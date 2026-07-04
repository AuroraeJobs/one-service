package com.one.record.lottery;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotteryMaintenanceSummary implements Serializable {

    private Boolean dryRun;

    @Builder.Default
    private List<CollectionStatus> collections = new ArrayList<>();

    @Builder.Default
    private List<CacheStatus> caches = new ArrayList<>();

    private Long generatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CollectionStatus implements Serializable {

        private String collection;

        private Long totalCount;

        private Long staleCount;

        private Integer retentionDays;

        private Long oversizedBy;

        private Boolean cleanupSupported;

        private String message;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CacheStatus implements Serializable {

        private String cacheKey;

        private Boolean present;

        private Long ttlSeconds;

        private Boolean noExpiry;

        private Boolean cleanupSupported;

        private String message;
    }
}
