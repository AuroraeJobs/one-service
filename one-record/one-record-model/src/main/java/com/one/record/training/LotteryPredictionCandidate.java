package com.one.record.training;

import lombok.Data;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
public class LotteryPredictionCandidate implements Serializable {

    private String title;

    private List<String> redNumbers = new ArrayList<>();

    private String blueNumber;

    private int score;

    private LotteryPredictionResult result;
}
