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
public class StockAnalysisSummary {

    private BigDecimal concentrationPercent;

    private String concentrationSymbol;

    private List<StockAnalysisItem> concentration;

    private List<StockAnalysisItem> volatility;

    private List<StockAnalysisItem> drawdown;

    private List<StockAnalysisItem> topGainers;

    private List<StockAnalysisItem> topLosers;

    private Long calculatedAt;
}
