package com.one.record.service.impl;

import com.one.record.lottery.LotteryDraw;
import com.one.record.response.Record;
import com.one.record.util.LotteryDrawUtil;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LotteryDrawUtilTest {

    @Test
    void fromRecordBuildsCanonicalDraw() {
        Record record = new Record();
        record.setCode("2026001");
        record.setDate("2026-07-03 21:00:00");
        record.setRed("06,01,33,16,17,02");
        record.setBlue("7");

        LotteryDraw draw = LotteryDrawUtil.fromRecord(record);

        assertThat(draw.getIssue()).isEqualTo("2026001");
        assertThat(draw.getPeriod()).isEqualTo(2026001L);
        assertThat(draw.getDrawDate()).isEqualTo("2026-07-03");
        assertThat(draw.getRedNumbers()).containsExactly("01", "02", "06", "16", "17", "33");
        assertThat(draw.getBlueNumber()).isEqualTo("07");
        assertThat(draw.getRaw()).isEqualTo("01020616173307");
        assertThat(draw.getRedSum()).isEqualTo(75);
        assertThat(draw.getOddCount()).isEqualTo(3);
        assertThat(draw.getEvenCount()).isEqualTo(3);
        assertThat(draw.getBigCount()).isEqualTo(2);
        assertThat(draw.getSmallCount()).isEqualTo(4);
        assertThat(draw.getSpan()).isEqualTo(32);
        assertThat(draw.getConsecutivePairs()).isEqualTo(2);
        assertThat(draw.getCombination()).isEqualTo("3奇3偶");
        assertThat(draw.getPlanetName()).isEqualTo("火星");
        assertThat(draw.getHexagramCode()).isEqualTo("100011");
        assertThat(draw.getHexagramName()).isEqualTo("益");
    }

    @Test
    void fromCompactRecordParsesFourteenDigitRecord() {
        LotteryDraw draw = LotteryDrawUtil.fromCompactRecord("01020304050607", 1);

        assertThat(draw.getId()).isEqualTo("1-01020304050607");
        assertThat(draw.getPeriod()).isEqualTo(1L);
        assertThat(draw.getRedNumbers()).containsExactly("01", "02", "03", "04", "05", "06");
        assertThat(draw.getBlueNumber()).isEqualTo("07");
    }

    @Test
    void normalizeRedNumbersRejectsDuplicatesAndOutOfRangeValues() {
        assertThatThrownBy(() -> LotteryDrawUtil.normalizeRedNumbers("01,02,03,04,05,05"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("不能重复");
        assertThatThrownBy(() -> LotteryDrawUtil.normalizeRedNumbers("01,02,03,04,05,34"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("01到33");
    }

    @Test
    void normalizeBlueNumberRejectsOutOfRangeValues() {
        assertThat(LotteryDrawUtil.normalizeBlueNumber("7")).isEqualTo("07");
        assertThatThrownBy(() -> LotteryDrawUtil.normalizeBlueNumber("17"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("01到16");
    }
}
