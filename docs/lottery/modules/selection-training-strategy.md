# 双色球选号策略与模型训练方向

Last updated: 2026-07-11

## 目标边界

本计划不把模型定位成“预测必中号码”的工具。双色球开奖接近随机抽样，历史记录可以帮助模型学习格式、分布、约束和回测方法，但不能可靠训练出稳定命中一等奖、二等奖或三等奖的模型。

后续训练目标应定义为：

- 生成合规号码：6 个红球、1 个蓝球，红球不重复且在 01-33 范围内，蓝球在 01-16 范围内。
- 生成结构合理的候选组合：和值、奇偶、大小、区间、跨度、连号数量不过度极端。
- 生成可解释策略：每组号码要能说明来自哪类规则、历史窗口或模型判断。
- 做可复盘回测：所有策略必须和随机基线对比，记录命中分布、成本、奖级、ROI 和过拟合风险。
- 服务二三等奖研究：重点观察红球命中数、蓝球命中率、候选池覆盖率，而不是宣称能稳定中奖。

一句话：训练模型不是为了“看穿随机数”，而是为了学习序列建模、策略生成、约束采样、回测评估和过拟合识别。

## 语料设计

基础语料来自历史双色球开奖记录，可以按多种格式组织。

### 原始开奖格式

```text
2026001: 03 08 12 19 25 31 + 06
2026002: 01 11 14 18 27 33 + 12
2026003: 05 09 16 20 22 30 + 03
```

适合学习：

- 期号结构。
- 红球与蓝球分隔。
- 红球升序。
- 开奖记录的固定文本格式。

### 结构特征格式

```text
issue=2026001 red=03,08,12,19,25,31 blue=06 sum=98 odd=4 even=2 span=28 zone=2,2,2
```

适合学习：

- 和值。
- 奇偶比。
- 大小比。
- 区间分布。
- 跨度。
- 连号。

### 策略样本格式

```text
target=next strategy=zone-balance red=01,02,12,13,23,24 blue=01 reason=sum_low;odd_even_3_3;big_small_2_4;zone_2_2_2;span_mid source_issue=2026001
```

适合学习：

- 生成候选号码。
- 解释选号理由。
- 把规则、号码和复盘连接起来。

Iteration 47A 将 `strategy` 固定为第三种正式导出格式。每一行必须是完整样本，至少包含：

```text
target=next strategy=<template> red=<six-normalized-reds> blue=<normalized-blue> reason=<documented-tags> source_issue=<issue>
```

约束：

- `target=next` 与训练/生成提示保持一致，`source_issue` 对应本行来源期号；同一期的字段不得跨训练集与验证集。
- `strategy` 和 `reason` 来自带版本号的确定性模板，不能根据验证窗口结果反向改写训练样本。
- 红球、蓝球和结构标签必须通过现有规范化/校验规则。
- 策略语料用于学习格式、约束和解释结构，不代表模板可以预测未来开奖结果。

## 训练/验证切分

Iteration 47 的正式研究基线固定使用完整样本行的时间切分。随机切分只能用于独立的格式学习探索，不能替代正式验证或回测证据。

### 时间切分

```text
按期号升序排列完整样本行
前 80% 期数训练
后 20% 期数验证
```

优点：更像真实未来预测，能检查策略是否只适合旧数据。

缺点：如果历史分布阶段性变化，验证结果可能波动较大。

正式切分规则：

- 切分单位是完整的开奖/特征/策略样本行，禁止按字符、token 或行内位置切分。
- `validationCount = max(1, ceil(totalCount * 0.20))`，其余较早样本进入训练集；少于 2 条有效记录时拒绝导出。
- 训练集最后一期必须早于验证集第一期，两个集合不得重叠。
- 相同规范化数据快照、格式、schema/template 版本和切分参数必须产生相同内容、边界与 SHA-256。
- 不允许因数据不足静默退化为随机切分。

### 随机切分

```text
随机 90% 样本训练
随机 10% 样本验证
```

优点：训练和验证分布更接近，适合学习格式和结构。

缺点：不能很好模拟“用过去预测未来”。

建议：随机切分只保留为不进入正式结论的格式学习实验；策略评估、候选生成门禁和回测一律引用上述时间切分语料与 manifest。

## Iteration 47A 语料版本与 Manifest 契约

每次正式导出在以下版本目录中保存不可混淆的一组产物：

```text
data/lottery-corpora/<format>/<corpusVersion>/all.txt
data/lottery-corpora/<format>/<corpusVersion>/train.txt
data/lottery-corpora/<format>/<corpusVersion>/validation.txt
data/lottery-corpora/<format>/<corpusVersion>/manifest.json
```

`manifest.json` 与导出 DTO 至少记录：

- `format`、`schemaVersion`、`templateVersion`、`corpusVersion`。
- `splitMode=TIME_ORDERED_80_20`、`validationRatio=0.20`、`sortOrder=issue:asc`。
- 总记录、训练记录、验证记录的数量及首末期号。
- 完整、训练、验证、manifest 的数据路径和绝对文件路径。
- 完整、训练、验证内容的 SHA-256。
- `generatedAt`，记录该版本产物首次成功创建的时间；重复导出同一版本时保持稳定，但不参与内容 hash。

兼容约定：

- 继续写入 `data/lottery-<format>.txt` 作为完整语料兼容文件。
- 现有 `dataPath`/`filePath` 保持指向该兼容完整文件，避免旧页面和调用方改变语义。
- `fullDataPath`/`fullFilePath` 指向版本目录的 `all.txt`；新客户端显式使用 `trainDataPath`、`validationDataPath` 和 `manifestDataPath`。
- MiniGPT 训练表单默认填入 `trainDataPath`，同时展示验证集范围、数量、hash 和 manifest，不能把未切分兼容文件误当正式训练输入。

## MiniGPT 参数解释

用双色球语料解释页面上的高级参数：

- `Batch Size`：每一步同时拿多少段开奖记录或策略样本训练。大一些更稳定，但更吃内存。
- `Learning Rate`：模型每次改错的幅度。太大容易学乱，太小训练很慢。
- `Block Size`：模型一次最多能看到多少个 token。必须至少能覆盖一条完整开奖记录，最好能覆盖多条连续记录或完整策略样本。
- `Embedding`：每个 token 的表示维度。越大越能表达“红球、蓝球、期号、分隔符、特征、策略”等差异，但模型更重。
- `Heads`：注意力头数量。可以理解为多个统计视角同时看数据，例如红球数量、蓝球位置、和值、区间分布、格式约束。
- `Layers`：Transformer 层数。浅层学习格式，深层可能学习更复杂的组合结构，但小数据上更容易过拟合。
- `Temperature`：生成候选号码时的随机程度。低温更保守，高温更发散。
- `Top-K`：每次生成下一个 token 时只从概率最高的 K 个候选里选，过滤明显离谱的 token。

## Iteration 47B 训练与生成证据

正式彩票语料不能只凭“训练成功”进入研究链。训练启动前必须验证当前模型真正生效的上下文长度能够容纳语料中的每一条完整结构化样本：

```text
requiredBlockSize = 最长非空样本行的 Unicode code point 数 + 行终止符 token
effectiveBlockSize = 续训 checkpoint 中的 block_size，否则为请求或 preset 的实际值
通过条件 = effectiveBlockSize >= requiredBlockSize
```

`recommendedBlockSize` 将 `requiredBlockSize` 向上对齐到 16 的倍数，便于页面快速采用，但硬门禁始终以原始 required 值为准。这个门禁证明完整行能够进入上下文，不代表随机窗口采样的每个 batch 都从行首开始。

正式时间切分语料还必须保持以下验证语义：

- `train.txt` 全部用于训练，不能再在脚本内部按字符切走尾部。
- `validation.txt` 直接作为训练日志与最终质量门禁的验证来源。
- 显式验证文件过短、包含训练 tokenizer 无法表示的字符或与 manifest/hash 不一致时立即失败，不能静默降级为同源验证。
- 续训时以 checkpoint 的实际模型配置为准；页面提交一个更大的 `blockSize` 不能掩盖旧 checkpoint 的短上下文。

每个正式 run 至少持久化 corpus format/version、schema/template version、manifest、train/validation SHA-256、run id、实际模型配置、seed、effective/required block size、validation source、checkpoint 及 checkpoint SHA-256。每条生成结果再复制这些训练证据，并记录 generation id、batch id、prompt、实际 temperature、top-k、seed、原始输出与解析/修复结果。

生成质量的统一分母是该批次实际完成的 `generatedCount`：

- `parseableRate = parseableCount / generatedCount`。
- `legalRate = legalCount / generatedCount`，只计算未经修复已经合法的输出。
- `postRepairLegalRate = postRepairLegalCount / generatedCount`，其中合法判定统一为 `valid || postRepairValid`。
- 修复必须保留稳定 issue code、动作和是否真正得到合法号码，不能仅凭修复数组长度推断成功。

批量生成采用显式 seed、策略标签、最大红球重叠和最小蓝球覆盖目标。候选选择只能报告实际达到的 overlap、blue coverage 与 strategy composition；当原始模型输出不足时应保留拒绝原因，不能伪造满足约束的候选。不同 seed 带来的是可复现采样差异，不是中奖概率提升证据。

## 选号策略方向

后续候选策略可以分为四类，每类都要能独立回测。

### 1. 合规约束策略

目标是保证生成结果合法：

- 红球 6 个。
- 红球范围 01-33。
- 红球不重复。
- 红球升序。
- 蓝球 1 个。
- 蓝球范围 01-16。

这是所有模型输出的最低门槛。

### 2. 结构分布策略

目标是避免极端组合：

- 和值控制在历史常见区间。
- 奇偶比例控制在 2:4、3:3、4:2 等常见区间。
- 大小比例避免 0:6 或 6:0 这类极端。
- 红球三区分布避免全集中在单一区间。
- 跨度避免过小或过大。
- 连号数量可控。

这类策略不保证中奖，但能生成更接近历史开奖结构的候选池。

### 3. 差异化候选池策略

目标是让多注号码之间不要太相似：

- 控制候选之间的红球重叠数量。
- 控制蓝球覆盖范围。
- 保持不同和值区间。
- 保持不同奇偶/大小组合。
- 避免一批候选全部来自同一规则。

如果目标是提高二三等奖研究价值，候选池覆盖比单注号码更重要。

### 4. 模型生成 + 规则修复策略

模型可以先生成粗候选，再由规则层修复：

```text
模型输出候选文本
-> 解析号码
-> 修复非法格式
-> 去重
-> 结构过滤
-> 候选池差异化
-> 回测评分
```

这样可以让模型负责“提出组合”，规则负责“保证可用”。

## 回测指标

所有策略必须和随机选号基线对比。建议记录：

- `redHitAvg`：平均红球命中数。
- `blueHitRate`：蓝球命中率。
- `thirdPrizeHits`：三等奖命中次数，规则为 5 红 + 蓝。
- `secondPrizeHits`：二等奖命中次数，规则为 6 红但蓝球未中。
- `prizeDistribution`：各奖级分布。
- `candidateCoverage`：候选池覆盖的红球、蓝球和结构范围。
- `costAmount`：投注成本。
- `prizeAmount`：奖金估算。
- `roi`：收益率。
- `randomBaselineDelta`：相对随机基线的差异。
- `overfitWarning`：训练窗口好、验证窗口差时必须标记。

回测结论必须写成“历史窗口表现”，不能写成“未来保证”。

## 训练阶段计划

### 阶段 1：格式学习

目标：让 MiniGPT 学会输出合法开奖记录格式。

训练语料：

```text
2026001: 03 08 12 19 25 31 + 06
```

完成标准：

- 生成结果能稳定出现 6 红 + 1 蓝结构。
- 红球/蓝球分隔符清晰。
- 非法字符明显减少。

### 阶段 2：结构特征学习

目标：让模型理解和值、奇偶、大小、跨度、区间等结构标签。

训练语料：

```text
issue=2026001 red=03,08,12,19,25,31 blue=06 sum=98 odd=4 even=2 span=28 zone=2,2,2
```

完成标准：

- 生成结果能带结构字段。
- 字段和号码之间基本一致。
- 可以用规则层校验字段正确率。

### 阶段 3：策略样本生成

目标：让模型按策略名称生成候选号码和理由。

采样提示示例：

```text
target=next strategy=balanced
```

期望输出：

```text
red=04,10,16,21,26,32 blue=09 reason=sum_mid;odd_even_3_3;zone_2_2_2
```

完成标准：

- 输出能被解析为候选号码。
- 理由能映射到已有结构规则。
- 候选通过合规约束。

### 阶段 4：候选池生成

目标：一次生成多组差异化候选。

完成标准：

- 每批候选不少于 5 组。
- 候选之间红球重叠受控。
- 蓝球覆盖多个号码。
- 候选通过预算和重复检查。

### 阶段 5：时间窗口回测

目标：用过去窗口生成候选，用后续开奖验证。

完成标准：

- 与纯随机候选对比。
- 输出红球命中分布、蓝球命中率、奖级分布和 ROI。
- 对训练窗口与验证窗口表现差异给出过拟合判断。

## 后续 one-service 落地方向

后续实现可以围绕这条链路推进：

```text
历史开奖 Mongo 数据
-> 训练语料导出
-> MiniGPT 训练 run
-> 候选号码生成
-> 合规修复与结构过滤
-> 候选池差异化
-> 保存为预测/票包草稿
-> 回测与开奖后复盘
```

当前已落地：

- `POST /ai/minigpt/corpus/lottery/export` 支持从 Mongo 开奖记录导出 `data/lottery-raw.txt` 和 `data/lottery-features.txt`。
- MiniGPT 页面训练控制区支持一键生成“开奖格式”和“结构特征”两类语料，并自动填入训练表单的语料路径。
- 导出后会刷新语料与 Tokenizer 洞察，便于先检查字符数、词表和编码样例，再启动训练。
- `POST /ai/minigpt/lottery-candidate/validate` 支持解析 MiniGPT 生成文本中的红蓝球，并检查数量、范围、重复、升序、和值、跨度和奇偶。
- MiniGPT 生成试验台会直接显示“双色球候选校验”，把模型生成文本分成“未解析、可修复、不合规、通过”几种状态。
- `POST /ai/minigpt/generate/compare` 支持同一 prompt 下批量对比不同 `temperature/top-k`，页面会并排显示生成文本和候选校验结果。
- MiniGPT 生成试验台可以把合规或可修复候选保存为现有彩票决策集草稿，后续可进入决策板、票包和回测链路。
- `POST /lottery/backtests/run` 支持 `decisionSetId`，可对 MiniGPT 候选池做最近窗口历史回测，并附带同窗口随机基线。
- MiniGPT 候选池回测完成后，页面可直接进入回测详情、研究对比，把 `backtest:<id>` 挂到策略笔记，并按策略名跳转导出回测证据。

建议新增或复用的能力：

- 语料导出：把历史开奖导出为格式学习、结构特征、策略样本三种文本。
- 策略模板：balanced、blue-focus、zone-balance、low-overlap 等。
- 模型候选解析器：把生成文本转成红球、蓝球、理由和置信标签。
- 合规修复器：修复重复、越界、数量不对、排序错误。
- 候选池评分：按结构合理性、差异化、预算和历史回测表现评分。
- 回测报告：和随机基线同窗口比较。
- 复盘记录：开奖后记录命中数、奖级、策略表现和下一轮调整。

## 风险和规则

- 不使用“必中”“稳定中奖”等表达。
- 不把训练 loss 下降等同于中奖概率提升。
- 不只看训练窗口表现，必须看验证窗口和随机基线。
- 不把历史噪声当成未来规律。
- 不把模型输出直接作为最终号码，必须经过规则校验和预算检查。

## 下一步

后续训练计划从这里拆：

1. 完成 Iteration 47A：strategy 语料、版本目录、manifest、完整行 80/20 时间切分和兼容路径。
2. 基于版本化训练集和验证集记录训练、checkpoint、prompt、采样、解析与修复 provenance。
3. 形成“模型生成 + 规则过滤 + 随机基线对比 + 研究笔记”的第一版闭环。
4. 将 MiniGPT 候选池回测报告继续纳入月度复盘。
