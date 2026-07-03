package com.one.record.stock;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "stock_klines")
@CompoundIndex(name = "idx_stock_kline_symbol_period_trade_date", def = "{'symbol': 1, 'period': 1, 'tradeDate': 1}", unique = true)
public class StockKLine {

    @Id
    private String id;

    private String symbol;

    private String market;

    private String code;

    private String period;

    private String tradeDate;

    private BigDecimal open;

    private BigDecimal close;

    private BigDecimal high;

    private BigDecimal low;

    private Long volume;

    private BigDecimal amount;

    private BigDecimal changeAmount;

    private BigDecimal changePercent;

    private String source;

    private Long createdAt;

    private Long updatedAt;
}
