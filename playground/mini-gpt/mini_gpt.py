"""A tiny character-level GPT for learning.

This file is intentionally small and explicit. It is not optimized for large
training runs; it is a readable path from text to generation.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
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

PROVENANCE_FIELDS = (
    "manifest_data",
    "corpus_version",
    "corpus_format",
    "schema_version",
    "template_version",
    "train_sha256",
    "validation_sha256",
    "required_block_size",
)

VALIDATION_SOURCE_FIXED_FILE = "FIXED_FILE"
VALIDATION_SOURCE_TRAIN_TAIL_SPLIT = "TRAIN_TAIL_SPLIT"


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
            "runId": metadata.get("run_id"),
            "preset": metadata.get("preset"),
            "status": status,
            "startedAt": metadata.get("started_at"),
            "finishedAt": metadata.get("finished_at"),
            "data": metadata.get("data"),
            "evalData": metadata.get("eval_data"),
            "checkpoint": metadata.get("checkpoint"),
            "parentRunName": metadata.get("parent_run_name"),
            "parentCheckpoint": metadata.get("parent_checkpoint"),
            "resumeStep": metadata.get("resume_step"),
            "trainStep": metadata.get("train_step"),
            "logFile": metadata.get("log_file"),
            "metadataFile": metadata.get("metadata_file"),
            "device": metadata.get("device"),
            "maxSteps": metadata.get("max_steps"),
            "batchSize": metadata.get("batch_size"),
            "learningRate": metadata.get("learning_rate"),
            "valRatio": metadata.get("val_ratio"),
            "validationEnabled": metadata.get("validation_enabled"),
            "validationSource": metadata.get("validation_source"),
            "trainTokens": metadata.get("train_tokens"),
            "evalTokens": metadata.get("eval_tokens"),
            "seed": metadata.get("seed"),
            "manifestDataPath": metadata.get("manifest_data"),
            "corpusVersion": metadata.get("corpus_version"),
            "corpusFormat": metadata.get("corpus_format"),
            "schemaVersion": metadata.get("schema_version"),
            "templateVersion": metadata.get("template_version"),
            "trainSha256": metadata.get("train_sha256"),
            "validationSha256": metadata.get("validation_sha256"),
            "requiredBlockSize": metadata.get("required_block_size"),
            "effectiveBlockSize": metadata.get("effective_block_size"),
            "checkpointSha256": metadata.get("checkpoint_sha256"),
            "samplePrompt": metadata.get("sample_prompt"),
            "sampleTokens": metadata.get("sample_tokens"),
            "finalTrainLoss": metadata.get("final_train_loss"),
            "finalEvalLoss": metadata.get("final_eval_loss"),
            "lossGap": metadata.get("loss_gap"),
            "fixedEvalLoss": metadata.get("fixed_eval_loss"),
            "qualityGateMaxEvalLoss": metadata.get("quality_gate_max_eval_loss"),
            "qualityGateMaxLossGap": metadata.get("quality_gate_max_loss_gap"),
            "qualityGateStatus": metadata.get("quality_gate_status"),
            "qualityGateReasons": metadata.get("quality_gate_reasons"),
            "config": metadata.get("config") or {},
            "provenance": metadata.get("provenance") or {},
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


@dataclass
class PreparedDatasets:
    train_data: torch.Tensor
    eval_data: torch.Tensor
    fixed_eval_data: torch.Tensor | None
    validation_enabled: bool
    fixed_eval_enabled: bool
    validation_source: str


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

    def unknown_characters(self, text: str) -> list[str]:
        return sorted(set(text).difference(self.stoi))

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


def seed_everything(seed: int) -> int:
    actual_seed = int(seed)
    torch.manual_seed(actual_seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(actual_seed)
    return actual_seed


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_text(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    if len(text) < 10:
        raise ValueError("training text is too short")
    return text


def load_training_state(
    args: argparse.Namespace,
    text: str,
    device: torch.device,
) -> tuple[dict[str, object] | None, CharTokenizer, ModelConfig, int]:
    if args.resume_checkpoint:
        payload = torch.load(args.resume_checkpoint, map_location=device)
        tokenizer = CharTokenizer.from_dict(payload["tokenizer"])
        config = ModelConfig(**payload["config"])
        resume_step = int(payload.get("train_step") or 0)
        return payload, tokenizer, config, resume_step
    tokenizer = CharTokenizer(text)
    config = ModelConfig(
        block_size=args.block_size,
        n_embd=args.n_embd,
        n_head=args.n_head,
        n_layer=args.n_layer,
        dropout=args.dropout,
        vocab_size=tokenizer.vocab_size,
    )
    return None, tokenizer, config, 0


def resolve_provenance(
    args: argparse.Namespace,
    resume_payload: dict[str, object] | None,
    run_id: str,
) -> dict[str, object]:
    provenance: dict[str, object] = {
        "run_id": getattr(args, "run_id", None) or run_id,
    }
    for field in PROVENANCE_FIELDS:
        value = getattr(args, field, None)
        if value is None and resume_payload is not None:
            value = resume_payload.get(field)
        provenance[field] = value
    return provenance


def has_formal_provenance(provenance: dict[str, object]) -> bool:
    return any(provenance.get(field) is not None for field in PROVENANCE_FIELDS)


def validate_training_tokenizer(
    text: str,
    tokenizer: CharTokenizer,
    formal_provenance: bool,
) -> None:
    if not formal_provenance:
        return
    unknown_characters = tokenizer.unknown_characters(text)
    if not unknown_characters:
        return
    preview = ", ".join(repr(value) for value in unknown_characters[:8])
    suffix = "..." if len(unknown_characters) > 8 else ""
    raise ValueError(
        "training data contains out-of-vocabulary characters for the checkpoint tokenizer: "
        f"{preview}{suffix}"
    )


def validate_training_context(
    train_data: torch.Tensor,
    block_size: int,
    required_block_size: int | None = None,
) -> None:
    if block_size <= 0:
        raise ValueError("block_size must be positive")
    if required_block_size is not None:
        if required_block_size <= 0:
            raise ValueError("required_block_size must be positive")
        if block_size < required_block_size:
            raise ValueError(
                "effective checkpoint block_size "
                f"{block_size} is smaller than required_block_size {required_block_size}"
            )
    minimum_tokens = block_size + 2
    if len(train_data) < minimum_tokens:
        raise ValueError(
            f"training data has {len(train_data)} tokens; at least {minimum_tokens} "
            f"are required for block_size {block_size}"
        )


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


def load_optional_eval_data(path_value: str | None, tokenizer: CharTokenizer, block_size: int) -> tuple[torch.Tensor | None, bool]:
    if not path_value:
        return None, False
    path = Path(path_value)
    if not path.exists():
        raise ValueError(f"eval data file does not exist: {path_value}")
    text = path.read_text(encoding="utf-8")
    unknown_characters = tokenizer.unknown_characters(text)
    if unknown_characters:
        preview = ", ".join(repr(value) for value in unknown_characters[:8])
        suffix = "..." if len(unknown_characters) > 8 else ""
        raise ValueError(
            "eval data contains out-of-vocabulary characters for the training tokenizer: "
            f"{preview}{suffix}"
        )
    encoded = torch.tensor(tokenizer.encode(text), dtype=torch.long)
    minimum_tokens = block_size + 2
    if len(encoded) < minimum_tokens:
        raise ValueError(
            f"eval data has {len(encoded)} encoded tokens; at least {minimum_tokens} "
            f"are required for block_size {block_size}"
        )
    return encoded, True


def prepare_datasets(
    encoded_train: torch.Tensor,
    val_ratio: float,
    block_size: int,
    fixed_eval_data: torch.Tensor | None = None,
    required_block_size: int | None = None,
) -> PreparedDatasets:
    validate_training_context(encoded_train, block_size, required_block_size)
    if fixed_eval_data is not None:
        return PreparedDatasets(
            train_data=encoded_train,
            eval_data=fixed_eval_data,
            fixed_eval_data=fixed_eval_data,
            validation_enabled=True,
            fixed_eval_enabled=True,
            validation_source=VALIDATION_SOURCE_FIXED_FILE,
        )
    train_data, eval_data, validation_enabled = split_dataset(encoded_train, val_ratio, block_size)
    return PreparedDatasets(
        train_data=train_data,
        eval_data=eval_data,
        fixed_eval_data=None,
        validation_enabled=validation_enabled,
        fixed_eval_enabled=False,
        validation_source=VALIDATION_SOURCE_TRAIN_TAIL_SPLIT,
    )


def quality_gate(
    fixed_eval_loss: float | None,
    loss_gap: float | None,
    max_eval_loss: float | None,
    max_loss_gap: float | None,
) -> tuple[str, list[str]]:
    reasons: list[str] = []
    if max_eval_loss is not None:
        if fixed_eval_loss is None:
            reasons.append("fixed eval loss unavailable")
        elif fixed_eval_loss > max_eval_loss:
            reasons.append(f"fixed eval loss {fixed_eval_loss:.4f} > {max_eval_loss:.4f}")
    if max_loss_gap is not None:
        if loss_gap is None:
            reasons.append("loss gap unavailable")
        elif abs(loss_gap) > max_loss_gap:
            reasons.append(f"loss gap {loss_gap:.4f} exceeds {max_loss_gap:.4f}")
    if max_eval_loss is None and max_loss_gap is None:
        return "NOT_CONFIGURED", []
    return ("PASS" if not reasons else "FAILED"), reasons


def train(args: argparse.Namespace) -> None:
    apply_training_defaults(args)
    actual_seed = seed_everything(getattr(args, "seed", 42))
    started_at = time.strftime("%Y-%m-%d %H:%M:%S")
    text = load_text(Path(args.data))
    device = select_device()
    resume_payload, tokenizer, config, resume_step = load_training_state(args, text, device)
    run_name = safe_run_name(args.run_name or f"{time.strftime('%Y%m%d-%H%M%S')}-{args.preset}")
    provenance = resolve_provenance(args, resume_payload, run_name)
    validate_training_tokenizer(text, tokenizer, has_formal_provenance(provenance))
    encoded = torch.tensor(tokenizer.encode(text), dtype=torch.long)
    fixed_eval_data, fixed_eval_enabled = load_optional_eval_data(args.eval_data, tokenizer, config.block_size)
    required_block_size_value = provenance.get("required_block_size")
    required_block_size = int(required_block_size_value) if required_block_size_value is not None else None
    provenance["required_block_size"] = required_block_size
    datasets = prepare_datasets(
        encoded,
        args.val_ratio,
        config.block_size,
        fixed_eval_data,
        required_block_size,
    )
    train_data = datasets.train_data
    eval_data = datasets.eval_data
    fixed_eval_data = datasets.fixed_eval_data
    validation_enabled = datasets.validation_enabled
    fixed_eval_enabled = datasets.fixed_eval_enabled
    validation_source = datasets.validation_source
    provenance_record = {
        **provenance,
        "data": args.data,
        "eval_data": args.eval_data,
        "seed": actual_seed,
        "validation_source": validation_source,
        "effective_block_size": config.block_size,
    }
    model = MiniGPT(config).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.learning_rate)
    if resume_payload:
        model.load_state_dict(resume_payload["model"])
        if "optimizer" in resume_payload:
            optimizer.load_state_dict(resume_payload["optimizer"])
            for group in optimizer.param_groups:
                group["lr"] = args.learning_rate
    runs_dir = Path(args.runs_dir)
    runs_dir.mkdir(parents=True, exist_ok=True)
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
        **provenance,
        "run_name": run_name,
        "preset": args.preset,
        "started_at": started_at,
        "data": args.data,
        "eval_data": args.eval_data,
        "fixed_eval_enabled": fixed_eval_enabled,
        "parent_run_name": args.parent_run_name,
        "parent_checkpoint": args.resume_checkpoint or args.parent_checkpoint,
        "resume_step": resume_step,
        "train_step": resume_step,
        "log_file": str(log_path),
        "metadata_file": str(run_latest_path),
        "device": str(device),
        "max_steps": args.max_steps,
        "batch_size": args.batch_size,
        "learning_rate": args.learning_rate,
        "val_ratio": args.val_ratio,
        "validation_enabled": validation_enabled,
        "validation_source": validation_source,
        "train_tokens": int(len(train_data)),
        "eval_tokens": int(len(eval_data)),
        "seed": actual_seed,
        "effective_block_size": config.block_size,
        "sample_prompt": args.sample_prompt,
        "sample_tokens": args.sample_tokens,
        "quality_gate_max_eval_loss": args.quality_gate_max_eval_loss,
        "quality_gate_max_loss_gap": args.quality_gate_max_loss_gap,
        "config": asdict(config),
        "provenance": provenance_record,
    }
    mongo_sink.upsert_run(initial_metadata, "RUNNING")

    fieldnames = ["step", "train_loss", "eval_loss", "elapsed_seconds", "sample"]
    with log_path.open("w", encoding="utf-8", newline="") as log_file:
        writer = csv.DictWriter(log_file, fieldnames=fieldnames)
        writer.writeheader()

        train_started = time.time()
        for step in range(1, args.max_steps + 1):
            global_step = resume_step + step
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
                print(f"step={step} train_loss={loss.item():.4f} eval_loss={eval_loss:.4f} global_step={global_step}")

    checkpoint_path = checkpoint_dir / "mini_gpt.pt"
    train_step = resume_step + args.max_steps
    checkpoint_payload = {
        **provenance,
        "run_name": run_name,
        "preset": args.preset,
        "data": args.data,
        "eval_data": args.eval_data,
        "seed": actual_seed,
        "validation_source": validation_source,
        "effective_block_size": config.block_size,
        "model": model.state_dict(),
        "optimizer": optimizer.state_dict(),
        "config": asdict(config),
        "tokenizer": tokenizer.to_dict(),
        "train_step": train_step,
        "parent_run_name": args.parent_run_name,
        "parent_checkpoint": args.resume_checkpoint or args.parent_checkpoint,
        "provenance": provenance_record,
    }
    torch.save(checkpoint_payload, checkpoint_path)
    checkpoint_sha256 = file_sha256(checkpoint_path)
    (checkpoint_dir / "config.json").write_text(json.dumps(asdict(config), ensure_ascii=False, indent=2), encoding="utf-8")
    final_train_loss = last_log_row["train_loss"] if last_log_row else None
    final_eval_loss = last_log_row["eval_loss"] if last_log_row else None
    loss_gap = None
    if final_train_loss is not None and final_eval_loss is not None:
        loss_gap = round(float(final_eval_loss) - float(final_train_loss), 6)
    fixed_eval_loss = None
    if fixed_eval_data is not None:
        fixed_eval_loss = round(estimate_loss(model, fixed_eval_data, config.block_size, args.batch_size, device), 6)
    quality_gate_status, quality_gate_reasons = quality_gate(
        fixed_eval_loss,
        loss_gap,
        args.quality_gate_max_eval_loss,
        args.quality_gate_max_loss_gap,
    )
    metadata = {
        **provenance,
        "run_name": run_name,
        "preset": args.preset,
        "started_at": started_at,
        "finished_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "data": args.data,
        "eval_data": args.eval_data,
        "fixed_eval_enabled": fixed_eval_enabled,
        "checkpoint": str(checkpoint_path),
        "checkpoint_sha256": checkpoint_sha256,
        "parent_run_name": args.parent_run_name,
        "parent_checkpoint": args.resume_checkpoint or args.parent_checkpoint,
        "resume_step": resume_step,
        "train_step": train_step,
        "log_file": str(log_path),
        "metadata_file": str(run_latest_path),
        "device": str(device),
        "max_steps": args.max_steps,
        "batch_size": args.batch_size,
        "learning_rate": args.learning_rate,
        "val_ratio": args.val_ratio,
        "validation_enabled": validation_enabled,
        "validation_source": validation_source,
        "train_tokens": int(len(train_data)),
        "eval_tokens": int(len(eval_data)),
        "seed": actual_seed,
        "effective_block_size": config.block_size,
        "sample_prompt": args.sample_prompt,
        "sample_tokens": args.sample_tokens,
        "final_train_loss": final_train_loss,
        "final_eval_loss": final_eval_loss,
        "loss_gap": loss_gap,
        "fixed_eval_loss": fixed_eval_loss,
        "quality_gate_max_eval_loss": args.quality_gate_max_eval_loss,
        "quality_gate_max_loss_gap": args.quality_gate_max_loss_gap,
        "quality_gate_status": quality_gate_status,
        "quality_gate_reasons": "; ".join(quality_gate_reasons),
        "config": asdict(config),
        "provenance": provenance_record,
    }
    latest_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    run_latest_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    mongo_sink.upsert_run(metadata, "SUCCESS")
    append_run_index(runs_dir, {
        "run_id": metadata["run_id"],
        "run_name": run_name,
        "preset": args.preset,
        "corpus_version": metadata["corpus_version"],
        "corpus_format": metadata["corpus_format"],
        "manifest_data": metadata["manifest_data"],
        "train_sha256": metadata["train_sha256"],
        "validation_sha256": metadata["validation_sha256"],
        "seed": actual_seed,
        "validation_source": validation_source,
        "finished_at": metadata["finished_at"],
        "log_file": metadata["log_file"],
        "metadata_file": metadata["metadata_file"],
        "checkpoint": metadata["checkpoint"],
        "checkpoint_sha256": checkpoint_sha256,
        "parent_run_name": metadata["parent_run_name"],
        "parent_checkpoint": metadata["parent_checkpoint"],
        "resume_step": resume_step,
        "train_step": train_step,
        "final_train_loss": final_train_loss,
        "final_eval_loss": final_eval_loss,
        "loss_gap": loss_gap,
        "fixed_eval_loss": fixed_eval_loss,
        "quality_gate_status": quality_gate_status,
        "max_steps": args.max_steps,
        "n_layer": config.n_layer,
        "n_embd": config.n_embd,
        "block_size": config.block_size,
    })
    print(f"saved checkpoint to {checkpoint_path}")
    print(f"saved training log to {log_path}")


def generation_payload(args: argparse.Namespace) -> dict[str, object]:
    actual_seed = seed_everything(getattr(args, "seed", 42))
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
    return {
        "generated_text": tokenizer.decode(output[0].tolist()),
        "seed": actual_seed,
        "model_config": asdict(config),
    }


def generate(args: argparse.Namespace) -> None:
    print(json.dumps(generation_payload(args), ensure_ascii=False))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Train or sample a tiny character-level GPT.")
    parser.add_argument("--mode", choices=["train", "generate"], required=True)
    parser.add_argument("--data", default="data/sample.txt")
    parser.add_argument("--eval-data")
    parser.add_argument("--checkpoint", default="checkpoints/mini_gpt.pt")
    parser.add_argument("--out-dir", default="checkpoints")
    parser.add_argument("--prompt", default="语言模型")
    parser.add_argument("--max-new-tokens", type=int, default=120)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--preset", choices=sorted(PRESETS), default="custom")
    parser.add_argument("--run-name")
    parser.add_argument("--run-id")
    parser.add_argument("--manifest-data")
    parser.add_argument("--corpus-version")
    parser.add_argument("--corpus-format")
    parser.add_argument("--schema-version", type=int)
    parser.add_argument("--template-version")
    parser.add_argument("--train-sha256")
    parser.add_argument("--validation-sha256")
    parser.add_argument("--required-block-size", type=int)
    parser.add_argument("--resume-checkpoint")
    parser.add_argument("--parent-run-name")
    parser.add_argument("--parent-checkpoint")
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
    parser.add_argument("--quality-gate-max-eval-loss", type=float)
    parser.add_argument("--quality-gate-max-loss-gap", type=float)
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
