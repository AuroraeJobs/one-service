package com.one.record.repository;

import com.one.record.model.LotteryRecordSyncLog;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import java.util.List;

@AllArgsConstructor
public class LotteryRecordSyncLogPageRepositoryImpl implements LotteryRecordSyncLogPageRepository {

    private final MongoOperations mongoOperations;

    @Override
    public Page<LotteryRecordSyncLog> findPage(String status,
                                               Long startedStartAt,
                                               Long startedEndAt,
                                               Pageable pageable) {
        Query countQuery = buildQuery(status, startedStartAt, startedEndAt);
        long total = mongoOperations.count(countQuery, LotteryRecordSyncLog.class);
        if (total <= pageable.getOffset()) {
            return new PageImpl<>(List.of(), pageable, total);
        }
        Query pageQuery = buildQuery(status, startedStartAt, startedEndAt).with(pageable);
        List<LotteryRecordSyncLog> items = mongoOperations.find(pageQuery, LotteryRecordSyncLog.class);
        return new PageImpl<>(items, pageable, total);
    }

    private static Query buildQuery(String status, Long startedStartAt, Long startedEndAt) {
        Query query = new Query();
        if (status != null) {
            query.addCriteria(Criteria.where("status").is(status));
        }
        if (startedStartAt != null || startedEndAt != null) {
            Criteria startedAt = Criteria.where("startedAt");
            if (startedStartAt != null) {
                startedAt.gte(startedStartAt);
            }
            if (startedEndAt != null) {
                startedAt.lte(startedEndAt);
            }
            query.addCriteria(startedAt);
        }
        return query;
    }
}
