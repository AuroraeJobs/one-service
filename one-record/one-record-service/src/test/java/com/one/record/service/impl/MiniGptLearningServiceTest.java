package com.one.record.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.one.record.ai.MiniGptLotteryCandidateValidation;
import com.one.record.ai.MiniGptLotteryCorpusExport;
import com.one.record.exception.MiniGptLotteryCorpusException;
import com.one.record.lottery.LotteryDraw;
import com.one.record.repository.MiniGptRunRepository;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class MiniGptLearningServiceTest {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @TempDir
    Path tempDir;

    private MiniGptLearningService service;

    private IRecordService recordService;

    @BeforeEach
    void setUp() {
        recordService = mock(IRecordService.class);
        service = new MiniGptLearningService(
                mock(MiniGptRunRepository.class),
                mock(MiniGptTrainingLogRepository.class),
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
        assertThat(result.getRepairedRedNumbers()).containsExactly("01", "02", "04", "05");
        assertThat(result.getRepairedBlueNumber()).isNull();
    }

    @Test
    void validateLotteryCandidateMarksUnparseableTextAsFailed() {
        MiniGptLotteryCandidateValidation result = service.validateLotteryCandidate("暂时没有号码");

        assertThat(result.getStatus()).isEqualTo("FAILED");
        assertThat(result.getParseable()).isFalse();
        assertThat(result.getIssues()).contains("未解析到候选号码", "红球数量应为 6 个，当前为 0", "未解析到蓝球");
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
