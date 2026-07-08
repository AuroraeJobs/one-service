package com.one.record.service.impl;

import com.one.record.ai.MiniGptLotteryCandidateValidation;
import com.one.record.repository.MiniGptRunRepository;
import com.one.record.repository.MiniGptTrainingLogRepository;
import com.one.record.service.IRecordService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class MiniGptLearningServiceTest {

    private MiniGptLearningService service;

    @BeforeEach
    void setUp() {
        service = new MiniGptLearningService(
                mock(MiniGptRunRepository.class),
                mock(MiniGptTrainingLogRepository.class),
                mock(IRecordService.class)
        );
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
}
