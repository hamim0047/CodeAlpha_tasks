from __future__ import annotations

from pathlib import Path
import sys

import requests

DATASET_URL = (
    "https://mcauleylab.ucsd.edu/public_datasets/data/"
    "amazon/qa/qa_Video_Games.json.gz"
)

BASE_DIR = Path(__file__).resolve().parent
DATASET_DIR = BASE_DIR / "dataset"
OUTPUT_PATH = DATASET_DIR / "qa_Video_Games.json.gz"


def download():
    DATASET_DIR.mkdir(parents=True, exist_ok=True)

    if OUTPUT_PATH.exists() and OUTPUT_PATH.stat().st_size > 0:
        print(f"Dataset already exists:\n{OUTPUT_PATH}")
        return

    print("Downloading the original UCSD Amazon Video Games Q/A dataset...")
    print(DATASET_URL)

    headers = {
        "User-Agent": "Mozilla/5.0 FAQChatbotEducationalProject/1.0"
    }

    try:
        with requests.get(
            DATASET_URL,
            stream=True,
            timeout=60,
            headers=headers,
        ) as response:
            response.raise_for_status()

            total = int(response.headers.get("content-length", 0))
            downloaded = 0

            with OUTPUT_PATH.open("wb") as file:
                for chunk in response.iter_content(
                    chunk_size=1024 * 1024
                ):
                    if not chunk:
                        continue

                    file.write(chunk)
                    downloaded += len(chunk)

                    if total:
                        percentage = downloaded / total * 100
                        print(
                            f"\rDownloaded {percentage:5.1f}%",
                            end="",
                            flush=True,
                        )

        print(f"\nDataset saved to:\n{OUTPUT_PATH}")

    except Exception as error:
        if OUTPUT_PATH.exists():
            OUTPUT_PATH.unlink(missing_ok=True)

        print("\nDataset download failed.")
        print(error)
        print(
            "\nYou can manually download the Video Games file "
            "from the official UCSD Amazon Q/A dataset page and save it as:\n"
            f"{OUTPUT_PATH}"
        )
        sys.exit(1)


if __name__ == "__main__":
    download()
