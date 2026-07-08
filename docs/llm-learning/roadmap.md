# 大语言模型开发学习路线

目标：从零理解一个小语言模型如何训练，再逐步进入开源模型微调、RAG、Agent 和部署。

## 阶段 1：工程基础

- Python：文件读取、数据结构、函数、类、类型标注、命令行参数。
- Linux：目录、环境变量、进程、日志、虚拟环境。
- Git：分支、提交、回滚、冲突处理。
- API：HTTP、JSON、FastAPI 或 Spring Boot。
- Docker：镜像、容器、端口、挂载、环境变量。

完成标准：能独立写一个 API 服务，并把模型推理包装成接口。

## 阶段 2：深度学习基础

- 张量、矩阵乘法、广播。
- loss、梯度、反向传播。
- optimizer、learning rate、batch size。
- train/eval 模式、checkpoint。
- GPU/显存、混合精度。

完成标准：能用 PyTorch 写一个训练循环，保存和加载模型。

## 阶段 3：从零实现 mini GPT

当前仓库练习目录：`playground/mini-gpt`。

学习顺序：

1. 字符级 tokenizer：把文本变成 token id。
2. batch 构造：输入 `x` 和目标 `y` 错位一位。
3. embedding：token embedding + position embedding。
4. causal self-attention：只能看当前位置之前的 token。
5. transformer block：attention + MLP + residual + layer norm。
6. 训练：cross entropy loss + AdamW。
7. 生成：temperature、top-k。

完成标准：能用自己的中文文本训练一个小模型，并让它续写。

已完成工具：`playground/mini-gpt` 支持 tiny/small/medium 训练预设、独立 run 保存、loss/验证集/生成样例记录、实验模板、实验对比、复盘问题、复盘笔记、实验报告复制、高级训练参数、tensor shape 速查、代码定位、checkpoint 生成试验台，以及可选择历史实验的 Web 观察台。`/ai/minigpt` 页面会按 Tokenizer、Batch、Causal Attention、Loss、Generate、Review 给出学习阶段清单。

## 阶段 4：开源模型开发者

- Hugging Face Transformers。
- LoRA / QLoRA 微调。
- RAG：切分、向量化、检索、重排、引用。
- Agent：工具调用、计划、记忆、任务状态。
- 部署：Ollama、vLLM、TGI。
- 评测：命中率、幻觉率、延迟、成本。

完成标准：能把一个开源模型接入业务数据，做成稳定的产品功能。

## 第一周任务

- 跑通 `playground/mini-gpt/mini_gpt.py`。
- 读懂每个模块的数据形状。
- 对照 `/ai/minigpt` 的 Tensor Shapes，确认 `x/y`、embedding、attention scores、logits 和 loss 的维度。
- 对照 `/ai/minigpt` 的代码定位，把 Tokenizer、Batch、Attention、Block、Train、Generate 映射到 `mini_gpt.py` 的类和函数。
- 替换 `data/sample.txt` 为自己的文本。
- 从 `/ai/minigpt` 的 Tiny 基线、低学习率、长上下文、Small 对照模板中选择一个启动实验。
- 训练 200 到 1000 step，观察 loss 下降和生成文本变化。
- 写一份复盘：模型为什么会胡说，数据量和上下文长度如何影响结果。
- 按 `/ai/minigpt` 的复盘问题检查 loss gap、验证集、生成样例和下一步实验变量。
- 在 `/ai/minigpt` 里保存每次实验的假设、观察、结论和下一步，并至少对比 2 个不同学习率、block size 或模型尺寸的实验。
- 用同一个 checkpoint 对比 2 组 `temperature/top-k` 生成结果，记录输出稳定性和重复程度。
- 点击 `复制报告` 把当前实验配置、loss、笔记和生成样例整理成 Markdown 复盘。
