package com.one.record.model;

import com.one.record.training.LotteryRuleEvidence;
import com.one.record.lottery.LotteryResearchProvenance;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotteryDecisionCandidateSelection implements Serializable {

    private String key;

    private String generationId;

    private LotteryResearchProvenance provenance;

    private String snapshotId;

    private String snapshotTitle;

    private String candidateTitle;

    private String source;

    private Integer targetPeriod;

    private String ruleId;

    private String ruleName;

    @Builder.Default
    private List<String> redNumbers = new ArrayList<>();

    private String blueNumber;

    private Integer score;

    private LotteryRuleEvidence evidence;

    private String replayText;

    private String driftLabel;

    private String resultLabel;

    private String resultState;

    private Integer redOverlap;

    private Boolean blueOverlap;

    private Integer ticketCount;

    private String ticketState;

    private String warning;

    @Builder.Default
    private List<String> convertedTicketIds = new ArrayList<>();
}
