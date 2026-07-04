package com.one.record.model;

import com.one.record.lottery.LotteryAuditMetadata;
import com.one.record.training.LotteryActualRecord;
import com.one.record.training.LotteryPredictionCandidate;
import com.one.record.training.LotteryPredictionResult;
import com.one.record.training.LotteryReplaySummary;
import com.one.record.training.LotteryRuleEvidence;
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
@Document(collection = "lottery_prediction_snapshots")
public class LotteryPredictionSnapshot {

    @Id
    private String id;

    private String title;

    @Builder.Default
    private List<String> redNumbers = new ArrayList<>();

    private String blueNumber;

    private Integer score;

    private String ruleId;

    private String ruleName;

    private Integer basedOnPeriod;

    private Integer targetPeriod;

    private String reason;

    private LotteryActualRecord actualRecord;

    private LotteryPredictionResult result;

    private LotteryRuleEvidence evidence;

    private LotteryReplaySummary replaySummary;

    @Builder.Default
    private List<LotteryPredictionCandidate> candidates = new ArrayList<>();

    private LotteryAuditMetadata auditMetadata;

    private Long createdAt;

    private Long updatedAt;
}
