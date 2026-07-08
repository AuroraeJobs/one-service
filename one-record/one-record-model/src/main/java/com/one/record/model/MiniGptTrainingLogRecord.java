package com.one.record.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "mini_gpt_training_logs")
@CompoundIndex(name = "run_step_unique", def = "{'runName': 1, 'step': 1}", unique = true)
public class MiniGptTrainingLogRecord {

    @Id
    private String id;

    private String runName;

    private Integer step;

    private Double trainLoss;

    private Double evalLoss;

    private Double elapsedSeconds;

    private String sample;

    private Long createdAt;

    private Long updatedAt;
}
