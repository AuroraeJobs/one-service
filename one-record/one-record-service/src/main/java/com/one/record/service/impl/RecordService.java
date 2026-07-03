package com.one.record.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.one.common.util.JsonUtil;
import com.one.record.lottery.LotteryDraw;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.one.record.repository.RecordRepository;
import com.one.record.request.RecordRequest;
import com.one.record.response.Record;
import com.one.record.response.RecordYearCount;
import com.one.record.service.IRecordService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import com.one.record.util.LotteryDrawUtil;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Component
@AllArgsConstructor
public class RecordService implements IRecordService {

    private static final String RECORD_YEAR_COUNT_KEY = "lottery:record:year-counts";

    private static final int DEFAULT_PAGE_SIZE = 50;

    private static final int MAX_PAGE_SIZE = 500;

    private final RecordRepository repository;

    private final StringRedisTemplate redisTemplate;

    @Override
    public void saveAll(List<Record> item) {
        repository.saveAll(item);
    }

    @Override
    public Record findFirst() {
        return repository.findTopByOrderByCodeAsc();
    }

    @Override
    public Record findLast() {
        return repository.findTopByOrderByCodeDesc();
    }

    @Override
    public Record findById(String id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public List<Record> findAll() {
        return repository.findAll();
    }

    @Override
    public List<Record> find(RecordRequest request) {
        if (StringUtils.hasText(request.getIssueStart()) && StringUtils.hasText(request.getIssueEnd())) {
            return repository.findByCodeBetween(request.getIssueStart(), request.getIssueEnd());
        }
        if (StringUtils.hasText(request.getDayStart()) && StringUtils.hasText(request.getDayEnd())) {
            return repository.findByDateBetween(request.getDayStart(), request.getDayEnd());
        }
        if (request.getLineStart() != 0 && request.getLineEnd() != 0) {
            return repository.findByLineBetween(request.getLineStart(), request.getLineEnd());
        }
        return null;
    }

    @Override
    public LotteryDraw findFirstDraw() {
        return LotteryDrawUtil.fromRecord(findFirst());
    }

    @Override
    public LotteryDraw findLastDraw() {
        return LotteryDrawUtil.fromRecord(findLast());
    }

    @Override
    public List<LotteryDraw> findDraws(RecordRequest request, int page, int size) {
        PageRequest pageRequest = PageRequest.of(normalizePage(page), normalizeSize(size));
        List<Record> records;
        if (request != null && StringUtils.hasText(request.getIssueStart()) && StringUtils.hasText(request.getIssueEnd())) {
            records = repository.findByCodeBetweenOrderByCodeDesc(request.getIssueStart(), request.getIssueEnd(), pageRequest);
        } else if (request != null && StringUtils.hasText(request.getDayStart()) && StringUtils.hasText(request.getDayEnd())) {
            records = repository.findByDateBetweenOrderByDateDesc(request.getDayStart(), request.getDayEnd(), pageRequest);
        } else if (request != null && request.getLineStart() != 0 && request.getLineEnd() != 0) {
            records = repository.findByLineBetweenOrderByLineDesc(request.getLineStart(), request.getLineEnd(), pageRequest);
        } else {
            records = repository.findAllByOrderByCodeDesc(pageRequest);
        }
        return records.stream()
                .map(LotteryDrawUtil::fromRecord)
                .collect(Collectors.toList());
    }

    @Override
    public List<RecordYearCount> countByYear() {
        Map<String, Long> yearCounts = new LinkedHashMap<>();
        repository.findAll().stream()
                .map(Record::getDate)
                .filter(StringUtils::hasText)
                .map(String::trim)
                .filter(date -> date.length() >= 4)
                .map(date -> date.substring(0, 4))
                .filter(year -> year.matches("\\d{4}"))
                .sorted()
                .forEach(year -> yearCounts.put(year, yearCounts.getOrDefault(year, 0L) + 1L));

        List<RecordYearCount> result = yearCounts.entrySet().stream()
                .map(entry -> new RecordYearCount(entry.getKey(), entry.getValue()))
                .collect(Collectors.toList());
        saveYearCounts(result);
        return result;
    }

    @Override
    public List<RecordYearCount> getYearCounts() {
        try {
            String value = redisTemplate.opsForValue().get(RECORD_YEAR_COUNT_KEY);
            if (!StringUtils.hasText(value)) {
                return Collections.emptyList();
            }
            return JsonUtil.toObject(value, new TypeReference<List<RecordYearCount>>() {
            });
        } catch (RuntimeException exception) {
            log.warn("年度记录数读取或反序列化失败，key={}", RECORD_YEAR_COUNT_KEY, exception);
        }
        return Collections.emptyList();
    }

    private void saveYearCounts(List<RecordYearCount> yearCounts) {
        try {
            redisTemplate.opsForValue().set(RECORD_YEAR_COUNT_KEY, JsonUtil.toJson(yearCounts));
        } catch (RuntimeException exception) {
            log.warn("年度记录数序列化或写入 Redis 失败，key={}", RECORD_YEAR_COUNT_KEY, exception);
        }
    }

    private static int normalizePage(int page) {
        return Math.max(0, page);
    }

    private static int normalizeSize(int size) {
        if (size <= 0) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(size, MAX_PAGE_SIZE);
    }
}
