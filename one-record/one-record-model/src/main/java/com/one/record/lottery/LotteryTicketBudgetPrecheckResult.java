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
public class LotteryTicketBudgetPrecheckResult implements Serializable {

    private Integer requestedCount;

    private Integer proposedTicketCount;

    private BigDecimal proposedCost;

    private BigDecimal weeklyBudget;

    private BigDecimal monthlyBudget;

    private Integer maxTicketsPerIssue;

    private Integer budgetReminderPercent;

    private BigDecimal weeklyCost;

    private BigDecimal monthlyCost;

    private BigDecimal projectedWeeklyCost;

    private BigDecimal projectedMonthlyCost;

    private BigDecimal weeklyUsagePercent;

    private BigDecimal monthlyUsagePercent;

    private String status;

    @Builder.Default
    private List<IssueExposure> issueExposures = new ArrayList<>();

    @Builder.Default
    private List<LotteryBudgetStatus.Warning> warnings = new ArrayList<>();

    private Long generatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IssueExposure implements Serializable {

        private String issue;

        private Integer currentTicketCount;

        private Integer proposedTicketCount;

        private Integer projectedTicketCount;

        private BigDecimal proposedCost;
    }
}
