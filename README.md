# CodeAlpha Tasks

This repository contains the projects completed as part of my **CodeAlpha internship/tasks**. Each task is organized in a separate folder and focuses on a different area of software development and artificial intelligence.

## Projects

| Task | Project Folder | Main Technologies | Description |
|---|---|---|---|
| Task 1 | [CodeAlpha_Translator](./CodeAlpha_Translator/) | ReactJS, Tailwind CSS, Translation API | A responsive language translation application. |
| Task 2 | [CodeAlpha_FAQChatbot](./CodeAlpha_FAQChatbot/) | ReactJS, Flask, NLTK, TF-IDF, Cosine Similarity | An NLP-based FAQ chatbot using an original FAQ dataset. |
| Task 3 | [CodeAlpha_MelodyStudio](./CodeAlpha_MelodyStudio/) | ReactJS, Flask, PyTorch, LSTM, music21, Tone.js | An AI music generation system trained on MIDI data. |
| Task 4 | [CodeAlpha_TrackVisionAI](./CodeAlpha_TrackVisionAI/) | ReactJS, Flask, OpenCV, YOLO, SORT | A real-time object detection and tracking application. |

---

## Task 1 — Translator

📁 **Folder:** [CodeAlpha_Translator](./CodeAlpha_Translator/)

A modern language translation application that allows users to translate text between multiple languages through a responsive and user-friendly interface.

### Main Features

- Source and target language selection
- Text translation
- Copy translated text
- Text-to-speech support
- Responsive layout
- Modern UI

### Technology Stack

```text
ReactJS
Vite
Tailwind CSS
Google Translation API
Lucide React
```

### Flow

```text
User Text
   ↓
Select Languages
   ↓
Translation Request
   ↓
Translation Service
   ↓
Translated Text
   ↓
Display / Copy / Listen
```

For setup and implementation details, open:

👉 [CodeAlpha_Translator](./CodeAlpha_Translator/)

---

## Task 2 — FAQ Chatbot

📁 **Folder:** [CodeAlpha_FAQChatbot](./CodeAlpha_FAQChatbot/)

A retrieval-based FAQ chatbot that uses Natural Language Processing to find the most relevant answer from an existing FAQ dataset.

The project uses the **Amazon Video Games Question/Answer dataset**.

### Main Features

- Original FAQ dataset
- NLTK preprocessing
- Stop-word removal
- Lemmatization
- TF-IDF vectorization
- Cosine similarity
- Relevance filtering
- Low-confidence query rejection
- Suggested FAQ questions
- Similarity score display
- Responsive chatbot interface

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

### NLP Flow

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

For setup and implementation details, open:

👉 [CodeAlpha_FAQChatbot](./CodeAlpha_FAQChatbot/)

---

## Task 3 — Melody Studio

📁 **Folder:** [CodeAlpha_MelodyStudio](./CodeAlpha_MelodyStudio/)

An AI-powered music generation project that learns musical patterns from MIDI files using a stacked LSTM neural network.

The project uses the **MAESTRO v3.0.0 MIDI dataset**.

### Main Features

- MAESTRO MIDI dataset
- MIDI preprocessing with music21
- Note, chord, and rest tokenization
- Vocabulary generation
- Sequence preparation
- PyTorch LSTM model
- Temperature-based generation
- MIDI output
- Tone.js sampled piano preview
- Adjustable sequence length
- Adjustable temperature
- Download generated MIDI

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

For setup and implementation details, open:

👉 [CodeAlpha_MelodyStudio](./CodeAlpha_MelodyStudio/)

---

## Task 4 — TrackVision AI

📁 **Folder:** [CodeAlpha_TrackVisionAI](./CodeAlpha_TrackVisionAI/)

A real-time computer vision system that performs object detection and multi-object tracking from webcam or uploaded video.

The project uses a pretrained **YOLO** model for object detection and **SORT** for tracking.

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

For setup and implementation details, open:

👉 [CodeAlpha_TrackVisionAI](./CodeAlpha_TrackVisionAI/)

---

## Repository Structure

```text
CodeAlpha_tasks/
│
├── CodeAlpha_FAQChatbot/
│   └── README.md
│
├── CodeAlpha_MelodyStudio/
│   └── README.md
│
├── CodeAlpha_TrackVisionAI/
│   └── README.md
│
├── CodeAlpha_Translator/
│   └── README.md
│
└── README.md
```

---

## General Requirements

Depending on the task, the projects may require:

```text
Node.js
npm
Python 3
pip
Git
```

AI-related projects may also use:

```text
Flask
PyTorch
OpenCV
Ultralytics
music21
Tone.js
NLTK
Scikit-learn
SciPy
FilterPy
```

---

## Running the Projects

Each task is independent.

Open the required folder and follow the project-specific README.

### Typical React Setup

```bash
npm install
npm run dev
```

### Typical Python Backend Setup

```bash
cd backend

python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
python app.py
```

Then run the frontend from the task folder:

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
- TF-IDF
- Cosine similarity
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

### Melody Studio

Uses the MAESTRO v3.0.0 MIDI dataset.

### TrackVision AI

Uses a pretrained Ultralytics YOLO object detection model.

See each task folder's README for detailed setup and attribution information.

---

## Project Status

| Task | Project | Status |
|---|---|---|
| Task 1 | Translator | ✅ Completed |
| Task 2 | FAQ Chatbot | ✅ Completed |
| Task 3 | Melody Studio | ✅ Completed |
| Task 4 | TrackVision AI | ✅ Completed |

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
