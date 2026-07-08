package com.one.record.ai;

import com.one.record.model.MiniGptRunRecord;
import com.one.record.model.MiniGptTrainingLogRecord;
import lombok.Builder;
import lombok.Data;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
public class MiniGptDashboard implements Serializable {

    private MiniGptRunRecord latestRun;

    @Builder.Default
    private List<MiniGptRunRecord> runs = new ArrayList<>();

    @Builder.Default
    private List<MiniGptTrainingLogRecord> logs = new ArrayList<>();

    private Integer runCount;

    private Integer logCount;

    private Long generatedAt;
}
