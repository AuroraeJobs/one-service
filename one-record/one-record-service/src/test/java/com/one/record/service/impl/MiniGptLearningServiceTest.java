package com.one.record.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.one.record.ai.MiniGptLotteryCandidateValidation;
import com.one.record.ai.MiniGptLotteryCorpusExport;
import com.one.record.ai.MiniGptCorpusInsight;
import com.one.record.ai.MiniGptGenerationBatchRequest;
import com.one.record.ai.MiniGptGenerationBatchResult;
import com.one.record.ai.MiniGptGenerationComparisonRequest;
import com.one.record.ai.MiniGptGenerationRequest;
import com.one.record.ai.MiniGptGenerationResult;
import com.one.record.ai.MiniGptTrainingRequest;
import com.one.record.ai.MiniGptTrainingStatus;
import com.one.record.exception.MiniGptLotteryCorpusException;
import com.one.record.exception.MiniGptTrainingValidationException;
import com.one.record.lottery.LotteryDraw;
import com.one.record.model.MiniGptGenerationRecord;
import com.one.record.model.MiniGptRunRecord;
import com.one.record.repository.MiniGptRunRepository;
import com.one.record.repository.MiniGptGenerationRepository;
import com.one.record.repository.MiniGptTrainingLogRepository;
import com.one.record.request.RecordRequest;
import com.one.record.service.IRecordService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MiniGptLearningServiceTest {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @TempDir
    Path tempDir;

    private MiniGptLearningService service;

    private IRecordService recordService;

    private MiniGptRunRepository runRepository;

    private MiniGptTrainingLogRepository logRepository;

    private MiniGptGenerationRepository generationRepository;

    private Map<String, MiniGptRunRecord> runs;

    private Map<String, MiniGptGenerationRecord> generations;

    @BeforeEach
    void setUp() {
        recordService = mock(IRecordService.class);
        runRepository = mock(MiniGptRunRepository.class);
        logRepository = mock(MiniGptTrainingLogRepository.class);
        generationRepository = mock(MiniGptGenerationRepository.class);
        runs = new ConcurrentHashMap<>();
        generations = new ConcurrentHashMap<>();
        when(runRepository.findByRunName(anyString()))
                .thenAnswer(invocation -> Optional.ofNullable(runs.get(invocation.getArgument(0))));
        when(runRepository.save(any(MiniGptRunRecord.class))).thenAnswer(invocation -> {
            MiniGptRunRecord run = invocation.getArgument(0);
            runs.put(run.getRunName(), run);
            return run;
        });
        when(generationRepository.save(any(MiniGptGenerationRecord.class))).thenAnswer(invocation -> {
            MiniGptGenerationRecord generation = invocation.getArgument(0);
            generations.put(generation.getGenerationId(), generation);
            return generation;
        });
        service = new MiniGptLearningService(
                runRepository,
                logRepository,
                generationRepository,
                recordService
        );
        ReflectionTestUtils.setField(service, "miniGptPlaygroundDir", tempDir.toString());
    }

    @Test
    void validateLotteryCandidateParsesRawDrawFormatWithoutTreatingIssueAsBall() {
        MiniGptLotteryCandidateValidation result = service.validateLotteryCandidate(
                "2026001: 03 08 12 19 25 31 + 06"
        );

        assertThat(result.getStatus()).isEqualTo("PASS");
        assertThat(result.getRedNumbers()).containsExactly("03", "08", "12", "19", "25", "31");
        assertThat(result.getBlueNumber()).isEqualTo("06");
        assertThat(result.getRedSum()).isEqualTo(98);
        assertThat(result.getSpan()).isEqualTo(28);
    }

    @Test
    void validateLotteryCandidateParsesStructuredModelOutput() {
        MiniGptLotteryCandidateValidation result = service.validateLotteryCandidate(
                "red=04,10,16,21,26,32 blue=09 reason=sum_mid"
        );

        assertThat(result.getValid()).isTrue();
        assertThat(result.getRedNumbers()).containsExactly("04", "10", "16", "21", "26", "32");
        assertThat(result.getBlueNumber()).isEqualTo("09");
        assertThat(result.getOddCount()).isEqualTo(1);
        assertThat(result.getEvenCount()).isEqualTo(5);
        assertThat(result.getIssueCodes()).isEmpty();
        assertThat(result.getRepairApplied()).isFalse();
        assertThat(result.getPostRepairValid()).isTrue();
    }

    @Test
    void validateLotteryCandidateFlagsDuplicateAndOutOfRangeNumbers() {
        MiniGptLotteryCandidateValidation result = service.validateLotteryCandidate(
                "red=01,02,02,35,04,05 blue=19"
        );

        assertThat(result.getStatus()).isEqualTo("WARNING");
        assertThat(result.getValid()).isFalse();
        assertThat(result.getDuplicateCount()).isEqualTo(1);
        assertThat(result.getIssues()).contains("红球存在重复", "红球越界: [35]", "蓝球越界: 19");
        assertThat(result.getIssueCodes()).contains("RED_DUPLICATE", "RED_OUT_OF_RANGE", "BLUE_OUT_OF_RANGE");
        assertThat(result.getRepairApplied()).isTrue();
        assertThat(result.getPostRepairValid()).isFalse();
        assertThat(result.getRepairedRedNumbers()).containsExactly("01", "02", "04", "05");
        assertThat(result.getRepairedBlueNumber()).isNull();
    }

    @Test
    void validateLotteryCandidateMarksUnparseableTextAsFailed() {
        MiniGptLotteryCandidateValidation result = service.validateLotteryCandidate("暂时没有号码");

        assertThat(result.getStatus()).isEqualTo("FAILED");
        assertThat(result.getParseable()).isFalse();
        assertThat(result.getIssues()).contains("未解析到候选号码", "红球数量应为 6 个，当前为 0", "未解析到蓝球");
        assertThat(result.getIssueCodes()).contains("NO_CANDIDATE", "RED_COUNT", "BLUE_MISSING");
        assertThat(result.getRepairApplied()).isFalse();
        assertThat(result.getPostRepairValid()).isFalse();
    }

    @Test
    void validateLotteryCandidateMarksSortedRepairAsPostRepairValid() {
        MiniGptLotteryCandidateValidation result = service.validateLotteryCandidate(
                "red=06,01,05,02,04,03 blue=09"
        );

        assertThat(result.getValid()).isFalse();
        assertThat(result.getIssueCodes()).containsExactly("RED_NOT_ASCENDING");
        assertThat(result.getRepairActions()).containsExactly("SORT_RED_ASCENDING");
        assertThat(result.getRepairApplied()).isTrue();
        assertThat(result.getPostRepairValid()).isTrue();
        assertThat(result.getRepairedRedNumbers()).containsExactly("01", "02", "03", "04", "05", "06");
    }

    @Test
    void corpusInsightCountsCompleteCodePointSamplesAndReadsVerifiedProvenance() throws Exception {
        CorpusFixture fixture = writeVersionedCorpus();

        MiniGptCorpusInsight insight = service.corpusInsight(fixture.trainDataPath(), "target=next", 20);

        assertThat(insight.getLineCount()).isEqualTo(3);
        assertThat(insight.getSampleCount()).isEqualTo(3);
        assertThat(insight.getMinimumSampleTokens()).isEqualTo(fixture.minimumSampleTokens());
        assertThat(insight.getMaximumSampleTokens()).isEqualTo(fixture.maximumSampleTokens());
        assertThat(insight.getRequiredBlockSize()).isEqualTo(fixture.maximumSampleTokens());
        assertThat(insight.getRecommendedBlockSize() % 16).isZero();
        assertThat(insight.getTokenizerType()).isEqualTo("CHAR_CODE_POINT");
        assertThat(insight.getCorpusVersion()).isEqualTo(fixture.corpusVersion());
        assertThat(insight.getCorpusFormat()).isEqualTo("strategy");
        assertThat(insight.getSchemaVersion()).isEqualTo(1);
        assertThat(insight.getTemplateVersion()).isEqualTo("lottery-strategy-v1");
        assertThat(insight.getTrainSha256()).isEqualTo(fixture.trainSha256());
        assertThat(insight.getValidationSha256()).isEqualTo(fixture.validationSha256());
        assertThat(insight.getProvenanceStatus()).isEqualTo("VERIFIED");
    }

    @Test
    void corpusInsightCountsEmojiAndCrLfAsCharacterTokens() throws Exception {
        Path dataFile = tempDir.resolve("data/crlf.txt");
        Files.createDirectories(dataFile.getParent());
        Files.writeString(dataFile, "a🙂\r\nbbbb\r\n", StandardCharsets.UTF_8);

        MiniGptCorpusInsight insight = service.corpusInsight("data/crlf.txt", null, 20);

        assertThat(insight.getSampleCount()).isEqualTo(2);
        assertThat(insight.getMinimumSampleTokens()).isEqualTo(4);
        assertThat(insight.getMaximumSampleTokens()).isEqualTo(6);
        assertThat(insight.getRequiredBlockSize()).isEqualTo(6);
        assertThat(insight.getRecommendedBlockSize()).isEqualTo(16);
        assertThat(insight.getProvenanceStatus()).isEqualTo("LEGACY_UNVERIFIED");
    }

    @Test
    void formalTrainingRejectsShortContextBeforeTakingTrainingLock() throws Exception {
        CorpusFixture fixture = writeVersionedCorpus();
        MiniGptTrainingRequest request = trainingRequest(fixture);
        request.setBlockSize(fixture.maximumSampleTokens() - 1);

        assertThatThrownBy(() -> service.startTraining(request))
                .isInstanceOf(MiniGptTrainingValidationException.class)
                .hasMessageContaining("无法容纳最长完整样本")
                .hasMessageContaining("至少需要 " + fixture.maximumSampleTokens());

        request.setBlockSize(fixture.recommendedBlockSize());
        request.setTrainSha256("stale-client-sha");
        assertThatThrownBy(() -> service.startTraining(request))
                .isInstanceOf(MiniGptTrainingValidationException.class)
                .hasMessageContaining("请求 trainSha256")
                .hasMessageContaining("不一致");
        assertThat(service.trainingStatus().isRunning()).isFalse();
    }

    @Test
    void formalTrainingRejectsValidationTokensOutsideTrainingTokenizer() throws Exception {
        CorpusFixture fixture = writeVersionedCorpus();
        String validationWithUnknownToken = Files.readString(fixture.validationFile(), StandardCharsets.UTF_8) + "Ω\n";
        Files.writeString(fixture.validationFile(), validationWithUnknownToken, StandardCharsets.UTF_8);
        rewriteManifestHash(fixture.manifestFile(), "validationSha256", sha256(validationWithUnknownToken));
        MiniGptTrainingRequest request = trainingRequest(fixture);
        request.setValidationSha256(sha256(validationWithUnknownToken));

        assertThatThrownBy(() -> service.startTraining(request))
                .isInstanceOf(MiniGptTrainingValidationException.class)
                .hasMessageContaining("训练 tokenizer 未见字符");
    }

    @Test
    void formalTrainingPersistsVerifiedRunAndPassesProvenanceArguments() throws Exception {
        CorpusFixture fixture = writeVersionedCorpus();
        Path commandArguments = installFakePython("printf '%s\\n' \"$@\" > command-args.txt\nexit 0\n");
        MiniGptTrainingRequest request = trainingRequest(fixture);
        request.setRunName("verified-run");
        request.setBlockSize(fixture.recommendedBlockSize());
        request.setSeed(77L);

        MiniGptTrainingStatus status = service.startTraining(request);
        waitForFile(commandArguments);
        waitForTrainingToFinish();
        MiniGptRunRecord run = runs.get("verified-run");

        assertThat(status.getRun().getId()).isNotBlank();
        assertThat(run.getProvenanceStatus()).isEqualTo("VERIFIED");
        assertThat(run.getCorpusVersion()).isEqualTo(fixture.corpusVersion());
        assertThat(run.getCorpusFormat()).isEqualTo("strategy");
        assertThat(run.getSchemaVersion()).isEqualTo(1);
        assertThat(run.getTemplateVersion()).isEqualTo("lottery-strategy-v1");
        assertThat(run.getTrainSha256()).isEqualTo(fixture.trainSha256());
        assertThat(run.getValidationSha256()).isEqualTo(fixture.validationSha256());
        assertThat(run.getRequiredBlockSize()).isEqualTo(fixture.maximumSampleTokens());
        assertThat(run.getRecommendedBlockSize()).isEqualTo(fixture.recommendedBlockSize());
        assertThat(run.getEffectiveBlockSize()).isEqualTo(fixture.recommendedBlockSize());
        assertThat(run.getValidationSource()).isEqualTo("FIXED_FILE");
        assertThat(run.getSeed()).isEqualTo(77L);

        String arguments = Files.readString(commandArguments, StandardCharsets.UTF_8);
        assertThat(arguments)
                .contains("--run-id", status.getRun().getId())
                .contains("--manifest-data", fixture.manifestDataPath())
                .contains("--corpus-version", fixture.corpusVersion())
                .contains("--corpus-format", "strategy")
                .contains("--schema-version", "1")
                .contains("--template-version", "lottery-strategy-v1")
                .contains("--train-sha256", fixture.trainSha256())
                .contains("--validation-sha256", fixture.validationSha256())
                .contains("--required-block-size", String.valueOf(fixture.maximumSampleTokens()))
                .contains("--seed", "77");
    }

    @Test
    void legacyTrainingRemainsAllowedButIsMarkedUnverified() throws Exception {
        Path dataFile = tempDir.resolve("data/sample.txt");
        Files.createDirectories(dataFile.getParent());
        Files.writeString(dataFile, "legacy learning sample\n".repeat(20), StandardCharsets.UTF_8);
        Path commandArguments = installFakePython("printf '%s\\n' \"$@\" > command-args.txt\nexit 0\n");
        MiniGptTrainingRequest request = new MiniGptTrainingRequest();
        request.setRunName("legacy-run");
        request.setData("data/sample.txt");

        MiniGptTrainingStatus status = service.startTraining(request);
        waitForFile(commandArguments);
        waitForTrainingToFinish();

        assertThat(status.getRun().getProvenanceStatus()).isEqualTo("LEGACY_UNVERIFIED");
        assertThat(status.getRun().getValidationSource()).isEqualTo("TRAIN_TAIL_SPLIT");
        assertThat(status.getRun().getEffectiveBlockSize()).isEqualTo(32);
        assertThat(Files.readString(commandArguments, StandardCharsets.UTF_8))
                .doesNotContain("--manifest-data", "--corpus-version", "--train-sha256");
    }

    @Test
    void missingTrainingScriptPersistsFailedRunAndSynchronizesStatusRun() throws Exception {
        writeLegacyTrainingData();
        MiniGptTrainingRequest request = new MiniGptTrainingRequest();
        request.setRunName("missing-script-run");
        request.setData("data/sample.txt");

        MiniGptTrainingStatus started = service.startTraining(request);
        waitForTrainingToFinish();
        MiniGptTrainingStatus failed = service.trainingStatus();
        MiniGptRunRecord persisted = runs.get("missing-script-run");

        assertThat(started.getRun().getProvenanceStatus()).isEqualTo("LEGACY_UNVERIFIED");
        assertThat(failed.isRunning()).isFalse();
        assertThat(failed.isFailed()).isTrue();
        assertThat(failed.isCancelled()).isFalse();
        assertThat(failed.getStage()).isEqualTo("训练失败");
        assertThat(failed.getMessage()).contains("未找到 MiniGPT 训练脚本");
        assertThat(failed.getRun()).isSameAs(persisted);
        assertThat(failed.getRun().getStatus()).isEqualTo("FAILED");
        assertThat(persisted.getStatus()).isEqualTo("FAILED");
        assertThat(persisted.getFinishedAt()).isNotBlank();
        assertThat(persisted.getUpdatedAt()).isNotNull();
        assertThat(persisted.getProvenanceStatus()).isEqualTo("LEGACY_UNVERIFIED");
        assertThat(persisted.getConfig()).containsEntry("seed", 42L);
    }

    @Test
    void processStartFailurePersistsFailedRunWithoutLosingProvenance() throws Exception {
        writeLegacyTrainingData();
        Files.writeString(tempDir.resolve("mini_gpt.py"), "# fake script\n", StandardCharsets.UTF_8);
        Files.createDirectories(tempDir.resolve(".venv/bin/python"));
        MiniGptTrainingRequest request = new MiniGptTrainingRequest();
        request.setRunName("process-start-failure-run");
        request.setData("data/sample.txt");

        service.startTraining(request);
        waitForTrainingToFinish();
        MiniGptTrainingStatus failed = service.trainingStatus();
        MiniGptRunRecord persisted = runs.get("process-start-failure-run");

        assertThat(failed.isFailed()).isTrue();
        assertThat(failed.getMessage()).isNotBlank();
        assertThat(failed.getRun().getStatus()).isEqualTo("FAILED");
        assertThat(persisted.getStatus()).isEqualTo("FAILED");
        assertThat(persisted.getFinishedAt()).isNotBlank();
        assertThat(persisted.getProvenanceStatus()).isEqualTo("LEGACY_UNVERIFIED");
        assertThat(persisted.getConfig()).containsKeys("blockSize", "seed");
    }

    @Test
    void resumeRejectsCheckpointWithoutAuthoritativeBlockSizeConfig() throws Exception {
        Path dataFile = tempDir.resolve("data/sample.txt");
        Files.createDirectories(dataFile.getParent());
        Files.writeString(dataFile, "legacy learning sample\n".repeat(20), StandardCharsets.UTF_8);
        Path checkpoint = tempDir.resolve("runs/parent/checkpoints/mini_gpt.pt");
        Files.createDirectories(checkpoint.getParent());
        Files.writeString(checkpoint, "checkpoint", StandardCharsets.UTF_8);
        runs.put("parent", MiniGptRunRecord.builder()
                .id("parent-id")
                .runName("parent")
                .data("data/sample.txt")
                .checkpoint(checkpoint.toString())
                .build());
        MiniGptTrainingRequest request = new MiniGptTrainingRequest();
        request.setData("data/sample.txt");
        request.setResumeFromRun("parent");

        assertThatThrownBy(() -> service.startTraining(request))
                .isInstanceOf(MiniGptTrainingValidationException.class)
                .hasMessageContaining("缺少有效 config.block_size");
    }

    @Test
    void generationPersistsEffectiveDefaultsAndParsesJsonAfterWarning() throws Exception {
        installFakePython(
                "printf 'torch warning\\n' >&2\n"
                        + "printf '%s\\n' '{\"generated_text\":\"red=01,02,03,04,05,06 blue=07\",\"seed\":42,\"model_config\":{\"block_size\":160,\"n_embd\":32}}'\n"
        );
        MiniGptRunRecord run = generationRun("generation-run");
        runs.put(run.getRunName(), run);
        MiniGptGenerationRequest request = new MiniGptGenerationRequest();
        request.setRunName(run.getRunName());

        MiniGptGenerationResult result = service.generate(request);

        assertThat(result.getGenerationId()).isNotBlank();
        assertThat(result.getRunId()).isEqualTo("run-id");
        assertThat(result.getGeneratedText()).isEqualTo("red=01,02,03,04,05,06 blue=07");
        assertThat(result.getMaxNewTokens()).isEqualTo(120);
        assertThat(result.getTemperature()).isEqualTo(0.9);
        assertThat(result.getTopK()).isEqualTo(20);
        assertThat(result.getSeed()).isEqualTo(42L);
        assertThat(result.getCorpusVersion()).isEqualTo("corpus-v1");
        assertThat(result.getCheckpointSha256()).hasSize(64);
        assertThat(result.getModelConfig()).containsEntry("block_size", 160).containsEntry("n_embd", 32);
        assertThat(result.getLotteryCandidate().getValid()).isTrue();
        assertThat(generations).containsKey(result.getGenerationId());
        assertThat(generations.get(result.getGenerationId()).getTemperature()).isEqualTo(0.9);
        verify(generationRepository).save(any(MiniGptGenerationRecord.class));
    }

    @Test
    void generationBatchUsesDeterministicSeedsAndPersistsSelectedPoolOnce() throws Exception {
        installFakePython(
                "seed=42\n"
                        + "while [ \"$#\" -gt 0 ]; do\n"
                        + "  if [ \"$1\" = \"--seed\" ]; then shift; seed=$1; fi\n"
                        + "  shift\n"
                        + "done\n"
                        + "case \"$seed\" in\n"
                        + "  42) text='red=01,02,03,04,05,06 blue=01' ;;\n"
                        + "  43) text='red=01,02,03,07,08,09 blue=02' ;;\n"
                        + "  *) text='red=01,02,03,04,05,10 blue=03' ;;\n"
                        + "esac\n"
                        + "printf 'torch warning\\n' >&2\n"
                        + "printf '{\"generated_text\":\"%s\",\"seed\":%s,\"model_config\":{\"block_size\":160}}\\n' \"$text\" \"$seed\"\n"
        );
        MiniGptRunRecord run = generationRun("batch-run");
        runs.put(run.getRunName(), run);
        MiniGptGenerationBatchRequest request = new MiniGptGenerationBatchRequest();
        request.setRunName(run.getRunName());
        request.setCandidateCount(3);
        request.setBaseSeed(42L);
        request.setMaxRedOverlap(3);
        request.setMinimumBlueCoverage(3);
        request.setStrategies(List.of("balanced", "zone-balance", "structure-observed"));

        MiniGptGenerationBatchResult result = service.generateBatch(request);

        assertThat(result.getRequestedCount()).isEqualTo(3);
        assertThat(result.getBaseSeed()).isEqualTo(42L);
        assertThat(result.getMaxRedOverlap()).isEqualTo(3);
        assertThat(result.getMinimumBlueCoverage()).isEqualTo(3);
        assertThat(result.getMinimumBlueCoverageMet()).isFalse();
        assertThat(result.getRequestedStrategies()).containsExactly("balanced", "zone-balance", "structure-observed");
        assertThat(result.getGeneratedCount()).isEqualTo(3);
        assertThat(result.getGeneratedRate()).isEqualTo(1.0);
        assertThat(result.getParseableCount()).isEqualTo(3);
        assertThat(result.getLegalCount()).isEqualTo(3);
        assertThat(result.getRepairedCount()).isZero();
        assertThat(result.getPostRepairLegalCount()).isEqualTo(3);
        assertThat(result.getParseableRate()).isEqualTo(1.0);
        assertThat(result.getLegalRate()).isEqualTo(1.0);
        assertThat(result.getPostRepairLegalRate()).isEqualTo(1.0);
        assertThat(result.getRedOverlapMax()).isEqualTo(3);
        assertThat(result.getRedOverlapAverage()).isEqualTo(3.0);
        assertThat(result.getDistinctBlueCount()).isEqualTo(2);
        assertThat(result.getBlueCoverage()).isEqualTo(1.0);
        assertThat(result.getStrategyComposition())
                .containsEntry("balanced", 1)
                .containsEntry("zone-balance", 1)
                .containsEntry("structure-observed", 1);
        assertThat(result.getItems()).extracting(MiniGptGenerationResult::getSeed)
                .containsExactly(42L, 43L, 44L);
        assertThat(result.getItems()).allSatisfy(item -> {
            assertThat(item.getBatchBaseSeed()).isEqualTo(42L);
            assertThat(item.getBatchMaxRedOverlap()).isEqualTo(3);
            assertThat(item.getBatchMinimumBlueCoverage()).isEqualTo(3);
            assertThat(item.getBatchMinimumBlueCoverageMet()).isFalse();
            assertThat(item.getBatchStrategies()).containsExactly("balanced", "zone-balance", "structure-observed");
        });
        assertThat(result.getItems()).filteredOn(item -> Boolean.TRUE.equals(item.getPoolSelected())).hasSize(2);
        assertThat(result.getItems()).filteredOn(item -> !Boolean.TRUE.equals(item.getPoolSelected()))
                .singleElement()
                .extracting(MiniGptGenerationResult::getPoolDecision)
                .isEqualTo("REJECTED_RED_OVERLAP");
        assertThat(generations).hasSize(3);
        assertThat(generations.values()).allSatisfy(record -> {
            assertThat(record.getBatchBaseSeed()).isEqualTo(42L);
            assertThat(record.getBatchMaxRedOverlap()).isEqualTo(3);
            assertThat(record.getBatchMinimumBlueCoverage()).isEqualTo(3);
            assertThat(record.getBatchMinimumBlueCoverageMet()).isFalse();
            assertThat(record.getBatchStrategies()).containsExactly("balanced", "zone-balance", "structure-observed");
        });
        verify(generationRepository, times(3)).save(any(MiniGptGenerationRecord.class));
    }

    @Test
    void generationBatchRethrowsWhenEveryAttemptFails() {
        runs.put("broken-run", MiniGptRunRecord.builder()
                .id("broken-id")
                .runName("broken-run")
                .checkpoint(tempDir.resolve("missing-checkpoint.pt").toString())
                .build());
        MiniGptGenerationBatchRequest request = new MiniGptGenerationBatchRequest();
        request.setRunName("broken-run");
        request.setCandidateCount(2);

        assertThatThrownBy(() -> service.generateBatch(request))
                .isInstanceOf(MiniGptTrainingValidationException.class)
                .hasMessageContaining("checkpoint 不存在");
        assertThat(generations).isEmpty();
    }

    @Test
    void generationComparisonSharesBatchIdAndUsesDeterministicSeeds() throws Exception {
        installFakePython(
                "seed=42\n"
                        + "while [ \"$#\" -gt 0 ]; do\n"
                        + "  if [ \"$1\" = \"--seed\" ]; then shift; seed=$1; fi\n"
                        + "  shift\n"
                        + "done\n"
                        + "printf '{\"generated_text\":\"red=01,02,03,04,05,06 blue=07\",\"seed\":%s,\"model_config\":{\"block_size\":160}}\\n' \"$seed\"\n"
        );
        MiniGptRunRecord run = generationRun("compare-run");
        runs.put(run.getRunName(), run);
        MiniGptGenerationComparisonRequest request = new MiniGptGenerationComparisonRequest();
        request.setRunName(run.getRunName());
        request.setTemperatures(List.of(0.7, 0.9));
        request.setTopKs(List.of(20));
        request.setBaseSeed(100L);

        List<MiniGptGenerationResult> results = service.compareGeneration(request);

        assertThat(results).hasSize(2);
        assertThat(results).extracting(MiniGptGenerationResult::getBatchId).doesNotContainNull().containsOnly(results.get(0).getBatchId());
        assertThat(results).extracting(MiniGptGenerationResult::getSeed).containsExactly(100L, 101L);
        assertThat(results).extracting(MiniGptGenerationResult::getTemperature).containsExactly(0.7, 0.9);
        assertThat(results).extracting(MiniGptGenerationResult::getTopK).containsOnly(20);
        verify(generationRepository, times(2)).save(any(MiniGptGenerationRecord.class));
    }

    @Test
    void exportLotteryCorpusCreatesStableStrategyVersionAndTimeSplit() throws Exception {
        List<LotteryDraw> firstOrder = List.of(
                draw("2026005", "05", "06", "16", "17", "27", "28", "05"),
                draw("2026002", "02", "03", "13", "14", "24", "25", "02"),
                draw("2026004", "04", "05", "15", "16", "26", "27", "04"),
                draw("2026001", "01", "02", "12", "13", "23", "24", "01"),
                draw("2026003", "03", "04", "14", "15", "25", "26", "03")
        );
        List<LotteryDraw> secondOrder = List.of(
                firstOrder.get(3),
                firstOrder.get(1),
                firstOrder.get(4),
                firstOrder.get(0),
                firstOrder.get(2)
        );
        when(recordService.findDraws(any(RecordRequest.class), eq(0), eq(5)))
                .thenReturn(firstOrder, secondOrder);

        MiniGptLotteryCorpusExport first = service.exportLotteryCorpus("strategy", 5);
        String firstManifest = Files.readString(Path.of(first.getManifestFilePath()), StandardCharsets.UTF_8);
        MiniGptLotteryCorpusExport second = service.exportLotteryCorpus("strategy", 5);
        String secondManifest = Files.readString(Path.of(second.getManifestFilePath()), StandardCharsets.UTF_8);

        assertThat(first.getSchemaVersion()).isEqualTo(1);
        assertThat(first.getTemplateVersion()).isEqualTo("lottery-strategy-v1");
        assertThat(first.getSplitMode()).isEqualTo("TIME_ORDERED_80_20");
        assertThat(first.getValidationRatio()).isEqualTo(0.2);
        assertThat(first.getSortOrder()).isEqualTo("issue:asc");
        assertThat(first.getCorpusVersion()).hasSize(64).matches("[0-9a-f]{64}");
        assertThat(second.getCorpusVersion()).isEqualTo(first.getCorpusVersion());
        assertThat(second.getContentSha256()).isEqualTo(first.getContentSha256());
        assertThat(second.getTrainSha256()).isEqualTo(first.getTrainSha256());
        assertThat(second.getValidationSha256()).isEqualTo(first.getValidationSha256());
        assertThat(second.getGeneratedAt()).isEqualTo(first.getGeneratedAt());
        assertThat(secondManifest).isEqualTo(firstManifest);

        assertThat(first.getDataPath()).isEqualTo("data/lottery-strategy.txt");
        assertThat(first.getLegacyDataPath()).isEqualTo(first.getDataPath());
        assertThat(first.getFullDataPath()).isEqualTo(
                "data/lottery-corpora/strategy/" + first.getCorpusVersion() + "/all.txt"
        );
        assertThat(first.getTrainDataPath()).endsWith("/train.txt");
        assertThat(first.getValidationDataPath()).endsWith("/validation.txt");
        assertThat(first.getManifestDataPath()).endsWith("/manifest.json");
        assertThat(first.getDrawCount()).isEqualTo(5);
        assertThat(first.getTrainDrawCount()).isEqualTo(4);
        assertThat(first.getValidationDrawCount()).isEqualTo(1);
        assertThat(first.getFirstIssue()).isEqualTo("2026001");
        assertThat(first.getLatestIssue()).isEqualTo("2026005");
        assertThat(first.getTrainFirstIssue()).isEqualTo("2026001");
        assertThat(first.getTrainLatestIssue()).isEqualTo("2026004");
        assertThat(first.getValidationFirstIssue()).isEqualTo("2026005");
        assertThat(first.getValidationLatestIssue()).isEqualTo("2026005");

        String allContent = Files.readString(Path.of(first.getFullFilePath()), StandardCharsets.UTF_8);
        String trainContent = Files.readString(Path.of(first.getTrainFilePath()), StandardCharsets.UTF_8);
        String validationContent = Files.readString(Path.of(first.getValidationFilePath()), StandardCharsets.UTF_8);
        assertThat(allContent.lines()).hasSize(5);
        assertThat(allContent.lines().toList()).extracting(line -> line.substring(line.indexOf("source_issue=") + 13))
                .containsExactly("2026001", "2026002", "2026003", "2026004", "2026005");
        assertThat(allContent.lines().findFirst().orElseThrow()).isEqualTo(
                "target=next strategy=zone-balance red=01,02,12,13,23,24 blue=01 "
                        + "reason=sum_low;odd_even_3_3;big_small_2_4;zone_2_2_2;span_mid source_issue=2026001"
        );
        assertThat(trainContent.lines()).hasSize(4);
        assertThat(trainContent).contains("source_issue=2026001").doesNotContain("source_issue=2026005");
        assertThat(validationContent.lines()).containsExactly(
                "target=next strategy=zone-balance red=05,06,16,17,27,28 blue=05 "
                        + "reason=sum_mid;odd_even_3_3;big_small_3_3;zone_2_2_2;span_mid source_issue=2026005"
        );
        assertThat(Files.readString(Path.of(first.getFilePath()), StandardCharsets.UTF_8)).isEqualTo(allContent);
        assertThat(first.getContentSha256()).isEqualTo(sha256(allContent));
        assertThat(first.getTrainSha256()).isEqualTo(sha256(trainContent));
        assertThat(first.getValidationSha256()).isEqualTo(sha256(validationContent));

        Map<String, Object> manifest = OBJECT_MAPPER.readValue(firstManifest, new TypeReference<>() {
        });
        assertThat(manifest)
                .containsEntry("schemaVersion", 1)
                .containsEntry("templateVersion", "lottery-strategy-v1")
                .containsEntry("corpusVersion", first.getCorpusVersion())
                .containsEntry("splitMode", "TIME_ORDERED_80_20")
                .containsEntry("sortOrder", "issue:asc")
                .containsEntry("dataPath", first.getDataPath())
                .containsEntry("filePath", first.getFilePath())
                .containsEntry("legacyDataPath", first.getLegacyDataPath())
                .containsEntry("fullDataPath", first.getFullDataPath())
                .containsEntry("fullFilePath", first.getFullFilePath())
                .containsEntry("trainDataPath", first.getTrainDataPath())
                .containsEntry("trainFilePath", first.getTrainFilePath())
                .containsEntry("validationDataPath", first.getValidationDataPath())
                .containsEntry("validationFilePath", first.getValidationFilePath())
                .containsEntry("manifestDataPath", first.getManifestDataPath())
                .containsEntry("manifestFilePath", first.getManifestFilePath())
                .containsEntry("drawCount", 5)
                .containsEntry("trainDrawCount", 4)
                .containsEntry("validationDrawCount", 1)
                .containsEntry("contentSha256", first.getContentSha256())
                .containsEntry("trainSha256", first.getTrainSha256())
                .containsEntry("validationSha256", first.getValidationSha256());
    }

    @Test
    void exportLotteryCorpusKeepsLegacyRawPathAndRendersFeaturesExactly() throws Exception {
        LotteryDraw first = draw("2026001", "1", "02", "12", "13", "23", "24", "1");
        LotteryDraw second = draw("2026002", "02", "03", "13", "14", "24", "25", "02");
        when(recordService.findDraws(any(RecordRequest.class), eq(0), eq(2)))
                .thenReturn(List.of(second, first));

        MiniGptLotteryCorpusExport raw = service.exportLotteryCorpus("raw", 2);
        MiniGptLotteryCorpusExport features = service.exportLotteryCorpus("features", 2);

        assertThat(raw.getDataPath()).isEqualTo("data/lottery-raw.txt");
        assertThat(raw.getFilePath()).isEqualTo(tempDir.resolve("data/lottery-raw.txt").toString());
        assertThat(Files.readString(Path.of(raw.getFilePath()), StandardCharsets.UTF_8).lines())
                .containsExactly(
                        "2026001: 01 02 12 13 23 24 + 01",
                        "2026002: 02 03 13 14 24 25 + 02"
                );
        assertThat(features.getDataPath()).isEqualTo("data/lottery-features.txt");
        assertThat(Files.readString(Path.of(features.getFilePath()), StandardCharsets.UTF_8).lines())
                .containsExactly(
                        "issue=2026001 red=01,02,12,13,23,24 blue=01 sum=75 odd=3 even=3 big=2 small=4 span=23 consecutive=3 zone=2,2,2",
                        "issue=2026002 red=02,03,13,14,24,25 blue=02 sum=81 odd=3 even=3 big=2 small=4 span=23 consecutive=3 zone=2,2,2"
                );
    }

    @Test
    void exportLotteryCorpusRejectsFewerThanTwoValidUniqueIssues() {
        LotteryDraw valid = draw("2026001", "01", "02", "12", "13", "23", "24", "01");
        LotteryDraw duplicate = draw("2026001", "03", "04", "14", "15", "25", "26", "03");
        LotteryDraw missingIssue = draw(null, "05", "06", "16", "17", "27", "28", "05");
        when(recordService.findDraws(any(RecordRequest.class), eq(0), eq(2)))
                .thenReturn(List.of(valid, duplicate));
        when(recordService.findDraws(any(RecordRequest.class), eq(1), eq(2)))
                .thenReturn(List.of(missingIssue));

        assertThatThrownBy(() -> service.exportLotteryCorpus("strategy", 2))
                .isInstanceOf(MiniGptLotteryCorpusException.class)
                .hasMessageContaining("至少需要 2 个有效且唯一的期号");
    }

    @Test
    void exportLotteryCorpusRejectsUnknownFormat() {
        assertThatThrownBy(() -> service.exportLotteryCorpus("jsonl", 10))
                .isInstanceOf(MiniGptLotteryCorpusException.class)
                .hasMessage("不支持的 MiniGPT 彩票语料格式: jsonl");
    }

    @Test
    void exportLotteryCorpusKeepsGeneratedAtStableDuringConcurrentFirstPublish() throws Exception {
        List<LotteryDraw> draws = List.of(
                draw("2026005", "05", "06", "16", "17", "27", "28", "05"),
                draw("2026004", "04", "05", "15", "16", "26", "27", "04"),
                draw("2026003", "03", "04", "14", "15", "25", "26", "03"),
                draw("2026002", "02", "03", "13", "14", "24", "25", "02"),
                draw("2026001", "01", "02", "12", "13", "23", "24", "01")
        );
        when(recordService.findDraws(any(RecordRequest.class), eq(0), eq(5))).thenReturn(draws);

        ExecutorService executor = Executors.newFixedThreadPool(6);
        CountDownLatch ready = new CountDownLatch(6);
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<CompletableFuture<MiniGptLotteryCorpusExport>> futures = IntStream.range(0, 12)
                    .mapToObj(index -> CompletableFuture.supplyAsync(() -> {
                        ready.countDown();
                        try {
                            start.await();
                        } catch (InterruptedException exception) {
                            Thread.currentThread().interrupt();
                            throw new IllegalStateException(exception);
                        }
                        return service.exportLotteryCorpus("strategy", 5);
                    }, executor))
                    .toList();
            assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
            start.countDown();

            List<MiniGptLotteryCorpusExport> results = futures.stream()
                    .map(CompletableFuture::join)
                    .toList();
            MiniGptLotteryCorpusExport first = results.get(0);
            assertThat(results).extracting(MiniGptLotteryCorpusExport::getCorpusVersion)
                    .containsOnly(first.getCorpusVersion());
            assertThat(results).extracting(MiniGptLotteryCorpusExport::getGeneratedAt)
                    .containsOnly(first.getGeneratedAt());

            Map<String, Object> manifest = OBJECT_MAPPER.readValue(
                    Path.of(first.getManifestFilePath()).toFile(),
                    new TypeReference<>() {
                    }
            );
            assertThat(manifest).containsEntry("generatedAt", first.getGeneratedAt());
            try (Stream<Path> paths = Files.walk(tempDir)) {
                assertThat(paths.map(path -> path.getFileName().toString()))
                        .noneMatch(name -> name.endsWith(".tmp")
                                || name.startsWith("." + first.getCorpusVersion() + "-"));
            }
        } finally {
            start.countDown();
            executor.shutdownNow();
        }
    }

    @Test
    void exportLotteryCorpusReportsFilesystemFailureAsServerError() throws Exception {
        Files.writeString(tempDir.resolve("data"), "not-a-directory", StandardCharsets.UTF_8);
        when(recordService.findDraws(any(RecordRequest.class), eq(0), eq(2)))
                .thenReturn(List.of(
                        draw("2026002", "02", "03", "13", "14", "24", "25", "02"),
                        draw("2026001", "01", "02", "12", "13", "23", "24", "01")
                ));

        assertThatThrownBy(() -> service.exportLotteryCorpus("strategy", 2))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("写入 MiniGPT 彩票语料失败")
                .hasCauseInstanceOf(IOException.class);
    }

    private CorpusFixture writeVersionedCorpus() throws Exception {
        String first = "target=next strategy=balanced red=01,02,03,04,05,06 blue=07 reason=sum_mid source_issue=2026001 note=平衡🙂";
        String second = "target=next strategy=zone-balance red=08,09,10,11,12,13 blue=14 reason=sum_mid;zone_2_2_2 source_issue=2026002 note=平衡🙂";
        String third = "target=next strategy=structure-observed red=14,15,16,17,18,19 blue=10 reason=span_mid source_issue=2026003 note=平衡🙂";
        String trainContent = String.join("\n", first, second, third) + "\n";
        String validationContent = String.join("\n", third, first, second) + "\n";
        String corpusVersion = "corpus-v1";
        Path versionDir = tempDir.resolve("data/lottery-corpora/strategy").resolve(corpusVersion);
        Files.createDirectories(versionDir);
        Path trainFile = versionDir.resolve("train.txt");
        Path validationFile = versionDir.resolve("validation.txt");
        Path manifestFile = versionDir.resolve("manifest.json");
        Files.writeString(trainFile, trainContent, StandardCharsets.UTF_8);
        Files.writeString(validationFile, validationContent, StandardCharsets.UTF_8);
        String trainDataPath = tempDir.relativize(trainFile).toString();
        String validationDataPath = tempDir.relativize(validationFile).toString();
        String manifestDataPath = tempDir.relativize(manifestFile).toString();
        String trainSha256 = sha256(trainContent);
        String validationSha256 = sha256(validationContent);
        Map<String, Object> manifest = new java.util.LinkedHashMap<>();
        manifest.put("schemaVersion", 1);
        manifest.put("templateVersion", "lottery-strategy-v1");
        manifest.put("corpusVersion", corpusVersion);
        manifest.put("format", "strategy");
        manifest.put("trainDataPath", trainDataPath);
        manifest.put("trainFilePath", trainFile.toString());
        manifest.put("validationDataPath", validationDataPath);
        manifest.put("validationFilePath", validationFile.toString());
        manifest.put("trainSha256", trainSha256);
        manifest.put("validationSha256", validationSha256);
        OBJECT_MAPPER.writeValue(manifestFile.toFile(), manifest);
        List<Integer> sampleTokens = List.of(first, second, third).stream()
                .map(line -> line.codePointCount(0, line.length()) + 1)
                .toList();
        int minimum = sampleTokens.stream().mapToInt(Integer::intValue).min().orElseThrow();
        int maximum = sampleTokens.stream().mapToInt(Integer::intValue).max().orElseThrow();
        int recommended = ((maximum + 15) / 16) * 16;
        return new CorpusFixture(
                corpusVersion,
                trainDataPath,
                validationDataPath,
                manifestDataPath,
                trainFile,
                validationFile,
                manifestFile,
                trainSha256,
                validationSha256,
                minimum,
                maximum,
                recommended
        );
    }

    private MiniGptTrainingRequest trainingRequest(CorpusFixture fixture) {
        MiniGptTrainingRequest request = new MiniGptTrainingRequest();
        request.setData(fixture.trainDataPath());
        request.setEvalData(fixture.validationDataPath());
        request.setManifestDataPath(fixture.manifestDataPath());
        request.setCorpusVersion(fixture.corpusVersion());
        request.setTrainSha256(fixture.trainSha256());
        request.setValidationSha256(fixture.validationSha256());
        request.setBlockSize(fixture.recommendedBlockSize());
        return request;
    }

    private Path installFakePython(String body) throws Exception {
        Path python = tempDir.resolve(".venv/bin/python");
        Files.createDirectories(python.getParent());
        Files.writeString(python, "#!/bin/sh\n" + body, StandardCharsets.UTF_8);
        assertThat(python.toFile().setExecutable(true)).isTrue();
        Files.writeString(tempDir.resolve("mini_gpt.py"), "# fake MiniGPT runner\n", StandardCharsets.UTF_8);
        return tempDir.resolve("command-args.txt");
    }

    private void writeLegacyTrainingData() throws Exception {
        Path dataFile = tempDir.resolve("data/sample.txt");
        Files.createDirectories(dataFile.getParent());
        Files.writeString(dataFile, "legacy learning sample\n".repeat(20), StandardCharsets.UTF_8);
    }

    private MiniGptRunRecord generationRun(String runName) throws Exception {
        Path checkpoint = tempDir.resolve("runs").resolve(runName).resolve("checkpoints/mini_gpt.pt");
        Files.createDirectories(checkpoint.getParent());
        Files.writeString(checkpoint, "checkpoint-" + runName, StandardCharsets.UTF_8);
        return MiniGptRunRecord.builder()
                .id("run-id")
                .runName(runName)
                .status("SUCCESS")
                .checkpoint(checkpoint.toString())
                .corpusVersion("corpus-v1")
                .trainSha256("train-sha")
                .validationSha256("validation-sha")
                .config(Map.of("block_size", 160, "n_embd", 32))
                .build();
    }

    private static void rewriteManifestHash(Path manifestFile, String field, String value) throws Exception {
        Map<String, Object> manifest = OBJECT_MAPPER.readValue(manifestFile.toFile(), new TypeReference<>() {
        });
        manifest.put(field, value);
        OBJECT_MAPPER.writeValue(manifestFile.toFile(), manifest);
    }

    private static void waitForFile(Path path) throws Exception {
        for (int attempt = 0; attempt < 100 && !Files.exists(path); attempt++) {
            Thread.sleep(20);
        }
        assertThat(path).exists();
    }

    private void waitForTrainingToFinish() throws Exception {
        for (int attempt = 0; attempt < 100 && service.trainingStatus().isRunning(); attempt++) {
            Thread.sleep(20);
        }
        assertThat(service.trainingStatus().isRunning()).isFalse();
    }

    private record CorpusFixture(String corpusVersion,
                                 String trainDataPath,
                                 String validationDataPath,
                                 String manifestDataPath,
                                 Path trainFile,
                                 Path validationFile,
                                 Path manifestFile,
                                 String trainSha256,
                                 String validationSha256,
                                 int minimumSampleTokens,
                                 int maximumSampleTokens,
                                 int recommendedBlockSize) {
    }

    private static LotteryDraw draw(String issue,
                                    String red1,
                                    String red2,
                                    String red3,
                                    String red4,
                                    String red5,
                                    String red6,
                                    String blue) {
        return LotteryDraw.builder()
                .issue(issue)
                .redNumbers(List.of(red1, red2, red3, red4, red5, red6))
                .blueNumber(blue)
                .build();
    }

    private static String sha256(String content) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                .digest(content.getBytes(StandardCharsets.UTF_8)));
    }
}
