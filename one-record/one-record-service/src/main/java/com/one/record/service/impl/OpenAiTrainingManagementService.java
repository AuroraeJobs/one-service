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
                .datasets(datasets())
                .jobs(jobs())
                .metrics(metrics())
                .checkpoints(checkpoints())
                .evalRuns(evalRuns())
                .evalFailureCases(evalFailureCases())
                .costItems(costItems())
                .deploymentBindings(deploymentBindings())
                .readinessChecks(readinessChecks())
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

    private List<OpenAiTrainingManagementDashboard.TrainingDataset> datasets() {
        return List.of(
                dataset("wechat-style", "ds_wechat_style_v1", "wechat-style-sft.jsonl", "fine_tune", "公众号人工精选样本", "file-wechat-style-v1", 420, "approved"),
                dataset("review-quality", "ds_review_quality_v2", "review-quality-sft.jsonl", "fine_tune", "MiniGPT 复盘笔记", "file-review-quality-v2", 180, "reviewed"),
                dataset("wechat-publish-eval", "ds_wechat_publish_eval", "wechat-publish-eval.jsonl", "eval", "发布回归用例", "file-wechat-eval-v1", 96, "approved")
        );
    }

    private List<OpenAiTrainingManagementDashboard.TrainingJob> jobs() {
        return List.of(
                job("job-1", "ftjob_wechat_draft_v1", "gpt-4.1-mini", "wechat-style-sft.jsonl", "succeeded", 0.92, 1.04, "step-240"),
                job("job-2", "ftjob_review_guard_v2", "gpt-4.1-mini", "review-quality-sft.jsonl", "running", 1.18, 1.31, "step-120"),
                job("job-3", "ftjob_tool_route_v1", "gpt-4.1", "tool-routing-eval.jsonl", "queued", null, null, "-")
        );
    }

    private List<OpenAiTrainingManagementDashboard.TrainingMetric> metrics() {
        return List.of(
                metric("wechat-060", "ftjob_wechat_draft_v1", 60, 1.42, 1.56, 0.62, 180),
                metric("wechat-120", "ftjob_wechat_draft_v1", 120, 1.12, 1.18, 0.74, 365),
                metric("wechat-240", "ftjob_wechat_draft_v1", 240, 0.92, 1.04, 0.81, 720),
                metric("review-060", "ftjob_review_guard_v2", 60, 1.43, 1.52, 0.61, 210),
                metric("review-120", "ftjob_review_guard_v2", 120, 1.18, 1.31, 0.69, 430)
        );
    }

    private List<OpenAiTrainingManagementDashboard.ModelCheckpoint> checkpoints() {
        return List.of(
                checkpoint("wechat-120", "ckpt_wechat_120", "ft:wechat:step-120", "ftjob_wechat_draft_v1", 120, 1.18, 0.74, "风格开始稳定，但标题仍偏模板化。"),
                checkpoint("wechat-240", "ckpt_wechat_240", "ft:wechat:step-240", "ftjob_wechat_draft_v1", 240, 1.04, 0.81, "候选 checkpoint，Eval 提升明显。"),
                checkpoint("review-120", "ckpt_review_120", "ft:review:step-120", "ftjob_review_guard_v2", 120, 1.31, 0.69, "适合作为 canary，继续补失败样例。")
        );
    }

    private List<OpenAiTrainingManagementDashboard.EvalRun> evalRuns() {
        return List.of(
                evalRun("base", "gpt-4.1-mini", "wechat-publish-eval", 72, 0.78, "baseline"),
                evalRun("checkpoint", "ft:wechat:step-240", "wechat-publish-eval", 84, 0.86, "candidate"),
                evalRun("deploy", "ft:wechat:final", "wechat-publish-eval", 89, 0.91, "deploy")
        );
    }

    private List<OpenAiTrainingManagementDashboard.EvalFailureCase> evalFailureCases() {
        return List.of(
                failureCase(
                        "format-drift",
                        "checkpoint",
                        "格式漂移",
                        "生成公众号发布计划摘要",
                        "保留标题、目标读者、发布时间和复盘指标",
                        "输出风格接近，但遗漏复盘指标",
                        "补充包含复盘指标的正例，并在 eval 中增加字段完整性断言"
                ),
                failureCase(
                        "weak-evidence",
                        "deploy",
                        "证据不足",
                        "解释为什么选择当前 checkpoint",
                        "引用 valid loss、pass rate 和失败案例",
                        "只引用 pass rate，缺少失败案例说明",
                        "把训练报告里的失败样例摘要加入回答模板"
                ),
                failureCase(
                        "tool-routing",
                        "base",
                        "工具路由",
                        "判断是否需要查询训练任务状态",
                        "识别为 training job 查询并调用 API",
                        "误判为普通聊天回答",
                        "为 tool-routing 数据集补充边界样本"
                )
        );
    }

    private List<OpenAiTrainingManagementDashboard.CostItem> costItems() {
        return List.of(
                cost("training-wechat", "fine_tune", "gpt-4.1-mini", 620000, 0, 3.10, "训练样本和验证集 token 估算。"),
                cost("eval-wechat", "eval", "ft:wechat:step-240", 48000, 36000, 0.42, "上线前回归评测成本快照。"),
                cost("canary-review", "canary", "ft:review:step-120", 120000, 90000, 1.05, "灰度期间按 1 周样本量估算。")
        );
    }

    private List<OpenAiTrainingManagementDashboard.DeploymentBinding> deploymentBindings() {
        return List.of(
                deployment("wechat-draft", "wechat-draft", "ft:wechat:final", "wechat-draft-v3", "deploy", "active", "gpt-4.1-mini"),
                deployment("minigpt-review", "minigpt-review", "ft:review:step-120", "review-v2", "checkpoint", "canary", "gpt-4.1-mini"),
                deployment("tool-routing", "tool-routing", "gpt-4.1", "tool-route-v1", "base", "draft", "gpt-4.1-mini")
        );
    }

    private List<OpenAiTrainingManagementDashboard.ReadinessCheck> readinessChecks() {
        return List.of(
                readiness("dataset-reviewed", "数据集审核", "PASS", "训练样本已标注用途、来源和审核状态。"),
                readiness("job-succeeded", "训练任务", "PASS", "主候选任务已完成，并产出 fine-tuned model。"),
                readiness("eval-threshold", "Eval 门槛", "PASS", "目标评测集 pass rate 达到 85% 以上。"),
                readiness("rollback-ready", "回滚模型", "PASS", "每个 active/canary 绑定都保留 rollbackModelId。"),
                readiness("canary-watch", "灰度观察", "WARNING", "canary 模型仍需补充失败样例和人工复盘。")
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

    private OpenAiTrainingManagementDashboard.TrainingDataset dataset(String key,
                                                                     String datasetId,
                                                                     String name,
                                                                     String purpose,
                                                                     String source,
                                                                     String fileId,
                                                                     Integer recordCount,
                                                                     String qualityStatus) {
        return OpenAiTrainingManagementDashboard.TrainingDataset.builder()
                .key(key)
                .datasetId(datasetId)
                .name(name)
                .purpose(purpose)
                .source(source)
                .fileId(fileId)
                .recordCount(recordCount)
                .qualityStatus(qualityStatus)
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

    private OpenAiTrainingManagementDashboard.TrainingMetric metric(String key,
                                                                   String jobId,
                                                                   Integer step,
                                                                   Double trainLoss,
                                                                   Double validLoss,
                                                                   Double validTokenAccuracy,
                                                                   Integer elapsedSeconds) {
        return OpenAiTrainingManagementDashboard.TrainingMetric.builder()
                .key(key)
                .jobId(jobId)
                .step(step)
                .trainLoss(trainLoss)
                .validLoss(validLoss)
                .validTokenAccuracy(validTokenAccuracy)
                .elapsedSeconds(elapsedSeconds)
                .build();
    }

    private OpenAiTrainingManagementDashboard.ModelCheckpoint checkpoint(String key,
                                                                        String checkpointId,
                                                                        String providerCheckpointId,
                                                                        String jobId,
                                                                        Integer step,
                                                                        Double validLoss,
                                                                        Double validTokenAccuracy,
                                                                        String notes) {
        return OpenAiTrainingManagementDashboard.ModelCheckpoint.builder()
                .key(key)
                .checkpointId(checkpointId)
                .providerCheckpointId(providerCheckpointId)
                .jobId(jobId)
                .step(step)
                .validLoss(validLoss)
                .validTokenAccuracy(validTokenAccuracy)
                .notes(notes)
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

    private OpenAiTrainingManagementDashboard.EvalFailureCase failureCase(String key,
                                                                         String evalRunId,
                                                                         String category,
                                                                         String prompt,
                                                                         String expected,
                                                                         String observed,
                                                                         String nextAction) {
        return OpenAiTrainingManagementDashboard.EvalFailureCase.builder()
                .key(key)
                .evalRunId(evalRunId)
                .category(category)
                .prompt(prompt)
                .expected(expected)
                .observed(observed)
                .nextAction(nextAction)
                .build();
    }

    private OpenAiTrainingManagementDashboard.CostItem cost(String key,
                                                           String scope,
                                                           String model,
                                                           Integer inputTokens,
                                                           Integer outputTokens,
                                                           Double estimatedUsd,
                                                           String note) {
        return OpenAiTrainingManagementDashboard.CostItem.builder()
                .key(key)
                .scope(scope)
                .model(model)
                .inputTokens(inputTokens)
                .outputTokens(outputTokens)
                .estimatedUsd(estimatedUsd)
                .note(note)
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

    private OpenAiTrainingManagementDashboard.ReadinessCheck readiness(String key, String label, String status, String detail) {
        return OpenAiTrainingManagementDashboard.ReadinessCheck.builder()
                .key(key)
                .label(label)
                .status(status)
                .detail(detail)
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
