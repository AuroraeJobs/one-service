package com.one.record.service.impl;

import com.one.record.lottery.LotteryDraw;
import com.one.record.repository.RecordRepository;
import com.one.record.request.RecordRequest;
import com.one.record.response.Record;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RecordServiceTest {

    private RecordRepository repository;

    private RecordService service;

    @BeforeEach
    void setUp() {
        repository = mock(RecordRepository.class);
        StringRedisTemplate redisTemplate = mock(StringRedisTemplate.class);
        @SuppressWarnings("unchecked")
        ValueOperations<String, String> valueOperations = (ValueOperations<String, String>) mock(ValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        service = new RecordService(repository, redisTemplate);
    }

    @Test
    void findLastDrawReturnsCanonicalDraw() {
        Record record = record("2026001", 1, "01,02,03,04,05,06", "07");
        when(repository.findTopByOrderByCodeDesc()).thenReturn(record);

        LotteryDraw draw = service.findLastDraw();

        assertThat(draw.getIssue()).isEqualTo("2026001");
        assertThat(draw.getRaw()).isEqualTo("01020304050607");
        assertThat(draw.getBlueNumber()).isEqualTo("07");
    }

    @Test
    void findDrawsUsesIssueFilterAndPagination() {
        RecordRequest request = RecordRequest.byIssue("2026001", "2026005");
        when(repository.findByCodeBetweenOrderByCodeDesc(any(), any(), any(Pageable.class)))
                .thenReturn(List.of(record("2026005", 5, "01,02,03,04,05,06", "07")));

        List<LotteryDraw> draws = service.findDraws(request, 2, 20);

        assertThat(draws).hasSize(1);
        assertThat(draws.get(0).getIssue()).isEqualTo("2026005");
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(repository).findByCodeBetweenOrderByCodeDesc(org.mockito.ArgumentMatchers.eq("2026001"),
                org.mockito.ArgumentMatchers.eq("2026005"), pageableCaptor.capture());
        assertThat(pageableCaptor.getValue().getPageNumber()).isEqualTo(2);
        assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(20);
    }

    @Test
    void findDrawsUsesDefaultPagingWhenNoFilterProvided() {
        when(repository.findAllByOrderByCodeDesc(any(Pageable.class)))
                .thenReturn(List.of(record("2026001", 1, "01,02,03,04,05,06", "07")));

        List<LotteryDraw> draws = service.findDraws(new RecordRequest(), -1, 0);

        assertThat(draws).hasSize(1);
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(repository).findAllByOrderByCodeDesc(pageableCaptor.capture());
        assertThat(pageableCaptor.getValue().getPageNumber()).isZero();
        assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(50);
    }

    private static Record record(String code, long line, String red, String blue) {
        Record record = new Record();
        record.setCode(code);
        record.setLine(line);
        record.setDate("2026-07-03");
        record.setRed(red);
        record.setBlue(blue);
        return record;
    }
}
