package com.one.record.lottery;

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
public class LotteryMiniGptDecisionSetCreateRequest implements Serializable {

    private String batchId;

    @Builder.Default
    private List<String> generationIds = new ArrayList<>();

    private String targetIssue;

    private String title;

    private String note;
}
