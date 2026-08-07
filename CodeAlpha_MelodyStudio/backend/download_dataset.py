from __future__ import annotations

from pathlib import Path
import shutil
import zipfile

import requests

from config import DATASET_DIR, MAESTRO_DIR

URL = (
    "https://storage.googleapis.com/magentadata/datasets/"
    "maestro/v3.0.0/maestro-v3.0.0-midi.zip"
)

ZIP_PATH = DATASET_DIR / "maestro-v3.0.0-midi.zip"


def download():
    DATASET_DIR.mkdir(parents=True, exist_ok=True)

    if MAESTRO_DIR.exists() and any(MAESTRO_DIR.rglob("*.midi")):
        print(f"Dataset already extracted at:\n{MAESTRO_DIR}")
        return

    print("Downloading MAESTRO v3.0.0 MIDI-only archive (~56 MB)...")

    with requests.get(URL, stream=True, timeout=120) as response:
        response.raise_for_status()

        total = int(response.headers.get("content-length", 0))
        downloaded = 0

        with ZIP_PATH.open("wb") as output:
            for chunk in response.iter_content(1024 * 1024):
                if not chunk:
                    continue

                output.write(chunk)
                downloaded += len(chunk)

                if total:
                    percent = downloaded / total * 100
                    print(
                        f"\rDownloaded {percent:5.1f}%",
                        end="",
                        flush=True,
                    )

    print("\nExtracting MIDI files...")

    with zipfile.ZipFile(ZIP_PATH, "r") as archive:
        archive.extractall(DATASET_DIR)

    # Google's archive normally extracts to maestro-v3.0.0.
    if not MAESTRO_DIR.exists():
        candidates = [
            path
            for path in DATASET_DIR.iterdir()
            if path.is_dir() and path.name.startswith("maestro")
        ]

        if candidates:
            candidates[0].rename(MAESTRO_DIR)

    print(f"Dataset ready:\n{MAESTRO_DIR}")

    try:
        ZIP_PATH.unlink()
    except OSError:
        pass


if __name__ == "__main__":
    download()
