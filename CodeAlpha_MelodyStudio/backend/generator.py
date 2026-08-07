from __future__ import annotations

import json
import random
import uuid
from pathlib import Path

import torch
from music21 import chord, instrument, note, stream

from config import (
    GENERATED_DIR,
    MODEL_PATH,
    SEQUENCE_LENGTH,
    TOKENS_PATH,
    VOCAB_PATH,
)
from model import MusicLSTM


def get_device():
    if torch.cuda.is_available():
        return torch.device("cuda")

    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return torch.device("mps")

    return torch.device("cpu")


class MusicGenerator:
    def __init__(self):
        self.device = get_device()

        self.vocab_data = json.loads(
            VOCAB_PATH.read_text(encoding="utf-8")
        )

        self.tokens = json.loads(
            TOKENS_PATH.read_text(encoding="utf-8")
        )

        self.token_to_id = self.vocab_data["token_to_id"]
        self.id_to_token = self.vocab_data["id_to_token"]

        checkpoint = torch.load(
            MODEL_PATH,
            map_location=self.device,
        )

        self.model = MusicLSTM(
            vocab_size=checkpoint["vocab_size"],
            embedding_dim=checkpoint.get("embedding_dim", 128),
            hidden_size=checkpoint.get("hidden_size", 256),
            num_layers=checkpoint.get("num_layers", 2),
            dropout=checkpoint.get("dropout", 0.25),
        ).to(self.device)

        self.model.load_state_dict(checkpoint["model_state"])
        self.model.eval()

    def generate(
        self,
        length: int = 96,
        temperature: float = 0.9,
    ) -> list[str]:
        temperature = max(0.15, min(2.0, temperature))

        valid_starts = max(
            1,
            len(self.tokens) - SEQUENCE_LENGTH - 1,
        )

        start = random.randrange(valid_starts)

        seed_tokens = self.tokens[
            start : start + SEQUENCE_LENGTH
        ]

        seed_ids = [
            self.token_to_id[token]
            for token in seed_tokens
        ]

        generated_ids = []

        input_sequence = torch.tensor(
            [seed_ids],
            dtype=torch.long,
            device=self.device,
        )

        with torch.no_grad():
            for _ in range(length):
                logits, _ = self.model(input_sequence)

                next_logits = logits[0, -1] / temperature
                probabilities = torch.softmax(next_logits, dim=-1)

                next_id = int(
                    torch.multinomial(
                        probabilities,
                        num_samples=1,
                    ).item()
                )

                generated_ids.append(next_id)

                next_tensor = torch.tensor(
                    [[next_id]],
                    dtype=torch.long,
                    device=self.device,
                )

                input_sequence = torch.cat(
                    [input_sequence[:, 1:], next_tensor],
                    dim=1,
                )

        tokens = [
            self.id_to_token[index]
            for index in generated_ids
            if self.id_to_token[index] != "<EOS>"
        ]

        return tokens

    @staticmethod
    def _parse_duration(value: str) -> float:
        try:
            return max(0.25, min(4.0, float(value)))
        except (TypeError, ValueError):
            return 0.5

    def tokens_to_midi(self, tokens: list[str]) -> Path:
        GENERATED_DIR.mkdir(parents=True, exist_ok=True)

        output_stream = stream.Stream()
        output_stream.append(instrument.Piano())

        for token_value in tokens:
            parts = token_value.split(":")

            try:
                if parts[0] == "N":
                    midi_pitch = int(parts[1])
                    duration = self._parse_duration(parts[2])

                    element = note.Note(midi_pitch)
                    element.duration.quarterLength = duration
                    output_stream.append(element)

                elif parts[0] == "C":
                    pitches = [
                        int(value)
                        for value in parts[1].split(".")
                    ]

                    duration = self._parse_duration(parts[2])

                    element = chord.Chord(pitches)
                    element.duration.quarterLength = duration
                    output_stream.append(element)

                elif parts[0] == "R":
                    duration = self._parse_duration(parts[1])

                    element = note.Rest()
                    element.duration.quarterLength = duration
                    output_stream.append(element)

            except (ValueError, IndexError):
                continue

        filename = f"generated_{uuid.uuid4().hex[:10]}.mid"
        path = GENERATED_DIR / filename

        output_stream.write(
            "midi",
            fp=str(path),
        )

        return path
