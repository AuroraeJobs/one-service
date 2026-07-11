package com.one.record.repository;

import com.one.record.model.LotteryProviderProbeLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface LotteryProviderProbeLogPageRepository {

    Page<LotteryProviderProbeLog> findPage(String provider,
                                           Boolean success,
                                           Long checkedStartAt,
                                           Long checkedEndAt,
                                           Pageable pageable);
}
