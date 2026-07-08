package com.one.record.service.impl;

import com.one.record.ai.MiniGptDashboard;
import com.one.record.ai.MiniGptCorpusInsight;
import com.one.record.ai.MiniGptGenerationRequest;
import com.one.record.ai.MiniGptGenerationResult;
import com.one.record.ai.MiniGptRunNoteRequest;
import com.one.record.ai.MiniGptTrainingRequest;
import com.one.record.ai.MiniGptTrainingStatus;
import com.one.record.model.MiniGptRunRecord;
import com.one.record.model.MiniGptTrainingLogRecord;
import com.one.record.repository.MiniGptRunRepository;
import com.one.record.repository.MiniGptTrainingLogRepository;
import com.one.record.service.IMiniGptLearningService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
public class MiniGptLearningService implements IMiniGptLearningService {

    private static final int DEFAULT_RUN_LIMIT = 20;

    private static final int MAX_RUN_LIMIT = 100;

    private static final int DEFAULT_LOG_LIMIT = 200;

    private static final int MAX_LOG_LIMIT = 1000;

    private static final String DEFAULT_PRESET = "tiny";

    private static final String DEFAULT_DATA = "data/sample.txt";

    private static final String DEFAULT_SAMPLE_PROMPT = "语言模型";

    private static final int DEFAULT_TOKEN_LIMIT = 80;

    private static final int MAX_TOKEN_LIMIT = 500;

    private static final int PREVIEW_LIMIT = 600;

    private static final int DEFAULT_GENERATION_TOKENS = 120;

    private static final int MAX_GENERATION_TOKENS = 500;

    private static final long GENERATION_TIMEOUT_SECONDS = 60;

    private static final Pattern TRAINING_LOSS_LINE = Pattern.compile(
            "step=(\\d+)\\s+train_loss=([0-9.]+)\\s+eval_loss=([0-9.]+)"
    );

    private static final DateTimeFormatter DISPLAY_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final MiniGptRunRepository runRepository;

    private final MiniGptTrainingLogRepository logRepository;

    private final AtomicBoolean trainingRunning = new AtomicBoolean(false);

    private final AtomicReference<Process> trainingProcess = new AtomicReference<>();

    private final AtomicReference<MiniGptTrainingStatus> trainingStatus = new AtomicReference<>(idleStatus());

    @Value("${minigpt.playground-dir:playground/mini-gpt}")
    private String miniGptPlaygroundDir;

    public MiniGptLearningService(MiniGptRunRepository runRepository,
                                  MiniGptTrainingLogRepository logRepository) {
        this.runRepository = runRepository;
        this.logRepository = logRepository;
    }

    @Override
    public MiniGptDashboard dashboard(String runName, Integer runLimit, Integer logLimit) {
        List<MiniGptRunRecord> recentRuns = runs(runLimit);
        MiniGptRunRecord selectedRun = selectedRun(runName, recentRuns);
        List<MiniGptTrainingLogRecord> selectedLogs = selectedRun == null
                ? Collections.emptyList()
                : logs(selectedRun.getRunName(), logLimit);
        return MiniGptDashboard.builder()
                .latestRun(selectedRun)
                .runs(recentRuns)
                .logs(selectedLogs)
                .runCount(recentRuns.size())
                .logCount(selectedLogs.size())
                .generatedAt(System.currentTimeMillis())
                .build();
    }

    @Override
    public List<MiniGptRunRecord> runs(Integer limit) {
        return runRepository.findByOrderByUpdatedAtDesc(PageRequest.of(0, normalizeLimit(limit, DEFAULT_RUN_LIMIT, MAX_RUN_LIMIT)));
    }

    @Override
    public MiniGptRunRecord latestRun() {
        return runRepository.findFirstByOrderByUpdatedAtDesc().orElse(null);
    }

    @Override
    public List<MiniGptTrainingLogRecord> logs(String runName, Integer limit) {
        if (!StringUtils.hasText(runName)) {
            MiniGptRunRecord latest = latestRun();
            if (latest == null) {
                return Collections.emptyList();
            }
            runName = latest.getRunName();
        }
        return logRepository.findByRunNameOrderByStepAsc(runName, PageRequest.of(0, normalizeLimit(limit, DEFAULT_LOG_LIMIT, MAX_LOG_LIMIT)));
    }

    @Override
    public MiniGptTrainingStatus startTraining(MiniGptTrainingRequest request) {
        MiniGptTrainingRequest safeRequest = request == null ? new MiniGptTrainingRequest() : request;
        if (!trainingRunning.compareAndSet(false, true)) {
            return trainingStatus();
        }

        long now = System.currentTimeMillis();
        String runName = safeRunName(StringUtils.hasText(safeRequest.getRunName())
                ? safeRequest.getRunName()
                : "web-" + now);
        String preset = hasTextOrDefault(safeRequest.getPreset(), DEFAULT_PRESET);
        int maxSteps = safeRequest.getMaxSteps() == null || safeRequest.getMaxSteps() <= 0
                ? presetDefaultMaxSteps(preset)
                : safeRequest.getMaxSteps();

        updateStatus(MiniGptTrainingStatus.builder()
                .running(true)
                .failed(false)
                .cancelled(false)
                .exitCode(0)
                .percent(1)
                .runName(runName)
                .preset(preset)
                .stage("准备训练")
                .message("正在启动 MiniGPT 训练进程")
                .processedStep(0)
                .totalSteps(maxSteps)
                .startedAt(now)
                .updatedAt(now)
                .build());

        CompletableFuture.runAsync(() -> runTrainingProcess(safeRequest, runName, preset, maxSteps, now));
        return trainingStatus();
    }

    @Override
    public MiniGptTrainingStatus trainingStatus() {
        MiniGptTrainingStatus current = trainingStatus.get();
        if (!StringUtils.hasText(current.getRunName())) {
            return current;
        }
        return enrichStatus(current);
    }

    @Override
    public MiniGptTrainingStatus cancelTraining() {
        MiniGptTrainingStatus current = trainingStatus.get();
        if (!trainingRunning.get()) {
            updateStatus(MiniGptTrainingStatus.builder()
                    .running(false)
                    .failed(false)
                    .cancelled(false)
                    .exitCode(current.getExitCode())
                    .percent(current.getPercent())
                    .runName(current.getRunName())
                    .preset(current.getPreset())
                    .stage("空闲")
                    .message("当前没有运行中的 MiniGPT 训练")
                    .processedStep(current.getProcessedStep())
                    .totalSteps(current.getTotalSteps())
                    .run(current.getRun())
                    .latestLog(current.getLatestLog())
                    .startedAt(current.getStartedAt())
                    .updatedAt(System.currentTimeMillis())
                    .build());
            return trainingStatus();
        }
        Process process = trainingProcess.get();
        if (process != null) {
            process.destroy();
        }
        updateStatus(MiniGptTrainingStatus.builder()
                .running(true)
                .failed(false)
                .cancelled(true)
                .exitCode(0)
                .percent(current.getPercent())
                .runName(current.getRunName())
                .preset(current.getPreset())
                .stage("正在取消")
                .message("已发送取消请求，等待 Python 训练进程退出")
                .processedStep(current.getProcessedStep())
                .totalSteps(current.getTotalSteps())
                .run(current.getRun())
                .latestLog(current.getLatestLog())
                .startedAt(current.getStartedAt())
                .updatedAt(System.currentTimeMillis())
                .build());
        return trainingStatus();
    }

    @Override
    public MiniGptCorpusInsight corpusInsight(String data, String sample, Integer tokenLimit) {
        String safeData = hasTextOrDefault(data, DEFAULT_DATA);
        Path playgroundDir = resolvePlaygroundDir();
        Path dataPath = playgroundDir.resolve(safeData).normalize();
        if (!dataPath.startsWith(playgroundDir)) {
            throw new IllegalArgumentException("语料路径必须位于 MiniGPT playground 目录内");
        }
        if (!Files.exists(dataPath)) {
            throw new IllegalArgumentException("未找到 MiniGPT 语料文件: " + safeData);
        }
        try {
            String text = Files.readString(dataPath, StandardCharsets.UTF_8);
            List<Integer> vocab = sortedCodePoints(text);
            Map<Integer, Integer> stoi = new LinkedHashMap<>();
            for (int index = 0; index < vocab.size(); index++) {
                stoi.put(vocab.get(index), index);
            }
            String sampleText = hasTextOrDefault(sample, text.substring(0, Math.min(text.length(), 40)));
            List<Integer> encoded = encodeSample(sampleText, stoi);
            return MiniGptCorpusInsight.builder()
                    .data(safeData)
                    .resolvedPath(dataPath.toString())
                    .charCount(text.codePointCount(0, text.length()))
                    .lineCount(text.isEmpty() ? 0 : text.split("\\R", -1).length)
                    .vocabSize(vocab.size())
                    .preview(text.substring(0, Math.min(text.length(), PREVIEW_LIMIT)))
                    .sampleText(sampleText)
                    .encodedSample(encoded)
                    .decodedSample(decodeSample(encoded, vocab))
                    .tokens(tokenEntries(vocab, normalizeLimit(tokenLimit, DEFAULT_TOKEN_LIMIT, MAX_TOKEN_LIMIT)))
                    .generatedAt(System.currentTimeMillis())
                    .build();
        } catch (IOException exception) {
            throw new IllegalStateException("读取 MiniGPT 语料失败: " + safeData, exception);
        }
    }

    @Override
    public MiniGptGenerationResult generate(MiniGptGenerationRequest request) {
        MiniGptGenerationRequest safeRequest = request == null ? new MiniGptGenerationRequest() : request;
        MiniGptRunRecord run = selectedGenerationRun(safeRequest.getRunName());
        if (run == null || !StringUtils.hasText(run.getCheckpoint())) {
            throw new IllegalArgumentException("当前 MiniGPT 实验没有可用 checkpoint");
        }
        Path playgroundDir = resolvePlaygroundDir();
        Path checkpointPath = resolveCheckpointPath(playgroundDir, run.getCheckpoint());
        if (!Files.exists(checkpointPath)) {
            throw new IllegalArgumentException("MiniGPT checkpoint 不存在: " + checkpointPath);
        }

        String prompt = hasTextOrDefault(safeRequest.getPrompt(), DEFAULT_SAMPLE_PROMPT);
        int maxNewTokens = normalizeLimit(safeRequest.getMaxNewTokens(), DEFAULT_GENERATION_TOKENS, MAX_GENERATION_TOKENS);
        long startedAt = System.currentTimeMillis();
        List<String> command = buildGenerationCommand(playgroundDir, checkpointPath, prompt, maxNewTokens, safeRequest);
        try {
            Process process = new ProcessBuilder(command)
                    .directory(playgroundDir.toFile())
                    .redirectErrorStream(true)
                    .start();
            boolean finished = process.waitFor(GENERATION_TIMEOUT_SECONDS, TimeUnit.SECONDS);
            String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8).trim();
            if (!finished) {
                process.destroyForcibly();
                throw new IllegalStateException("MiniGPT 生成超时");
            }
            int exitCode = process.exitValue();
            if (exitCode != 0) {
                throw new IllegalStateException("MiniGPT 生成失败: " + output);
            }
            return MiniGptGenerationResult.builder()
                    .runName(run.getRunName())
                    .prompt(prompt)
                    .generatedText(output)
                    .checkpoint(checkpointPath.toString())
                    .maxNewTokens(maxNewTokens)
                    .temperature(safeRequest.getTemperature())
                    .topK(safeRequest.getTopK())
                    .exitCode(exitCode)
                    .elapsedMillis(System.currentTimeMillis() - startedAt)
                    .generatedAt(System.currentTimeMillis())
                    .build();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("MiniGPT 生成线程被中断", exception);
        } catch (IOException exception) {
            throw new IllegalStateException("MiniGPT 生成启动失败", exception);
        }
    }

    @Override
    public MiniGptRunRecord updateRunNotes(String runName, MiniGptRunNoteRequest request) {
        if (!StringUtils.hasText(runName)) {
            throw new IllegalArgumentException("runName 不能为空");
        }
        MiniGptRunRecord run = runRepository.findByRunName(runName)
                .orElseThrow(() -> new IllegalArgumentException("未找到 MiniGPT 实验: " + runName));
        MiniGptRunNoteRequest safeRequest = request == null ? new MiniGptRunNoteRequest() : request;
        run.setHypothesis(trimToNull(safeRequest.getHypothesis()));
        run.setObservation(trimToNull(safeRequest.getObservation()));
        run.setConclusion(trimToNull(safeRequest.getConclusion()));
        run.setNextStep(trimToNull(safeRequest.getNextStep()));
        run.setUpdatedAt(System.currentTimeMillis());
        return runRepository.save(run);
    }

    private MiniGptRunRecord selectedRun(String runName, List<MiniGptRunRecord> recentRuns) {
        if (StringUtils.hasText(runName)) {
            return runRepository.findByRunName(runName).orElse(null);
        }
        if (!recentRuns.isEmpty()) {
            return recentRuns.get(0);
        }
        return latestRun();
    }

    private MiniGptRunRecord selectedGenerationRun(String runName) {
        if (StringUtils.hasText(runName)) {
            return runRepository.findByRunName(runName)
                    .orElseThrow(() -> new IllegalArgumentException("未找到 MiniGPT 实验: " + runName));
        }
        return latestRun();
    }

    private static int normalizeLimit(Integer limit, int defaultValue, int maxValue) {
        if (limit == null || limit <= 0) {
            return defaultValue;
        }
        return Math.min(limit, maxValue);
    }

    private void runTrainingProcess(MiniGptTrainingRequest request, String runName, String preset, int maxSteps, long startedAt) {
        try {
            Path playgroundDir = resolvePlaygroundDir();
            Path scriptPath = playgroundDir.resolve("mini_gpt.py");
            if (!Files.exists(scriptPath)) {
                throw new IllegalStateException("未找到 MiniGPT 训练脚本: " + scriptPath);
            }

            initializeTrainingRun(runName, preset, maxSteps, request, startedAt);
            List<String> command = buildTrainingCommand(playgroundDir, request, runName, preset, maxSteps);
            ProcessBuilder builder = new ProcessBuilder(command);
            builder.directory(playgroundDir.toFile());
            Map<String, String> env = builder.environment();
            env.putIfAbsent("PYTHONUNBUFFERED", "1");
            Process process = builder.start();
            trainingProcess.set(process);
            startLogReader(process.getInputStream(), false, runName, maxSteps, startedAt);
            startLogReader(process.getErrorStream(), true);

            int exitCode = process.waitFor();
            MiniGptTrainingStatus current = trainingStatus.get();
            boolean cancelled = current.isCancelled();
            boolean failed = exitCode != 0 && !cancelled;
            updateTrainingRunCompletion(playgroundDir, runName, failed, cancelled, request);
            updateStatus(MiniGptTrainingStatus.builder()
                    .running(false)
                    .failed(failed)
                    .cancelled(cancelled)
                    .exitCode(exitCode)
                    .percent(failed ? current.getPercent() : 100)
                    .runName(runName)
                    .preset(preset)
                    .stage(cancelled ? "训练已取消" : failed ? "训练失败" : "训练完成")
                    .message(cancelled ? "MiniGPT 训练已取消" : failed ? "Python 训练进程异常退出" : "MiniGPT 训练完成，Mongo 数据已刷新")
                    .processedStep(current.getProcessedStep())
                    .totalSteps(maxSteps)
                    .startedAt(startedAt)
                    .updatedAt(System.currentTimeMillis())
                    .build());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            failTraining(runName, preset, maxSteps, startedAt, "MiniGPT 训练线程被中断");
        } catch (RuntimeException | IOException exception) {
            log.error("MiniGPT 训练启动失败", exception);
            failTraining(runName, preset, maxSteps, startedAt, exception.getMessage());
        } finally {
            trainingProcess.set(null);
            trainingRunning.set(false);
        }
    }

    private List<String> buildTrainingCommand(Path playgroundDir,
                                              MiniGptTrainingRequest request,
                                              String runName,
                                              String preset,
                                              int maxSteps) {
        List<String> command = new java.util.ArrayList<>();
        command.add(resolvePython(playgroundDir));
        command.add("mini_gpt.py");
        command.add("--mode");
        command.add("train");
        addArgument(command, "--preset", preset);
        addArgument(command, "--run-name", runName);
        addArgument(command, "--data", hasTextOrDefault(request.getData(), DEFAULT_DATA));
        addArgument(command, "--max-steps", maxSteps);
        addArgument(command, "--sample-prompt", hasTextOrDefault(request.getSamplePrompt(), DEFAULT_SAMPLE_PROMPT));
        addOptionalArgument(command, "--batch-size", request.getBatchSize());
        addOptionalArgument(command, "--learning-rate", request.getLearningRate());
        addOptionalArgument(command, "--block-size", request.getBlockSize());
        addOptionalArgument(command, "--n-embd", request.getNEmbd());
        addOptionalArgument(command, "--n-head", request.getNHead());
        addOptionalArgument(command, "--n-layer", request.getNLayer());
        addOptionalArgument(command, "--val-ratio", request.getValRatio());
        addOptionalArgument(command, "--sample-tokens", request.getSampleTokens());
        addOptionalArgument(command, "--temperature", request.getTemperature());
        addOptionalArgument(command, "--top-k", request.getTopK());
        return command;
    }

    private List<String> buildGenerationCommand(Path playgroundDir,
                                                Path checkpointPath,
                                                String prompt,
                                                int maxNewTokens,
                                                MiniGptGenerationRequest request) {
        List<String> command = new java.util.ArrayList<>();
        command.add(resolvePython(playgroundDir));
        command.add("mini_gpt.py");
        command.add("--mode");
        command.add("generate");
        addArgument(command, "--checkpoint", checkpointPath.toString());
        addArgument(command, "--prompt", prompt);
        addArgument(command, "--max-new-tokens", maxNewTokens);
        addOptionalArgument(command, "--temperature", request.getTemperature());
        addOptionalArgument(command, "--top-k", request.getTopK());
        return command;
    }

    private MiniGptTrainingStatus enrichStatus(MiniGptTrainingStatus status) {
        MiniGptRunRecord run = runRepository.findByRunName(status.getRunName()).orElse(status.getRun());
        MiniGptTrainingLogRecord latestLog = logRepository.findFirstByRunNameOrderByStepDesc(status.getRunName())
                .orElse(status.getLatestLog());
        Integer processedStep = latestLog == null ? status.getProcessedStep() : latestLog.getStep();
        int percent = status.isRunning()
                ? percent(processedStep, status.getTotalSteps())
                : status.getPercent();
        MiniGptTrainingStatus enriched = MiniGptTrainingStatus.builder()
                .running(status.isRunning())
                .failed(status.isFailed())
                .cancelled(status.isCancelled())
                .exitCode(status.getExitCode())
                .percent(percent)
                .runName(status.getRunName())
                .preset(status.getPreset())
                .stage(status.getStage())
                .message(status.getMessage())
                .processedStep(processedStep)
                .totalSteps(status.getTotalSteps())
                .run(run)
                .latestLog(latestLog)
                .startedAt(status.getStartedAt())
                .updatedAt(System.currentTimeMillis())
                .build();
        trainingStatus.set(enriched);
        return enriched;
    }

    private void failTraining(String runName, String preset, int maxSteps, long startedAt, String message) {
        updateStatus(MiniGptTrainingStatus.builder()
                .running(false)
                .failed(true)
                .cancelled(false)
                .exitCode(-1)
                .percent(100)
                .runName(runName)
                .preset(preset)
                .stage("训练失败")
                .message(message)
                .processedStep(0)
                .totalSteps(maxSteps)
                .startedAt(startedAt)
                .updatedAt(System.currentTimeMillis())
                .build());
    }

    private void updateStatus(MiniGptTrainingStatus status) {
        trainingStatus.set(enrichStatusWithoutWriteBack(status));
    }

    private MiniGptTrainingStatus enrichStatusWithoutWriteBack(MiniGptTrainingStatus status) {
        if (!StringUtils.hasText(status.getRunName())) {
            return status;
        }
        MiniGptRunRecord run = runRepository.findByRunName(status.getRunName()).orElse(status.getRun());
        MiniGptTrainingLogRecord latestLog = logRepository.findFirstByRunNameOrderByStepDesc(status.getRunName())
                .orElse(status.getLatestLog());
        Integer processedStep = latestLog == null ? status.getProcessedStep() : latestLog.getStep();
        return MiniGptTrainingStatus.builder()
                .running(status.isRunning())
                .failed(status.isFailed())
                .cancelled(status.isCancelled())
                .exitCode(status.getExitCode())
                .percent(status.isRunning() ? percent(processedStep, status.getTotalSteps()) : status.getPercent())
                .runName(status.getRunName())
                .preset(status.getPreset())
                .stage(status.getStage())
                .message(status.getMessage())
                .processedStep(processedStep)
                .totalSteps(status.getTotalSteps())
                .run(run)
                .latestLog(latestLog)
                .startedAt(status.getStartedAt())
                .updatedAt(status.getUpdatedAt())
                .build();
    }

    private void startLogReader(InputStream stream, boolean error) {
        startLogReader(stream, error, null, 0, 0);
    }

    private void startLogReader(InputStream stream, boolean error, String runName, int maxSteps, long startedAt) {
        CompletableFuture.runAsync(() -> {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (error) {
                        log.warn("[mini-gpt] {}", line);
                    } else {
                        log.info("[mini-gpt] {}", line);
                        syncTrainingLossLine(runName, line, maxSteps, startedAt);
                    }
                }
            } catch (IOException exception) {
                log.debug("MiniGPT 训练日志读取结束", exception);
            }
        });
    }

    private void initializeTrainingRun(String runName,
                                       String preset,
                                       int maxSteps,
                                       MiniGptTrainingRequest request,
                                       long startedAt) {
        long now = System.currentTimeMillis();
        MiniGptRunRecord run = runRepository.findByRunName(runName).orElseGet(MiniGptRunRecord::new);
        run.setRunName(runName);
        run.setPreset(preset);
        run.setStatus("RUNNING");
        run.setStartedAt(formatDisplayTime(startedAt));
        run.setFinishedAt(null);
        run.setData(hasTextOrDefault(request.getData(), DEFAULT_DATA));
        run.setCheckpoint(null);
        run.setLogFile(Path.of("runs", runName, "train_log.csv").toString());
        run.setMetadataFile(Path.of("runs", runName, "latest.json").toString());
        run.setMaxSteps(maxSteps);
        run.setBatchSize(request.getBatchSize());
        run.setLearningRate(request.getLearningRate());
        run.setValRatio(request.getValRatio());
        run.setSamplePrompt(hasTextOrDefault(request.getSamplePrompt(), DEFAULT_SAMPLE_PROMPT));
        run.setSampleTokens(request.getSampleTokens());
        run.setFinalTrainLoss(null);
        run.setFinalEvalLoss(null);
        run.setLossGap(null);
        run.setUpdatedAt(now);
        if (run.getCreatedAt() == null) {
            run.setCreatedAt(now);
        }
        run.setConfig(trainingConfig(request));
        runRepository.save(run);
    }

    private void updateTrainingRunCompletion(Path playgroundDir,
                                             String runName,
                                             boolean failed,
                                             boolean cancelled,
                                             MiniGptTrainingRequest request) {
        MiniGptRunRecord run = runRepository.findByRunName(runName).orElseGet(MiniGptRunRecord::new);
        MiniGptTrainingLogRecord latestLog = logRepository.findFirstByRunNameOrderByStepDesc(runName).orElse(null);
        run.setRunName(runName);
        run.setStatus(cancelled ? "CANCELLED" : failed ? "FAILED" : "SUCCESS");
        run.setFinishedAt(formatDisplayTime(System.currentTimeMillis()));
        if (!failed && !cancelled) {
            run.setCheckpoint(playgroundDir.resolve("runs").resolve(runName).resolve("checkpoints").resolve("mini_gpt.pt").toString());
        }
        if (latestLog != null) {
            run.setFinalTrainLoss(latestLog.getTrainLoss());
            run.setFinalEvalLoss(latestLog.getEvalLoss());
            if (latestLog.getTrainLoss() != null && latestLog.getEvalLoss() != null) {
                run.setLossGap(latestLog.getEvalLoss() - latestLog.getTrainLoss());
            }
        }
        run.setUpdatedAt(System.currentTimeMillis());
        if (run.getConfig() == null || run.getConfig().isEmpty()) {
            run.setConfig(trainingConfig(request));
        }
        runRepository.save(run);
    }

    private void syncTrainingLossLine(String runName, String line, int maxSteps, long startedAt) {
        if (!StringUtils.hasText(runName)) {
            return;
        }
        Matcher matcher = TRAINING_LOSS_LINE.matcher(line);
        if (!matcher.find()) {
            return;
        }

        Integer step = Integer.parseInt(matcher.group(1));
        Double trainLoss = Double.parseDouble(matcher.group(2));
        Double evalLoss = Double.parseDouble(matcher.group(3));
        long now = System.currentTimeMillis();
        MiniGptTrainingLogRecord record = logRepository.findByRunNameAndStep(runName, step)
                .orElseGet(MiniGptTrainingLogRecord::new);
        record.setRunName(runName);
        record.setStep(step);
        record.setTrainLoss(trainLoss);
        record.setEvalLoss(evalLoss);
        record.setElapsedSeconds(startedAt > 0 ? (now - startedAt) / 1000.0 : null);
        record.setUpdatedAt(now);
        if (record.getCreatedAt() == null) {
            record.setCreatedAt(now);
        }
        MiniGptTrainingLogRecord saved = logRepository.save(record);

        MiniGptTrainingStatus current = trainingStatus.get();
        if (runName.equals(current.getRunName())) {
            updateStatus(MiniGptTrainingStatus.builder()
                    .running(current.isRunning())
                    .failed(current.isFailed())
                    .cancelled(current.isCancelled())
                    .exitCode(current.getExitCode())
                    .percent(percent(step, maxSteps))
                    .runName(runName)
                    .preset(current.getPreset())
                    .stage(current.getStage())
                    .message("MiniGPT 训练中，已同步 loss 到 Mongo")
                    .processedStep(step)
                    .totalSteps(current.getTotalSteps())
                    .run(current.getRun())
                    .latestLog(saved)
                    .startedAt(current.getStartedAt())
                    .updatedAt(now)
                    .build());
        }
    }

    private Map<String, Object> trainingConfig(MiniGptTrainingRequest request) {
        Map<String, Object> config = new LinkedHashMap<>();
        config.put("blockSize", request.getBlockSize());
        config.put("nEmbd", request.getNEmbd());
        config.put("nHead", request.getNHead());
        config.put("nLayer", request.getNLayer());
        config.put("temperature", request.getTemperature());
        config.put("topK", request.getTopK());
        return config;
    }

    private static String formatDisplayTime(long millis) {
        return LocalDateTime.ofInstant(java.time.Instant.ofEpochMilli(millis), java.time.ZoneId.systemDefault())
                .format(DISPLAY_TIME_FORMATTER);
    }

    private static MiniGptTrainingStatus idleStatus() {
        return MiniGptTrainingStatus.builder()
                .running(false)
                .failed(false)
                .cancelled(false)
                .exitCode(0)
                .percent(0)
                .stage("空闲")
                .message("暂无运行中的 MiniGPT 训练")
                .updatedAt(System.currentTimeMillis())
                .build();
    }

    private Path resolvePlaygroundDir() {
        Path configuredPath = Path.of(miniGptPlaygroundDir);
        return configuredPath.isAbsolute()
                ? configuredPath.normalize()
                : Path.of("").toAbsolutePath().normalize().resolve(configuredPath).normalize();
    }

    private static Path resolveCheckpointPath(Path playgroundDir, String checkpoint) {
        Path checkpointPath = Path.of(checkpoint);
        return checkpointPath.isAbsolute()
                ? checkpointPath.normalize()
                : playgroundDir.resolve(checkpointPath).normalize();
    }

    private static String resolvePython(Path playgroundDir) {
        Path venvPython = playgroundDir.resolve(".venv").resolve("bin").resolve("python");
        if (Files.exists(venvPython)) {
            return venvPython.toString();
        }
        return "python3";
    }

    private static void addArgument(List<String> command, String key, Object value) {
        command.add(key);
        command.add(String.valueOf(value));
    }

    private static void addOptionalArgument(List<String> command, String key, Object value) {
        if (value == null) {
            return;
        }
        command.add(key);
        command.add(String.valueOf(value));
    }

    private static String hasTextOrDefault(String value, String defaultValue) {
        return StringUtils.hasText(value) ? value : defaultValue;
    }

    private static String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private static String safeRunName(String value) {
        StringBuilder builder = new StringBuilder();
        for (char ch : value.trim().toCharArray()) {
            if (Character.isLetterOrDigit(ch) || ch == '-' || ch == '_') {
                builder.append(ch);
            } else {
                builder.append('-');
            }
        }
        String cleaned = builder.toString().replaceAll("^-+|-+$", "");
        return StringUtils.hasText(cleaned) ? cleaned : "web-" + System.currentTimeMillis();
    }

    private static int presetDefaultMaxSteps(String preset) {
        Map<String, Integer> defaults = new LinkedHashMap<>();
        defaults.put("tiny", 120);
        defaults.put("small", 300);
        defaults.put("medium", 600);
        return defaults.getOrDefault(preset, 120);
    }

    private static int percent(Integer processedStep, Integer totalSteps) {
        if (processedStep == null || totalSteps == null || totalSteps <= 0) {
            return 1;
        }
        return Math.max(1, Math.min(99, (int) Math.round(processedStep * 100.0 / totalSteps)));
    }

    private static List<Integer> sortedCodePoints(String text) {
        Set<Integer> codePoints = new TreeSet<>();
        text.codePoints().forEach(codePoints::add);
        return new ArrayList<>(codePoints);
    }

    private static List<Integer> encodeSample(String sample, Map<Integer, Integer> stoi) {
        List<Integer> encoded = new ArrayList<>();
        sample.codePoints().forEach(codePoint -> {
            Integer tokenId = stoi.get(codePoint);
            if (tokenId != null) {
                encoded.add(tokenId);
            }
        });
        return encoded;
    }

    private static String decodeSample(List<Integer> encoded, List<Integer> vocab) {
        StringBuilder builder = new StringBuilder();
        for (Integer tokenId : encoded) {
            if (tokenId != null && tokenId >= 0 && tokenId < vocab.size()) {
                builder.appendCodePoint(vocab.get(tokenId));
            }
        }
        return builder.toString();
    }

    private static List<MiniGptCorpusInsight.TokenEntry> tokenEntries(List<Integer> vocab, int limit) {
        List<MiniGptCorpusInsight.TokenEntry> entries = new ArrayList<>();
        for (int index = 0; index < Math.min(vocab.size(), limit); index++) {
            int codePoint = vocab.get(index);
            String token = new String(Character.toChars(codePoint));
            entries.add(MiniGptCorpusInsight.TokenEntry.builder()
                    .token(token)
                    .tokenId(index)
                    .codePoint(codePoint)
                    .display(displayToken(token))
                    .build());
        }
        return entries;
    }

    private static String displayToken(String token) {
        if ("\n".equals(token)) {
            return "\\n";
        }
        if ("\r".equals(token)) {
            return "\\r";
        }
        if ("\t".equals(token)) {
            return "\\t";
        }
        if (" ".equals(token)) {
            return "space";
        }
        return token;
    }
}
