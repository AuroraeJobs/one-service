package com.one.record.stock;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockProviderConfig {

    private String provider;

    private List<String> fallbackProviders;

    private Boolean cacheEnabled;

    private Integer quoteCacheTtlSeconds;

    private Integer fallbackCacheTtlSeconds;

    private Integer providerProbeTtlSeconds;

    private List<String> defaultSymbols;

    private Boolean klineSyncEnabled;

    private String klineSyncCron;

    private List<String> klineSyncSymbols;

    private Boolean alertEvaluationEnabled;

    private String alertEvaluationCron;

    private Long checkedAt;
}
