# Neural Melody Studio — AI Music Generation with LSTM

A full-stack student project that trains a deep-learning model on MIDI music
and generates new symbolic piano sequences.

The system uses the **MAESTRO v3.0.0 MIDI-only dataset**, preprocesses MIDI
music using `music21`, trains a stacked LSTM model with PyTorch, generates new
note/chord/rest sequences, converts them back into MIDI, and provides a
React-based interface for generating, previewing, and downloading music.

For browser playback, the project uses **Tone.js with sampled piano sounds**
instead of a simple oscillator, providing a much better preview quality.

---

## Stack

### Frontend
- ReactJS
- Vite
- Tailwind CSS
- Lucide React
- Tone.js
- Sampled piano playback

### Backend / AI
- Python
- Flask
- PyTorch
- music21
- NumPy
- Requests
- tqdm

### Dataset
- MAESTRO v3.0.0 MIDI-only archive
- Classical piano performances

---

## Why MAESTRO?

MAESTRO is a public research dataset of professional piano performances. The
full dataset contains synchronized audio and MIDI, but this project uses only
the much smaller MIDI-only archive.

The MIDI-only MAESTRO v3.0.0 download is approximately **56 MB**.

Official page:

```text
https://magenta.tensorflow.org/datasets/maestro
```

---

## Project Structure

```text
Neural-Melody-Studio/
├── backend/
│   ├── dataset/
│   ├── artifacts/
│   ├── generated/
│   ├── app.py
│   ├── config.py
│   ├── download_dataset.py
│   ├── preprocess.py
│   ├── model.py
│   ├── train.py
│   ├── generator.py
│   ├── test_generation.py
│   └── requirements.txt
│
├── src/
│   ├── components/
│   │   ├── Metric.jsx
│   │   └── StepCard.jsx
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
│
├── index.html
├── vite.config.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

---

## Pipeline

```text
MAESTRO MIDI files
        ↓
music21 parsing
        ↓
Chordify polyphonic piano
        ↓
Quantized symbolic tokens
        ↓
N / C / R event vocabulary
        ↓
Training windows
        ↓
Embedding
        ↓
2-layer LSTM
        ↓
Next-token prediction
        ↓
Temperature sampling
        ↓
Generated note/chord/rest tokens
        ↓
music21 MIDI conversion
        ↓
Generated .mid file
        ↓
React Interface
   ├── Tone.js Piano Preview
   └── Download MIDI
```

---

## Token Format

Examples:

```text
N:60:1.0
```

means MIDI note 60 (C4) with a duration of one quarter note.

```text
C:60.64.67:0.5
```

means a C-major chord with duration `0.5`.

```text
R:0.5
```

means a rest.

---

## 1. Frontend Setup

From the project root:

```bash
npm install
npm install lucide-react tone
npm install -D tailwindcss @tailwindcss/vite
```

Run React:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## 2. Python Environment

Use Python 3.11 or 3.12 if possible.

```bash
cd backend

python3 -m venv .venv
source .venv/bin/activate
```

Upgrade pip:

```bash
python -m pip install --upgrade pip setuptools wheel
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### Intel Mac note

If newer PyTorch versions are unavailable on Intel/x86_64 macOS, use:

```bash
pip install torch==2.2.2
pip install numpy==1.26.4
```

---

## 3. Download the Dataset

```bash
python download_dataset.py
```

This downloads and extracts the MAESTRO v3.0.0 MIDI-only archive.

---

## 4. Preprocess MIDI

Start with a smaller subset:

```bash
python preprocess.py --max-files 20
```

For a larger run:

```bash
python preprocess.py --max-files 40
```

For stronger training later:

```bash
python preprocess.py --max-files 100
```

Use all MIDI files:

```bash
python preprocess.py --max-files 0
```

Generated artifacts:

```text
backend/artifacts/tokens.json
backend/artifacts/vocab.json
```

---

## 5. Train the LSTM

Quick first run:

```bash
python train.py --epochs 2 --max-sequences 8000
```

Laptop-friendly:

```bash
python train.py --epochs 3 --max-sequences 15000
```

Better training:

```bash
python train.py --epochs 10 --max-sequences 50000
```

Use every available training window:

```bash
python train.py --epochs 10 --max-sequences 0
```

The script automatically chooses:

```text
CUDA → NVIDIA GPU
MPS  → Apple Silicon GPU
CPU  → fallback
```

The best model is saved as:

```text
backend/artifacts/music_lstm.pt
```

Training information is saved as:

```text
backend/artifacts/training_info.json
```

---

## 6. Test Generation in Python

```bash
python test_generation.py
```

A MIDI file will be created inside:

```text
backend/generated/
```

---

## 7. Start Flask

```bash
python app.py
```

Backend:

```text
http://127.0.0.1:5000
```

Keep it running.

---

## 8. Start React

In another terminal from the project root:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

Vite proxies `/api` requests to Flask.

---

## Generation Controls

### Sequence Length
Controls how many symbolic music events are sampled.

Recommended:

```text
64–96 events
```

### Temperature
Lower values create safer/more repetitive sequences.
Higher values produce more variation and unpredictability.

Recommended:

```text
0.7 – 1.0
```

---

## High-Quality Browser Preview

The original version used a simple Web Audio oscillator, which sounded synthetic.

The improved version uses:

```text
Tone.js + sampled piano sounds
```

Install:

```bash
npm install tone
```

Import:

```js
import * as Tone from "tone";
```

The project uses `Tone.Sampler` so generated note events are played with sampled
piano audio rather than a triangle-wave oscillator.

### Browser Preview Flow

```text
Generated Tokens
      ↓
Token Parser
      ↓
MIDI Pitch → Note Name
      ↓
Tone.js Sampler
      ↓
Sampled Piano
      ↓
Browser Audio
```

### Downloaded MIDI Flow

```text
Generated Tokens
      ↓
music21
      ↓
MIDI File
      ↓
GarageBand / Logic / MuseScore / MIDI Player
```

The downloaded MIDI may sound even better because professional applications can
use higher-quality instruments and effects.

---

## API

### Health

```http
GET /api/health
```

### Generate

```http
POST /api/generate
Content-Type: application/json
```

Body:

```json
{
  "length": 96,
  "temperature": 0.9
}
```

Response:

```json
{
  "tokens": ["N:60:0.5", "C:60.64.67:1.0"],
  "event_count": 96,
  "temperature": 0.9,
  "midi_url": "/api/midi/generated_xxxxx.mid"
}
```

### Download generated MIDI

```http
GET /api/midi/<filename>
```

---

## Assignment Requirements Covered

| Requirement | Implementation |
|---|---|
| Collect MIDI music data | MAESTRO v3.0.0 |
| Preprocess music | music21 |
| Create note sequences | note/chord/rest tokenization |
| Deep learning model | PyTorch LSTM |
| Train model | `train.py` |
| Generate new sequences | temperature sampling |
| Convert to MIDI | music21 |
| Play generated sequence | Tone.js sampled piano |
| Save result | downloadable `.mid` file |
| User interface | React + Tailwind CSS |

---

## Important Note About Training

Do not begin with all 1,000+ MAESTRO performances on a laptop.

First confirm the complete pipeline using:

```bash
python preprocess.py --max-files 20
python train.py --epochs 2 --max-sequences 8000
```

After everything works, increase the dataset size and epochs.

---

## Full First-Run Workflow

### Terminal 1 — Backend

```bash
cd backend

python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt

python download_dataset.py

python preprocess.py --max-files 20

python train.py --epochs 2 --max-sequences 8000

python test_generation.py

python app.py
```

### Terminal 2 — Frontend

```bash
npm install
npm install tone
npm run dev
```

Then open:

```text
http://localhost:5173
```

---

## Limitations

This is a learning-oriented sequence model, not a production music generator.

- Chordification simplifies the original polyphonic performance.
- Dynamics, pedals, and detailed expressive timing are not fully modeled.
- Small training runs may sound repetitive.
- LSTMs learn local sequential patterns better than long musical structure.
- Browser playback depends on the sampled piano implementation.
- Training can be slow on CPU.

---

## Possible Improvements

- Add velocity tokens.
- Add tempo tokens.
- Preserve exact onset timing.
- Preserve pedal information.
- Add expressive dynamics.
- Train on more MAESTRO files.
- Increase training epochs.
- Add composer/style selection.
- Add piano-roll visualization.
- Add training-loss charts.
- Allow MIDI upload as a seed.
- Use a Transformer instead of an LSTM.
- Render generated MIDI to WAV/MP3.
- Deploy generation through a GPU-backed server.

---

## Troubleshooting

### `@tailwindcss/vite` cannot be resolved

```bash
npm install -D tailwindcss @tailwindcss/vite
```

### `lucide-react` cannot be resolved

```bash
npm install lucide-react
```

### `tone` cannot be resolved

```bash
npm install tone
```

### Model shows `Not Trained`

Check:

```text
backend/artifacts/music_lstm.pt
```

If missing:

```bash
python train.py --epochs 2 --max-sequences 8000
```

### Dataset shows `Missing`

```bash
python download_dataset.py
```

### Browser preview has no sound

Check:
- browser volume
- system volume
- autoplay permissions
- Tone.js installation
- internet connection if piano samples are loaded remotely

### Browser preview sounds different from downloaded MIDI

This is expected. The browser uses Tone.js sampled piano playback, while the
downloaded MIDI may be rendered by a higher-quality instrument in GarageBand,
Logic, MuseScore, or another MIDI player.

---

## Dataset Attribution

MAESTRO was introduced by Hawthorne et al. for piano music transcription and
generation research.

Dataset version:

```text
MAESTRO v3.0.0
```

Official page:

```text
https://magenta.tensorflow.org/datasets/maestro
```

The dataset is distributed under **CC BY-NC-SA 4.0**.

---

## Author

Hamim

---

## Project

**Task 3 — Music Generation with AI**

This project demonstrates how MIDI preprocessing, symbolic music
representation, LSTM sequence modeling, temperature sampling, MIDI conversion,
and sampled browser playback can be combined to build an AI-based music
generation system.
