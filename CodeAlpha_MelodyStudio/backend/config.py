from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATASET_DIR = BASE_DIR / "dataset"
MAESTRO_DIR = DATASET_DIR / "maestro-v3.0.0"
ARTIFACT_DIR = BASE_DIR / "artifacts"
GENERATED_DIR = BASE_DIR / "generated"

TOKENS_PATH = ARTIFACT_DIR / "tokens.json"
VOCAB_PATH = ARTIFACT_DIR / "vocab.json"
MODEL_PATH = ARTIFACT_DIR / "music_lstm.pt"
TRAINING_INFO_PATH = ARTIFACT_DIR / "training_info.json"

SEQUENCE_LENGTH = 64
