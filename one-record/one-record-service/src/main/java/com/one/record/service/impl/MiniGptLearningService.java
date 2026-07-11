package com.one.record.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.util.concurrent.Striped;
import com.one.record.ai.MiniGptDashboard;
import com.one.record.ai.MiniGptEnvironmentCheck;
import com.one.record.ai.MiniGptCorpusInsight;
import com.one.record.ai.MiniGptGenerationComparisonRequest;
import com.one.record.ai.MiniGptGenerationBatchRequest;
import com.one.record.ai.MiniGptGenerationBatchResult;
import com.one.record.ai.MiniGptGenerationRequest;
import com.one.record.ai.MiniGptGenerationResult;
import com.one.record.ai.MiniGptLotteryCandidateValidation;
import com.one.record.ai.MiniGptLotteryCorpusExport;
import com.one.record.ai.MiniGptRunNoteRequest;
import com.one.record.ai.MiniGptTrainingRequest;
import com.one.record.ai.MiniGptTrainingStatus;
import com.one.record.exception.MiniGptLotteryCorpusException;
import com.one.record.exception.MiniGptTrainingValidationException;
import com.one.record.lottery.LotteryDraw;
import com.one.record.model.MiniGptGenerationRecord;
import com.one.record.model.MiniGptRunRecord;
import com.one.record.model.MiniGptTrainingLogRecord;
import com.one.record.repository.MiniGptGenerationRepository;
import com.one.record.repository.MiniGptRunRepository;
import com.one.record.repository.MiniGptTrainingLogRepository;
import com.one.record.request.RecordRequest;
import com.one.record.service.IMiniGptLearningService;
import com.one.record.service.IRecordService;
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
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.locks.Lock;
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

    private static final int MAX_GENERATION_COMPARISONS = 6;

    private static final int DEFAULT_GENERATION_TOP_K = 20;

    private static final double DEFAULT_GENERATION_TEMPERATURE = 0.9;

    private static final long DEFAULT_GENERATION_SEED = 42L;

    private static final int DEFAULT_BATCH_CANDIDATES = 8;

    private static final int MAX_BATCH_CANDIDATES = 32;

    private static final int DEFAULT_MAX_RED_OVERLAP = 3;

    private static final String TOKENIZER_TYPE = "CHAR_CODE_POINT";

    private static final String PROVENANCE_VERIFIED = "VERIFIED";

    private static final String PROVENANCE_LEGACY = "LEGACY_UNVERIFIED";

    private static final Pattern STRATEGY_FIELD_PATTERN = Pattern.compile("(?i)strategy\\s*[=:]\\s*([a-z0-9-]+)");

    private static final Pattern TRAINING_LOSS_LINE = Pattern.compile(
            "step=(\\d+)\\s+train_loss=([0-9.]+)\\s+eval_loss=([0-9.]+)"
    );

    private static final Pattern RED_FIELD_PATTERN = Pattern.compile("(?i)red\\s*[=:：]\\s*([0-9,，\\s]+)");

    private static final Pattern BLUE_FIELD_PATTERN = Pattern.compile("(?i)blue\\s*[=:：]\\s*(\\d{1,2})");

    private static final Pattern NUMBER_PATTERN = Pattern.compile("(?<!\\d)\\d{1,2}(?!\\d)");

    private static final DateTimeFormatter DISPLAY_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private static final String DEFAULT_MONGO_URI = "mongodb://localhost:27017";

    private static final String DEFAULT_MONGO_DB = "test";

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private static final int LOTTERY_CORPUS_PAGE_SIZE = 500;

    private static final int DEFAULT_LOTTERY_CORPUS_LIMIT = 2000;

    private static final int MAX_LOTTERY_CORPUS_LIMIT = 5000;

    private static final int LOTTERY_CORPUS_SCHEMA_VERSION = 1;

    private static final String LOTTERY_CORPUS_SPLIT_MODE = "TIME_ORDERED_80_20";

    private static final double LOTTERY_CORPUS_VALIDATION_RATIO = 0.2;

    private static final String LOTTERY_CORPUS_SORT_ORDER = "issue:asc";

    private static final String LOTTERY_CORPUS_VERSION_ROOT = "lottery-corpora";

    private static final String CORPUS_LINE_SEPARATOR = "\n";

    private static final Striped<Lock> LOTTERY_CORPUS_VERSION_LOCKS = Striped.lazyWeakLock(64);

    private static final Striped<Lock> LOTTERY_CORPUS_FORMAT_LOCKS = Striped.lazyWeakLock(8);

    private final MiniGptRunRepository runRepository;

    private final MiniGptTrainingLogRepository logRepository;

    private final MiniGptGenerationRepository generationRepository;

    private final IRecordService recordService;

    private final AtomicBoolean trainingRunning = new AtomicBoolean(false);

    private final AtomicReference<Process> trainingProcess = new AtomicReference<>();

    private final AtomicReference<MiniGptTrainingStatus> trainingStatus = new AtomicReference<>(idleStatus());

    @Value("${minigpt.playground-dir:playground/mini-gpt}")
    private String miniGptPlaygroundDir;

    public MiniGptLearningService(MiniGptRunRepository runRepository,
                                  MiniGptTrainingLogRepository logRepository,
                                  MiniGptGenerationRepository generationRepository,
                                  IRecordService recordService) {
        this.runRepository = runRepository;
        this.logRepository = logRepository;
        this.generationRepository = generationRepository;
        this.recordService = recordService;
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
        String preset = hasTextOrDefault(safeRequest.getPreset(), DEFAULT_PRESET);
        TrainingContext context = validateTrainingContext(safeRequest, preset);
        if (!trainingRunning.compareAndSet(false, true)) {
            return trainingStatus();
        }

        long now = System.currentTimeMillis();
        String runName = safeRunName(StringUtils.hasText(safeRequest.getRunName())
                ? safeRequest.getRunName()
                : "web-" + now);
        int maxSteps = safeRequest.getMaxSteps() == null || safeRequest.getMaxSteps() <= 0
                ? presetDefaultMaxSteps(preset)
                : safeRequest.getMaxSteps();
        try {
            if (runRepository.findByRunName(runName).isPresent()) {
                throw new MiniGptTrainingValidationException("MiniGPT 实验名称已存在: " + runName);
            }
            MiniGptRunRecord run = initializeTrainingRun(runName, preset, maxSteps, safeRequest, context, now);
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
                    .run(run)
                    .startedAt(now)
                    .updatedAt(now)
                    .build());
        } catch (RuntimeException exception) {
            trainingRunning.set(false);
            throw exception;
        }

        CompletableFuture.runAsync(() -> runTrainingProcess(safeRequest, runName, preset, maxSteps, context, now));
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
    public MiniGptEnvironmentCheck environment() {
        Path playgroundDir = resolvePlaygroundDir();
        String pythonPath = resolvePython(playgroundDir);
        String mongoUri = System.getenv().getOrDefault("MINI_GPT_MONGO_URI", DEFAULT_MONGO_URI);
        String mongoDb = System.getenv().getOrDefault("MINI_GPT_MONGO_DB", DEFAULT_MONGO_DB);
        MiniGptEnvironmentCheck.MiniGptEnvironmentCheckBuilder builder = MiniGptEnvironmentCheck.builder()
                .playgroundDir(playgroundDir.toString())
                .pythonPath(pythonPath)
                .mongoUri(maskMongoUri(mongoUri))
                .mongoDb(mongoDb)
                .checkedAt(System.currentTimeMillis());

        List<String> command = List.of(
                pythonPath,
                "-c",
                "import json, os, sys\n"
                        + "result={'pythonAvailable': True, 'pythonPath': sys.executable}\n"
                        + "try:\n"
                        + " import pymongo\n"
                        + " result['pymongoAvailable']=True\n"
                        + " result['pymongoVersion']=pymongo.version\n"
                        + " uri=os.getenv('MINI_GPT_MONGO_URI','mongodb://localhost:27017')\n"
                        + " db=os.getenv('MINI_GPT_MONGO_DB','test')\n"
                        + " client=pymongo.MongoClient(uri, serverSelectionTimeoutMS=1000)\n"
                        + " client.admin.command('ping')\n"
                        + " result['mongoAvailable']=True\n"
                        + " result['mongoDb']=db\n"
                        + "except Exception as exc:\n"
                        + " result.setdefault('pymongoAvailable', False)\n"
                        + " result.setdefault('mongoAvailable', False)\n"
                        + " result['message']=type(exc).__name__ + ': ' + str(exc)\n"
                        + "print(json.dumps(result, ensure_ascii=False))"
        );
        try {
            Process process = new ProcessBuilder(command)
                    .directory(playgroundDir.toFile())
                    .redirectErrorStream(true)
                    .start();
            boolean finished = process.waitFor(8, TimeUnit.SECONDS);
            String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8).trim();
            if (!finished) {
                process.destroyForcibly();
                return builder
                        .pythonAvailable(true)
                        .pymongoAvailable(false)
                        .mongoAvailable(false)
                        .status("FAILED")
                        .message("MiniGPT 环境检查超时")
                        .build();
            }
            applyEnvironmentOutput(builder, output);
            return builder.build();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            return builder
                    .pythonAvailable(false)
                    .pymongoAvailable(false)
                    .mongoAvailable(false)
                    .status("FAILED")
                    .message("MiniGPT 环境检查线程被中断")
                    .build();
        } catch (IOException exception) {
            return builder
                    .pythonAvailable(false)
                    .pymongoAvailable(false)
                    .mongoAvailable(false)
                    .status("FAILED")
                    .message("MiniGPT Python 启动失败: " + exception.getMessage())
                    .build();
        }
    }

    @Override
    public MiniGptLotteryCorpusExport exportLotteryCorpus(String format, Integer limit) {
        String normalizedFormat = normalizeLotteryCorpusFormat(format);
        List<LotteryDraw> draws = loadLotteryDraws(normalizeLimit(limit, DEFAULT_LOTTERY_CORPUS_LIMIT, MAX_LOTTERY_CORPUS_LIMIT));
        if (draws.size() < 2) {
            throw new MiniGptLotteryCorpusException("MiniGPT 彩票语料至少需要 2 个有效且唯一的期号");
        }

        List<String> lines = draws.stream()
                .map(draw -> lotteryCorpusLine(draw, normalizedFormat))
                .toList();
        int trainDrawCount = Math.max(1, Math.min(draws.size() - 1, (draws.size() * 80) / 100));
        List<LotteryDraw> trainDraws = draws.subList(0, trainDrawCount);
        List<LotteryDraw> validationDraws = draws.subList(trainDrawCount, draws.size());
        String content = corpusContent(lines);
        String trainContent = corpusContent(lines.subList(0, trainDrawCount));
        String validationContent = corpusContent(lines.subList(trainDrawCount, lines.size()));
        String contentSha256 = sha256(content);
        String trainSha256 = sha256(trainContent);
        String validationSha256 = sha256(validationContent);
        String templateVersion = "lottery-" + normalizedFormat + "-v1";
        String corpusVersion = corpusVersion(
                normalizedFormat,
                templateVersion,
                contentSha256,
                trainSha256,
                validationSha256
        );
        Path playgroundDir = resolvePlaygroundDir();
        Path dataDir = playgroundDir.resolve("data").normalize();
        Path legacyPath = dataDir.resolve("lottery-" + normalizedFormat + ".txt").normalize();
        Path versionDir = dataDir.resolve(LOTTERY_CORPUS_VERSION_ROOT)
                .resolve(normalizedFormat)
                .resolve(corpusVersion)
                .normalize();
        Path fullPath = versionDir.resolve("all.txt").normalize();
        Path trainPath = versionDir.resolve("train.txt").normalize();
        Path validationPath = versionDir.resolve("validation.txt").normalize();
        Path manifestPath = versionDir.resolve("manifest.json").normalize();
        if (!legacyPath.startsWith(dataDir)
                || !versionDir.startsWith(dataDir)
                || !fullPath.startsWith(versionDir)
                || !trainPath.startsWith(versionDir)
                || !validationPath.startsWith(versionDir)
                || !manifestPath.startsWith(versionDir)) {
            throw new IllegalArgumentException("MiniGPT 彩票语料路径非法");
        }

        String legacyDataPath = relativeDataPath(playgroundDir, legacyPath);
        String fullDataPath = relativeDataPath(playgroundDir, fullPath);
        String trainDataPath = relativeDataPath(playgroundDir, trainPath);
        String validationDataPath = relativeDataPath(playgroundDir, validationPath);
        String manifestDataPath = relativeDataPath(playgroundDir, manifestPath);
        String legacyFilePath = legacyPath.toString();
        String fullFilePath = fullPath.toString();
        String trainFilePath = trainPath.toString();
        String validationFilePath = validationPath.toString();
        String manifestFilePath = manifestPath.toString();

        long generatedAt;
        Lock versionLock = LOTTERY_CORPUS_VERSION_LOCKS.get(versionDir.toString());
        versionLock.lock();
        try {
            generatedAt = existingManifestGeneratedAt(manifestPath);
            Map<String, Object> manifest = lotteryCorpusManifest(
                    normalizedFormat,
                    templateVersion,
                    corpusVersion,
                    legacyDataPath,
                    legacyFilePath,
                    fullDataPath,
                    fullFilePath,
                    trainDataPath,
                    trainFilePath,
                    validationDataPath,
                    validationFilePath,
                    manifestDataPath,
                    manifestFilePath,
                    draws,
                    trainDraws,
                    validationDraws,
                    contentSha256,
                    trainSha256,
                    validationSha256,
                    generatedAt
            );
            String manifestContent = OBJECT_MAPPER.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(manifest) + CORPUS_LINE_SEPARATOR;
            publishVersionArtifacts(
                    versionDir,
                    content,
                    trainContent,
                    validationContent,
                    manifestContent
            );
        } catch (IOException exception) {
            throw new IllegalStateException("写入 MiniGPT 彩票语料失败", exception);
        } finally {
            versionLock.unlock();
        }

        Lock formatLock = LOTTERY_CORPUS_FORMAT_LOCKS.get(legacyPath.toString());
        formatLock.lock();
        try {
            writeStringAtomically(legacyPath, content);
        } catch (IOException exception) {
            throw new IllegalStateException("写入 MiniGPT 彩票兼容语料失败", exception);
        } finally {
            formatLock.unlock();
        }

        return MiniGptLotteryCorpusExport.builder()
                .schemaVersion(LOTTERY_CORPUS_SCHEMA_VERSION)
                .templateVersion(templateVersion)
                .corpusVersion(corpusVersion)
                .format(normalizedFormat)
                .splitMode(LOTTERY_CORPUS_SPLIT_MODE)
                .validationRatio(LOTTERY_CORPUS_VALIDATION_RATIO)
                .sortOrder(LOTTERY_CORPUS_SORT_ORDER)
                .dataPath(legacyDataPath)
                .filePath(legacyFilePath)
                .legacyDataPath(legacyDataPath)
                .fullDataPath(fullDataPath)
                .fullFilePath(fullFilePath)
                .trainDataPath(trainDataPath)
                .trainFilePath(trainFilePath)
                .validationDataPath(validationDataPath)
                .validationFilePath(validationFilePath)
                .manifestDataPath(manifestDataPath)
                .manifestFilePath(manifestFilePath)
                .drawCount(draws.size())
                .trainDrawCount(trainDraws.size())
                .validationDrawCount(validationDraws.size())
                .firstIssue(firstIssue(draws))
                .latestIssue(latestIssue(draws))
                .trainFirstIssue(firstIssue(trainDraws))
                .trainLatestIssue(latestIssue(trainDraws))
                .validationFirstIssue(firstIssue(validationDraws))
                .validationLatestIssue(latestIssue(validationDraws))
                .contentSha256(contentSha256)
                .trainSha256(trainSha256)
                .validationSha256(validationSha256)
                .preview(content.substring(0, Math.min(content.length(), PREVIEW_LIMIT)))
                .generatedAt(generatedAt)
                .build();
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
            SampleStats sampleStats = sampleStats(text);
            InsightProvenance provenance = insightProvenance(dataPath, text);
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
                    .lineCount(text.isEmpty() ? 0 : (int) text.lines().count())
                    .sampleCount(sampleStats.sampleCount())
                    .minimumSampleTokens(sampleStats.minimumTokens())
                    .maximumSampleTokens(sampleStats.maximumTokens())
                    .requiredBlockSize(sampleStats.requiredBlockSize())
                    .recommendedBlockSize(sampleStats.recommendedBlockSize())
                    .tokenizerType(TOKENIZER_TYPE)
                    .corpusVersion(provenance.corpusVersion())
                    .corpusFormat(provenance.corpusFormat())
                    .schemaVersion(provenance.schemaVersion())
                    .templateVersion(provenance.templateVersion())
                    .trainSha256(provenance.trainSha256())
                    .validationSha256(provenance.validationSha256())
                    .provenanceStatus(provenance.status())
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
        return runGeneration(safeRequest, null, strategyLabel(safeRequest.getPrompt()), false);
    }

    @Override
    public List<MiniGptGenerationResult> compareGeneration(MiniGptGenerationComparisonRequest request) {
        MiniGptGenerationComparisonRequest safeRequest = request == null ? new MiniGptGenerationComparisonRequest() : request;
        List<Double> temperatures = normalizeTemperatures(safeRequest.getTemperatures());
        List<Integer> topKs = normalizeTopKs(safeRequest.getTopKs());
        String batchId = UUID.randomUUID().toString();
        long baseSeed = normalizeSeed(safeRequest.getBaseSeed());
        List<MiniGptGenerationRequest> requests = new ArrayList<>();
        for (Double temperature : temperatures) {
            for (Integer topK : topKs) {
                if (requests.size() >= MAX_GENERATION_COMPARISONS) {
                    break;
                }
                MiniGptGenerationRequest generationRequest = new MiniGptGenerationRequest();
                generationRequest.setRunName(safeRequest.getRunName());
                generationRequest.setPrompt(safeRequest.getPrompt());
                generationRequest.setMaxNewTokens(safeRequest.getMaxNewTokens());
                generationRequest.setTemperature(temperature);
                generationRequest.setTopK(topK);
                generationRequest.setSeed(baseSeed + requests.size());
                requests.add(generationRequest);
            }
        }
        return requests.stream()
                .map(generationRequest -> runGeneration(
                        generationRequest,
                        batchId,
                        strategyLabel(generationRequest.getPrompt()),
                        false
                ))
                .toList();
    }

    @Override
    public MiniGptGenerationBatchResult generateBatch(MiniGptGenerationBatchRequest request) {
        MiniGptGenerationBatchRequest safeRequest = request == null ? new MiniGptGenerationBatchRequest() : request;
        int candidateCount = normalizeLimit(safeRequest.getCandidateCount(), DEFAULT_BATCH_CANDIDATES, MAX_BATCH_CANDIDATES);
        int maxRedOverlap = safeRequest.getMaxRedOverlap() == null
                ? DEFAULT_MAX_RED_OVERLAP
                : Math.max(0, Math.min(6, safeRequest.getMaxRedOverlap()));
        int minimumBlueCoverage = safeRequest.getMinimumBlueCoverage() == null
                ? 0
                : Math.max(0, Math.min(16, safeRequest.getMinimumBlueCoverage()));
        long baseSeed = normalizeSeed(safeRequest.getBaseSeed());
        List<String> strategies = normalizeStrategies(safeRequest.getStrategies());
        String batchId = UUID.randomUUID().toString();
        List<MiniGptGenerationResult> results = new ArrayList<>();
        RuntimeException lastFailure = null;

        for (int index = 0; index < candidateCount; index++) {
            String strategy = strategies.get(index % strategies.size());
            MiniGptGenerationRequest generationRequest = new MiniGptGenerationRequest();
            generationRequest.setRunName(safeRequest.getRunName());
            generationRequest.setPrompt(promptForStrategy(safeRequest.getPrompt(), strategy));
            generationRequest.setMaxNewTokens(safeRequest.getMaxNewTokens());
            generationRequest.setTemperature(safeRequest.getTemperature());
            generationRequest.setTopK(safeRequest.getTopK());
            generationRequest.setSeed(baseSeed + index);
            try {
                results.add(runGeneration(generationRequest, batchId, strategy, true));
            } catch (RuntimeException exception) {
                lastFailure = exception;
                log.warn("MiniGPT batch generation failed: batchId={}, seed={}", batchId, baseSeed + index, exception);
            }
        }

        if (results.isEmpty() && lastFailure != null) {
            throw lastFailure;
        }

        selectCandidatePool(results, maxRedOverlap, minimumBlueCoverage);
        boolean minimumBlueCoverageMet = applyBatchPolicy(
                results,
                baseSeed,
                maxRedOverlap,
                minimumBlueCoverage,
                strategies
        );
        results.forEach(this::persistGeneration);
        return generationBatchResult(
                batchId,
                candidateCount,
                baseSeed,
                maxRedOverlap,
                minimumBlueCoverage,
                minimumBlueCoverageMet,
                strategies,
                results
        );
    }

    private MiniGptGenerationResult runGeneration(MiniGptGenerationRequest safeRequest,
                                                   String batchId,
                                                   String strategy,
                                                   boolean poolEvaluation) {
        MiniGptRunRecord run = selectedGenerationRun(safeRequest.getRunName());
        if (run == null || !StringUtils.hasText(run.getCheckpoint())) {
            throw new MiniGptTrainingValidationException("当前 MiniGPT 实验没有可用 checkpoint");
        }
        Path playgroundDir = resolvePlaygroundDir();
        Path checkpointPath = resolveCheckpointPath(playgroundDir, run.getCheckpoint());
        if (!checkpointPath.startsWith(playgroundDir)) {
            throw new MiniGptTrainingValidationException("MiniGPT checkpoint 路径必须位于 playground 目录内");
        }
        if (!Files.exists(checkpointPath)) {
            throw new MiniGptTrainingValidationException("MiniGPT checkpoint 不存在: " + checkpointPath);
        }

        String checkpointSha256 = sha256File(checkpointPath);
        if (StringUtils.hasText(run.getCheckpointSha256()) && !run.getCheckpointSha256().equals(checkpointSha256)) {
            throw new MiniGptTrainingValidationException("MiniGPT checkpoint SHA-256 与实验记录不一致");
        }

        String prompt = hasTextOrDefault(safeRequest.getPrompt(), DEFAULT_SAMPLE_PROMPT);
        int maxNewTokens = normalizeLimit(safeRequest.getMaxNewTokens(), DEFAULT_GENERATION_TOKENS, MAX_GENERATION_TOKENS);
        double temperature = normalizeTemperature(safeRequest.getTemperature());
        int topK = normalizeTopK(safeRequest.getTopK());
        long seed = normalizeSeed(safeRequest.getSeed());
        long startedAt = System.currentTimeMillis();
        List<String> command = buildGenerationCommand(
                playgroundDir,
                checkpointPath,
                prompt,
                maxNewTokens,
                temperature,
                topK,
                seed
        );
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
            GenerationOutput generationOutput = parseGenerationOutput(output, seed, run.getConfig());
            MiniGptLotteryCandidateValidation validation = validateLotteryCandidate(generationOutput.generatedText());
            MiniGptGenerationResult result = MiniGptGenerationResult.builder()
                    .generationId(UUID.randomUUID().toString())
                    .batchId(batchId)
                    .runId(run.getId())
                    .runName(run.getRunName())
                    .prompt(prompt)
                    .generatedText(generationOutput.generatedText())
                    .checkpoint(checkpointPath.toString())
                    .checkpointSha256(checkpointSha256)
                    .corpusVersion(run.getCorpusVersion())
                    .trainSha256(run.getTrainSha256())
                    .validationSha256(run.getValidationSha256())
                    .trainFirstIssue(run.getTrainFirstIssue())
                    .trainLatestIssue(run.getTrainLatestIssue())
                    .validationFirstIssue(run.getValidationFirstIssue())
                    .validationLatestIssue(run.getValidationLatestIssue())
                    .modelConfig(generationOutput.modelConfig())
                    .maxNewTokens(maxNewTokens)
                    .temperature(temperature)
                    .topK(topK)
                    .seed(generationOutput.seed())
                    .strategyLabel(hasTextOrDefault(strategy, strategyLabel(generationOutput.generatedText())))
                    .poolSelected(poolEvaluation ? Boolean.FALSE : null)
                    .poolDecision(poolEvaluation ? "PENDING_POOL_SELECTION" : null)
                    .exitCode(exitCode)
                    .elapsedMillis(System.currentTimeMillis() - startedAt)
                    .lotteryCandidate(validation)
                    .generatedAt(System.currentTimeMillis())
                    .build();
            if (!poolEvaluation) {
                persistGeneration(result);
            }
            return result;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("MiniGPT 生成线程被中断", exception);
        } catch (IOException exception) {
            throw new IllegalStateException("MiniGPT 生成启动失败", exception);
        }
    }

    @Override
    public MiniGptLotteryCandidateValidation validateLotteryCandidate(String text) {
        String sourceText = hasTextOrDefault(text, "");
        ParsedLotteryCandidate parsed = parseLotteryCandidate(sourceText);
        List<Integer> redValues = parsed.redValues();
        Integer blueValue = parsed.blueValue();
        List<String> issues = new ArrayList<>();
        List<String> issueCodes = new ArrayList<>();
        Set<String> repairActions = new LinkedHashSet<>();

        if (redValues.isEmpty() && blueValue == null) {
            issues.add("未解析到候选号码");
            issueCodes.add("NO_CANDIDATE");
        }
        if (redValues.size() != 6) {
            issues.add("红球数量应为 6 个，当前为 " + redValues.size());
            issueCodes.add("RED_COUNT");
            if (redValues.size() > 6) {
                repairActions.add("TRIM_RED_TO_SIX");
            }
        }
        if (blueValue == null) {
            issues.add("未解析到蓝球");
            issueCodes.add("BLUE_MISSING");
        }

        List<Integer> outOfRangeRed = redValues.stream()
                .filter(value -> value < 1 || value > 33)
                .toList();
        if (!outOfRangeRed.isEmpty()) {
            issues.add("红球越界: " + outOfRangeRed);
            issueCodes.add("RED_OUT_OF_RANGE");
            repairActions.add("FILTER_RED_OUT_OF_RANGE");
        }
        if (blueValue != null && (blueValue < 1 || blueValue > 16)) {
            issues.add("蓝球越界: " + blueValue);
            issueCodes.add("BLUE_OUT_OF_RANGE");
            repairActions.add("DROP_BLUE_OUT_OF_RANGE");
        }

        long distinctRedCount = redValues.stream().distinct().count();
        int duplicateCount = redValues.size() - (int) distinctRedCount;
        if (duplicateCount > 0) {
            issues.add("红球存在重复");
            issueCodes.add("RED_DUPLICATE");
            repairActions.add("DEDUPLICATE_RED");
        }

        boolean redAscending = isAscending(redValues);
        if (redValues.size() > 1 && !redAscending) {
            issues.add("红球未按升序排列");
            issueCodes.add("RED_NOT_ASCENDING");
            repairActions.add("SORT_RED_ASCENDING");
        }

        List<Integer> repairedRed = redValues.stream()
                .filter(value -> value >= 1 && value <= 33)
                .distinct()
                .sorted()
                .limit(6)
                .toList();
        String repairedBlue = blueValue != null && blueValue >= 1 && blueValue <= 16 ? formatBall(blueValue) : null;
        int redSum = redValues.stream()
                .filter(value -> value >= 1 && value <= 33)
                .mapToInt(Integer::intValue)
                .sum();
        int oddCount = (int) redValues.stream().filter(value -> value % 2 != 0).count();
        int evenCount = redValues.size() - oddCount;
        int span = repairedRed.size() >= 2 ? repairedRed.get(repairedRed.size() - 1) - repairedRed.get(0) : 0;
        boolean parseable = !redValues.isEmpty() || blueValue != null;
        boolean valid = issues.isEmpty();
        boolean postRepairValid = repairedRed.size() == 6 && repairedBlue != null;

        return MiniGptLotteryCandidateValidation.builder()
                .sourceText(sourceText)
                .redNumbers(redValues.stream().map(MiniGptLearningService::formatBall).toList())
                .blueNumber(blueValue == null ? null : formatBall(blueValue))
                .redCount(redValues.size())
                .valid(valid)
                .parseable(parseable)
                .redSum(redSum)
                .span(span)
                .oddCount(oddCount)
                .evenCount(evenCount)
                .duplicateCount(duplicateCount)
                .redAscending(redAscending)
                .status(valid ? "PASS" : parseable ? "WARNING" : "FAILED")
                .issues(issues)
                .issueCodes(issueCodes)
                .repairApplied(!repairActions.isEmpty())
                .repairActions(new ArrayList<>(repairActions))
                .postRepairValid(postRepairValid)
                .repairedRedNumbers(repairedRed.stream().map(MiniGptLearningService::formatBall).toList())
                .repairedBlueNumber(repairedBlue)
                .build();
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

    private TrainingContext validateTrainingContext(MiniGptTrainingRequest request, String preset) {
        Path playgroundDir = resolvePlaygroundDir();
        String dataValue = hasTextOrDefault(request.getData(), DEFAULT_DATA);
        Path dataPath = resolvePlaygroundPath(playgroundDir, dataValue, "训练语料");
        if (!Files.isRegularFile(dataPath)) {
            throw new MiniGptTrainingValidationException("未找到 MiniGPT 训练语料文件: " + dataValue);
        }

        String manifestValue = trimToNull(request.getManifestDataPath());
        boolean versionedLotteryCorpus = StringUtils.hasText(manifestValue)
                || dataPath.toString().contains(LOTTERY_CORPUS_VERSION_ROOT);
        SampleStats stats = readSampleStats(dataPath);
        int effectiveBlockSize = effectiveBlockSize(playgroundDir, request, preset);
        String validationSource = StringUtils.hasText(request.getEvalData()) ? "FIXED_FILE" : "TRAIN_TAIL_SPLIT";

        if (!versionedLotteryCorpus) {
            return new TrainingContext(
                    PROVENANCE_LEGACY,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    stats.minimumTokens(),
                    stats.maximumTokens(),
                    stats.requiredBlockSize(),
                    stats.recommendedBlockSize(),
                    effectiveBlockSize,
                    validationSource
            );
        }

        if (!StringUtils.hasText(manifestValue)) {
            Path inferredManifest = dataPath.getParent() == null ? null : dataPath.getParent().resolve("manifest.json");
            if (inferredManifest == null || !Files.isRegularFile(inferredManifest)) {
                throw new MiniGptTrainingValidationException("正式版本化彩票语料必须提供 manifestDataPath");
            }
            manifestValue = playgroundRelativePath(playgroundDir, inferredManifest);
        }

        Path manifestPath = resolvePlaygroundPath(playgroundDir, manifestValue, "语料 manifest");
        Map<String, Object> manifest = readJsonObject(manifestPath, "读取 MiniGPT 语料 manifest 失败");
        String corpusVersion = requiredManifestText(manifest, "corpusVersion");
        String corpusFormat = requiredManifestText(manifest, "format");
        Integer schemaVersion = requiredManifestInteger(manifest, "schemaVersion");
        String templateVersion = requiredManifestText(manifest, "templateVersion");
        String manifestTrainSha = requiredManifestText(manifest, "trainSha256");
        String manifestValidationSha = requiredManifestText(manifest, "validationSha256");
        String trainFirstIssue = requiredManifestText(manifest, "trainFirstIssue");
        String trainLatestIssue = requiredManifestText(manifest, "trainLatestIssue");
        String validationFirstIssue = requiredManifestText(manifest, "validationFirstIssue");
        String validationLatestIssue = requiredManifestText(manifest, "validationLatestIssue");
        Path manifestTrainPath = manifestArtifactPath(playgroundDir, manifest, "trainDataPath", "trainFilePath");
        Path manifestValidationPath = manifestArtifactPath(playgroundDir, manifest, "validationDataPath", "validationFilePath");

        if (!dataPath.equals(manifestTrainPath)) {
            throw new MiniGptTrainingValidationException("训练语料路径与 manifest trainDataPath 不一致");
        }
        if (!StringUtils.hasText(request.getEvalData())) {
            throw new MiniGptTrainingValidationException("正式版本化彩票语料必须使用 manifest 配对的 validationDataPath");
        }
        Path evalPath = resolvePlaygroundPath(playgroundDir, request.getEvalData(), "验证语料");
        if (!evalPath.equals(manifestValidationPath)) {
            throw new MiniGptTrainingValidationException("验证语料路径与 manifest validationDataPath 不一致");
        }
        if (!Files.isRegularFile(evalPath)) {
            throw new MiniGptTrainingValidationException("未找到 MiniGPT 验证语料文件: " + request.getEvalData());
        }

        String actualTrainSha = sha256File(dataPath);
        String actualValidationSha = sha256File(evalPath);
        requireMatchingValue("manifest trainSha256", manifestTrainSha, actualTrainSha);
        requireMatchingValue("manifest validationSha256", manifestValidationSha, actualValidationSha);
        requireOptionalMatchingValue("请求 corpusVersion", request.getCorpusVersion(), corpusVersion);
        requireOptionalMatchingValue("请求 trainSha256", request.getTrainSha256(), actualTrainSha);
        requireOptionalMatchingValue("请求 validationSha256", request.getValidationSha256(), actualValidationSha);

        if (stats.sampleCount() == 0) {
            throw new MiniGptTrainingValidationException("正式版本化彩票训练语料不包含完整非空样本");
        }
        if (effectiveBlockSize < stats.requiredBlockSize()) {
            throw new MiniGptTrainingValidationException(
                    "MiniGPT Block Size=" + effectiveBlockSize
                            + " 无法容纳最长完整样本，至少需要 " + stats.requiredBlockSize()
                            + "，建议使用 " + stats.recommendedBlockSize()
            );
        }
        String trainText = readTrainingText(dataPath, "训练语料");
        String validationText = readTrainingText(evalPath, "验证语料");
        int minimumCorpusTokens = effectiveBlockSize + 2;
        int trainTokenCount = trainText.codePointCount(0, trainText.length());
        int validationTokenCount = validationText.codePointCount(0, validationText.length());
        if (trainTokenCount < minimumCorpusTokens) {
            throw new MiniGptTrainingValidationException(
                    "MiniGPT 训练语料 token 数=" + trainTokenCount + "，至少需要 " + minimumCorpusTokens
            );
        }
        if (validationTokenCount < minimumCorpusTokens) {
            throw new MiniGptTrainingValidationException(
                    "MiniGPT 验证语料 token 数=" + validationTokenCount + "，至少需要 " + minimumCorpusTokens
            );
        }
        Set<Integer> trainVocabulary = new TreeSet<>();
        trainText.codePoints().forEach(trainVocabulary::add);
        Set<Integer> validationOnlyTokens = new TreeSet<>();
        validationText.codePoints().forEach(validationOnlyTokens::add);
        validationOnlyTokens.removeAll(trainVocabulary);
        if (!validationOnlyTokens.isEmpty()) {
            throw new MiniGptTrainingValidationException(
                    "MiniGPT 验证语料包含训练 tokenizer 未见字符: " + validationOnlyTokens
            );
        }

        return new TrainingContext(
                PROVENANCE_VERIFIED,
                playgroundRelativePath(playgroundDir, manifestPath),
                corpusVersion,
                corpusFormat,
                schemaVersion,
                templateVersion,
                actualTrainSha,
                actualValidationSha,
                trainFirstIssue,
                trainLatestIssue,
                validationFirstIssue,
                validationLatestIssue,
                stats.minimumTokens(),
                stats.maximumTokens(),
                stats.requiredBlockSize(),
                stats.recommendedBlockSize(),
                effectiveBlockSize,
                "FIXED_FILE"
        );
    }

    private int effectiveBlockSize(Path playgroundDir, MiniGptTrainingRequest request, String preset) {
        try {
            ResumeSource resumeSource = resolveResumeSource(playgroundDir, request);
            if (resumeSource != null) {
                Path configPath = resumeSource.checkpointPath().getParent().resolve("config.json");
                if (Files.isRegularFile(configPath)) {
                    Integer blockSize = asInteger(readJsonObject(configPath, "读取 MiniGPT checkpoint config 失败").get("block_size"));
                    if (blockSize != null && blockSize > 0) {
                        return blockSize;
                    }
                }
                throw new MiniGptTrainingValidationException(
                        "MiniGPT 续训 checkpoint 缺少有效 config.block_size: " + configPath
                );
            }
        } catch (IllegalArgumentException exception) {
            throw new MiniGptTrainingValidationException(exception.getMessage(), exception);
        }
        if (request.getBlockSize() != null && request.getBlockSize() > 0) {
            return request.getBlockSize();
        }
        return presetDefaultBlockSize(preset);
    }

    private static Path resolvePlaygroundPath(Path playgroundDir, String value, String label) {
        if (!StringUtils.hasText(value)) {
            throw new MiniGptTrainingValidationException(label + "路径不能为空");
        }
        Path configured = Path.of(value);
        Path resolved = configured.isAbsolute()
                ? configured.normalize()
                : playgroundDir.resolve(configured).normalize();
        if (!resolved.startsWith(playgroundDir)) {
            throw new MiniGptTrainingValidationException(label + "路径必须位于 MiniGPT playground 目录内");
        }
        return resolved;
    }

    private static String playgroundRelativePath(Path playgroundDir, Path path) {
        return playgroundDir.relativize(path.normalize()).toString();
    }

    private static Path manifestArtifactPath(Path playgroundDir,
                                             Map<String, Object> manifest,
                                             String dataPathKey,
                                             String filePathKey) {
        String dataPath = asString(manifest.get(dataPathKey));
        if (StringUtils.hasText(dataPath)) {
            return resolvePlaygroundPath(playgroundDir, dataPath, "manifest " + dataPathKey);
        }
        String filePath = requiredManifestText(manifest, filePathKey);
        return resolvePlaygroundPath(playgroundDir, filePath, "manifest " + filePathKey);
    }

    private static Map<String, Object> readJsonObject(Path path, String message) {
        if (!Files.isRegularFile(path)) {
            throw new MiniGptTrainingValidationException("未找到文件: " + path);
        }
        try {
            return OBJECT_MAPPER.readValue(path.toFile(), new TypeReference<>() {
            });
        } catch (IOException exception) {
            throw new MiniGptTrainingValidationException(message + ": " + path, exception);
        }
    }

    private static String requiredManifestText(Map<String, Object> manifest, String field) {
        String value = asString(manifest.get(field));
        if (!StringUtils.hasText(value)) {
            throw new MiniGptTrainingValidationException("MiniGPT 语料 manifest 缺少字段: " + field);
        }
        return value;
    }

    private static Integer requiredManifestInteger(Map<String, Object> manifest, String field) {
        Integer value = asInteger(manifest.get(field));
        if (value == null) {
            throw new MiniGptTrainingValidationException("MiniGPT 语料 manifest 缺少字段: " + field);
        }
        return value;
    }

    private static void requireMatchingValue(String label, String expected, String actual) {
        if (!expected.equalsIgnoreCase(actual)) {
            throw new MiniGptTrainingValidationException(label + " 与实际文件 SHA-256 不一致");
        }
    }

    private static void requireOptionalMatchingValue(String label, String expected, String actual) {
        if (StringUtils.hasText(expected) && !expected.equalsIgnoreCase(actual)) {
            throw new MiniGptTrainingValidationException(label + " 与服务端 provenance 不一致");
        }
    }

    private static SampleStats readSampleStats(Path path) {
        try {
            return sampleStats(Files.readString(path, StandardCharsets.UTF_8));
        } catch (IOException exception) {
            throw new MiniGptTrainingValidationException("读取 MiniGPT 训练语料失败: " + path, exception);
        }
    }

    private static String readTrainingText(Path path, String label) {
        try {
            return Files.readString(path, StandardCharsets.UTF_8);
        } catch (IOException exception) {
            throw new MiniGptTrainingValidationException("读取 MiniGPT " + label + "失败: " + path, exception);
        }
    }

    private static SampleStats sampleStats(String text) {
        List<Integer> lengths = new ArrayList<>();
        int lineStart = 0;
        int index = 0;
        while (index < text.length()) {
            char value = text.charAt(index);
            if (value != '\r' && value != '\n') {
                index++;
                continue;
            }
            String line = text.substring(lineStart, index);
            int terminatorTokens = 1;
            if (value == '\r' && index + 1 < text.length() && text.charAt(index + 1) == '\n') {
                terminatorTokens = 2;
                index++;
            }
            if (!line.isBlank()) {
                lengths.add(line.codePointCount(0, line.length()) + terminatorTokens);
            }
            index++;
            lineStart = index;
        }
        if (lineStart < text.length()) {
            String line = text.substring(lineStart);
            if (!line.isBlank()) {
                lengths.add(line.codePointCount(0, line.length()) + 1);
            }
        }
        if (lengths.isEmpty()) {
            return new SampleStats(0, 0, 0, 0, 0);
        }
        int minimum = lengths.stream().mapToInt(Integer::intValue).min().orElse(0);
        int maximum = lengths.stream().mapToInt(Integer::intValue).max().orElse(0);
        int required = maximum;
        int recommended = ((required + 15) / 16) * 16;
        return new SampleStats(lengths.size(), minimum, maximum, required, recommended);
    }

    private static InsightProvenance insightProvenance(Path dataPath, String text) {
        Path parent = dataPath.getParent();
        Path manifestPath = parent == null ? null : parent.resolve("manifest.json");
        if (manifestPath == null || !Files.isRegularFile(manifestPath)) {
            return InsightProvenance.legacy();
        }
        try {
            Map<String, Object> manifest = OBJECT_MAPPER.readValue(manifestPath.toFile(), new TypeReference<>() {
            });
            String fileName = dataPath.getFileName().toString();
            String expectedHash = switch (fileName) {
                case "train.txt" -> asString(manifest.get("trainSha256"));
                case "validation.txt" -> asString(manifest.get("validationSha256"));
                case "all.txt" -> asString(manifest.get("contentSha256"));
                default -> null;
            };
            String status = StringUtils.hasText(expectedHash) && expectedHash.equalsIgnoreCase(sha256(text))
                    ? PROVENANCE_VERIFIED
                    : "HASH_MISMATCH";
            return new InsightProvenance(
                    asString(manifest.get("corpusVersion")),
                    asString(manifest.get("format")),
                    asInteger(manifest.get("schemaVersion")),
                    asString(manifest.get("templateVersion")),
                    asString(manifest.get("trainSha256")),
                    asString(manifest.get("validationSha256")),
                    status
            );
        } catch (IOException exception) {
            return InsightProvenance.legacy();
        }
    }

    private static int normalizeLimit(Integer limit, int defaultValue, int maxValue) {
        if (limit == null || limit <= 0) {
            return defaultValue;
        }
        return Math.min(limit, maxValue);
    }

    private static List<Double> normalizeTemperatures(List<Double> temperatures) {
        if (temperatures == null || temperatures.isEmpty()) {
            return List.of(0.7, 0.9, 1.1);
        }
        List<Double> values = temperatures.stream()
                .filter(value -> value != null && value >= 0.1 && value <= 2)
                .distinct()
                .limit(3)
                .toList();
        return values.isEmpty() ? List.of(0.7, 0.9, 1.1) : values;
    }

    private static List<Integer> normalizeTopKs(List<Integer> topKs) {
        if (topKs == null || topKs.isEmpty()) {
            return List.of(20);
        }
        List<Integer> values = topKs.stream()
                .filter(value -> value != null && value >= 1 && value <= 200)
                .distinct()
                .limit(2)
                .toList();
        return values.isEmpty() ? List.of(20) : values;
    }

    private static double normalizeTemperature(Double temperature) {
        if (temperature == null) {
            return DEFAULT_GENERATION_TEMPERATURE;
        }
        return Math.max(0.1, Math.min(2.0, temperature));
    }

    private static int normalizeTopK(Integer topK) {
        if (topK == null) {
            return DEFAULT_GENERATION_TOP_K;
        }
        return Math.max(1, Math.min(200, topK));
    }

    private static long normalizeSeed(Long seed) {
        return seed == null ? DEFAULT_GENERATION_SEED : Math.max(0L, seed);
    }

    private static List<String> normalizeStrategies(List<String> strategies) {
        if (strategies == null || strategies.isEmpty()) {
            return List.of("balanced", "zone-balance", "structure-observed");
        }
        List<String> normalized = strategies.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .map(String::toLowerCase)
                .filter(value -> value.matches("[a-z0-9-]{1,40}"))
                .distinct()
                .limit(8)
                .toList();
        return normalized.isEmpty() ? List.of("balanced", "zone-balance", "structure-observed") : normalized;
    }

    private static String promptForStrategy(String prompt, String strategy) {
        String base = hasTextOrDefault(prompt, "target=next").trim();
        Matcher matcher = STRATEGY_FIELD_PATTERN.matcher(base);
        return matcher.find()
                ? matcher.replaceAll("strategy=" + strategy)
                : base + " strategy=" + strategy;
    }

    private static String strategyLabel(String text) {
        if (!StringUtils.hasText(text)) {
            return null;
        }
        Matcher matcher = STRATEGY_FIELD_PATTERN.matcher(text);
        return matcher.find() ? matcher.group(1).toLowerCase() : null;
    }

    private static GenerationOutput parseGenerationOutput(String output,
                                                          long fallbackSeed,
                                                          Map<String, Object> fallbackConfig) {
        if (StringUtils.hasText(output)) {
            String lastLine = output.lines()
                    .map(String::trim)
                    .filter(StringUtils::hasText)
                    .reduce((first, second) -> second)
                    .orElse(output.trim());
            GenerationOutput parsed = parseGenerationJson(lastLine, fallbackSeed, fallbackConfig);
            if (parsed != null) {
                return parsed;
            }
            parsed = parseGenerationJson(output.trim(), fallbackSeed, fallbackConfig);
            if (parsed != null) {
                return parsed;
            }
        }
        return new GenerationOutput(output, fallbackSeed, copyConfig(fallbackConfig));
    }

    private static GenerationOutput parseGenerationJson(String candidate,
                                                         long fallbackSeed,
                                                         Map<String, Object> fallbackConfig) {
        if (!StringUtils.hasText(candidate) || !candidate.startsWith("{")) {
            return null;
        }
        try {
            Map<String, Object> payload = OBJECT_MAPPER.readValue(candidate, new TypeReference<>() {
            });
            String generatedText = asString(payload.get("generated_text"));
            Long seed = asLong(payload.get("seed"));
            Map<String, Object> modelConfig = asMap(payload.get("model_config"));
            if (StringUtils.hasText(generatedText)) {
                return new GenerationOutput(
                        generatedText,
                        seed == null ? fallbackSeed : seed,
                        modelConfig.isEmpty() ? copyConfig(fallbackConfig) : modelConfig
                );
            }
        } catch (IOException ignored) {
            // Older Python runners returned plain generated text; keep that response compatible.
        }
        return null;
    }

    private void persistGeneration(MiniGptGenerationResult result) {
        generationRepository.save(MiniGptGenerationRecord.builder()
                .id(result.getGenerationId())
                .generationId(result.getGenerationId())
                .batchId(result.getBatchId())
                .runId(result.getRunId())
                .runName(result.getRunName())
                .corpusVersion(result.getCorpusVersion())
                .trainSha256(result.getTrainSha256())
                .validationSha256(result.getValidationSha256())
                .trainFirstIssue(result.getTrainFirstIssue())
                .trainLatestIssue(result.getTrainLatestIssue())
                .validationFirstIssue(result.getValidationFirstIssue())
                .validationLatestIssue(result.getValidationLatestIssue())
                .checkpoint(result.getCheckpoint())
                .checkpointSha256(result.getCheckpointSha256())
                .modelConfig(copyConfig(result.getModelConfig()))
                .prompt(result.getPrompt())
                .generatedText(result.getGeneratedText())
                .maxNewTokens(result.getMaxNewTokens())
                .temperature(result.getTemperature())
                .topK(result.getTopK())
                .seed(result.getSeed())
                .strategyLabel(result.getStrategyLabel())
                .poolSelected(result.getPoolSelected())
                .poolDecision(result.getPoolDecision())
                .batchBaseSeed(result.getBatchBaseSeed())
                .batchMaxRedOverlap(result.getBatchMaxRedOverlap())
                .batchMinimumBlueCoverage(result.getBatchMinimumBlueCoverage())
                .batchMinimumBlueCoverageMet(result.getBatchMinimumBlueCoverageMet())
                .batchStrategies(result.getBatchStrategies())
                .exitCode(result.getExitCode())
                .elapsedMillis(result.getElapsedMillis())
                .lotteryCandidate(result.getLotteryCandidate())
                .generatedAt(result.getGeneratedAt())
                .build());
    }

    private void selectCandidatePool(List<MiniGptGenerationResult> results,
                                     int maxRedOverlap,
                                     int minimumBlueCoverage) {
        List<MiniGptGenerationResult> remaining = new ArrayList<>();
        for (MiniGptGenerationResult result : results) {
            if (isCandidateUsable(result.getLotteryCandidate())) {
                remaining.add(result);
            } else {
                result.setPoolSelected(false);
                result.setPoolDecision("REJECTED_NOT_LEGAL");
            }
        }

        List<MiniGptGenerationResult> selected = new ArrayList<>();
        Set<String> selectedBlueNumbers = new LinkedHashSet<>();
        while (!remaining.isEmpty()) {
            MiniGptGenerationResult best = null;
            int bestOverlap = Integer.MAX_VALUE;
            boolean bestAddsBlue = false;
            for (MiniGptGenerationResult candidate : remaining) {
                int overlap = maximumOverlap(candidate, selected);
                if (overlap > maxRedOverlap) {
                    continue;
                }
                String blue = candidateBlue(candidate.getLotteryCandidate());
                boolean addsBlue = StringUtils.hasText(blue) && !selectedBlueNumbers.contains(blue);
                boolean coveragePriority = minimumBlueCoverage <= 0 || selectedBlueNumbers.size() < minimumBlueCoverage;
                if (best == null
                        || (coveragePriority && addsBlue && !bestAddsBlue)
                        || (addsBlue == bestAddsBlue && overlap < bestOverlap)) {
                    best = candidate;
                    bestOverlap = overlap;
                    bestAddsBlue = addsBlue;
                }
            }
            if (best == null) {
                break;
            }
            best.setPoolSelected(true);
            best.setPoolDecision(bestAddsBlue ? "SELECTED_BLUE_COVERAGE" : "SELECTED_OVERLAP_OK");
            selected.add(best);
            String blue = candidateBlue(best.getLotteryCandidate());
            if (StringUtils.hasText(blue)) {
                selectedBlueNumbers.add(blue);
            }
            remaining.remove(best);
        }
        for (MiniGptGenerationResult rejected : remaining) {
            rejected.setPoolSelected(false);
            rejected.setPoolDecision("REJECTED_RED_OVERLAP");
        }
    }

    private MiniGptGenerationBatchResult generationBatchResult(String batchId,
                                                               int requestedCount,
                                                               long baseSeed,
                                                               int maxRedOverlap,
                                                               int minimumBlueCoverage,
                                                               boolean minimumBlueCoverageMet,
                                                               List<String> requestedStrategies,
                                                               List<MiniGptGenerationResult> results) {
        int generatedCount = results.size();
        int parseableCount = 0;
        int legalCount = 0;
        int repairedCount = 0;
        int postRepairLegalCount = 0;
        Map<String, Integer> repairReasonCounts = new LinkedHashMap<>();
        for (MiniGptGenerationResult result : results) {
            MiniGptLotteryCandidateValidation validation = result.getLotteryCandidate();
            if (validation == null) {
                continue;
            }
            if (Boolean.TRUE.equals(validation.getParseable())) {
                parseableCount++;
            }
            if (Boolean.TRUE.equals(validation.getValid())) {
                legalCount++;
            }
            if (Boolean.TRUE.equals(validation.getRepairApplied())) {
                repairedCount++;
            }
            if (isCandidateUsable(validation)) {
                postRepairLegalCount++;
            }
            if (validation.getIssueCodes() != null) {
                validation.getIssueCodes().forEach(code -> repairReasonCounts.merge(code, 1, Integer::sum));
            }
        }

        List<MiniGptGenerationResult> selected = results.stream()
                .filter(result -> Boolean.TRUE.equals(result.getPoolSelected()))
                .toList();
        OverlapStats overlapStats = overlapStats(selected);
        Set<String> blueNumbers = new LinkedHashSet<>();
        Map<String, Integer> strategyComposition = new LinkedHashMap<>();
        for (MiniGptGenerationResult result : results) {
            String strategy = hasTextOrDefault(result.getStrategyLabel(), "unlabeled");
            strategyComposition.merge(strategy, 1, Integer::sum);
        }
        for (MiniGptGenerationResult result : selected) {
            String blue = candidateBlue(result.getLotteryCandidate());
            if (StringUtils.hasText(blue)) {
                blueNumbers.add(blue);
            }
        }

        MiniGptGenerationResult first = results.isEmpty() ? null : results.get(0);
        return MiniGptGenerationBatchResult.builder()
                .batchId(batchId)
                .runId(first == null ? null : first.getRunId())
                .runName(first == null ? null : first.getRunName())
                .corpusVersion(first == null ? null : first.getCorpusVersion())
                .trainSha256(first == null ? null : first.getTrainSha256())
                .validationSha256(first == null ? null : first.getValidationSha256())
                .checkpoint(first == null ? null : first.getCheckpoint())
                .checkpointSha256(first == null ? null : first.getCheckpointSha256())
                .modelConfig(first == null ? Collections.emptyMap() : copyConfig(first.getModelConfig()))
                .requestedCount(requestedCount)
                .baseSeed(baseSeed)
                .maxRedOverlap(maxRedOverlap)
                .minimumBlueCoverage(minimumBlueCoverage)
                .minimumBlueCoverageMet(minimumBlueCoverageMet)
                .requestedStrategies(requestedStrategies)
                .generatedCount(generatedCount)
                .generatedRate(rate(generatedCount, requestedCount))
                .parseableCount(parseableCount)
                .parseableRate(rate(parseableCount, generatedCount))
                .legalCount(legalCount)
                .legalRate(rate(legalCount, generatedCount))
                .repairedCount(repairedCount)
                .repairedRate(rate(repairedCount, generatedCount))
                .postRepairLegalCount(postRepairLegalCount)
                .postRepairLegalRate(rate(postRepairLegalCount, generatedCount))
                .repairReasonCounts(repairReasonCounts)
                .redOverlapMax(overlapStats.maximum())
                .redOverlapAverage(overlapStats.average())
                .distinctBlueCount(blueNumbers.size())
                .blueCoverage(rate(blueNumbers.size(), selected.size()))
                .strategyComposition(strategyComposition)
                .items(results)
                .generatedAt(System.currentTimeMillis())
                .build();
    }

    private static boolean applyBatchPolicy(List<MiniGptGenerationResult> results,
                                            long baseSeed,
                                            int maxRedOverlap,
                                            int minimumBlueCoverage,
                                            List<String> strategies) {
        Set<String> selectedBlueNumbers = new LinkedHashSet<>();
        results.stream()
                .filter(result -> Boolean.TRUE.equals(result.getPoolSelected()))
                .map(MiniGptGenerationResult::getLotteryCandidate)
                .map(MiniGptLearningService::candidateBlue)
                .filter(StringUtils::hasText)
                .forEach(selectedBlueNumbers::add);
        boolean coverageMet = minimumBlueCoverage == 0 || selectedBlueNumbers.size() >= minimumBlueCoverage;
        for (MiniGptGenerationResult result : results) {
            result.setBatchBaseSeed(baseSeed);
            result.setBatchMaxRedOverlap(maxRedOverlap);
            result.setBatchMinimumBlueCoverage(minimumBlueCoverage);
            result.setBatchMinimumBlueCoverageMet(coverageMet);
            result.setBatchStrategies(List.copyOf(strategies));
        }
        return coverageMet;
    }

    private static boolean isCandidateUsable(MiniGptLotteryCandidateValidation validation) {
        return validation != null
                && (Boolean.TRUE.equals(validation.getValid()) || Boolean.TRUE.equals(validation.getPostRepairValid()));
    }

    private static List<String> candidateRedNumbers(MiniGptLotteryCandidateValidation validation) {
        if (validation == null) {
            return Collections.emptyList();
        }
        List<String> values = Boolean.TRUE.equals(validation.getValid())
                ? validation.getRedNumbers()
                : validation.getRepairedRedNumbers();
        return values == null ? Collections.emptyList() : values;
    }

    private static String candidateBlue(MiniGptLotteryCandidateValidation validation) {
        if (validation == null) {
            return null;
        }
        return Boolean.TRUE.equals(validation.getValid())
                ? validation.getBlueNumber()
                : validation.getRepairedBlueNumber();
    }

    private static int maximumOverlap(MiniGptGenerationResult candidate,
                                      List<MiniGptGenerationResult> selected) {
        int maximum = 0;
        Set<String> candidateReds = new LinkedHashSet<>(candidateRedNumbers(candidate.getLotteryCandidate()));
        for (MiniGptGenerationResult existing : selected) {
            Set<String> shared = new LinkedHashSet<>(candidateReds);
            shared.retainAll(candidateRedNumbers(existing.getLotteryCandidate()));
            maximum = Math.max(maximum, shared.size());
        }
        return maximum;
    }

    private static OverlapStats overlapStats(List<MiniGptGenerationResult> selected) {
        if (selected.size() < 2) {
            return new OverlapStats(0, 0.0);
        }
        int maximum = 0;
        int total = 0;
        int pairs = 0;
        for (int left = 0; left < selected.size(); left++) {
            Set<String> leftReds = new LinkedHashSet<>(candidateRedNumbers(selected.get(left).getLotteryCandidate()));
            for (int right = left + 1; right < selected.size(); right++) {
                Set<String> shared = new LinkedHashSet<>(leftReds);
                shared.retainAll(candidateRedNumbers(selected.get(right).getLotteryCandidate()));
                maximum = Math.max(maximum, shared.size());
                total += shared.size();
                pairs++;
            }
        }
        return new OverlapStats(maximum, pairs == 0 ? 0.0 : total * 1.0 / pairs);
    }

    private static double rate(int numerator, int denominator) {
        return denominator <= 0 ? 0.0 : numerator * 1.0 / denominator;
    }

    private void runTrainingProcess(MiniGptTrainingRequest request,
                                    String runName,
                                    String preset,
                                    int maxSteps,
                                    TrainingContext context,
                                    long startedAt) {
        try {
            Path playgroundDir = resolvePlaygroundDir();
            Path scriptPath = playgroundDir.resolve("mini_gpt.py");
            if (!Files.exists(scriptPath)) {
                throw new IllegalStateException("未找到 MiniGPT 训练脚本: " + scriptPath);
            }

            MiniGptRunRecord run = runRepository.findByRunName(runName)
                    .orElseThrow(() -> new IllegalStateException("未找到已初始化的 MiniGPT 实验: " + runName));
            List<String> command = buildTrainingCommand(playgroundDir, request, run, preset, maxSteps, context);
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
            updateTrainingRunCompletion(playgroundDir, runName, failed, cancelled, request, context);
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
                                              MiniGptRunRecord run,
                                              String preset,
                                              int maxSteps,
                                              TrainingContext context) {
        List<String> command = new java.util.ArrayList<>();
        command.add(resolvePython(playgroundDir));
        command.add("mini_gpt.py");
        command.add("--mode");
        command.add("train");
        addArgument(command, "--preset", preset);
        addArgument(command, "--run-name", run.getRunName());
        addArgument(command, "--run-id", run.getId());
        addArgument(command, "--seed", normalizeSeed(request.getSeed()));
        addArgument(command, "--data", hasTextOrDefault(request.getData(), DEFAULT_DATA));
        addOptionalArgument(command, "--eval-data", request.getEvalData());
        addArgument(command, "--max-steps", maxSteps);
        addArgument(command, "--sample-prompt", hasTextOrDefault(request.getSamplePrompt(), DEFAULT_SAMPLE_PROMPT));
        ResumeSource resumeSource = resolveResumeSource(playgroundDir, request);
        if (resumeSource != null) {
            addArgument(command, "--resume-checkpoint", resumeSource.checkpointPath().toString());
            addOptionalArgument(command, "--parent-run-name", resumeSource.runName());
            addArgument(command, "--parent-checkpoint", resumeSource.checkpointPath().toString());
        }
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
        addOptionalArgument(command, "--quality-gate-max-eval-loss", request.getQualityGateMaxEvalLoss());
        addOptionalArgument(command, "--quality-gate-max-loss-gap", request.getQualityGateMaxLossGap());
        if (context.verified()) {
            addArgument(command, "--manifest-data", context.manifestDataPath());
            addArgument(command, "--corpus-version", context.corpusVersion());
            addArgument(command, "--corpus-format", context.corpusFormat());
            addArgument(command, "--schema-version", context.schemaVersion());
            addArgument(command, "--template-version", context.templateVersion());
            addArgument(command, "--train-sha256", context.trainSha256());
            addArgument(command, "--validation-sha256", context.validationSha256());
            addArgument(command, "--required-block-size", context.requiredBlockSize());
        }
        return command;
    }

    private List<String> buildGenerationCommand(Path playgroundDir,
                                                Path checkpointPath,
                                                String prompt,
                                                int maxNewTokens,
                                                double temperature,
                                                int topK,
                                                long seed) {
        List<String> command = new java.util.ArrayList<>();
        command.add(resolvePython(playgroundDir));
        command.add("mini_gpt.py");
        command.add("--mode");
        command.add("generate");
        addArgument(command, "--checkpoint", checkpointPath.toString());
        addArgument(command, "--prompt", prompt);
        addArgument(command, "--max-new-tokens", maxNewTokens);
        addArgument(command, "--temperature", temperature);
        addArgument(command, "--top-k", topK);
        addArgument(command, "--seed", seed);
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
        long now = System.currentTimeMillis();
        MiniGptTrainingStatus current = trainingStatus.get();
        boolean cancelled = current.isCancelled();
        MiniGptRunRecord run = runRepository.findByRunName(runName).orElse(current.getRun());
        if (run != null) {
            run.setStatus(cancelled ? "CANCELLED" : "FAILED");
            run.setFinishedAt(formatDisplayTime(now));
            run.setUpdatedAt(now);
            MiniGptRunRecord saved = runRepository.save(run);
            if (saved != null) {
                run = saved;
            }
        }
        updateStatus(MiniGptTrainingStatus.builder()
                .running(false)
                .failed(!cancelled)
                .cancelled(cancelled)
                .exitCode(-1)
                .percent(100)
                .runName(runName)
                .preset(preset)
                .stage(cancelled ? "训练已取消" : "训练失败")
                .message(message)
                .processedStep(current.getProcessedStep())
                .totalSteps(maxSteps)
                .run(run)
                .latestLog(current.getLatestLog())
                .startedAt(startedAt)
                .updatedAt(now)
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

    private MiniGptRunRecord initializeTrainingRun(String runName,
                                                   String preset,
                                                   int maxSteps,
                                                   MiniGptTrainingRequest request,
                                                   TrainingContext context,
                                                   long startedAt) {
        long now = System.currentTimeMillis();
        MiniGptRunRecord run = new MiniGptRunRecord();
        run.setId(UUID.randomUUID().toString());
        run.setRunName(runName);
        run.setPreset(preset);
        run.setStatus("RUNNING");
        run.setStartedAt(formatDisplayTime(startedAt));
        run.setFinishedAt(null);
        run.setData(hasTextOrDefault(request.getData(), DEFAULT_DATA));
        run.setEvalData(trimToNull(request.getEvalData()));
        run.setManifestDataPath(context.manifestDataPath());
        run.setCorpusVersion(context.corpusVersion());
        run.setCorpusFormat(context.corpusFormat());
        run.setSchemaVersion(context.schemaVersion());
        run.setTemplateVersion(context.templateVersion());
        run.setTrainSha256(context.trainSha256());
        run.setValidationSha256(context.validationSha256());
        run.setTrainFirstIssue(context.trainFirstIssue());
        run.setTrainLatestIssue(context.trainLatestIssue());
        run.setValidationFirstIssue(context.validationFirstIssue());
        run.setValidationLatestIssue(context.validationLatestIssue());
        run.setProvenanceStatus(context.provenanceStatus());
        run.setMinimumSampleTokens(context.minimumSampleTokens());
        run.setMaximumSampleTokens(context.maximumSampleTokens());
        run.setRequiredBlockSize(context.requiredBlockSize());
        run.setRecommendedBlockSize(context.recommendedBlockSize());
        run.setEffectiveBlockSize(context.effectiveBlockSize());
        run.setValidationSource(context.validationSource());
        run.setSeed(normalizeSeed(request.getSeed()));
        run.setProvenance(context.provenanceMap());
        run.setCheckpoint(null);
        run.setCheckpointSha256(null);
        ResumeSource resumeSource = resolveResumeSource(resolvePlaygroundDir(), request);
        run.setParentRunName(resumeSource == null ? null : resumeSource.runName());
        run.setParentCheckpoint(resumeSource == null ? null : resumeSource.checkpointPath().toString());
        run.setResumeStep(null);
        run.setTrainStep(null);
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
        run.setFixedEvalLoss(null);
        run.setQualityGateMaxEvalLoss(request.getQualityGateMaxEvalLoss());
        run.setQualityGateMaxLossGap(request.getQualityGateMaxLossGap());
        run.setQualityGateStatus(null);
        run.setQualityGateReasons(null);
        run.setUpdatedAt(now);
        if (run.getCreatedAt() == null) {
            run.setCreatedAt(now);
        }
        run.setConfig(trainingConfig(request, context));
        MiniGptRunRecord saved = runRepository.save(run);
        return saved == null ? run : saved;
    }

    private void updateTrainingRunCompletion(Path playgroundDir,
                                             String runName,
                                             boolean failed,
                                             boolean cancelled,
                                             MiniGptTrainingRequest request,
                                             TrainingContext context) {
        MiniGptRunRecord run = runRepository.findByRunName(runName).orElseGet(MiniGptRunRecord::new);
        MiniGptTrainingLogRecord latestLog = logRepository.findFirstByRunNameOrderByStepDesc(runName).orElse(null);
        run.setRunName(runName);
        run.setStatus(cancelled ? "CANCELLED" : failed ? "FAILED" : "SUCCESS");
        run.setFinishedAt(formatDisplayTime(System.currentTimeMillis()));
        if (!failed && !cancelled) {
            Path checkpointPath = playgroundDir.resolve("runs").resolve(runName).resolve("checkpoints").resolve("mini_gpt.pt");
            run.setCheckpoint(checkpointPath.toString());
            if (Files.exists(checkpointPath)) {
                run.setCheckpointSha256(sha256File(checkpointPath));
            }
        }
        ResumeSource resumeSource = resolveResumeSource(playgroundDir, request);
        run.setParentRunName(resumeSource == null ? run.getParentRunName() : resumeSource.runName());
        run.setParentCheckpoint(resumeSource == null ? run.getParentCheckpoint() : resumeSource.checkpointPath().toString());
        Map<String, Object> latestMetadata = readRunMetadata(playgroundDir, runName);
        run.setResumeStep(asInteger(latestMetadata.get("resume_step")));
        run.setTrainStep(asInteger(latestMetadata.get("train_step")));
        String metadataEvalData = asString(latestMetadata.get("eval_data"));
        if (StringUtils.hasText(metadataEvalData)) {
            run.setEvalData(metadataEvalData);
        }
        run.setFixedEvalLoss(asDouble(latestMetadata.get("fixed_eval_loss")));
        run.setQualityGateMaxEvalLoss(asDouble(latestMetadata.get("quality_gate_max_eval_loss")));
        run.setQualityGateMaxLossGap(asDouble(latestMetadata.get("quality_gate_max_loss_gap")));
        run.setQualityGateStatus(asString(latestMetadata.get("quality_gate_status")));
        run.setQualityGateReasons(asString(latestMetadata.get("quality_gate_reasons")));
        run.setValidationEnabled(asBoolean(latestMetadata.get("validation_enabled")));
        run.setTrainTokens(asInteger(latestMetadata.get("train_tokens")));
        run.setEvalTokens(asInteger(latestMetadata.get("eval_tokens")));
        run.setDevice(asString(latestMetadata.get("device")));
        Integer metadataBatchSize = asInteger(latestMetadata.get("batch_size"));
        if (metadataBatchSize != null) {
            run.setBatchSize(metadataBatchSize);
        }
        Double metadataLearningRate = asDouble(latestMetadata.get("learning_rate"));
        if (metadataLearningRate != null) {
            run.setLearningRate(metadataLearningRate);
        }
        Double metadataValRatio = asDouble(latestMetadata.get("val_ratio"));
        if (metadataValRatio != null) {
            run.setValRatio(metadataValRatio);
        }
        Integer metadataSampleTokens = asInteger(latestMetadata.get("sample_tokens"));
        if (metadataSampleTokens != null) {
            run.setSampleTokens(metadataSampleTokens);
        }
        String metadataSamplePrompt = asString(latestMetadata.get("sample_prompt"));
        if (StringUtils.hasText(metadataSamplePrompt)) {
            run.setSamplePrompt(metadataSamplePrompt);
        }
        run.setValidationSource(hasTextOrDefault(asString(latestMetadata.get("validation_source")), context.validationSource()));
        Long metadataSeed = asLong(latestMetadata.get("seed"));
        if (metadataSeed != null) {
            run.setSeed(metadataSeed);
        }
        String metadataCheckpointSha256 = asString(latestMetadata.get("checkpoint_sha256"));
        if (StringUtils.hasText(metadataCheckpointSha256)) {
            if (!StringUtils.hasText(run.getCheckpointSha256())) {
                run.setCheckpointSha256(metadataCheckpointSha256);
            } else if (!run.getCheckpointSha256().equalsIgnoreCase(metadataCheckpointSha256)) {
                log.warn("MiniGPT checkpoint SHA-256 metadata mismatch: runName={}", runName);
            }
        }
        Map<String, Object> effectiveConfig = asMap(latestMetadata.get("config"));
        if (!effectiveConfig.isEmpty()) {
            run.setConfig(effectiveConfig);
            run.setEffectiveBlockSize(asInteger(effectiveConfig.get("block_size")));
        }
        Map<String, Object> metadataProvenance = asMap(latestMetadata.get("provenance"));
        if (!metadataProvenance.isEmpty()) {
            Map<String, Object> mergedProvenance = new LinkedHashMap<>();
            if (run.getProvenance() != null) {
                mergedProvenance.putAll(run.getProvenance());
            }
            mergedProvenance.putAll(metadataProvenance);
            if (context.verified()) {
                mergedProvenance.putAll(context.provenanceMap());
            }
            run.setProvenance(mergedProvenance);
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
            run.setConfig(trainingConfig(request, context));
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

    private void applyEnvironmentOutput(MiniGptEnvironmentCheck.MiniGptEnvironmentCheckBuilder builder, String output) {
        if (!StringUtils.hasText(output)) {
            builder.pythonAvailable(false)
                    .pymongoAvailable(false)
                    .mongoAvailable(false)
                    .status("FAILED")
                    .message("MiniGPT 环境检查没有输出");
            return;
        }
        try {
            Map<String, Object> payload = OBJECT_MAPPER.readValue(output, new TypeReference<>() {
            });
            Boolean pymongoAvailable = Boolean.TRUE.equals(payload.get("pymongoAvailable"));
            Boolean mongoAvailable = Boolean.TRUE.equals(payload.get("mongoAvailable"));
            builder.pythonAvailable(Boolean.TRUE.equals(payload.get("pythonAvailable")))
                    .pythonPath(String.valueOf(payload.getOrDefault("pythonPath", "")))
                    .pymongoAvailable(pymongoAvailable)
                    .pymongoVersion(payload.get("pymongoVersion") == null ? null : String.valueOf(payload.get("pymongoVersion")))
                    .mongoAvailable(mongoAvailable)
                    .mongoDb(payload.get("mongoDb") == null ? DEFAULT_MONGO_DB : String.valueOf(payload.get("mongoDb")))
                    .status(pymongoAvailable && mongoAvailable ? "PASS" : "FAILED")
                    .message(payload.get("message") == null
                            ? pymongoAvailable && mongoAvailable ? "Python 可以直接写 Mongo" : "Python Mongo 依赖不完整"
                            : String.valueOf(payload.get("message")));
        } catch (IOException exception) {
            builder.pythonAvailable(true)
                    .pymongoAvailable(false)
                    .mongoAvailable(false)
                    .status("FAILED")
                    .message("MiniGPT 环境检查输出无法解析: " + output);
        }
    }

    private static String maskMongoUri(String mongoUri) {
        if (!StringUtils.hasText(mongoUri)) {
            return DEFAULT_MONGO_URI;
        }
        return mongoUri.replaceAll("(?<=://)([^:/@]+):([^@]+)@", "$1:****@");
    }

    private static ParsedLotteryCandidate parseLotteryCandidate(String text) {
        if (!StringUtils.hasText(text)) {
            return new ParsedLotteryCandidate(Collections.emptyList(), null);
        }

        List<Integer> redValues = new ArrayList<>();
        Matcher redMatcher = RED_FIELD_PATTERN.matcher(text);
        if (redMatcher.find()) {
            redValues.addAll(parseNumbers(redMatcher.group(1)));
        }

        Integer blueValue = null;
        Matcher blueMatcher = BLUE_FIELD_PATTERN.matcher(text);
        if (blueMatcher.find()) {
            blueValue = parseInteger(blueMatcher.group(1));
        }

        List<Integer> allNumbers = parseNumbers(text);
        if (redValues.isEmpty() && allNumbers.size() >= 6) {
            redValues.addAll(allNumbers.subList(0, 6));
        }
        if (blueValue == null && allNumbers.size() >= 7) {
            blueValue = allNumbers.get(6);
        }
        if (blueValue == null && allNumbers.size() == 1 && redValues.isEmpty()) {
            blueValue = allNumbers.get(0);
        }

        return new ParsedLotteryCandidate(redValues.stream().limit(12).toList(), blueValue);
    }

    private static List<Integer> parseNumbers(String text) {
        Matcher matcher = NUMBER_PATTERN.matcher(text);
        List<Integer> values = new ArrayList<>();
        while (matcher.find()) {
            Integer value = parseInteger(matcher.group());
            if (value != null) {
                values.add(value);
            }
        }
        return values;
    }

    private static Integer parseInteger(String value) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private static boolean isAscending(List<Integer> values) {
        for (int index = 1; index < values.size(); index++) {
            if (values.get(index) < values.get(index - 1)) {
                return false;
            }
        }
        return true;
    }

    private static String formatBall(Integer value) {
        return value == null ? null : String.format("%02d", value);
    }

    private List<LotteryDraw> loadLotteryDraws(int limit) {
        Map<String, LotteryDraw> drawsByIssue = new TreeMap<>();
        int fetchSize = Math.min(LOTTERY_CORPUS_PAGE_SIZE, limit);
        int page = 0;
        while (drawsByIssue.size() < limit) {
            List<LotteryDraw> pageDraws = recordService.findDraws(new RecordRequest(), page, fetchSize);
            if (pageDraws == null || pageDraws.isEmpty()) {
                break;
            }
            for (LotteryDraw draw : pageDraws) {
                if (!isValidCorpusDraw(draw)) {
                    continue;
                }
                String issue = safeIssue(draw);
                if (!drawsByIssue.containsKey(issue) && drawsByIssue.size() >= limit) {
                    break;
                }
                drawsByIssue.merge(issue, draw, MiniGptLearningService::canonicalCorpusDraw);
            }
            if (pageDraws.size() < fetchSize) {
                break;
            }
            page++;
        }
        return drawsByIssue.values().stream()
                .limit(limit)
                .toList();
    }

    private static String normalizeLotteryCorpusFormat(String format) {
        if (!StringUtils.hasText(format)) {
            return "raw";
        }
        String normalized = format.trim();
        if ("raw".equalsIgnoreCase(normalized)) {
            return "raw";
        }
        if ("features".equalsIgnoreCase(normalized)) {
            return "features";
        }
        if ("strategy".equalsIgnoreCase(normalized)) {
            return "strategy";
        }
        throw new MiniGptLotteryCorpusException("不支持的 MiniGPT 彩票语料格式: " + normalized);
    }

    private static String lotteryCorpusLine(LotteryDraw draw, String format) {
        return switch (format) {
            case "features" -> featureCorpusLine(draw);
            case "strategy" -> strategyCorpusLine(draw);
            default -> rawCorpusLine(draw);
        };
    }

    private static String corpusContent(List<String> lines) {
        return String.join(CORPUS_LINE_SEPARATOR, lines) + CORPUS_LINE_SEPARATOR;
    }

    private static String rawCorpusLine(LotteryDraw draw) {
        return String.format(
                "%s: %s + %s",
                safeIssue(draw),
                String.join(" ", normalizedRedNumbers(draw)),
                normalizedBlueNumber(draw)
        );
    }

    private static String featureCorpusLine(LotteryDraw draw) {
        List<Integer> redValues = redValues(draw);
        int oddCount = (int) redValues.stream().filter(value -> value % 2 != 0).count();
        int bigCount = (int) redValues.stream().filter(value -> value >= 17).count();
        return String.format(
                "issue=%s red=%s blue=%s sum=%s odd=%s even=%s big=%s small=%s span=%s consecutive=%s zone=%s",
                safeIssue(draw),
                String.join(",", normalizedRedNumbers(draw)),
                normalizedBlueNumber(draw),
                redValues.stream().mapToInt(Integer::intValue).sum(),
                oddCount,
                redValues.size() - oddCount,
                bigCount,
                redValues.size() - bigCount,
                span(redValues),
                consecutivePairs(redValues),
                zoneSignature(redValues)
        );
    }

    private static String strategyCorpusLine(LotteryDraw draw) {
        List<Integer> redValues = redValues(draw);
        int redSum = redValues.stream().mapToInt(Integer::intValue).sum();
        int oddCount = (int) redValues.stream().filter(value -> value % 2 != 0).count();
        int evenCount = redValues.size() - oddCount;
        int bigCount = (int) redValues.stream().filter(value -> value >= 17).count();
        int smallCount = redValues.size() - bigCount;
        int[] zones = zoneCounts(redValues);
        String reason = String.join(";",
                "sum_" + bucket(redSum, 80, 130),
                "odd_even_" + oddCount + "_" + evenCount,
                "big_small_" + bigCount + "_" + smallCount,
                "zone_" + zones[0] + "_" + zones[1] + "_" + zones[2],
                "span_" + bucket(span(redValues), 20, 28)
        );
        return String.format(
                "target=next strategy=%s red=%s blue=%s reason=%s source_issue=%s",
                strategyLabel(oddCount, evenCount, bigCount, smallCount, zones),
                String.join(",", normalizedRedNumbers(draw)),
                normalizedBlueNumber(draw),
                reason,
                safeIssue(draw)
        );
    }

    private static String safeIssue(LotteryDraw draw) {
        if (StringUtils.hasText(draw.getIssue())) {
            return draw.getIssue().trim();
        }
        return draw.getPeriod() == null ? "" : String.valueOf(draw.getPeriod());
    }

    private static boolean isValidCorpusDraw(LotteryDraw draw) {
        if (draw == null
                || (!StringUtils.hasText(draw.getIssue()) && draw.getPeriod() == null)
                || draw.getRedNumbers() == null
                || draw.getRedNumbers().size() != 6) {
            return false;
        }
        List<Integer> redValues = draw.getRedNumbers().stream()
                .map(MiniGptLearningService::parseInteger)
                .toList();
        Integer blueValue = parseInteger(draw.getBlueNumber());
        return redValues.stream().allMatch(value -> value != null && value >= 1 && value <= 33)
                && redValues.stream().distinct().count() == 6
                && blueValue != null
                && blueValue >= 1
                && blueValue <= 16;
    }

    private static LotteryDraw canonicalCorpusDraw(LotteryDraw first, LotteryDraw second) {
        return canonicalDrawKey(first).compareTo(canonicalDrawKey(second)) <= 0 ? first : second;
    }

    private static String canonicalDrawKey(LotteryDraw draw) {
        return String.join(",", normalizedRedNumbers(draw)) + "+" + normalizedBlueNumber(draw);
    }

    private static List<Integer> redValues(LotteryDraw draw) {
        return draw.getRedNumbers().stream()
                .map(MiniGptLearningService::parseInteger)
                .sorted()
                .toList();
    }

    private static List<String> normalizedRedNumbers(LotteryDraw draw) {
        return redValues(draw).stream().map(MiniGptLearningService::formatBall).toList();
    }

    private static String normalizedBlueNumber(LotteryDraw draw) {
        return formatBall(parseInteger(draw.getBlueNumber()));
    }

    private static int span(List<Integer> values) {
        return values.isEmpty() ? 0 : values.get(values.size() - 1) - values.get(0);
    }

    private static int consecutivePairs(List<Integer> values) {
        int pairs = 0;
        for (int index = 1; index < values.size(); index++) {
            if (values.get(index) - values.get(index - 1) == 1) {
                pairs++;
            }
        }
        return pairs;
    }

    private static int[] zoneCounts(List<Integer> redNumbers) {
        int[] zones = new int[3];
        for (Integer value : redNumbers) {
            zones[value <= 11 ? 0 : value <= 22 ? 1 : 2]++;
        }
        return zones;
    }

    private static String zoneSignature(List<Integer> redNumbers) {
        int[] zones = zoneCounts(redNumbers);
        return zones[0] + "," + zones[1] + "," + zones[2];
    }

    private static String strategyLabel(int oddCount,
                                        int evenCount,
                                        int bigCount,
                                        int smallCount,
                                        int[] zones) {
        int zoneMin = Math.min(zones[0], Math.min(zones[1], zones[2]));
        int zoneMax = Math.max(zones[0], Math.max(zones[1], zones[2]));
        if (zoneMax - zoneMin <= 1) {
            return "zone-balance";
        }
        if (Math.abs(oddCount - evenCount) <= 2 && Math.abs(bigCount - smallCount) <= 2 && zoneMin > 0) {
            return "balanced";
        }
        return "structure-observed";
    }

    private static String bucket(int value, int lowExclusiveBoundary, int highExclusiveBoundary) {
        if (value < lowExclusiveBoundary) {
            return "low";
        }
        if (value > highExclusiveBoundary) {
            return "high";
        }
        return "mid";
    }

    private static String sha256(String content) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(content.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("当前 JVM 不支持 SHA-256", exception);
        }
    }

    private static String sha256File(Path path) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(Files.readAllBytes(path)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("当前 JVM 不支持 SHA-256", exception);
        } catch (IOException exception) {
            throw new MiniGptTrainingValidationException("读取 SHA-256 文件失败: " + path, exception);
        }
    }

    private static String corpusVersion(String format,
                                        String templateVersion,
                                        String contentSha256,
                                        String trainSha256,
                                        String validationSha256) {
        String versionMaterial = String.join(CORPUS_LINE_SEPARATOR,
                "schemaVersion=" + LOTTERY_CORPUS_SCHEMA_VERSION,
                "templateVersion=" + templateVersion,
                "format=" + format,
                "sortOrder=" + LOTTERY_CORPUS_SORT_ORDER,
                "splitMode=" + LOTTERY_CORPUS_SPLIT_MODE,
                "validationRatio=" + LOTTERY_CORPUS_VALIDATION_RATIO,
                "contentSha256=" + contentSha256,
                "trainSha256=" + trainSha256,
                "validationSha256=" + validationSha256
        );
        return sha256(versionMaterial);
    }

    private static String relativeDataPath(Path playgroundDir, Path path) {
        return playgroundDir.relativize(path).toString().replace('\\', '/');
    }

    private static void publishVersionArtifacts(Path versionDir,
                                                String content,
                                                String trainContent,
                                                String validationContent,
                                                String manifestContent) throws IOException {
        Path formatDir = versionDir.getParent();
        Files.createDirectories(formatDir);
        if (Files.notExists(versionDir)) {
            publishNewVersionDirectory(
                    formatDir,
                    versionDir,
                    content,
                    trainContent,
                    validationContent,
                    manifestContent
            );
            return;
        }

        Files.createDirectories(versionDir);
        writeStringAtomically(versionDir.resolve("all.txt"), content);
        writeStringAtomically(versionDir.resolve("train.txt"), trainContent);
        writeStringAtomically(versionDir.resolve("validation.txt"), validationContent);
        writeStringAtomically(versionDir.resolve("manifest.json"), manifestContent);
    }

    private static void publishNewVersionDirectory(Path formatDir,
                                                   Path versionDir,
                                                   String content,
                                                   String trainContent,
                                                   String validationContent,
                                                   String manifestContent) throws IOException {
        Path stagingDir = Files.createTempDirectory(formatDir, "." + versionDir.getFileName() + "-");
        boolean published = false;
        try {
            Files.writeString(stagingDir.resolve("all.txt"), content, StandardCharsets.UTF_8);
            Files.writeString(stagingDir.resolve("train.txt"), trainContent, StandardCharsets.UTF_8);
            Files.writeString(stagingDir.resolve("validation.txt"), validationContent, StandardCharsets.UTF_8);
            Files.writeString(stagingDir.resolve("manifest.json"), manifestContent, StandardCharsets.UTF_8);
            moveDirectoryAtomically(stagingDir, versionDir);
            published = true;
        } finally {
            if (!published) {
                deleteStagingDirectory(stagingDir);
            }
        }
    }

    private static void writeStringAtomically(Path target, String content) throws IOException {
        Path parent = target.getParent();
        Files.createDirectories(parent);
        Path stagingPath = Files.createTempFile(parent, "." + target.getFileName() + "-", ".tmp");
        try {
            Files.writeString(stagingPath, content, StandardCharsets.UTF_8);
            try {
                Files.move(
                        stagingPath,
                        target,
                        StandardCopyOption.ATOMIC_MOVE,
                        StandardCopyOption.REPLACE_EXISTING
                );
            } catch (AtomicMoveNotSupportedException exception) {
                Files.move(stagingPath, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } finally {
            Files.deleteIfExists(stagingPath);
        }
    }

    private static void moveDirectoryAtomically(Path source, Path target) throws IOException {
        try {
            Files.move(source, target, StandardCopyOption.ATOMIC_MOVE);
        } catch (AtomicMoveNotSupportedException exception) {
            Files.move(source, target);
        }
    }

    private static void deleteStagingDirectory(Path stagingDir) {
        try {
            Files.deleteIfExists(stagingDir.resolve("all.txt"));
            Files.deleteIfExists(stagingDir.resolve("train.txt"));
            Files.deleteIfExists(stagingDir.resolve("validation.txt"));
            Files.deleteIfExists(stagingDir.resolve("manifest.json"));
            Files.deleteIfExists(stagingDir);
        } catch (IOException cleanupException) {
            log.warn("清理 MiniGPT 彩票语料临时目录失败: {}", stagingDir, cleanupException);
        }
    }

    private long existingManifestGeneratedAt(Path manifestPath) {
        if (!Files.exists(manifestPath)) {
            return System.currentTimeMillis();
        }
        try {
            Map<String, Object> existing = OBJECT_MAPPER.readValue(manifestPath.toFile(), new TypeReference<>() {
            });
            Long generatedAt = asLong(existing.get("generatedAt"));
            return generatedAt == null ? System.currentTimeMillis() : generatedAt;
        } catch (IOException exception) {
            log.warn("读取既有 MiniGPT 彩票语料 manifest 失败，将重新生成: {}", manifestPath, exception);
            return System.currentTimeMillis();
        }
    }

    private static Map<String, Object> lotteryCorpusManifest(String format,
                                                              String templateVersion,
                                                              String corpusVersion,
                                                              String legacyDataPath,
                                                              String legacyFilePath,
                                                              String fullDataPath,
                                                              String fullFilePath,
                                                              String trainDataPath,
                                                              String trainFilePath,
                                                              String validationDataPath,
                                                              String validationFilePath,
                                                              String manifestDataPath,
                                                              String manifestFilePath,
                                                              List<LotteryDraw> draws,
                                                              List<LotteryDraw> trainDraws,
                                                              List<LotteryDraw> validationDraws,
                                                              String contentSha256,
                                                              String trainSha256,
                                                              String validationSha256,
                                                              long generatedAt) {
        Map<String, Object> manifest = new LinkedHashMap<>();
        manifest.put("schemaVersion", LOTTERY_CORPUS_SCHEMA_VERSION);
        manifest.put("templateVersion", templateVersion);
        manifest.put("corpusVersion", corpusVersion);
        manifest.put("format", format);
        manifest.put("splitMode", LOTTERY_CORPUS_SPLIT_MODE);
        manifest.put("validationRatio", LOTTERY_CORPUS_VALIDATION_RATIO);
        manifest.put("sortOrder", LOTTERY_CORPUS_SORT_ORDER);
        manifest.put("dataPath", legacyDataPath);
        manifest.put("filePath", legacyFilePath);
        manifest.put("legacyDataPath", legacyDataPath);
        manifest.put("fullDataPath", fullDataPath);
        manifest.put("fullFilePath", fullFilePath);
        manifest.put("trainDataPath", trainDataPath);
        manifest.put("trainFilePath", trainFilePath);
        manifest.put("validationDataPath", validationDataPath);
        manifest.put("validationFilePath", validationFilePath);
        manifest.put("manifestDataPath", manifestDataPath);
        manifest.put("manifestFilePath", manifestFilePath);
        manifest.put("drawCount", draws.size());
        manifest.put("trainDrawCount", trainDraws.size());
        manifest.put("validationDrawCount", validationDraws.size());
        manifest.put("firstIssue", firstIssue(draws));
        manifest.put("latestIssue", latestIssue(draws));
        manifest.put("trainFirstIssue", firstIssue(trainDraws));
        manifest.put("trainLatestIssue", latestIssue(trainDraws));
        manifest.put("validationFirstIssue", firstIssue(validationDraws));
        manifest.put("validationLatestIssue", latestIssue(validationDraws));
        manifest.put("contentSha256", contentSha256);
        manifest.put("trainSha256", trainSha256);
        manifest.put("validationSha256", validationSha256);
        manifest.put("generatedAt", generatedAt);
        return manifest;
    }

    private static String firstIssue(List<LotteryDraw> draws) {
        return draws.isEmpty() ? null : safeIssue(draws.get(0));
    }

    private static String latestIssue(List<LotteryDraw> draws) {
        return draws.isEmpty() ? null : safeIssue(draws.get(draws.size() - 1));
    }

    private record TrainingContext(String provenanceStatus,
                                   String manifestDataPath,
                                   String corpusVersion,
                                   String corpusFormat,
                                   Integer schemaVersion,
                                   String templateVersion,
                                   String trainSha256,
                                   String validationSha256,
                                   String trainFirstIssue,
                                   String trainLatestIssue,
                                   String validationFirstIssue,
                                   String validationLatestIssue,
                                   Integer minimumSampleTokens,
                                   Integer maximumSampleTokens,
                                   Integer requiredBlockSize,
                                   Integer recommendedBlockSize,
                                   Integer effectiveBlockSize,
                                   String validationSource) {

        private boolean verified() {
            return PROVENANCE_VERIFIED.equals(provenanceStatus);
        }

        private Map<String, Object> provenanceMap() {
            Map<String, Object> values = new LinkedHashMap<>();
            values.put("manifest_data", manifestDataPath);
            values.put("corpus_version", corpusVersion);
            values.put("corpus_format", corpusFormat);
            values.put("schema_version", schemaVersion);
            values.put("template_version", templateVersion);
            values.put("train_sha256", trainSha256);
            values.put("validation_sha256", validationSha256);
            values.put("train_first_issue", trainFirstIssue);
            values.put("train_latest_issue", trainLatestIssue);
            values.put("validation_first_issue", validationFirstIssue);
            values.put("validation_latest_issue", validationLatestIssue);
            values.put("required_block_size", requiredBlockSize);
            return values;
        }
    }

    private record SampleStats(int sampleCount,
                               int minimumTokens,
                               int maximumTokens,
                               int requiredBlockSize,
                               int recommendedBlockSize) {
    }

    private record InsightProvenance(String corpusVersion,
                                     String corpusFormat,
                                     Integer schemaVersion,
                                     String templateVersion,
                                     String trainSha256,
                                     String validationSha256,
                                     String status) {

        private static InsightProvenance legacy() {
            return new InsightProvenance(null, null, null, null, null, null, PROVENANCE_LEGACY);
        }
    }

    private record GenerationOutput(String generatedText,
                                    long seed,
                                    Map<String, Object> modelConfig) {
    }

    private record OverlapStats(int maximum, double average) {
    }

    private record ParsedLotteryCandidate(List<Integer> redValues, Integer blueValue) {
    }

    private record ResumeSource(String runName, Path checkpointPath) {
    }

    private Map<String, Object> trainingConfig(MiniGptTrainingRequest request, TrainingContext context) {
        Map<String, Object> config = new LinkedHashMap<>();
        config.put("blockSize", context.effectiveBlockSize());
        config.put("nEmbd", request.getNEmbd());
        config.put("nHead", request.getNHead());
        config.put("nLayer", request.getNLayer());
        config.put("temperature", request.getTemperature());
        config.put("topK", request.getTopK());
        config.put("resumeFromRun", request.getResumeFromRun());
        config.put("resumeCheckpoint", request.getResumeCheckpoint());
        config.put("evalData", request.getEvalData());
        config.put("qualityGateMaxEvalLoss", request.getQualityGateMaxEvalLoss());
        config.put("qualityGateMaxLossGap", request.getQualityGateMaxLossGap());
        config.put("seed", normalizeSeed(request.getSeed()));
        config.put("corpusVersion", context.corpusVersion());
        config.put("trainSha256", context.trainSha256());
        config.put("validationSha256", context.validationSha256());
        config.put("requiredBlockSize", context.requiredBlockSize());
        return config;
    }

    private ResumeSource resolveResumeSource(Path playgroundDir, MiniGptTrainingRequest request) {
        if (request == null) {
            return null;
        }
        String checkpoint = trimToNull(request.getResumeCheckpoint());
        String parentRunName = trimToNull(request.getResumeFromRun());
        String expectedCheckpointSha256 = null;
        if (!StringUtils.hasText(checkpoint) && StringUtils.hasText(parentRunName)) {
            MiniGptRunRecord parentRun = runRepository.findByRunName(parentRunName)
                    .orElseThrow(() -> new IllegalArgumentException("未找到续训来源实验: " + parentRunName));
            String requestData = hasTextOrDefault(request.getData(), DEFAULT_DATA);
            String parentData = hasTextOrDefault(parentRun.getData(), DEFAULT_DATA);
            if (!requestData.equals(parentData)) {
                throw new IllegalArgumentException("续训来源语料不一致: 当前语料=" + requestData + ", 来源语料=" + parentData);
            }
            checkpoint = parentRun.getCheckpoint();
            expectedCheckpointSha256 = parentRun.getCheckpointSha256();
            if (!StringUtils.hasText(checkpoint)) {
                throw new IllegalArgumentException("续训来源实验没有可用 checkpoint: " + parentRunName);
            }
        }
        if (!StringUtils.hasText(checkpoint)) {
            return null;
        }
        Path checkpointPath = resolveCheckpointPath(playgroundDir, checkpoint);
        if (!checkpointPath.startsWith(playgroundDir)) {
            throw new IllegalArgumentException("MiniGPT 续训 checkpoint 路径非法: " + checkpoint);
        }
        if (!Files.exists(checkpointPath)) {
            throw new IllegalArgumentException("MiniGPT 续训 checkpoint 不存在: " + checkpointPath);
        }
        if (StringUtils.hasText(expectedCheckpointSha256)
                && !expectedCheckpointSha256.equalsIgnoreCase(sha256File(checkpointPath))) {
            throw new IllegalArgumentException("MiniGPT 续训 checkpoint SHA-256 与来源实验不一致: " + parentRunName);
        }
        return new ResumeSource(parentRunName, checkpointPath);
    }

    private Map<String, Object> readRunMetadata(Path playgroundDir, String runName) {
        Path metadataPath = playgroundDir.resolve("runs").resolve(runName).resolve("latest.json").normalize();
        if (!metadataPath.startsWith(playgroundDir) || !Files.exists(metadataPath)) {
            return Collections.emptyMap();
        }
        try {
            return OBJECT_MAPPER.readValue(metadataPath.toFile(), new TypeReference<>() {
            });
        } catch (IOException exception) {
            log.warn("MiniGPT 训练元数据读取失败: {}", metadataPath, exception);
            return Collections.emptyMap();
        }
    }

    private static Integer asInteger(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value instanceof String text && StringUtils.hasText(text)) {
            try {
                return Integer.parseInt(text);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private static Long asLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        if (value instanceof String text && StringUtils.hasText(text)) {
            try {
                return Long.parseLong(text);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private static Map<String, Object> asMap(Object value) {
        if (!(value instanceof Map<?, ?> source)) {
            return Collections.emptyMap();
        }
        Map<String, Object> result = new LinkedHashMap<>();
        source.forEach((key, entryValue) -> {
            if (key != null) {
                result.put(String.valueOf(key), entryValue);
            }
        });
        return result;
    }

    private static Map<String, Object> copyConfig(Map<String, Object> config) {
        return config == null ? new LinkedHashMap<>() : new LinkedHashMap<>(config);
    }

    private static Double asDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        if (value instanceof String text && StringUtils.hasText(text)) {
            try {
                return Double.parseDouble(text);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private static Boolean asBoolean(Object value) {
        if (value instanceof Boolean booleanValue) {
            return booleanValue;
        }
        if (value instanceof String text && StringUtils.hasText(text)) {
            return Boolean.parseBoolean(text);
        }
        return null;
    }

    private static String asString(Object value) {
        return value == null ? null : String.valueOf(value);
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

    private static int presetDefaultBlockSize(String preset) {
        Map<String, Integer> defaults = new LinkedHashMap<>();
        defaults.put("tiny", 32);
        defaults.put("small", 48);
        defaults.put("medium", 64);
        return defaults.getOrDefault(preset, 64);
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
