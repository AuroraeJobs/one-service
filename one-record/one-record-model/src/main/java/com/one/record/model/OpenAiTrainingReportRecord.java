package com.one.record.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "openai_training_reports")
public class OpenAiTrainingReportRecord {

    @Id
    private String id;

    private String title;

    private String content;

    private String source;

    @Indexed
    private Long dashboardGeneratedAt;

    private Long createdAt;
}
