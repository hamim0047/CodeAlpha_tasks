# CodeAlpha Tasks

This repository contains the projects completed as part of my **CodeAlpha internship/tasks**. Each task is organized in a separate folder and demonstrates a different area of software development, artificial intelligence, natural language processing, deep learning, and computer vision.

## Projects Overview

| Task | Project | Main Technologies | Description |
|---|---|---|---|
| Task 1 | Language Translation Tool | ReactJS, Tailwind CSS, Translation API | A responsive translation application for translating text between multiple languages. |
| Task 2 | FAQ Chatbot | ReactJS, Flask, NLTK, Scikit-learn, TF-IDF, Cosine Similarity | A retrieval-based chatbot that finds the most relevant FAQ answer from an original dataset. |
| Task 3 | HarmonIQ / Neural Melody Studio | ReactJS, Flask, PyTorch, LSTM, music21, Tone.js | A deep-learning music generation system trained on MIDI data. |
| Task 4 | TrackVision AI | ReactJS, Flask, OpenCV, YOLO, SORT | A real-time object detection and multi-object tracking system for webcam and video input. |

---

## Task 1 — Language Translation Tool

A modern translation application that allows users to translate text between different languages through a clean and responsive interface.

### Main Features

- Source and target language selection
- Text translation
- Copy translated text
- Text-to-speech support
- Responsive interface
- Modern glass-style UI

### Technology Stack

```text
ReactJS
Vite
Tailwind CSS
Google Translation API
Lucide React
```

### Basic Flow

```text
User Text
   ↓
Select Source Language
   ↓
Select Target Language
   ↓
Translation Request
   ↓
Translation Service
   ↓
Translated Text
   ↓
Display / Copy / Listen
```

---

## Task 2 — FAQ Chatbot using NLP

A retrieval-based FAQ chatbot that uses classical NLP techniques to find the most relevant answer from an existing FAQ dataset.

The project uses the **Amazon Video Games Question/Answer dataset**.

### Main Features

- Original FAQ dataset
- NLTK text preprocessing
- Stop-word removal
- Lemmatization
- TF-IDF vectorization
- Cosine similarity
- Relevance filtering
- Low-confidence query rejection
- Suggested FAQ questions
- Similarity score display
- Responsive React chatbot interface

### Technology Stack

```text
Frontend:
ReactJS
Vite
Tailwind CSS
Lucide React

Backend:
Python
Flask
NLTK
Scikit-learn

NLP:
TF-IDF
Cosine Similarity
Lemmatization
Stop-word Removal
```

### Processing Flow

```text
User Question
      ↓
Text Preprocessing
      ↓
TF-IDF Vectorization
      ↓
Cosine Similarity
      ↓
Relevance Filtering
      ↓
Best FAQ Match
      ↓
Original Answer
```

---

## Task 3 — HarmonIQ / Neural Melody Studio

An AI-powered music generation project that learns musical patterns from MIDI files using a stacked LSTM neural network.

The project uses the **MAESTRO v3.0.0 MIDI dataset**.

### Main Features

- Original MIDI dataset
- MIDI preprocessing with music21
- Note, chord, and rest tokenization
- Vocabulary generation
- Sequence preparation
- PyTorch LSTM model
- Temperature-based music generation
- MIDI export
- Sampled piano browser preview using Tone.js
- Adjustable sequence length and temperature

### Technology Stack

```text
Frontend:
ReactJS
Vite
Tailwind CSS
Tone.js
Lucide React

Backend / AI:
Python
Flask
PyTorch
music21
NumPy
```

### AI Pipeline

```text
MAESTRO MIDI
      ↓
music21 Parsing
      ↓
Notes / Chords / Rests
      ↓
Symbolic Tokens
      ↓
Training Sequences
      ↓
Embedding
      ↓
LSTM
      ↓
Next-Token Prediction
      ↓
Temperature Sampling
      ↓
Generated Music
      ↓
MIDI Output
```

---

## Task 4 — TrackVision AI

A real-time computer vision system that performs object detection and multi-object tracking from webcam or uploaded video.

The project uses a pretrained **YOLO** model for detection and **SORT** for tracking.

### Main Features

- Webcam input
- Video upload
- Real-time object detection
- Bounding boxes
- Class labels
- Confidence scores
- Persistent tracking IDs
- SORT tracking
- Kalman Filter
- IoU matching
- Hungarian assignment
- FPS display
- Object counts
- Adjustable detection threshold

### Technology Stack

```text
Frontend:
ReactJS
Vite
Tailwind CSS
Lucide React

Backend:
Python
Flask
OpenCV
Ultralytics YOLO
NumPy
SciPy
FilterPy

Tracking:
SORT
Kalman Filter
IoU
Hungarian Algorithm
```

### Computer Vision Pipeline

```text
Webcam / Video
      ↓
OpenCV
      ↓
YOLO Detection
      ↓
Bounding Boxes
      ↓
SORT Tracker
      ↓
Kalman Prediction
      ↓
IoU Matching
      ↓
Hungarian Assignment
      ↓
Persistent Track IDs
      ↓
Annotated Video Stream
      ↓
React Dashboard
```

---

## Repository Structure

```text
CodeAlpha_tasks/
│
├── Task 1 - Translation Tool/
│   └── README.md
│
├── Task 2 - FAQ Chatbot/
│   └── README.md
│
├── Task 3 - HarmonIQ/
│   └── README.md
│
├── Task 4 - TrackVision AI/
│   └── README.md
│
└── README.md
```

> Folder names may differ slightly in the repository. Each project folder contains its own source code and task-specific setup instructions.

---

## General Requirements

Depending on the project, you may need:

```text
Node.js
npm
Python 3
pip
Git
```

Some projects also require:

```text
PyTorch
OpenCV
Ultralytics
music21
NLTK
Scikit-learn
Flask
```

---

## Running a Project

Each project is independent. Open the required task folder and follow the README inside that folder.

For most React projects:

```bash
npm install
npm run dev
```

For projects with a Python backend:

```bash
cd backend

python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
python app.py
```

Then start the frontend from the project root:

```bash
npm install
npm run dev
```

---

## Skills Demonstrated

This repository demonstrates practical experience with:

- React frontend development
- Responsive UI design
- REST API integration
- Python backend development
- Flask
- Natural Language Processing
- TF-IDF and cosine similarity
- Deep learning
- LSTM neural networks
- MIDI processing
- AI music generation
- OpenCV
- YOLO object detection
- SORT multi-object tracking
- Kalman filtering
- Data preprocessing
- Model inference
- Full-stack AI application development

---

## Datasets and Models

### FAQ Chatbot
Uses the Amazon Question/Answer dataset, particularly the Video Games category.

### AI Music Generation
Uses the MAESTRO v3.0.0 MIDI dataset.

### Object Detection and Tracking
Uses a pretrained Ultralytics YOLO model for general-purpose object detection.

Please refer to the README inside each project folder for project-specific attribution and setup details.

---

## Notes

- Each task is developed as an independent project.
- Individual projects may require different Python package versions.
- Python virtual environments are recommended for backend projects.
- Large datasets, trained model files, generated files, and virtual environments may be excluded from Git using `.gitignore`.
- API keys and private credentials should never be committed to the repository.

---

## Project Status

| Task | Status |
|---|---|
| Task 1 — Language Translation Tool | ✅ Completed |
| Task 2 — FAQ Chatbot | ✅ Completed |
| Task 3 — AI Music Generation | ✅ Completed |
| Task 4 — Object Detection & Tracking | ✅ Completed |

---

## Author

**Hamim**

---

## Repository

**CodeAlpha_tasks**

A collection of CodeAlpha projects covering:

```text
Web Development
Natural Language Processing
Deep Learning
Generative AI
Computer Vision
Object Tracking
```

---

## License

This repository is primarily intended for educational and internship project purposes.

External datasets, pretrained models, APIs, and third-party libraries remain subject to their respective licenses and terms of use.
