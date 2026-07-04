package com.one.record.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotteryTicketPackItem implements Serializable {

    private String key;

    private String title;

    @Builder.Default
    private List<String> redNumbers = new ArrayList<>();

    private String blueNumber;

    private Integer quantity;

    private BigDecimal cost;

    private String source;

    private String predictionSnapshotId;

    private String decisionSetId;

    private String portfolioId;

    private String note;

    @Builder.Default
    private List<String> warnings = new ArrayList<>();
}
