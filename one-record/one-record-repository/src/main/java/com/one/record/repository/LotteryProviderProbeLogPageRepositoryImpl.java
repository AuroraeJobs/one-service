package com.one.record.repository;

import com.one.record.model.LotteryProviderProbeLog;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import java.util.List;

@AllArgsConstructor
public class LotteryProviderProbeLogPageRepositoryImpl implements LotteryProviderProbeLogPageRepository {

    private final MongoOperations mongoOperations;

    @Override
    public Page<LotteryProviderProbeLog> findPage(String provider,
                                                  Boolean success,
                                                  Long checkedStartAt,
                                                  Long checkedEndAt,
                                                  Pageable pageable) {
        Query countQuery = buildQuery(provider, success, checkedStartAt, checkedEndAt);
        long total = mongoOperations.count(countQuery, LotteryProviderProbeLog.class);
        if (total <= pageable.getOffset()) {
            return new PageImpl<>(List.of(), pageable, total);
        }
        Query pageQuery = buildQuery(provider, success, checkedStartAt, checkedEndAt).with(pageable);
        List<LotteryProviderProbeLog> items = mongoOperations.find(pageQuery, LotteryProviderProbeLog.class);
        return new PageImpl<>(items, pageable, total);
    }

    private static Query buildQuery(String provider,
                                    Boolean success,
                                    Long checkedStartAt,
                                    Long checkedEndAt) {
        Query query = new Query();
        if (provider != null) {
            query.addCriteria(Criteria.where("provider").is(provider));
        }
        if (success != null) {
            query.addCriteria(Criteria.where("success").is(success));
        }
        if (checkedStartAt != null || checkedEndAt != null) {
            Criteria checkedAt = Criteria.where("checkedAt");
            if (checkedStartAt != null) {
                checkedAt.gte(checkedStartAt);
            }
            if (checkedEndAt != null) {
                checkedAt.lte(checkedEndAt);
            }
            query.addCriteria(checkedAt);
        }
        return query;
    }
}
