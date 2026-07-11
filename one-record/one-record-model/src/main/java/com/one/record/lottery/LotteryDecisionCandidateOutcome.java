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
public class LotteryDecisionCandidateOutcome implements Serializable {

    private String decisionSetId;

    private String decisionSetTitle;

    private String candidateKey;

    private String candidateTitle;

    private String generationId;

    private LotteryResearchProvenance provenance;

    private String source;

    private String snapshotId;

    private String ruleName;

    private String targetIssue;

    @Builder.Default
    private List<String> redNumbers = new ArrayList<>();

    private String blueNumber;

    private String evidenceTag;

    private String driftLabel;

    private Integer redHits;

    private Boolean blueHit;

    private String prizeName;

    private String resultState;

    private Integer convertedTicketCount;

    private Integer checkedTicketCount;

    private Integer winningTicketCount;

    private BigDecimal totalCost;

    private BigDecimal totalPrize;

    private BigDecimal netResult;

    @Builder.Default
    private List<String> warnings = new ArrayList<>();
}
