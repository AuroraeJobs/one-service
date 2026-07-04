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
@Document(collection = "lottery_provider_probe_logs")
public class LotteryProviderProbeLog {

    @Id
    private String id;

    private String category;

    private String provider;

    private Boolean success;

    private String status;

    private String message;

    private Integer recordCount;

    private Long durationMs;

    private Long checkedAt;
}
