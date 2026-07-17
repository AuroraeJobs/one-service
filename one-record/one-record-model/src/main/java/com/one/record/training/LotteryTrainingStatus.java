package com.one.record.training;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

@Data
public class LotteryTrainingStatus implements Serializable {

    private boolean running;

    private boolean failed;

    private boolean cancelled;

    private int percent;

    private String stage;

    private int processed;

    private int total;

    private String message;

    private Integer replayCount;

    private String scale;

    private Long startedAt;

    private Long updatedAt;

    private Long finishedAt;

    private String taskDetail;

    private List<String> logs;

    private Long logSequence;

    private LotteryTrainingReport report;
}
