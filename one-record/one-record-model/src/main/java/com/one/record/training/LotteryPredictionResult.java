package com.one.record.training;

import lombok.Data;

import java.io.Serializable;

@Data
public class LotteryPredictionResult implements Serializable {

    private int redHits;

    private boolean blueHit;

    private String prizeName;

    private int score;
}
