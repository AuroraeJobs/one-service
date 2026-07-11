package com.one.record.repository;

import com.one.record.model.LotteryProviderProbeLog;
import com.one.record.model.LotteryRecordSyncLog;
import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.query.Query;

import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LotteryLogPageRepositoryTest {

    @Test
    void syncLogPageUsesMongoFiltersSortAndOffsetPagination() {
        MongoOperations mongoOperations = mock(MongoOperations.class);
        LotteryRecordSyncLog item = LotteryRecordSyncLog.builder().id("sync-11").status("SUCCESS").build();
        when(mongoOperations.count(any(Query.class), eq(LotteryRecordSyncLog.class))).thenReturn(25L);
        when(mongoOperations.find(any(Query.class), eq(LotteryRecordSyncLog.class))).thenReturn(List.of(item));
        LotteryRecordSyncLogPageRepository repository = new LotteryRecordSyncLogPageRepositoryImpl(mongoOperations);

        var result = repository.findPage(
                "SUCCESS",
                100L,
                200L,
                PageRequest.of(1, 10, Sort.by(Sort.Direction.DESC, "startedAt", "_id"))
        );

        assertThat(result.getContent()).containsExactly(item);
        assertThat(result.getTotalElements()).isEqualTo(25);
        assertThat(result.hasNext()).isTrue();

        ArgumentCaptor<Query> countQueryCaptor = ArgumentCaptor.captor();
        verify(mongoOperations).count(countQueryCaptor.capture(), eq(LotteryRecordSyncLog.class));
        assertThat(countQueryCaptor.getValue().getSkip()).isZero();
        assertThat(countQueryCaptor.getValue().getLimit()).isZero();

        ArgumentCaptor<Query> pageQueryCaptor = ArgumentCaptor.captor();
        verify(mongoOperations).find(pageQueryCaptor.capture(), eq(LotteryRecordSyncLog.class));
        Query pageQuery = pageQueryCaptor.getValue();
        assertThat(pageQuery.getQueryObject().getString("status")).isEqualTo("SUCCESS");
        assertThat(pageQuery.getQueryObject().get("startedAt", Document.class))
                .containsEntry("$gte", 100L)
                .containsEntry("$lte", 200L);
        assertThat(pageQuery.getSkip()).isEqualTo(10);
        assertThat(pageQuery.getLimit()).isEqualTo(10);
        assertThat(pageQuery.getSortObject()).containsEntry("startedAt", -1);
        assertThat(pageQuery.getSortObject()).containsEntry("_id", -1);
    }

    @Test
    void providerProbePageUsesExactProviderAndMongoFilters() {
        MongoOperations mongoOperations = mock(MongoOperations.class);
        LotteryProviderProbeLog item = LotteryProviderProbeLog.builder().id("probe-1").provider("cwl").build();
        when(mongoOperations.count(any(Query.class), eq(LotteryProviderProbeLog.class))).thenReturn(1L);
        when(mongoOperations.find(any(Query.class), eq(LotteryProviderProbeLog.class))).thenReturn(List.of(item));
        LotteryProviderProbeLogPageRepository repository = new LotteryProviderProbeLogPageRepositoryImpl(mongoOperations);

        var result = repository.findPage(
                "cwl",
                false,
                100L,
                200L,
                PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "checkedAt", "_id"))
        );

        assertThat(result.getContent()).containsExactly(item);
        ArgumentCaptor<Query> pageQueryCaptor = ArgumentCaptor.captor();
        verify(mongoOperations).find(pageQueryCaptor.capture(), eq(LotteryProviderProbeLog.class));
        Query pageQuery = pageQueryCaptor.getValue();
        assertThat(pageQuery.getQueryObject().get("provider")).isEqualTo("cwl");
        assertThat(pageQuery.getQueryObject().getBoolean("success")).isFalse();
        assertThat(pageQuery.getQueryObject().get("checkedAt", Document.class))
                .containsEntry("$gte", 100L)
                .containsEntry("$lte", 200L);
        assertThat(pageQuery.getSkip()).isZero();
        assertThat(pageQuery.getLimit()).isEqualTo(20);
        assertThat(pageQuery.getSortObject()).containsEntry("checkedAt", -1);
        assertThat(pageQuery.getSortObject()).containsEntry("_id", -1);
    }

    @Test
    void logDocumentsDeclareIndexesForOptionalFilterCombinations() {
        assertThat(indexNames(LotteryRecordSyncLog.class))
                .containsExactlyInAnyOrder(
                        "idx_lottery_sync_started_at",
                        "idx_lottery_sync_status_started_at"
                );
        assertThat(indexNames(LotteryProviderProbeLog.class))
                .containsExactlyInAnyOrder(
                        "idx_lottery_probe_checked_at",
                        "idx_lottery_probe_provider_checked_at",
                        "idx_lottery_probe_success_checked_at",
                        "idx_lottery_probe_provider_success_checked_at"
                );
    }

    private static List<String> indexNames(Class<?> documentType) {
        CompoundIndexes indexes = documentType.getAnnotation(CompoundIndexes.class);
        return Arrays.stream(indexes.value())
                .map(CompoundIndex::name)
                .toList();
    }
}
