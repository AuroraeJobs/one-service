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
public class LotteryWorkbenchStepResult implements Serializable {

    private String step;

    private String status;

    private String message;

    private Long startedAt;

    private Long finishedAt;

    private Integer savedCount;

    private Integer checkedCount;

    private Integer updatedCount;

    private String error;
}
