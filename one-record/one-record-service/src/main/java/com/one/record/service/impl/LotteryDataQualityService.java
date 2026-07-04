package com.one.record.service.impl;

import com.one.record.lottery.LotteryDataQualityReport;
import com.one.record.response.Record;
import com.one.record.service.ILotteryDataQualityService;
import com.one.record.service.IRecordService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class LotteryDataQualityService implements ILotteryDataQualityService {

    private static final int SAMPLE_LIMIT = 50;

    private final IRecordService recordService;

    @Override
    public LotteryDataQualityReport report() {
        List<Record> records = recordService.findAll();
        List<String> duplicateIssues = duplicateIssues(records);
        List<String> missingIssues = missingIssues(records);
        List<String> malformedIssues = records.stream()
                .filter(this::malformed)
                .map(Record::getCode)
                .filter(StringUtils::hasText)
                .sorted()
                .toList();
        List<String> futureDateIssues = records.stream()
                .filter(this::futureDate)
                .map(Record::getCode)
                .filter(StringUtils::hasText)
                .sorted()
                .toList();
        return LotteryDataQualityReport.builder()
                .totalRecords(records.size())
                .missingIssueCount(missingIssues.size())
                .duplicateIssueCount(duplicateIssues.size())
                .malformedRecordCount(malformedIssues.size())
                .futureDateCount(futureDateIssues.size())
                .missingIssues(limit(missingIssues))
                .duplicateIssues(limit(duplicateIssues))
                .malformedIssues(limit(malformedIssues))
                .futureDateIssues(limit(futureDateIssues))
                .generatedAt(System.currentTimeMillis())
                .build();
    }

    private List<String> duplicateIssues(List<Record> records) {
        Map<String, Long> issueCounts = records.stream()
                .map(Record::getCode)
                .filter(StringUtils::hasText)
                .collect(Collectors.groupingBy(issue -> issue, LinkedHashMap::new, Collectors.counting()));
        return issueCounts.entrySet().stream()
                .filter(entry -> entry.getValue() > 1)
                .map(Map.Entry::getKey)
                .sorted()
                .toList();
    }

    private List<String> missingIssues(List<Record> records) {
        Map<String, Set<Integer>> sequencesByYear = new LinkedHashMap<>();
        for (Record record : records) {
            IssueParts issue = parseIssue(record.getCode());
            if (issue == null) {
                continue;
            }
            sequencesByYear.computeIfAbsent(issue.year(), ignored -> new HashSet<>()).add(issue.sequence());
        }
        List<String> missingIssues = new ArrayList<>();
        for (Map.Entry<String, Set<Integer>> entry : sequencesByYear.entrySet()) {
            List<Integer> sequences = entry.getValue().stream().sorted().toList();
            if (sequences.size() < 2) {
                continue;
            }
            for (int sequence = sequences.get(0); sequence <= sequences.get(sequences.size() - 1); sequence++) {
                if (!entry.getValue().contains(sequence)) {
                    missingIssues.add(entry.getKey() + String.format("%03d", sequence));
                }
            }
        }
        missingIssues.sort(Comparator.naturalOrder());
        return missingIssues;
    }

    private boolean malformed(Record record) {
        IssueParts issue = parseIssue(record.getCode());
        if (issue == null) {
            return true;
        }
        List<Integer> redNumbers = parseNumbers(record.getRed());
        List<Integer> blueNumbers = parseNumbers(record.getBlue());
        return redNumbers.size() != 6
                || new HashSet<>(redNumbers).size() != 6
                || redNumbers.stream().anyMatch(number -> number < 1 || number > 33)
                || blueNumbers.size() != 1
                || blueNumbers.get(0) < 1
                || blueNumbers.get(0) > 16;
    }

    private boolean futureDate(Record record) {
        if (!StringUtils.hasText(record.getDate())) {
            return false;
        }
        try {
            return LocalDate.parse(record.getDate().substring(0, Math.min(10, record.getDate().length())))
                    .isAfter(LocalDate.now());
        } catch (DateTimeParseException exception) {
            return false;
        }
    }

    private List<Integer> parseNumbers(String value) {
        if (!StringUtils.hasText(value)) {
            return List.of();
        }
        List<Integer> numbers = new ArrayList<>();
        for (String part : value.split("[,，\\s]+")) {
            if (!StringUtils.hasText(part)) {
                continue;
            }
            try {
                numbers.add(Integer.parseInt(part.trim()));
            } catch (NumberFormatException exception) {
                return List.of();
            }
        }
        return numbers;
    }

    private IssueParts parseIssue(String issue) {
        if (!StringUtils.hasText(issue) || !issue.matches("\\d{7}")) {
            return null;
        }
        return new IssueParts(issue.substring(0, 4), Integer.parseInt(issue.substring(4)));
    }

    private List<String> limit(List<String> values) {
        return values.stream().limit(SAMPLE_LIMIT).toList();
    }

    private record IssueParts(String year, int sequence) {
    }
}
