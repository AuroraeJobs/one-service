package com.one.record.util;

import com.one.record.lottery.LotteryPrizeResult;

import java.util.List;

public final class LotteryPrizeCalculator {

    private LotteryPrizeCalculator() {
    }

    public static LotteryPrizeResult calculate(List<String> ticketRedNumbers,
                                               String ticketBlueNumber,
                                               List<String> actualRedNumbers,
                                               String actualBlueNumber) {
        List<String> normalizedTicketRed = LotteryDrawUtil.normalizeRedNumbers(ticketRedNumbers);
        List<String> normalizedActualRed = LotteryDrawUtil.normalizeRedNumbers(actualRedNumbers);
        String normalizedTicketBlue = LotteryDrawUtil.normalizeBlueNumber(ticketBlueNumber);
        String normalizedActualBlue = LotteryDrawUtil.normalizeBlueNumber(actualBlueNumber);
        int redHits = (int) normalizedTicketRed.stream().filter(normalizedActualRed::contains).count();
        boolean blueHit = normalizedTicketBlue.equals(normalizedActualBlue);
        return result(redHits, blueHit);
    }

    public static LotteryPrizeResult result(int redHits, boolean blueHit) {
        if (redHits < 0 || redHits > 6) {
            throw new IllegalArgumentException("红球命中数量必须是0到6");
        }
        Prize prize = prize(redHits, blueHit);
        return LotteryPrizeResult.builder()
                .redHits(redHits)
                .blueHit(blueHit)
                .prizeGrade(prize.grade)
                .prizeName(prize.name)
                .prizeLevel(prize.level)
                .prizeAmount(prize.amount)
                .winning(prize.level != null)
                .build();
    }

    private static Prize prize(int redHits, boolean blueHit) {
        if (redHits == 6 && blueHit) {
            return new Prize("FIRST", "一等奖", 1, null);
        }
        if (redHits == 6) {
            return new Prize("SECOND", "二等奖", 2, null);
        }
        if (redHits == 5 && blueHit) {
            return new Prize("THIRD", "三等奖", 3, 300000L);
        }
        if (redHits == 5 || (redHits == 4 && blueHit)) {
            return new Prize("FOURTH", "四等奖", 4, 20000L);
        }
        if (redHits == 4 || (redHits == 3 && blueHit)) {
            return new Prize("FIFTH", "五等奖", 5, 1000L);
        }
        if (blueHit) {
            return new Prize("SIXTH", "六等奖", 6, 500L);
        }
        return new Prize("NONE", "未中奖", null, 0L);
    }

    private static class Prize {

        private final String grade;

        private final String name;

        private final Integer level;

        private final Long amount;

        private Prize(String grade, String name, Integer level, Long amount) {
            this.grade = grade;
            this.name = name;
            this.level = level;
            this.amount = amount;
        }
    }
}
