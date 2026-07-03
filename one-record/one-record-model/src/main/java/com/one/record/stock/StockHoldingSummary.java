package com.one.record.stock;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockHoldingSummary {

    private String positionId;

    private String accountId;

    private String symbol;

    private String market;

    private String code;

    private String name;

    private BigDecimal quantity;

    private BigDecimal costPrice;

    private BigDecimal costAmount;

    private BigDecimal latestPrice;

    private BigDecimal changeAmount;

    private BigDecimal changePercent;

    private BigDecimal marketValue;

    private BigDecimal floatingPnl;

    private BigDecimal floatingPnlPercent;

    private BigDecimal realizedPnl;

    private BigDecimal dividendIncome;

    private BigDecimal todayPnl;

    private Boolean quoteAvailable;

    private Boolean stale;
}
