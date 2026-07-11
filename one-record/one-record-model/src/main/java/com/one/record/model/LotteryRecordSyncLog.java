package com.one.record.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "lottery_record_sync_logs")
@CompoundIndexes({
        @CompoundIndex(name = "idx_lottery_sync_started_at", def = "{'startedAt': -1}"),
        @CompoundIndex(name = "idx_lottery_sync_status_started_at", def = "{'status': 1, 'startedAt': -1}")
})
public class LotteryRecordSyncLog {

    @Id
    private String id;

    private String jobName;

    private String status;

    private String startIssue;

    private String endIssue;

    private Integer savedCount;

    private String message;

    private String failureCategory;

    private String provider;

    private String requestMode;

    private Integer httpStatus;

    private Boolean networkBlockSuspected;

    private Long startedAt;

    private Long finishedAt;
}
