"""A tiny character-level GPT for learning.

This file is intentionally small and explicit. It is not optimized for large
training runs; it is a readable path from text to generation.
"""

from __future__ import annotations

import argparse
import csv
import json
import time
from dataclasses import asdict, dataclass
from pathlib import Path

import torch
from torch import nn
import torch.nn.functional as F


@dataclass
class ModelConfig:
    block_size: int = 64
    n_embd: int = 128
    n_head: int = 4
    n_layer: int = 4
    dropout: float = 0.1
    vocab_size: int = 0


class CharTokenizer:
    def __init__(self, text: str) -> None:
        chars = sorted(set(text))
        self.stoi = {ch: index for index, ch in enumerate(chars)}
        self.itos = {index: ch for ch, index in self.stoi.items()}

    @property
    def vocab_size(self) -> int:
        return len(self.stoi)

    def encode(self, text: str) -> list[int]:
        return [self.stoi[ch] for ch in text if ch in self.stoi]

    def decode(self, ids: list[int]) -> str:
        return "".join(self.itos[index] for index in ids)

    def to_dict(self) -> dict[str, dict[str, int] | dict[str, str]]:
        return {
            "stoi": self.stoi,
            "itos": {str(key): value for key, value in self.itos.items()},
        }

    @classmethod
    def from_dict(cls, payload: dict[str, dict[str, int] | dict[str, str]]) -> "CharTokenizer":
        tokenizer = cls("")
        tokenizer.stoi = {str(key): int(value) for key, value in payload["stoi"].items()}
        tokenizer.itos = {int(key): str(value) for key, value in payload["itos"].items()}
        return tokenizer


class CausalSelfAttention(nn.Module):
    def __init__(self, config: ModelConfig) -> None:
        super().__init__()
        if config.n_embd % config.n_head != 0:
            raise ValueError("n_embd must be divisible by n_head")
        self.n_head = config.n_head
        self.head_dim = config.n_embd // config.n_head
        self.qkv = nn.Linear(config.n_embd, 3 * config.n_embd)
        self.proj = nn.Linear(config.n_embd, config.n_embd)
        self.dropout = nn.Dropout(config.dropout)
        mask = torch.tril(torch.ones(config.block_size, config.block_size))
        self.register_buffer("mask", mask.view(1, 1, config.block_size, config.block_size))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        batch, time, channels = x.shape
        qkv = self.qkv(x)
        query, key, value = qkv.split(channels, dim=2)
        query = query.view(batch, time, self.n_head, self.head_dim).transpose(1, 2)
        key = key.view(batch, time, self.n_head, self.head_dim).transpose(1, 2)
        value = value.view(batch, time, self.n_head, self.head_dim).transpose(1, 2)

        attention = (query @ key.transpose(-2, -1)) * (self.head_dim ** -0.5)
        attention = attention.masked_fill(self.mask[:, :, :time, :time] == 0, float("-inf"))
        attention = F.softmax(attention, dim=-1)
        attention = self.dropout(attention)
        output = attention @ value
        output = output.transpose(1, 2).contiguous().view(batch, time, channels)
        return self.proj(output)


class TransformerBlock(nn.Module):
    def __init__(self, config: ModelConfig) -> None:
        super().__init__()
        self.ln1 = nn.LayerNorm(config.n_embd)
        self.attn = CausalSelfAttention(config)
        self.ln2 = nn.LayerNorm(config.n_embd)
        self.mlp = nn.Sequential(
            nn.Linear(config.n_embd, 4 * config.n_embd),
            nn.GELU(),
            nn.Linear(4 * config.n_embd, config.n_embd),
            nn.Dropout(config.dropout),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = x + self.attn(self.ln1(x))
        x = x + self.mlp(self.ln2(x))
        return x


class MiniGPT(nn.Module):
    def __init__(self, config: ModelConfig) -> None:
        super().__init__()
        self.config = config
        self.token_embedding = nn.Embedding(config.vocab_size, config.n_embd)
        self.position_embedding = nn.Embedding(config.block_size, config.n_embd)
        self.blocks = nn.Sequential(*[TransformerBlock(config) for _ in range(config.n_layer)])
        self.ln = nn.LayerNorm(config.n_embd)
        self.head = nn.Linear(config.n_embd, config.vocab_size)

    def forward(self, idx: torch.Tensor, targets: torch.Tensor | None = None) -> tuple[torch.Tensor, torch.Tensor | None]:
        batch, time = idx.shape
        if time > self.config.block_size:
            raise ValueError("sequence is longer than block_size")
        positions = torch.arange(time, device=idx.device)
        x = self.token_embedding(idx) + self.position_embedding(positions)
        x = self.blocks(x)
        x = self.ln(x)
        logits = self.head(x)
        loss = None
        if targets is not None:
            loss = F.cross_entropy(logits.view(batch * time, -1), targets.view(batch * time))
        return logits, loss

    @torch.no_grad()
    def generate(self, idx: torch.Tensor, max_new_tokens: int, temperature: float = 1.0, top_k: int | None = None) -> torch.Tensor:
        for _ in range(max_new_tokens):
            context = idx[:, -self.config.block_size :]
            logits, _ = self(context)
            logits = logits[:, -1, :] / max(temperature, 1e-6)
            if top_k:
                values, _ = torch.topk(logits, min(top_k, logits.size(-1)))
                logits[logits < values[:, [-1]]] = -float("inf")
            probs = F.softmax(logits, dim=-1)
            next_id = torch.multinomial(probs, num_samples=1)
            idx = torch.cat([idx, next_id], dim=1)
        return idx


def select_device() -> torch.device:
    if torch.cuda.is_available():
        return torch.device("cuda")
    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


def load_text(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    if len(text) < 10:
        raise ValueError("training text is too short")
    return text


def get_batch(data: torch.Tensor, block_size: int, batch_size: int, device: torch.device) -> tuple[torch.Tensor, torch.Tensor]:
    max_start = len(data) - block_size - 1
    if max_start <= 0:
        raise ValueError("data is too short for the configured block_size")
    starts = torch.randint(max_start, (batch_size,))
    x = torch.stack([data[start : start + block_size] for start in starts])
    y = torch.stack([data[start + 1 : start + block_size + 1] for start in starts])
    return x.to(device), y.to(device)


@torch.no_grad()
def estimate_loss(model: MiniGPT, data: torch.Tensor, block_size: int, batch_size: int, device: torch.device) -> float:
    model.eval()
    losses = []
    for _ in range(20):
        x, y = get_batch(data, block_size, batch_size, device)
        _, loss = model(x, y)
        losses.append(float(loss.item()))
    model.train()
    return sum(losses) / len(losses)


@torch.no_grad()
def sample_text(
    model: MiniGPT,
    tokenizer: CharTokenizer,
    prompt: str,
    device: torch.device,
    max_new_tokens: int,
    temperature: float,
    top_k: int,
) -> str:
    model.eval()
    prompt_ids = tokenizer.encode(prompt)
    if not prompt_ids:
        prompt_ids = [0]
    idx = torch.tensor([prompt_ids], dtype=torch.long, device=device)
    output = model.generate(idx, max_new_tokens=max_new_tokens, temperature=temperature, top_k=top_k)
    model.train()
    return tokenizer.decode(output[0].tolist())


def train(args: argparse.Namespace) -> None:
    started_at = time.strftime("%Y-%m-%d %H:%M:%S")
    text = load_text(Path(args.data))
    tokenizer = CharTokenizer(text)
    config = ModelConfig(
        block_size=args.block_size,
        n_embd=args.n_embd,
        n_head=args.n_head,
        n_layer=args.n_layer,
        dropout=args.dropout,
        vocab_size=tokenizer.vocab_size,
    )
    device = select_device()
    encoded = torch.tensor(tokenizer.encode(text), dtype=torch.long)
    model = MiniGPT(config).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.learning_rate)
    runs_dir = Path(args.runs_dir)
    runs_dir.mkdir(parents=True, exist_ok=True)
    log_path = runs_dir / args.log_file
    latest_path = runs_dir / "latest.json"

    fieldnames = ["step", "train_loss", "eval_loss", "elapsed_seconds", "sample"]
    with log_path.open("w", encoding="utf-8", newline="") as log_file:
        writer = csv.DictWriter(log_file, fieldnames=fieldnames)
        writer.writeheader()

        train_started = time.time()
        for step in range(1, args.max_steps + 1):
            x, y = get_batch(encoded, config.block_size, args.batch_size, device)
            _, loss = model(x, y)
            optimizer.zero_grad(set_to_none=True)
            loss.backward()
            optimizer.step()

            if step == 1 or step % args.log_every == 0 or step == args.max_steps:
                eval_loss = estimate_loss(model, encoded, config.block_size, args.batch_size, device)
                elapsed_seconds = round(time.time() - train_started, 2)
                sample = sample_text(
                    model,
                    tokenizer,
                    args.sample_prompt,
                    device,
                    args.sample_tokens,
                    args.temperature,
                    args.top_k,
                )
                writer.writerow({
                    "step": step,
                    "train_loss": round(float(loss.item()), 6),
                    "eval_loss": round(eval_loss, 6),
                    "elapsed_seconds": elapsed_seconds,
                    "sample": json.dumps(sample, ensure_ascii=False),
                })
                log_file.flush()
                print(f"step={step} train_loss={loss.item():.4f} eval_loss={eval_loss:.4f}")

    checkpoint_dir = Path(args.out_dir)
    checkpoint_dir.mkdir(parents=True, exist_ok=True)
    checkpoint_path = checkpoint_dir / "mini_gpt.pt"
    torch.save(
        {
            "model": model.state_dict(),
            "config": asdict(config),
            "tokenizer": tokenizer.to_dict(),
        },
        checkpoint_path,
    )
    (checkpoint_dir / "config.json").write_text(json.dumps(asdict(config), ensure_ascii=False, indent=2), encoding="utf-8")
    latest_path.write_text(json.dumps({
        "started_at": started_at,
        "finished_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "data": args.data,
        "checkpoint": str(checkpoint_path),
        "log_file": str(log_path),
        "device": str(device),
        "max_steps": args.max_steps,
        "batch_size": args.batch_size,
        "learning_rate": args.learning_rate,
        "sample_prompt": args.sample_prompt,
        "sample_tokens": args.sample_tokens,
        "config": asdict(config),
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"saved checkpoint to {checkpoint_path}")
    print(f"saved training log to {log_path}")


def generate(args: argparse.Namespace) -> None:
    device = select_device()
    payload = torch.load(args.checkpoint, map_location=device)
    config = ModelConfig(**payload["config"])
    tokenizer = CharTokenizer.from_dict(payload["tokenizer"])
    model = MiniGPT(config).to(device)
    model.load_state_dict(payload["model"])
    model.eval()
    prompt_ids = tokenizer.encode(args.prompt)
    if not prompt_ids:
        prompt_ids = [0]
    idx = torch.tensor([prompt_ids], dtype=torch.long, device=device)
    output = model.generate(idx, max_new_tokens=args.max_new_tokens, temperature=args.temperature, top_k=args.top_k)
    print(tokenizer.decode(output[0].tolist()))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Train or sample a tiny character-level GPT.")
    parser.add_argument("--mode", choices=["train", "generate"], required=True)
    parser.add_argument("--data", default="data/sample.txt")
    parser.add_argument("--checkpoint", default="checkpoints/mini_gpt.pt")
    parser.add_argument("--out-dir", default="checkpoints")
    parser.add_argument("--prompt", default="语言模型")
    parser.add_argument("--max-new-tokens", type=int, default=120)
    parser.add_argument("--max-steps", type=int, default=300)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--block-size", type=int, default=64)
    parser.add_argument("--n-embd", type=int, default=128)
    parser.add_argument("--n-head", type=int, default=4)
    parser.add_argument("--n-layer", type=int, default=4)
    parser.add_argument("--dropout", type=float, default=0.1)
    parser.add_argument("--learning-rate", type=float, default=3e-4)
    parser.add_argument("--temperature", type=float, default=0.9)
    parser.add_argument("--top-k", type=int, default=20)
    parser.add_argument("--log-every", type=int, default=50)
    parser.add_argument("--runs-dir", default="runs")
    parser.add_argument("--log-file", default="train_log.csv")
    parser.add_argument("--sample-prompt", default="语言模型")
    parser.add_argument("--sample-tokens", type=int, default=80)
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    if args.mode == "train":
        train(args)
    else:
        generate(args)


if __name__ == "__main__":
    main()
