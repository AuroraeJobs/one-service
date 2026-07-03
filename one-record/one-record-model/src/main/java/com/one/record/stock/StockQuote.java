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
public class StockQuote {

    private String symbol;

    private String market;

    private String code;

    private String name;

    private BigDecimal price;

    private BigDecimal changeAmount;

    private BigDecimal changePercent;

    private BigDecimal open;

    private BigDecimal previousClose;

    private BigDecimal high;

    private BigDecimal low;

    private Long volume;

    private BigDecimal amount;

    private String tradeDateTime;

    private String source;

    private String sourceSymbol;

    private Long fetchedAt;

    private Boolean available;

    private Boolean stale;

    private String staleReason;

    private String message;
}
