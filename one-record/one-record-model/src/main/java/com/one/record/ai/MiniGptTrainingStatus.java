package com.one.record.ai;

import com.one.record.model.MiniGptRunRecord;
import com.one.record.model.MiniGptTrainingLogRecord;
import lombok.Builder;
import lombok.Data;

import java.io.Serializable;

@Data
@Builder
public class MiniGptTrainingStatus implements Serializable {

    private boolean running;

    private boolean failed;

    private boolean cancelled;

    private int exitCode;

    private int percent;

    private String runName;

    private String preset;

    private String stage;

    private String message;

    private Integer processedStep;

    private Integer totalSteps;

    private MiniGptRunRecord run;

    private MiniGptTrainingLogRecord latestLog;

    private Long startedAt;

    private Long updatedAt;
}
