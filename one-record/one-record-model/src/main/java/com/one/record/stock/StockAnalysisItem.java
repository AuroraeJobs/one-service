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
public class StockAnalysisItem {

    private String symbol;

    private String name;

    private BigDecimal value;

    private BigDecimal percent;

    private String message;
}
