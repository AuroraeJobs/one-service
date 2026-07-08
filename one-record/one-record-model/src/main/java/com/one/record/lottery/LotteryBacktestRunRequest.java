package com.one.record.lottery;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotteryBacktestRunRequest implements Serializable {

    private String experimentId;

    private String decisionSetId;

    private String strategyName;

    private String presetWindow;

    private Integer window;

    private String issueStart;

    private String issueEnd;
}
