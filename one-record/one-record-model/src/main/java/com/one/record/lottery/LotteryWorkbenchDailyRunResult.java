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
public class LotteryWorkbenchDailyRunResult implements Serializable {

    @Builder.Default
    private List<LotteryWorkbenchStepResult> steps = new ArrayList<>();

    private LotteryWorkbenchSummary summary;

    private Long generatedAt;
}
