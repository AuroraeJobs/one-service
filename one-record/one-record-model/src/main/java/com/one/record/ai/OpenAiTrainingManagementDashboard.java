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
    private List<TrainingDataset> datasets = new ArrayList<>();

    @Builder.Default
    private List<TrainingJob> jobs = new ArrayList<>();

    @Builder.Default
    private List<EvalRun> evalRuns = new ArrayList<>();

    @Builder.Default
    private List<DeploymentBinding> deploymentBindings = new ArrayList<>();

    @Builder.Default
    private List<ReadinessCheck> readinessChecks = new ArrayList<>();

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
    public static class TrainingDataset implements Serializable {

        private String key;

        private String datasetId;

        private String name;

        private String purpose;

        private String source;

        private String fileId;

        private Integer recordCount;

        private String qualityStatus;
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
    public static class DeploymentBinding implements Serializable {

        private String key;

        private String featureKey;

        private String modelId;

        private String promptVersion;

        private String evalRunId;

        private String rolloutStatus;

        private String rollbackModelId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReadinessCheck implements Serializable {

        private String key;

        private String label;

        private String status;

        private String detail;
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
