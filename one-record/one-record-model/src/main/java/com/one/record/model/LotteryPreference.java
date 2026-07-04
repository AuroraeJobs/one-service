package com.one.record.model;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "lottery_preferences")
public class LotteryPreference {

    @Id
    private String id;

    private String userId;

    private String defaultTrainingScale;

    private Integer defaultReplayCount;

    private Boolean autoSavePredictions;

    private String defaultTicketSource;

    private BigDecimal weeklyBudget;

    private BigDecimal monthlyBudget;

    private Integer maxTicketsPerIssue;

    private Integer budgetReminderPercent;

    private Integer reminderDrawWindowHours;

    private Integer reminderDefaultSnoozeMinutes;

    private Boolean monthEndExportChecklistEnabled;

    private Integer governancePortfolioScoreThreshold;

    private Integer governanceSimulatorHighRiskLimit;

    private Integer governanceTicketPackBudgetExposurePercent;

    private Integer governanceEvidenceFreshnessDays;

    private Integer governanceStaleApprovalHours;

    @Builder.Default
    private List<String> workbenchWidgetOrder = new ArrayList<>();

    @Builder.Default
    private List<String> hiddenWorkbenchWidgets = new ArrayList<>();

    private Long createdAt;

    private Long updatedAt;
}
