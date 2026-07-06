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
python mini_gpt.py --mode generate --checkpoint checkpoints/mini_gpt.pt --prompt "模型"
```

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
