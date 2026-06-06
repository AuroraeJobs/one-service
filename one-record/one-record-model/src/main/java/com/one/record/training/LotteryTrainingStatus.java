package com.one.record.training;

import lombok.Data;

import java.io.Serializable;

@Data
public class LotteryTrainingStatus implements Serializable {

    private boolean running;

    private boolean failed;

    private int percent;

    private String stage;

    private int processed;

    private int total;

    private String message;

    private LotteryTrainingReport report;
}
