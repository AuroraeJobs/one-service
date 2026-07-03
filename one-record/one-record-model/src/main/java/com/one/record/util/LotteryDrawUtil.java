package com.one.record.util;

import com.one.record.lottery.LotteryDraw;
import com.one.record.response.Record;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public final class LotteryDrawUtil {

    private LotteryDrawUtil() {
    }

    public static LotteryDraw fromRecord(Record record) {
        if (record == null) {
            return null;
        }
        List<String> redNumbers = normalizeRedNumbers(record.getRed());
        String blueNumber = normalizeBlueNumber(record.getBlue());
        LotteryDraw draw = build(redNumbers, blueNumber);
        draw.setId(record.getCode());
        draw.setIssue(record.getCode());
        draw.setPeriod(parsePeriod(record.getCode()));
        draw.setDrawDate(normalizeDate(record.getDate()));
        draw.setSource("record");
        return draw;
    }

    public static LotteryDraw fromCompactRecord(String compactRecord, long period) {
        if (!StringUtils.hasText(compactRecord)) {
            throw new IllegalArgumentException("开奖记录不能为空");
        }
        String normalized = compactRecord.trim();
        if (!normalized.matches("\\d{14}")) {
            throw new IllegalArgumentException("开奖记录必须是14位数字");
        }
        List<String> redNumbers = normalizeRedNumbers(normalized.substring(0, 12));
        String blueNumber = normalizeBlueNumber(normalized.substring(12, 14));
        LotteryDraw draw = build(redNumbers, blueNumber);
        draw.setId(period + "-" + draw.getRaw());
        draw.setPeriod(period);
        return draw;
    }

    public static List<String> normalizeRedNumbers(String red) {
        List<String> numbers = splitNumbers(red);
        if (numbers.size() != 6) {
            throw new IllegalArgumentException("红球必须是6个号码");
        }
        List<Integer> values = new ArrayList<>();
        for (String number : numbers) {
            int value = parseNumber(number, "红球");
            if (value < 1 || value > 33) {
                throw new IllegalArgumentException("红球号码必须在01到33之间");
            }
            values.add(value);
        }
        Set<Integer> uniqueValues = new LinkedHashSet<>(values);
        if (uniqueValues.size() != values.size()) {
            throw new IllegalArgumentException("红球号码不能重复");
        }
        return values.stream()
                .sorted(Comparator.naturalOrder())
                .map(LotteryDrawUtil::formatNumber)
                .collect(Collectors.toList());
    }

    public static String normalizeBlueNumber(String blue) {
        int value = parseNumber(blue, "蓝球");
        if (value < 1 || value > 16) {
            throw new IllegalArgumentException("蓝球号码必须在01到16之间");
        }
        return formatNumber(value);
    }

    private static LotteryDraw build(List<String> redNumbers, String blueNumber) {
        List<Integer> redValues = redNumbers.stream().map(Integer::parseInt).collect(Collectors.toList());
        int redSum = redValues.stream().mapToInt(Integer::intValue).sum();
        int oddCount = (int) redValues.stream().filter(value -> value % 2 != 0).count();
        int bigCount = (int) redValues.stream().filter(value -> value >= 17).count();
        int min = redValues.stream().mapToInt(Integer::intValue).min().orElse(0);
        int max = redValues.stream().mapToInt(Integer::intValue).max().orElse(0);
        String[] redArray = redNumbers.toArray(new String[0]);
        String hexagramCode = LotteryBallUtil.redHexagramCode(redArray);
        return LotteryDraw.builder()
                .raw(String.join("", redNumbers) + blueNumber)
                .redNumbers(redNumbers)
                .blueNumber(blueNumber)
                .redSum(redSum)
                .oddCount(oddCount)
                .evenCount(redNumbers.size() - oddCount)
                .bigCount(bigCount)
                .smallCount(redNumbers.size() - bigCount)
                .span(max - min)
                .consecutivePairs(countConsecutivePairs(redValues))
                .combination(oddCount + "奇" + (redNumbers.size() - oddCount) + "偶")
                .planetName(LotteryBallUtil.redPlanet(redArray))
                .hexagramCode(hexagramCode)
                .hexagramName(LotteryBallUtil.redHexagram(redArray))
                .build();
    }

    private static List<String> splitNumbers(String value) {
        if (!StringUtils.hasText(value)) {
            return List.of();
        }
        String normalized = value.trim();
        if (normalized.contains(",")) {
            return List.of(normalized.split(",")).stream()
                    .map(String::trim)
                    .filter(StringUtils::hasText)
                    .collect(Collectors.toList());
        }
        if (!normalized.matches("\\d+") || normalized.length() % 2 != 0) {
            throw new IllegalArgumentException("号码格式必须是逗号分隔或连续两位数字");
        }
        List<String> numbers = new ArrayList<>();
        for (int index = 0; index + 2 <= normalized.length(); index += 2) {
            numbers.add(normalized.substring(index, index + 2));
        }
        return numbers;
    }

    private static int parseNumber(String number, String label) {
        if (!StringUtils.hasText(number)) {
            throw new IllegalArgumentException(label + "号码不能为空");
        }
        String normalized = number.trim();
        if (!normalized.matches("\\d{1,2}")) {
            throw new IllegalArgumentException(label + "号码必须是数字");
        }
        return Integer.parseInt(normalized);
    }

    private static String formatNumber(int value) {
        return String.format("%02d", value);
    }

    private static long parsePeriod(String code) {
        if (!StringUtils.hasText(code)) {
            return 0;
        }
        try {
            return Long.parseLong(code.trim());
        } catch (NumberFormatException exception) {
            return 0;
        }
    }

    private static String normalizeDate(String date) {
        if (!StringUtils.hasText(date)) {
            return null;
        }
        String normalized = date.trim();
        return normalized.length() >= 10 ? normalized.substring(0, 10) : normalized;
    }

    private static int countConsecutivePairs(List<Integer> values) {
        List<Integer> sorted = values.stream().sorted().collect(Collectors.toList());
        int count = 0;
        for (int index = 1; index < sorted.size(); index++) {
            if (sorted.get(index - 1) + 1 == sorted.get(index)) {
                count++;
            }
        }
        return count;
    }
}
