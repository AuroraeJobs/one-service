from __future__ import annotations

import io
import json
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch

import torch

import mini_gpt


class MiniGptTrainingSemanticsTest(unittest.TestCase):
    def test_explicit_eval_uses_full_training_data(self) -> None:
        encoded_train = torch.arange(40, dtype=torch.long)
        fixed_eval = torch.arange(12, dtype=torch.long)

        prepared = mini_gpt.prepare_datasets(
            encoded_train,
            val_ratio=0.5,
            block_size=4,
            fixed_eval_data=fixed_eval,
            required_block_size=4,
        )

        self.assertTrue(torch.equal(prepared.train_data, encoded_train))
        self.assertTrue(torch.equal(prepared.eval_data, fixed_eval))
        self.assertTrue(torch.equal(prepared.fixed_eval_data, fixed_eval))
        self.assertTrue(prepared.validation_enabled)
        self.assertTrue(prepared.fixed_eval_enabled)
        self.assertEqual(mini_gpt.VALIDATION_SOURCE_FIXED_FILE, prepared.validation_source)

        internal = mini_gpt.prepare_datasets(encoded_train, val_ratio=0.25, block_size=4)
        self.assertEqual(30, len(internal.train_data))
        self.assertEqual(10, len(internal.eval_data))
        self.assertEqual(mini_gpt.VALIDATION_SOURCE_TRAIN_TAIL_SPLIT, internal.validation_source)

    def test_explicit_eval_rejects_missing_oov_and_too_short_files(self) -> None:
        tokenizer = mini_gpt.CharTokenizer("abc\n")
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)

            with self.assertRaisesRegex(ValueError, "does not exist"):
                mini_gpt.load_optional_eval_data(str(root / "missing.txt"), tokenizer, block_size=4)

            short_path = root / "short.txt"
            short_path.write_text("abc\n", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "at least 6"):
                mini_gpt.load_optional_eval_data(str(short_path), tokenizer, block_size=4)

            oov_path = root / "oov.txt"
            oov_path.write_text("abcx\nabc", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "out-of-vocabulary"):
                mini_gpt.load_optional_eval_data(str(oov_path), tokenizer, block_size=4)

    def test_context_gate_checks_required_block_and_minimum_tokens(self) -> None:
        mini_gpt.validate_training_context(torch.arange(6), block_size=4, required_block_size=4)

        with self.assertRaisesRegex(ValueError, "required_block_size 5"):
            mini_gpt.validate_training_context(torch.arange(20), block_size=4, required_block_size=5)
        with self.assertRaisesRegex(ValueError, "at least 6"):
            mini_gpt.validate_training_context(torch.arange(5), block_size=4, required_block_size=4)

    def test_resume_uses_checkpoint_block_size_and_rejects_formal_oov(self) -> None:
        tokenizer = mini_gpt.CharTokenizer("abc\n")
        with tempfile.TemporaryDirectory() as directory:
            checkpoint = Path(directory) / "resume.pt"
            torch.save(
                {
                    "config": {
                        "block_size": 4,
                        "n_embd": 8,
                        "n_head": 1,
                        "n_layer": 1,
                        "dropout": 0.0,
                        "vocab_size": tokenizer.vocab_size,
                    },
                    "tokenizer": tokenizer.to_dict(),
                    "train_step": 7,
                    "required_block_size": 5,
                },
                checkpoint,
            )
            args = mini_gpt.build_parser().parse_args([
                "--mode", "train",
                "--resume-checkpoint", str(checkpoint),
                "--block-size", "32",
            ])
            mini_gpt.apply_training_defaults(args)

            payload, resumed_tokenizer, config, resume_step = mini_gpt.load_training_state(
                args,
                "abc\nabc\n",
                torch.device("cpu"),
            )
            provenance = mini_gpt.resolve_provenance(args, payload, "resume-run")

            self.assertEqual(4, config.block_size)
            self.assertEqual(7, resume_step)
            self.assertEqual(5, provenance["required_block_size"])
            with self.assertRaisesRegex(ValueError, "required_block_size 5"):
                mini_gpt.validate_training_context(torch.arange(20), config.block_size, 5)
            with self.assertRaisesRegex(ValueError, "checkpoint tokenizer"):
                mini_gpt.validate_training_tokenizer("abcx\nabc", resumed_tokenizer, True)

    def test_seed_makes_generation_reproducible_and_stdout_is_json(self) -> None:
        self.assertEqual(42, mini_gpt.build_parser().parse_args(["--mode", "generate"]).seed)
        tokenizer = mini_gpt.CharTokenizer("abc\n")
        config = mini_gpt.ModelConfig(
            block_size=4,
            n_embd=8,
            n_head=1,
            n_layer=1,
            dropout=0.0,
            vocab_size=tokenizer.vocab_size,
        )
        mini_gpt.seed_everything(17)
        model = mini_gpt.MiniGPT(config)

        with tempfile.TemporaryDirectory() as directory:
            checkpoint = Path(directory) / "model.pt"
            torch.save(
                {
                    "model": model.state_dict(),
                    "config": mini_gpt.asdict(config),
                    "tokenizer": tokenizer.to_dict(),
                },
                checkpoint,
            )
            args = mini_gpt.build_parser().parse_args([
                "--mode", "generate",
                "--checkpoint", str(checkpoint),
                "--prompt", "a",
                "--max-new-tokens", "12",
                "--temperature", "0.9",
                "--top-k", "4",
                "--seed", "99",
            ])

            with patch.object(mini_gpt, "select_device", return_value=torch.device("cpu")):
                first = mini_gpt.generation_payload(args)
                second = mini_gpt.generation_payload(args)
                stdout = io.StringIO()
                with redirect_stdout(stdout):
                    mini_gpt.generate(args)

            self.assertEqual(first, second)
            self.assertEqual(99, first["seed"])
            self.assertEqual(mini_gpt.asdict(config), first["model_config"])
            self.assertEqual(first, json.loads(stdout.getvalue()))

    def test_training_persists_fixed_eval_and_provenance(self) -> None:
        train_text = "abcd\n" * 12
        eval_text = "dcba\n" * 4
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            train_path = root / "train.txt"
            eval_path = root / "validation.txt"
            runs_dir = root / "runs"
            train_path.write_text(train_text, encoding="utf-8")
            eval_path.write_text(eval_text, encoding="utf-8")
            args = mini_gpt.build_parser().parse_args([
                "--mode", "train",
                "--preset", "custom",
                "--data", str(train_path),
                "--eval-data", str(eval_path),
                "--runs-dir", str(runs_dir),
                "--run-name", "formal-run",
                "--run-id", "run-47b",
                "--manifest-data", "data/lottery-corpora/strategy/version/manifest.json",
                "--corpus-version", "corpus-v1",
                "--corpus-format", "strategy",
                "--schema-version", "1",
                "--template-version", "lottery-strategy-v1",
                "--train-sha256", "train-sha",
                "--validation-sha256", "validation-sha",
                "--required-block-size", "4",
                "--seed", "123",
                "--max-steps", "1",
                "--batch-size", "2",
                "--block-size", "4",
                "--n-embd", "8",
                "--n-head", "1",
                "--n-layer", "1",
                "--dropout", "0",
                "--learning-rate", "0.001",
                "--val-ratio", "0.5",
                "--log-every", "1",
                "--sample-prompt", "a",
                "--sample-tokens", "2",
                "--temperature", "0.9",
                "--top-k", "4",
                "--no-mongo",
            ])

            with patch.object(mini_gpt, "select_device", return_value=torch.device("cpu")):
                mini_gpt.train(args)

            metadata_path = runs_dir / "formal-run" / "latest.json"
            metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
            checkpoint_path = Path(metadata["checkpoint"])
            checkpoint = torch.load(checkpoint_path, map_location="cpu")

            self.assertEqual("run-47b", metadata["run_id"])
            self.assertEqual("corpus-v1", metadata["corpus_version"])
            self.assertEqual("strategy", metadata["corpus_format"])
            self.assertEqual(
                "data/lottery-corpora/strategy/version/manifest.json",
                metadata["manifest_data"],
            )
            self.assertEqual(1, metadata["schema_version"])
            self.assertEqual("lottery-strategy-v1", metadata["template_version"])
            self.assertEqual("train-sha", metadata["train_sha256"])
            self.assertEqual("validation-sha", metadata["validation_sha256"])
            self.assertEqual(123, metadata["seed"])
            self.assertEqual(4, metadata["effective_block_size"])
            self.assertEqual(mini_gpt.VALIDATION_SOURCE_FIXED_FILE, metadata["validation_source"])
            self.assertTrue(metadata["validation_enabled"])
            self.assertTrue(metadata["fixed_eval_enabled"])
            self.assertEqual(len(train_text), metadata["train_tokens"])
            self.assertEqual(len(eval_text), metadata["eval_tokens"])
            self.assertIsNotNone(metadata["fixed_eval_loss"])
            self.assertEqual(mini_gpt.file_sha256(checkpoint_path), metadata["checkpoint_sha256"])

            self.assertEqual("run-47b", checkpoint["run_id"])
            self.assertEqual("corpus-v1", checkpoint["corpus_version"])
            self.assertEqual("strategy", checkpoint["corpus_format"])
            self.assertEqual(1, checkpoint["schema_version"])
            self.assertEqual("lottery-strategy-v1", checkpoint["template_version"])
            self.assertEqual("train-sha", checkpoint["train_sha256"])
            self.assertEqual("validation-sha", checkpoint["validation_sha256"])
            self.assertEqual(123, checkpoint["seed"])
            self.assertEqual(4, checkpoint["effective_block_size"])
            self.assertEqual(mini_gpt.VALIDATION_SOURCE_FIXED_FILE, checkpoint["validation_source"])
            self.assertEqual(4, checkpoint["config"]["block_size"])
            self.assertEqual(123, checkpoint["provenance"]["seed"])
            self.assertNotIn("checkpoint_sha256", checkpoint)


if __name__ == "__main__":
    unittest.main()
