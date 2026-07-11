package com.one.record.repository;

import com.one.record.model.LotteryProviderProbeLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LotteryProviderProbeLogRepository extends MongoRepository<LotteryProviderProbeLog, String>,
        LotteryProviderProbeLogPageRepository {

    List<LotteryProviderProbeLog> findByOrderByCheckedAtDesc(Pageable pageable);

    List<LotteryProviderProbeLog> findByProviderOrderByCheckedAtDesc(String provider, Pageable pageable);
}
