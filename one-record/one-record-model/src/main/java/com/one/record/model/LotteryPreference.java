package com.one.record.model;

import java.math.BigDecimal;

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

    private Long createdAt;

    private Long updatedAt;
}
