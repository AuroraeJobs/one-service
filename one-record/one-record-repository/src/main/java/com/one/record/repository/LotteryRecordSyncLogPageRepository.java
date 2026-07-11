package com.one.record.repository;

import com.one.record.model.LotteryRecordSyncLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface LotteryRecordSyncLogPageRepository {

    Page<LotteryRecordSyncLog> findPage(String status,
                                        Long startedStartAt,
                                        Long startedEndAt,
                                        Pageable pageable);
}
