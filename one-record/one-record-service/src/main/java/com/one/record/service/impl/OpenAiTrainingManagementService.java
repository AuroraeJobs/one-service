package com.one.record.service.impl;

import com.one.record.ai.OpenAiTrainingManagementDashboard;
import com.one.record.service.IOpenAiTrainingManagementService;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class OpenAiTrainingManagementService implements IOpenAiTrainingManagementService {

    @Override
    public OpenAiTrainingManagementDashboard dashboard() {
        return OpenAiTrainingManagementDashboard.builder()
                .lifecycleStages(lifecycleStages())
                .entities(entities())
                .jobs(jobs())
                .evalRuns(evalRuns())
                .deploymentBindings(deploymentBindings())
                .nextActions(nextActions())
                .generatedAt(System.currentTimeMillis())
                .build();
    }

    private List<OpenAiTrainingManagementDashboard.LifecycleStage> lifecycleStages() {
        return List.of(
                stage("eval", "experiment", "Baseline Eval", "先测基础模型，确认问题来自 prompt、数据、工具还是模型行为。"),
                stage("dataset", "database", "Dataset", "整理 supervised 样本，记录来源、用途、审核状态和 OpenAI file id。"),
                stage("job", "upload", "Fine-tuning Job", "创建训练任务，跟踪 queued、running、succeeded、failed 等状态。"),
                stage("checkpoint", "branches", "Checkpoint", "比较中间模型的 loss、accuracy、样例输出和失败案例。"),
                stage("deploy", "rocket", "Deployment Binding", "只有 eval 达标后，才把模型版本绑定到具体业务能力。")
        );
    }

    private List<OpenAiTrainingManagementDashboard.EntityCard> entities() {
        return List.of(
                entity("dataset", "llm_training_dataset", "训练/评测数据集", "#0071e3"),
                entity("job", "llm_training_job", "托管训练任务", "#ff9500"),
                entity("metric", "llm_training_metric", "step 与 loss 指标", "#34c759"),
                entity("checkpoint", "llm_model_checkpoint", "中间模型版本", "#5856d6"),
                entity("eval", "llm_eval_run", "上线前评测", "#00c7be"),
                entity("deployment", "llm_model_deployment", "业务绑定与回滚", "#ff3b30")
        );
    }

    private List<OpenAiTrainingManagementDashboard.TrainingJob> jobs() {
        return List.of(
                job("job-1", "ftjob_wechat_draft_v1", "gpt-4.1-mini", "wechat-style-sft.jsonl", "succeeded", 0.92, 1.04, "step-240"),
                job("job-2", "ftjob_review_guard_v2", "gpt-4.1-mini", "review-quality-sft.jsonl", "running", 1.18, 1.31, "step-120"),
                job("job-3", "ftjob_tool_route_v1", "gpt-4.1", "tool-routing-eval.jsonl", "queued", null, null, "-")
        );
    }

    private List<OpenAiTrainingManagementDashboard.EvalRun> evalRuns() {
        return List.of(
                evalRun("base", "gpt-4.1-mini", "wechat-publish-eval", 72, 0.78, "baseline"),
                evalRun("checkpoint", "ft:wechat:step-240", "wechat-publish-eval", 84, 0.86, "candidate"),
                evalRun("deploy", "ft:wechat:final", "wechat-publish-eval", 89, 0.91, "deploy")
        );
    }

    private List<OpenAiTrainingManagementDashboard.DeploymentBinding> deploymentBindings() {
        return List.of(
                deployment("wechat-draft", "wechat-draft", "ft:wechat:final", "wechat-draft-v3", "deploy", "active", "gpt-4.1-mini"),
                deployment("minigpt-review", "minigpt-review", "ft:review:step-120", "review-v2", "checkpoint", "canary", "gpt-4.1-mini"),
                deployment("tool-routing", "tool-routing", "gpt-4.1", "tool-route-v1", "base", "draft", "gpt-4.1-mini")
        );
    }

    private List<OpenAiTrainingManagementDashboard.NextAction> nextActions() {
        return List.of(
                nextAction("api", "api", "one-service API", "提供 dataset、job、metric、checkpoint、eval、deployment 的只读接口。"),
                nextAction("mongo", "chart", "Mongo 持久化", "保存训练任务状态、指标、评测结果和上线绑定历史。"),
                nextAction("gate", "check", "上线门禁", "用 eval pass rate 和失败案例决定模型是否进入灰度或回滚。")
        );
    }

    private OpenAiTrainingManagementDashboard.LifecycleStage stage(String key, String icon, String title, String detail) {
        return OpenAiTrainingManagementDashboard.LifecycleStage.builder()
                .key(key)
                .icon(icon)
                .title(title)
                .detail(detail)
                .build();
    }

    private OpenAiTrainingManagementDashboard.EntityCard entity(String key, String label, String value, String accent) {
        return OpenAiTrainingManagementDashboard.EntityCard.builder()
                .key(key)
                .label(label)
                .value(value)
                .accent(accent)
                .build();
    }

    private OpenAiTrainingManagementDashboard.TrainingJob job(String key,
                                                             String jobId,
                                                             String baseModel,
                                                             String dataset,
                                                             String status,
                                                             Double trainLoss,
                                                             Double validLoss,
                                                             String checkpoint) {
        return OpenAiTrainingManagementDashboard.TrainingJob.builder()
                .key(key)
                .jobId(jobId)
                .baseModel(baseModel)
                .dataset(dataset)
                .status(status)
                .trainLoss(trainLoss)
                .validLoss(validLoss)
                .checkpoint(checkpoint)
                .build();
    }

    private OpenAiTrainingManagementDashboard.EvalRun evalRun(String key,
                                                             String model,
                                                             String evalSet,
                                                             Integer passRate,
                                                             Double score,
                                                             String decision) {
        return OpenAiTrainingManagementDashboard.EvalRun.builder()
                .key(key)
                .model(model)
                .evalSet(evalSet)
                .passRate(passRate)
                .score(score)
                .decision(decision)
                .build();
    }

    private OpenAiTrainingManagementDashboard.DeploymentBinding deployment(String key,
                                                                          String featureKey,
                                                                          String modelId,
                                                                          String promptVersion,
                                                                          String evalRunId,
                                                                          String rolloutStatus,
                                                                          String rollbackModelId) {
        return OpenAiTrainingManagementDashboard.DeploymentBinding.builder()
                .key(key)
                .featureKey(featureKey)
                .modelId(modelId)
                .promptVersion(promptVersion)
                .evalRunId(evalRunId)
                .rolloutStatus(rolloutStatus)
                .rollbackModelId(rollbackModelId)
                .build();
    }

    private OpenAiTrainingManagementDashboard.NextAction nextAction(String key, String icon, String title, String detail) {
        return OpenAiTrainingManagementDashboard.NextAction.builder()
                .key(key)
                .icon(icon)
                .title(title)
                .detail(detail)
                .build();
    }
}
