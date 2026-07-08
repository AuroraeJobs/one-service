# OpenAI 模型训练管理学习笔记

目标：理解 OpenAI 平台上开发者可以管理的“模型训练”部分，并把它映射到 `one-service` 后续可实现的学习功能。

## 管理边界

OpenAI 基础模型的预训练、对齐训练、安全评估、模型发布和退役由 OpenAI 内部管理。开发者侧主要管理的是模型优化工作流：

- 评测：用固定数据集比较 base model、prompt、fine-tuned model 和 checkpoint。
- 数据集：准备 supervised fine-tuning 或 preference 数据。
- 训练任务：创建、查询、取消 fine-tuning job。
- checkpoint：查看训练过程中的中间模型与指标。
- 模型版本：使用 fine-tuned model id，并决定哪些业务场景绑定到哪个版本。
- 上线记录：记录模型、prompt、eval、成本和回滚方案。

## 生命周期

1. 建立 baseline eval：先测基础模型，确认问题是 prompt、数据、工具还是模型行为。
2. 准备训练数据：收集输入和理想输出，保留来源、场景、质量标注和审核状态。
3. 上传 dataset file：文件进入平台后得到 file id，供训练任务引用。
4. 创建 training job：指定 base model、training file、validation file 和超参数。
5. 监控 job 状态：记录 queued、running、succeeded、failed、cancelled 等状态和错误。
6. 读取 metrics 和 checkpoint：关注 train loss、valid loss、accuracy、step 和 token 使用量。
7. 运行 eval 对比：用同一套任务比较 base、prompt-only、fine-tuned、checkpoint。
8. 绑定模型版本：只有 eval 达标后才绑定到业务能力或灰度环境。
9. 复盘与回滚：记录这次训练解决了什么、没解决什么、下一轮数据怎么补。

## one-service 数据实体建议

### `llm_training_dataset`

- `datasetId`：内部数据集 id。
- `name`：数据集名称。
- `purpose`：`fine_tune`、`eval`、`preference`。
- `source`：人工整理、业务日志、标注平台或导入文件。
- `fileId`：OpenAI file id。
- `recordCount`：样本数。
- `qualityStatus`：`draft`、`reviewed`、`approved`、`rejected`。
- `createdAt`、`updatedAt`。

### `llm_training_job`

- `jobId`：内部任务 id。
- `providerJobId`：OpenAI fine-tuning job id。
- `baseModel`：基础模型。
- `trainingFileId`：训练文件。
- `validationFileId`：验证文件。
- `status`：`validating_files`、`queued`、`running`、`succeeded`、`failed`、`cancelled`。
- `fineTunedModel`：完成后的模型 id。
- `startedAt`、`finishedAt`。
- `errorMessage`。

### `llm_training_metric`

- `jobId`：训练任务 id。
- `step`：训练步数。
- `trainLoss`。
- `validLoss`。
- `validTokenAccuracy`。
- `elapsedSeconds`。
- `createdAt`。

### `llm_model_checkpoint`

- `checkpointId`：内部 checkpoint id。
- `providerCheckpointId`：OpenAI checkpoint id 或模型名。
- `jobId`：所属训练任务。
- `step`。
- `metrics`：该 checkpoint 的评测指标快照。
- `notes`：人工观察。

### `llm_eval_run`

- `evalRunId`。
- `modelId`：base、fine-tuned 或 checkpoint model。
- `evalSetId`。
- `score`。
- `passRate`。
- `failureCases`：失败样例摘要。
- `createdAt`。

### `llm_model_deployment`

- `deploymentId`。
- `featureKey`：业务能力，例如 `wechat-draft`、`minigpt-review`。
- `modelId`：当前绑定模型。
- `promptVersion`。
- `evalRunId`：上线依据。
- `rolloutStatus`：`draft`、`canary`、`active`、`rolled_back`。
- `rollbackModelId`。

## 页面功能建议

- 数据集列表：展示样本数、用途、审核状态和 OpenAI file id。
- 训练任务列表：展示 job 状态、base model、fine-tuned model、耗时和错误。
- 训练详情：展示 loss 曲线、checkpoint、事件日志和参数。
- Eval 对比：同一 eval set 下比较 base、checkpoint、fine-tuned model。
- 版本绑定：把通过评测的模型绑定到某个业务功能。
- 复盘报告：输出数据集、任务、指标、eval、上线决策和下一步。

## 和 MiniGPT 的关系

MiniGPT 是本地可解释训练台，适合学习训练细节。OpenAI fine-tuning 是托管训练台，适合学习工程化管理。

| MiniGPT | OpenAI 管理对象 |
| --- | --- |
| run | fine-tuning job |
| data/sample.txt | training file |
| logs | training metrics / events |
| checkpoint | checkpoint model |
| 生成试验台 | model eval sample |
| 实验对比 | eval comparison |
| 复盘笔记 | training review |
| 复制报告 | training report |

当前进展：`/ai/training` 已经提供只读“OpenAI 训练管理”学习页，并通过 one-service 的 `/ai/training/dashboard` API 获取生命周期、管理对象、数据集资产、训练任务、训练指标快照、Checkpoint 资产、Eval 决策、Eval 失败案例、成本与 Token 快照、训练审计事件、模型部署绑定、上线门禁检查和下一步实现数据。

下一步可以把 `/ai/training/dashboard` 的固定学习蓝图替换为 Mongo 持久化数据，再逐步接入 OpenAI 文件、fine-tuning job、checkpoint、eval API 和发布门禁规则。
