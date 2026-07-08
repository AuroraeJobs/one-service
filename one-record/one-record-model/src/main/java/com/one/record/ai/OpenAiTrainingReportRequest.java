package com.one.record.ai;

import lombok.Data;

import java.io.Serializable;

@Data
public class OpenAiTrainingReportRequest implements Serializable {

    private String title;

    private String content;

    private String source;

    private Long dashboardGeneratedAt;
}
