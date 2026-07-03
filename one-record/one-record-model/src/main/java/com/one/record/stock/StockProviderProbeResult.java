package com.one.record.stock;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockProviderProbeResult {

    private String category;

    private String symbol;

    private Boolean success;

    private Boolean available;

    private Integer sampleCount;

    private Long durationMs;

    private Long checkedAt;

    private String message;
}
