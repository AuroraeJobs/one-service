package com.one.record.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OpenAiTrainingManagementDashboard implements Serializable {

    @Builder.Default
    private List<LifecycleStage> lifecycleStages = new ArrayList<>();

    @Builder.Default
    private List<EntityCard> entities = new ArrayList<>();

    @Builder.Default
    private List<TrainingJob> jobs = new ArrayList<>();

    @Builder.Default
    private List<EvalRun> evalRuns = new ArrayList<>();

    @Builder.Default
    private List<NextAction> nextActions = new ArrayList<>();

    private Long generatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LifecycleStage implements Serializable {

        private String key;

        private String icon;

        private String title;

        private String detail;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EntityCard implements Serializable {

        private String key;

        private String label;

        private String value;

        private String accent;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrainingJob implements Serializable {

        private String key;

        private String jobId;

        private String baseModel;

        private String dataset;

        private String status;

        private Double trainLoss;

        private Double validLoss;

        private String checkpoint;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EvalRun implements Serializable {

        private String key;

        private String model;

        private String evalSet;

        private Integer passRate;

        private Double score;

        private String decision;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NextAction implements Serializable {

        private String key;

        private String icon;

        private String title;

        private String detail;
    }
}
