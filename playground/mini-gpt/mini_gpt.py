"""A tiny character-level GPT for learning.

This file is intentionally small and explicit. It is not optimized for large
training runs; it is a readable path from text to generation.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import time
from dataclasses import asdict, dataclass
from pathlib import Path

import torch
from torch import nn
import torch.nn.functional as F


TRAIN_DEFAULTS = {
    "max_steps": 300,
    "batch_size": 16,
    "block_size": 64,
    "n_embd": 128,
    "n_head": 4,
    "n_layer": 4,
    "dropout": 0.1,
    "learning_rate": 3e-4,
    "val_ratio": 0.1,
    "log_every": 50,
    "sample_tokens": 80,
}

PRESETS = {
    "custom": {},
    "tiny": {
        "max_steps": 120,
        "batch_size": 4,
        "block_size": 32,
        "n_embd": 32,
        "n_head": 4,
        "n_layer": 1,
        "log_every": 20,
    },
    "small": {
        "max_steps": 300,
        "batch_size": 8,
        "block_size": 48,
        "n_embd": 64,
        "n_head": 4,
        "n_layer": 2,
        "log_every": 50,
    },
    "medium": {
        "max_steps": 600,
        "batch_size": 12,
        "block_size": 64,
        "n_embd": 128,
        "n_head": 4,
        "n_layer": 4,
        "log_every": 60,
    },
}


class MongoRunSink:
    def __init__(self, args: argparse.Namespace, run_name: str) -> None:
        self.enabled = False
        self.run_name = run_name
        if args.no_mongo:
            return
        try:
            from pymongo import MongoClient, ReplaceOne
            from pymongo.errors import PyMongoError
        except ImportError:
            print("pymongo is not installed; skip Mongo sync")
            return

        self.ReplaceOne = ReplaceOne
        self.PyMongoError = PyMongoError
        try:
            self.client = MongoClient(args.mongo_uri, serverSelectionTimeoutMS=800)
            self.client.admin.command("ping")
            database = self.client[args.mongo_db]
            self.runs = database["mini_gpt_runs"]
            self.logs = database["mini_gpt_training_logs"]
            self.enabled = True
        except PyMongoError as error:
            print(f"Mongo sync unavailable: {error}")

    def upsert_run(self, metadata: dict[str, object], status: str) -> None:
        if not self.enabled:
            return
        now_ms = int(time.time() * 1000)
        document = {
            "runName": self.run_name,
            "preset": metadata.get("preset"),
            "status": status,
            "startedAt": metadata.get("started_at"),
            "finishedAt": metadata.get("finished_at"),
            "data": metadata.get("data"),
            "checkpoint": metadata.get("checkpoint"),
            "logFile": metadata.get("log_file"),
            "metadataFile": metadata.get("metadata_file"),
            "device": metadata.get("device"),
            "maxSteps": metadata.get("max_steps"),
            "batchSize": metadata.get("batch_size"),
            "learningRate": metadata.get("learning_rate"),
            "valRatio": metadata.get("val_ratio"),
            "validationEnabled": metadata.get("validation_enabled"),
            "trainTokens": metadata.get("train_tokens"),
            "evalTokens": metadata.get("eval_tokens"),
            "samplePrompt": metadata.get("sample_prompt"),
            "sampleTokens": metadata.get("sample_tokens"),
            "finalTrainLoss": metadata.get("final_train_loss"),
            "finalEvalLoss": metadata.get("final_eval_loss"),
            "lossGap": metadata.get("loss_gap"),
            "config": metadata.get("config") or {},
            "updatedAt": now_ms,
        }
        try:
            self.runs.update_one(
                {"runName": self.run_name},
                {"$set": document, "$setOnInsert": {"createdAt": now_ms}},
                upsert=True,
            )
        except self.PyMongoError as error:
            print(f"Mongo run sync failed: {error}")

    def upsert_log(self, row: dict[str, object]) -> None:
        if not self.enabled:
            return
        now_ms = int(time.time() * 1000)
        sample_value = row.get("sample") or ""
        if isinstance(sample_value, str):
            try:
                sample_value = json.loads(sample_value)
            except json.JSONDecodeError:
                pass
        document = {
            "runName": self.run_name,
            "step": int(row["step"]),
            "trainLoss": float(row["train_loss"]),
            "evalLoss": float(row["eval_loss"]),
            "elapsedSeconds": float(row["elapsed_seconds"]),
            "sample": sample_value,
            "updatedAt": now_ms,
        }
        try:
            self.logs.update_one(
                {"runName": self.run_name, "step": document["step"]},
                {"$set": document, "$setOnInsert": {"createdAt": now_ms}},
                upsert=True,
            )
        except self.PyMongoError as error:
            print(f"Mongo log sync failed: {error}")


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


def split_dataset(data: torch.Tensor, val_ratio: float, block_size: int) -> tuple[torch.Tensor, torch.Tensor, bool]:
    val_size = int(len(data) * val_ratio)
    min_eval_size = block_size + 2
    if val_size < min_eval_size or len(data) - val_size < min_eval_size:
        return data, data, False
    return data[:-val_size], data[-val_size:], True


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


def apply_training_defaults(args: argparse.Namespace) -> None:
    preset = PRESETS[args.preset]
    for key, default_value in TRAIN_DEFAULTS.items():
        value = getattr(args, key)
        if value is None:
            setattr(args, key, preset.get(key, default_value))


def safe_run_name(value: str) -> str:
    cleaned = "".join(ch if ch.isalnum() or ch in {"-", "_"} else "-" for ch in value.strip())
    return cleaned.strip("-_") or "run"


def append_run_index(runs_dir: Path, entry: dict[str, object]) -> None:
    index_path = runs_dir / "index.json"
    if index_path.exists():
        try:
            entries = json.loads(index_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            entries = []
    else:
        entries = []
    entries = [item for item in entries if item.get("run_name") != entry["run_name"]]
    entries.insert(0, entry)
    index_path.write_text(json.dumps(entries[:50], ensure_ascii=False, indent=2), encoding="utf-8")


def train(args: argparse.Namespace) -> None:
    apply_training_defaults(args)
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
    train_data, eval_data, validation_enabled = split_dataset(encoded, args.val_ratio, config.block_size)
    model = MiniGPT(config).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.learning_rate)
    runs_dir = Path(args.runs_dir)
    runs_dir.mkdir(parents=True, exist_ok=True)
    run_name = safe_run_name(args.run_name or f"{time.strftime('%Y%m%d-%H%M%S')}-{args.preset}")
    run_dir = runs_dir / run_name
    run_dir.mkdir(parents=True, exist_ok=True)
    checkpoint_dir = run_dir / "checkpoints"
    checkpoint_dir.mkdir(parents=True, exist_ok=True)
    log_path = run_dir / args.log_file
    latest_path = runs_dir / "latest.json"
    run_latest_path = run_dir / "latest.json"
    last_log_row = None
    mongo_sink = MongoRunSink(args, run_name)
    initial_metadata = {
        "run_name": run_name,
        "preset": args.preset,
        "started_at": started_at,
        "data": args.data,
        "log_file": str(log_path),
        "metadata_file": str(run_latest_path),
        "device": str(device),
        "max_steps": args.max_steps,
        "batch_size": args.batch_size,
        "learning_rate": args.learning_rate,
        "val_ratio": args.val_ratio,
        "validation_enabled": validation_enabled,
        "train_tokens": int(len(train_data)),
        "eval_tokens": int(len(eval_data)),
        "sample_prompt": args.sample_prompt,
        "sample_tokens": args.sample_tokens,
        "config": asdict(config),
    }
    mongo_sink.upsert_run(initial_metadata, "RUNNING")

    fieldnames = ["step", "train_loss", "eval_loss", "elapsed_seconds", "sample"]
    with log_path.open("w", encoding="utf-8", newline="") as log_file:
        writer = csv.DictWriter(log_file, fieldnames=fieldnames)
        writer.writeheader()

        train_started = time.time()
        for step in range(1, args.max_steps + 1):
            x, y = get_batch(train_data, config.block_size, args.batch_size, device)
            _, loss = model(x, y)
            optimizer.zero_grad(set_to_none=True)
            loss.backward()
            optimizer.step()

            if step == 1 or step % args.log_every == 0 or step == args.max_steps:
                eval_loss = estimate_loss(model, eval_data, config.block_size, args.batch_size, device)
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
                last_log_row = {
                    "step": step,
                    "train_loss": round(float(loss.item()), 6),
                    "eval_loss": round(eval_loss, 6),
                    "elapsed_seconds": elapsed_seconds,
                    "sample": json.dumps(sample, ensure_ascii=False),
                }
                writer.writerow(last_log_row)
                mongo_sink.upsert_log(last_log_row)
                log_file.flush()
                print(f"step={step} train_loss={loss.item():.4f} eval_loss={eval_loss:.4f}")

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
    final_train_loss = last_log_row["train_loss"] if last_log_row else None
    final_eval_loss = last_log_row["eval_loss"] if last_log_row else None
    loss_gap = None
    if final_train_loss is not None and final_eval_loss is not None:
        loss_gap = round(float(final_eval_loss) - float(final_train_loss), 6)
    metadata = {
        "run_name": run_name,
        "preset": args.preset,
        "started_at": started_at,
        "finished_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "data": args.data,
        "checkpoint": str(checkpoint_path),
        "log_file": str(log_path),
        "metadata_file": str(run_latest_path),
        "device": str(device),
        "max_steps": args.max_steps,
        "batch_size": args.batch_size,
        "learning_rate": args.learning_rate,
        "val_ratio": args.val_ratio,
        "validation_enabled": validation_enabled,
        "train_tokens": int(len(train_data)),
        "eval_tokens": int(len(eval_data)),
        "sample_prompt": args.sample_prompt,
        "sample_tokens": args.sample_tokens,
        "final_train_loss": final_train_loss,
        "final_eval_loss": final_eval_loss,
        "loss_gap": loss_gap,
        "config": asdict(config),
    }
    latest_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    run_latest_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    mongo_sink.upsert_run(metadata, "SUCCESS")
    append_run_index(runs_dir, {
        "run_name": run_name,
        "preset": args.preset,
        "finished_at": metadata["finished_at"],
        "log_file": metadata["log_file"],
        "metadata_file": metadata["metadata_file"],
        "checkpoint": metadata["checkpoint"],
        "final_train_loss": final_train_loss,
        "final_eval_loss": final_eval_loss,
        "loss_gap": loss_gap,
        "max_steps": args.max_steps,
        "n_layer": config.n_layer,
        "n_embd": config.n_embd,
        "block_size": config.block_size,
    })
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
    parser.add_argument("--preset", choices=sorted(PRESETS), default="custom")
    parser.add_argument("--run-name")
    parser.add_argument("--max-steps", type=int)
    parser.add_argument("--batch-size", type=int)
    parser.add_argument("--block-size", type=int)
    parser.add_argument("--n-embd", type=int)
    parser.add_argument("--n-head", type=int)
    parser.add_argument("--n-layer", type=int)
    parser.add_argument("--dropout", type=float)
    parser.add_argument("--learning-rate", type=float)
    parser.add_argument("--val-ratio", type=float)
    parser.add_argument("--temperature", type=float, default=0.9)
    parser.add_argument("--top-k", type=int, default=20)
    parser.add_argument("--log-every", type=int)
    parser.add_argument("--runs-dir", default="runs")
    parser.add_argument("--log-file", default="train_log.csv")
    parser.add_argument("--sample-prompt", default="语言模型")
    parser.add_argument("--sample-tokens", type=int)
    parser.add_argument("--mongo-uri", default=os.getenv("MINI_GPT_MONGO_URI", "mongodb://localhost:27017"))
    parser.add_argument("--mongo-db", default=os.getenv("MINI_GPT_MONGO_DB", "test"))
    parser.add_argument("--no-mongo", action="store_true")
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
