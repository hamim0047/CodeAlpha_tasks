from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

from music21 import chord, converter, note
from tqdm import tqdm

from config import (
    ARTIFACT_DIR,
    MAESTRO_DIR,
    TOKENS_PATH,
    VOCAB_PATH,
)

EOS = "<EOS>"


def quantize_duration(value: float) -> float:
    if not math.isfinite(value) or value <= 0:
        value = 0.5

    value = min(4.0, max(0.25, value))
    return round(round(value / 0.25) * 0.25, 2)


def token_from_element(element):
    duration = quantize_duration(float(element.duration.quarterLength))

    if isinstance(element, note.Rest):
        return f"R:{duration}"

    if isinstance(element, note.Note):
        return f"N:{element.pitch.midi}:{duration}"

    if isinstance(element, chord.Chord):
        pitches = sorted(
            {
                int(pitch.midi)
                for pitch in element.pitches
                if 21 <= pitch.midi <= 108
            }
        )

        if not pitches:
            return None

        # Limit extremely dense chords to make the vocabulary manageable.
        pitches = pitches[:6]
        return f"C:{'.'.join(map(str, pitches))}:{duration}"

    return None


def extract_tokens(midi_path: Path) -> list[str]:
    score = converter.parse(str(midi_path))

    # Chordify gives us a sequential symbolic representation of polyphonic piano.
    events = score.chordify().flatten().notesAndRests

    tokens = []

    for element in events:
        token = token_from_element(element)

        if token:
            tokens.append(token)

    return tokens


def preprocess(max_files: int):
    if not MAESTRO_DIR.exists():
        raise FileNotFoundError(
            "MAESTRO dataset not found. Run: python download_dataset.py"
        )

    midi_files = sorted(
        list(MAESTRO_DIR.rglob("*.midi"))
        + list(MAESTRO_DIR.rglob("*.mid"))
    )

    if not midi_files:
        raise RuntimeError("No MIDI files were found in the dataset.")

    if max_files > 0:
        midi_files = midi_files[:max_files]

    all_tokens = []
    parsed_files = 0

    print(f"Preprocessing {len(midi_files)} MIDI files...")

    for midi_path in tqdm(midi_files):
        try:
            tokens = extract_tokens(midi_path)

            if len(tokens) < 80:
                continue

            all_tokens.extend(tokens)
            all_tokens.append(EOS)
            parsed_files += 1

        except Exception as error:
            print(f"\nSkipped {midi_path.name}: {error}")

    if not all_tokens:
        raise RuntimeError("No usable music tokens were extracted.")

    vocabulary = sorted(set(all_tokens))

    token_to_id = {
        token: index
        for index, token in enumerate(vocabulary)
    }

    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

    TOKENS_PATH.write_text(
        json.dumps(all_tokens, ensure_ascii=False),
        encoding="utf-8",
    )

    VOCAB_PATH.write_text(
        json.dumps(
            {
                "token_to_id": token_to_id,
                "id_to_token": vocabulary,
                "parsed_files": parsed_files,
                "total_tokens": len(all_tokens),
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    print("\nPreprocessing complete.")
    print(f"Parsed files: {parsed_files}")
    print(f"Total tokens: {len(all_tokens):,}")
    print(f"Vocabulary size: {len(vocabulary):,}")
    print(f"Saved: {TOKENS_PATH}")
    print(f"Saved: {VOCAB_PATH}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--max-files",
        type=int,
        default=60,
        help=(
            "Number of MIDI files to preprocess. "
            "Use 0 for the full dataset. Start with 30-60 on a laptop."
        ),
    )

    args = parser.parse_args()
    preprocess(args.max_files)
