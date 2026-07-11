package com.one.record.model;

import com.one.record.lottery.LotteryAuditMetadata;
import com.one.record.lottery.LotteryResearchProvenance;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "lottery_decision_sets")
public class LotteryDecisionSet {

    @Id
    private String id;

    private String userId;

    private String title;

    private String targetIssue;

    private Integer targetPeriod;

    private String ruleName;

    private String evidenceState;

    private String resultState;

    private String status;

    private String conversionState;

    private String note;

    private LotteryResearchProvenance provenance;

    private String reviewAction;

    private String reviewNote;

    private String reviewBacktestId;

    private Long reviewedAt;

    @Builder.Default
    private List<LotteryDecisionCandidateSelection> selectedCandidates = new ArrayList<>();

    private Boolean archived;

    private Long archivedAt;

    private LotteryAuditMetadata auditMetadata;

    private Long createdAt;

    private Long updatedAt;
}
