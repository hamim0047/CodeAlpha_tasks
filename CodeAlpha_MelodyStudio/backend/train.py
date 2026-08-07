from __future__ import annotations

import argparse
import json
import random
import time

import torch
from torch import nn
from torch.utils.data import DataLoader, Dataset, random_split

from config import (
    MODEL_PATH,
    SEQUENCE_LENGTH,
    TOKENS_PATH,
    TRAINING_INFO_PATH,
    VOCAB_PATH,
)
from model import MusicLSTM


class MusicSequenceDataset(Dataset):
    def __init__(
        self,
        token_ids: list[int],
        sequence_length: int,
        stride: int = 4,
    ):
        self.token_ids = token_ids
        self.sequence_length = sequence_length
        self.starts = list(
            range(
                0,
                len(token_ids) - sequence_length - 1,
                stride,
            )
        )

    def __len__(self):
        return len(self.starts)

    def __getitem__(self, index):
        start = self.starts[index]
        end = start + self.sequence_length

        x = torch.tensor(
            self.token_ids[start:end],
            dtype=torch.long,
        )

        y = torch.tensor(
            self.token_ids[start + 1 : end + 1],
            dtype=torch.long,
        )

        return x, y


def get_device():
    if torch.cuda.is_available():
        return torch.device("cuda")

    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return torch.device("mps")

    return torch.device("cpu")


def train(
    epochs: int,
    batch_size: int,
    learning_rate: float,
    max_sequences: int,
):
    if not TOKENS_PATH.exists() or not VOCAB_PATH.exists():
        raise FileNotFoundError(
            "Preprocessed data not found. Run: python preprocess.py"
        )

    tokens = json.loads(TOKENS_PATH.read_text(encoding="utf-8"))
    vocab_data = json.loads(VOCAB_PATH.read_text(encoding="utf-8"))

    token_to_id = vocab_data["token_to_id"]
    vocab_size = len(token_to_id)

    token_ids = [
        token_to_id[token]
        for token in tokens
        if token in token_to_id
    ]

    dataset = MusicSequenceDataset(
        token_ids,
        sequence_length=SEQUENCE_LENGTH,
        stride=4,
    )

    if max_sequences > 0 and len(dataset) > max_sequences:
        generator = torch.Generator().manual_seed(42)

        selected, _ = random_split(
            dataset,
            [max_sequences, len(dataset) - max_sequences],
            generator=generator,
        )

        dataset = selected

    if len(dataset) < 10:
        raise RuntimeError(
            "Not enough training sequences. Preprocess more MIDI files."
        )

    validation_size = max(1, int(len(dataset) * 0.1))
    training_size = len(dataset) - validation_size

    generator = torch.Generator().manual_seed(42)

    train_dataset, validation_dataset = random_split(
        dataset,
        [training_size, validation_size],
        generator=generator,
    )

    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
    )

    validation_loader = DataLoader(
        validation_dataset,
        batch_size=batch_size,
        shuffle=False,
    )

    device = get_device()
    print(f"Using device: {device}")
    print(f"Vocabulary size: {vocab_size:,}")
    print(f"Training sequences: {training_size:,}")
    print(f"Validation sequences: {validation_size:,}")

    model = MusicLSTM(vocab_size=vocab_size).to(device)

    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=learning_rate,
        weight_decay=1e-4,
    )

    criterion = nn.CrossEntropyLoss()

    history = []
    best_validation_loss = float("inf")

    for epoch in range(1, epochs + 1):
        started = time.time()

        model.train()
        train_loss = 0.0

        for batch_x, batch_y in train_loader:
            batch_x = batch_x.to(device)
            batch_y = batch_y.to(device)

            optimizer.zero_grad()

            logits, _ = model(batch_x)

            loss = criterion(
                logits.reshape(-1, vocab_size),
                batch_y.reshape(-1),
            )

            loss.backward()

            torch.nn.utils.clip_grad_norm_(
                model.parameters(),
                max_norm=1.0,
            )

            optimizer.step()

            train_loss += loss.item()

        train_loss /= max(1, len(train_loader))

        model.eval()
        validation_loss = 0.0

        with torch.no_grad():
            for batch_x, batch_y in validation_loader:
                batch_x = batch_x.to(device)
                batch_y = batch_y.to(device)

                logits, _ = model(batch_x)

                loss = criterion(
                    logits.reshape(-1, vocab_size),
                    batch_y.reshape(-1),
                )

                validation_loss += loss.item()

        validation_loss /= max(1, len(validation_loader))

        elapsed = time.time() - started

        item = {
            "epoch": epoch,
            "train_loss": round(train_loss, 5),
            "validation_loss": round(validation_loss, 5),
            "seconds": round(elapsed, 2),
        }

        history.append(item)

        print(
            f"Epoch {epoch:02d}/{epochs} "
            f"train={train_loss:.4f} "
            f"val={validation_loss:.4f} "
            f"time={elapsed:.1f}s"
        )

        if validation_loss < best_validation_loss:
            best_validation_loss = validation_loss

            torch.save(
                {
                    "model_state": model.state_dict(),
                    "vocab_size": vocab_size,
                    "sequence_length": SEQUENCE_LENGTH,
                    "embedding_dim": 128,
                    "hidden_size": 256,
                    "num_layers": 2,
                    "dropout": 0.25,
                },
                MODEL_PATH,
            )

    TRAINING_INFO_PATH.write_text(
        json.dumps(
            {
                "device": str(device),
                "epochs": epochs,
                "batch_size": batch_size,
                "learning_rate": learning_rate,
                "history": history,
                "best_validation_loss": best_validation_loss,
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    print(f"\nBest model saved to:\n{MODEL_PATH}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()

    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--learning-rate", type=float, default=0.001)

    parser.add_argument(
        "--max-sequences",
        type=int,
        default=30000,
        help=(
            "Maximum training windows. "
            "Use 0 to use every available sequence."
        ),
    )

    args = parser.parse_args()

    train(
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.learning_rate,
        max_sequences=args.max_sequences,
    )
