from __future__ import annotations

import json

from flask import Flask, jsonify, request, send_from_directory

from config import (
    GENERATED_DIR,
    MAESTRO_DIR,
    MODEL_PATH,
    VOCAB_PATH,
)
from generator import MusicGenerator

app = Flask(__name__)

generator = None


def get_generator():
    global generator

    if generator is None:
        if not MODEL_PATH.exists() or not VOCAB_PATH.exists():
            return None

        generator = MusicGenerator()

    return generator


@app.get("/api/health")
def health():
    vocabulary_size = None

    if VOCAB_PATH.exists():
        try:
            data = json.loads(
                VOCAB_PATH.read_text(encoding="utf-8")
            )

            vocabulary_size = len(data.get("id_to_token", []))

        except Exception:
            vocabulary_size = None

    return jsonify(
        {
            "status": "ok",
            "dataset_ready": (
                MAESTRO_DIR.exists()
                and bool(
                    list(MAESTRO_DIR.rglob("*.midi"))
                    or list(MAESTRO_DIR.rglob("*.mid"))
                )
            ),
            "model_ready": MODEL_PATH.exists(),
            "vocabulary_size": vocabulary_size,
            "architecture": "PyTorch stacked LSTM",
        }
    )


@app.post("/api/generate")
def generate_music():
    model = get_generator()

    if model is None:
        return (
            jsonify(
                {
                    "error": (
                        "The trained model is missing. "
                        "Run preprocess.py and train.py first."
                    )
                }
            ),
            503,
        )

    body = request.get_json(silent=True) or {}

    try:
        length = int(body.get("length", 96))
    except (TypeError, ValueError):
        length = 96

    try:
        temperature = float(body.get("temperature", 0.9))
    except (TypeError, ValueError):
        temperature = 0.9

    length = max(16, min(length, 256))
    temperature = max(0.15, min(temperature, 2.0))

    tokens = model.generate(
        length=length,
        temperature=temperature,
    )

    if not tokens:
        return (
            jsonify(
                {
                    "error": "The model produced an empty sequence."
                }
            ),
            500,
        )

    midi_path = model.tokens_to_midi(tokens)

    return jsonify(
        {
            "tokens": tokens,
            "event_count": len(tokens),
            "temperature": temperature,
            "midi_url": f"/api/midi/{midi_path.name}",
        }
    )


@app.get("/api/midi/<path:filename>")
def download_midi(filename):
    return send_from_directory(
        GENERATED_DIR,
        filename,
        as_attachment=True,
        download_name=filename,
    )


if __name__ == "__main__":
    GENERATED_DIR.mkdir(parents=True, exist_ok=True)

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True,
    )
