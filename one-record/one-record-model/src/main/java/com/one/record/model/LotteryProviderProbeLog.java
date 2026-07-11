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
@Document(collection = "lottery_provider_probe_logs")
@CompoundIndexes({
        @CompoundIndex(name = "idx_lottery_probe_checked_at", def = "{'checkedAt': -1}"),
        @CompoundIndex(name = "idx_lottery_probe_provider_checked_at", def = "{'provider': 1, 'checkedAt': -1}"),
        @CompoundIndex(name = "idx_lottery_probe_success_checked_at", def = "{'success': 1, 'checkedAt': -1}"),
        @CompoundIndex(name = "idx_lottery_probe_provider_success_checked_at", def = "{'provider': 1, 'success': 1, 'checkedAt': -1}")
})
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

    private String failureCategory;

    private String requestMode;

    private Integer httpStatus;

    private String responseContentType;

    private String responseSnippet;

    private Boolean networkBlockSuspected;
}
