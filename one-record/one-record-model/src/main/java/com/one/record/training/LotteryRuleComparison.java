package com.one.record.training;

import com.one.record.model.LotteryPredictionRuleRecord;
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
public class LotteryRuleComparison implements Serializable {

    @Builder.Default
    private List<LotteryPredictionRuleRecord> rules = new ArrayList<>();

    private String bestRuleId;

    private String bestRuleName;

    private Integer bestRankScore;

    private Long generatedAt;
}
