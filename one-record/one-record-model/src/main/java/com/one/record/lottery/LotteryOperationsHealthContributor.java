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
public class LotteryOperationsHealthContributor implements Serializable {

    private String key;

    private String label;

    private String status;

    private Integer score;

    private Integer weight;

    private String message;

    private String path;

    private Integer pendingCount;

    private Long updatedAt;
}
