package com.one.record.lottery;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotteryProviderProbeResult implements Serializable {

    private String category;

    private String provider;

    private Boolean success;

    private String status;

    private String message;

    private Integer recordCount;

    private Long durationMs;

    private Long checkedAt;
}
