package com.one.record.lottery;

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
public class LotteryBudgetStatus implements Serializable {

    private BigDecimal weeklyBudget;

    private BigDecimal monthlyBudget;

    private Integer maxTicketsPerIssue;

    private Integer budgetReminderPercent;

    private BigDecimal weeklyCost;

    private BigDecimal monthlyCost;

    private Integer maxIssueTicketCount;

    private String maxIssue;

    private BigDecimal weeklyUsagePercent;

    private BigDecimal monthlyUsagePercent;

    private String status;

    @Builder.Default
    private List<Warning> warnings = new ArrayList<>();

    private Long generatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Warning implements Serializable {

        private String key;

        private String level;

        private String message;

        private String path;
    }
}
