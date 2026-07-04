package com.one.record.training;

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
public class LotteryRuleEvidence implements Serializable {

    private String tag;

    private String label;

    private String message;

    private Integer score;

    @Builder.Default
    private List<String> reasons = new ArrayList<>();

    private Long generatedAt;
}
