package com.one.record.lottery;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotteryTicketImportPreviewRequest {

    private String content;

    private String defaultIssue;

    private Integer defaultQuantity;

    private BigDecimal defaultCost;

    private String defaultSource;

    private String defaultStatus;

    private String note;
}
