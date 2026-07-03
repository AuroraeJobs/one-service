package com.one.record.service.impl;

import com.one.record.lottery.LotteryPrizeResult;
import com.one.record.util.LotteryPrizeCalculator;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LotteryPrizeCalculatorTest {

    @Test
    void calculatesPrizeGradesFromHitCounts() {
        assertPrize(6, true, "FIRST", "一等奖", 1, null, true);
        assertPrize(6, false, "SECOND", "二等奖", 2, null, true);
        assertPrize(5, true, "THIRD", "三等奖", 3, 300000L, true);
        assertPrize(5, false, "FOURTH", "四等奖", 4, 20000L, true);
        assertPrize(4, true, "FOURTH", "四等奖", 4, 20000L, true);
        assertPrize(4, false, "FIFTH", "五等奖", 5, 1000L, true);
        assertPrize(3, true, "FIFTH", "五等奖", 5, 1000L, true);
        assertPrize(0, true, "SIXTH", "六等奖", 6, 500L, true);
        assertPrize(3, false, "NONE", "未中奖", null, 0L, false);
    }

    @Test
    void calculatesHitsFromTicketAndActualNumbers() {
        LotteryPrizeResult result = LotteryPrizeCalculator.calculate(
                List.of("1", "02", "03", "04", "05", "06"),
                "7",
                List.of("01", "02", "03", "08", "09", "10"),
                "07"
        );

        assertThat(result.getRedHits()).isEqualTo(3);
        assertThat(result.getBlueHit()).isTrue();
        assertThat(result.getPrizeGrade()).isEqualTo("FIFTH");
        assertThat(result.getPrizeName()).isEqualTo("五等奖");
    }

    @Test
    void rejectsInvalidHitCount() {
        assertThatThrownBy(() -> LotteryPrizeCalculator.result(7, false))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("0到6");
    }

    private static void assertPrize(int redHits, boolean blueHit, String grade, String name,
                                    Integer level, Long amount, boolean winning) {
        LotteryPrizeResult result = LotteryPrizeCalculator.result(redHits, blueHit);

        assertThat(result.getRedHits()).isEqualTo(redHits);
        assertThat(result.getBlueHit()).isEqualTo(blueHit);
        assertThat(result.getPrizeGrade()).isEqualTo(grade);
        assertThat(result.getPrizeName()).isEqualTo(name);
        assertThat(result.getPrizeLevel()).isEqualTo(level);
        assertThat(result.getPrizeAmount()).isEqualTo(amount);
        assertThat(result.getWinning()).isEqualTo(winning);
    }
}
