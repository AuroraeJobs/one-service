package com.one.record.training;

import lombok.Data;

@Data
public class LotteryTrainingRequest {

    private int replayCount;

    private String scale = "deep";
}
