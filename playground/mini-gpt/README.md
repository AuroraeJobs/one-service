# Mini GPT From Scratch

这是一个学习用的字符级 mini GPT。它的目的不是训练强模型，而是帮助你理解大语言模型的最小闭环：

文本 -> token -> batch -> Transformer -> loss -> 反向传播 -> 生成。

## 环境

建议使用 Python 3.10 到 3.12 的虚拟环境安装 PyTorch。当前机器如果没有 PyTorch，先看代码也没问题。

```bash
cd playground/mini-gpt
pyenv local 3.12.8
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

如果你已经装过 NumPy 2.x，PyTorch 2.2.x 可能会报 `modules must be compiled with NumPy 2.0`。直接降级即可：

```bash
pip install --force-reinstall "numpy<2"
```

## 训练

```bash
python mini_gpt.py --mode train --data data/sample.txt --max-steps 300
```

也可以用训练预设快速做对比实验：

```bash
python mini_gpt.py --mode train --preset tiny --run-name tiny-baseline
python mini_gpt.py --mode train --preset small --run-name small-baseline
python mini_gpt.py --mode train --preset medium --run-name medium-baseline
```

预设会设置 `block_size`、`batch_size`、层数和 embedding 维度；命令行里显式传入的参数仍会覆盖预设，例如：

```bash
python mini_gpt.py --mode train --preset tiny --run-name tiny-smoke --max-steps 10
```

训练会生成：

```text
runs/<run-name>/checkpoints/mini_gpt.pt
runs/<run-name>/train_log.csv
runs/<run-name>/latest.json
runs/index.json
runs/latest.json
```

训练脚本也会默认把实验状态同步到 one-service 使用的 Mongo：

```text
mini_gpt_runs
mini_gpt_training_logs
```

默认连接 `mongodb://localhost:27017/test`，与 `one-starter` 的本地配置一致。可以通过参数或环境变量切换：

```bash
python mini_gpt.py --mode train --preset tiny --run-name tiny-mongo \
  --mongo-uri mongodb://localhost:27017 \
  --mongo-db test
```

如果只想保留本地 `runs/` 文件，不写 Mongo：

```bash
python mini_gpt.py --mode train --preset tiny --run-name tiny-local --no-mongo
```

## 在 one-web 中训练

one-service 提供了 MiniGPT 训练 API，one-web 的 `/ai/minigpt` 页面可以直接启动训练并持续刷新状态。后端会调用：

```text
playground/mini-gpt/.venv/bin/python mini_gpt.py --mode train ...
```

如果 Spring Boot 不是从仓库根目录启动，可以通过环境变量指定 playground 目录：

```bash
MINI_GPT_PLAYGROUND_DIR=/Users/aurorae/Program/Hello/one-service/playground/mini-gpt
```

页面里的 `语料与 Tokenizer` 面板会读取当前语料，展示字符数、行数、词表大小、字符到 token id 的映射，以及采样提示的 encode/decode 结果。这个面板对应代码里的 `CharTokenizer`，可以用来理解文本进入模型前发生了什么。

页面里的 `训练过程解释` 面板会把采样提示拆成 `x -> y` 的 next-token 训练对，展示 causal mask，并把当前 run 的配置串成模型数据流。它分别对应代码里的 `get_batch`、`CausalSelfAttention` 和 `MiniGPT`。

训练完成后，`生成试验台` 会使用当前实验保存的 checkpoint 调用 `mini_gpt.py --mode generate`，可以直接调整 prompt、生成长度、temperature 和 top-k，观察采样策略如何改变输出。

### 正式彩票语料与可复现参数

Iteration 47 的正式彩票训练使用同一版本目录里的训练、验证和 manifest 文件。页面会提交这些路径及服务端重新校验过的 hash；直接运行脚本时也可以显式传入相同证据：

```bash
python mini_gpt.py --mode train \
  --data data/lottery-corpora/strategy/<version>/train.txt \
  --eval-data data/lottery-corpora/strategy/<version>/validation.txt \
  --manifest-data data/lottery-corpora/strategy/<version>/manifest.json \
  --corpus-version <version> \
  --train-sha256 <sha256> \
  --validation-sha256 <sha256> \
  --required-block-size 155 \
  --block-size 160 \
  --seed 42 \
  --run-name strategy-47b
```

脚本在这种模式下不会再把 `train.txt` 的尾部按字符切成验证集。完整训练文件用于更新模型，显式 `validation.txt` 用于周期 `eval_loss` 和最终验证。验证文件过短或含有训练字符词表之外的字符会直接失败。

`required-block-size` 表示最长完整样本行加换行 token 的长度；续训时实际生效值来自 checkpoint 的 `config.block_size`。固定 `seed`、语料 hash、checkpoint hash 和模型配置可以复现采样过程，但不构成提高未来中奖概率的证据。

## Web 观察台

训练后启动本地静态服务：

```bash
python -m http.server 8000
```

然后打开：

```text
http://localhost:8000/web/
```

页面会自动读取 `runs/index.json`，可以在右上角选择历史训练实验，展示对应配置、loss 曲线、生成样例和日志表。如果浏览器没有自动读取，点击页面右上角的 `选择 CSV`，手动选择某个 `runs/<run-name>/train_log.csv`。

默认会把语料最后 10% 留作验证集：

```bash
python mini_gpt.py --mode train --data data/sample.txt --val-ratio 0.1
```

Web 页里的 `泛化差距 = eval_loss - train_loss`。如果训练 loss 下降但泛化差距持续变大，说明模型可能在记忆训练文本，而不是学到稳定规律。样本太短时会自动回退为同源评估，`validation_enabled` 会显示为 `false`。

训练日志还会保存每次 log 时的生成样例。可以通过参数调整采样：

```bash
python mini_gpt.py --mode train \
  --data data/sample.txt \
  --max-steps 300 \
  --sample-prompt "语言模型" \
  --sample-tokens 80
```

## 生成

```bash
python mini_gpt.py --mode generate --checkpoint checkpoints/mini_gpt.pt --prompt "模型" --seed 42
```

生成结果 JSON 会记录实际模型配置、seed 和采样参数。one-service 还会把每条结果及 corpus/run/checkpoint provenance 持久化，并由批量生成接口统一计算可解析率、原始合法率、修复结果、修复后合法率和候选池多样性。

## 你应该重点看懂什么

- `CharTokenizer`：为什么文本可以变成数字。
- `get_batch`：为什么输入和目标要错开一位。
- `CausalSelfAttention`：为什么生成模型不能偷看未来。
- `MiniGPT`：token embedding、position embedding 和 transformer block 如何组合。
- `generate`：为什么模型每次只预测下一个 token。

## 下一步练习

1. 把 `data/sample.txt` 换成你自己的中文文本。
2. 调整 `--block-size`，观察上下文长度影响。
3. 调整 `--n-layer` 和 `--n-embd`，观察模型容量影响。
4. 加入 top-p 采样。
5. 把训练日志保存成 CSV，再画 loss 曲线。
