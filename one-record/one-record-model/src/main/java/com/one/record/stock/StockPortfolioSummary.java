package com.one.record.stock;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockPortfolioSummary {

    private BigDecimal totalMarketValue;

    private BigDecimal totalCostAmount;

    private BigDecimal floatingPnl;

    private BigDecimal floatingPnlPercent;

    private BigDecimal todayPnl;

    private Integer holdingCount;

    private Long calculatedAt;

    private List<StockHoldingSummary> holdings;
}
