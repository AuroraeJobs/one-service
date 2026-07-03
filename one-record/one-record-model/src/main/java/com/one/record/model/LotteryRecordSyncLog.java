package com.one.record.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "lottery_record_sync_logs")
public class LotteryRecordSyncLog {

    @Id
    private String id;

    private String jobName;

    private String status;

    private String startIssue;

    private String endIssue;

    private Integer savedCount;

    private String message;

    private Long startedAt;

    private Long finishedAt;
}
