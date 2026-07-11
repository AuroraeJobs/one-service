package com.one.record.model;

import com.one.record.lottery.LotteryAuditMetadata;
import com.one.record.lottery.LotteryResearchProvenance;
import com.one.record.lottery.LotteryTicketBudgetPrecheckResult;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "lottery_ticket_packs")
public class LotteryTicketPack implements Serializable {

    @Id
    private String id;

    private String userId;

    private String title;

    private String targetIssue;

    private String sourceType;

    private String sourceId;

    private String decisionSetId;

    private String generationId;

    private LotteryResearchProvenance provenance;

    private String status;

    private String approvalState;

    private Boolean archived;

    private Long approvedAt;

    private Long savedAt;

    private Long archivedAt;

    @Builder.Default
    private List<LotteryTicketPackItem> items = new ArrayList<>();

    private LotteryTicketBudgetPrecheckResult budgetPrecheck;

    @Builder.Default
    private List<String> savedTicketIds = new ArrayList<>();

    @Builder.Default
    private List<String> warnings = new ArrayList<>();

    private LotteryAuditMetadata auditMetadata;

    private Long createdAt;

    private Long updatedAt;
}
