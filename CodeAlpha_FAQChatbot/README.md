# FAQ Chatbot using NLP

A responsive FAQ chatbot built with **ReactJS**, **Tailwind CSS**, **Flask**, **NLTK**, **TF-IDF**, and **Cosine Similarity**.

The chatbot uses the **original Amazon Video Games Question/Answer dataset** from the UCSD Amazon Product Data collection. Instead of generating answers with ChatGPT, Gemini, or another generative AI service, the system preprocesses the user's question, compares it with real questions from the dataset, finds the most relevant FAQ, and returns the corresponding original answer.

---

## Project Objective

The goal of this project is to build an FAQ chatbot that can:

- Use a real FAQ-style question-answer dataset
- Preprocess user text using NLP techniques
- Convert FAQ questions into numerical vectors
- Compare user questions with existing FAQs
- Find the most similar question using cosine similarity
- Return the best matching original answer
- Reject unrelated or low-confidence questions
- Provide a responsive chatbot interface

---

## Features

- Original Amazon Video Games Q&A dataset
- NLTK-based text preprocessing
- Lowercase conversion
- Punctuation removal
- Stop-word removal
- Lemmatization
- TF-IDF vectorization
- Unigram and bigram features
- Cosine similarity matching
- Relevance filtering
- Minimum meaningful-word overlap
- Low-confidence match rejection
- Top-candidate checking
- Real FAQ suggestions loaded from the backend
- Matched FAQ display
- Similarity percentage display
- Responsive React chat interface
- Mobile, tablet, laptop, and desktop support
- Sticky chatbot header
- Sticky message input
- Scrollable chat history
- Animated background
- Typing indicator
- Clear-chat option
- Backend connection status

---

## Technology Stack

### Frontend

- ReactJS
- Vite
- Tailwind CSS
- Lucide React
- CSS animations

### Backend

- Python
- Flask
- NLTK
- Scikit-learn
- TF-IDF Vectorizer
- Cosine Similarity

### Dataset

- Amazon Question/Answer Dataset
- Category: **Video Games**
- Source: UCSD / Julian McAuley Amazon Product Data

Official dataset page:

```text
https://cseweb.ucsd.edu/~jmcauley/datasets/amazon/qa/
```

---

## System Architecture

```text
                   USER
                     │
                     ▼
              React Chat UI
                     │
                     │ POST /api/chat
                     ▼
               Flask Backend
                     │
                     ▼
              NLP Preprocessing
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
 User Question               FAQ Questions
        │                         │
        ▼                         ▼
 Lowercase                  Lowercase
 Cleaning                   Cleaning
 Stop Words                 Stop Words
 Lemmatization              Lemmatization
        │                         │
        └────────────┬────────────┘
                     ▼
              TF-IDF Vectors
                     │
                     ▼
             Cosine Similarity
                     │
                     ▼
             Top FAQ Candidates
                     │
                     ▼
              Relevance Filter
                     │
              ┌──────┴──────┐
              │             │
          Good Match     Weak Match
              │             │
              ▼             ▼
        Original Answer   No-match
              │           Response
              └──────┬──────┘
                     ▼
              React Chat UI
```

---

## NLP Processing Pipeline

```text
Raw Question
     ↓
Convert to lowercase
     ↓
Remove punctuation
     ↓
Normalize whitespace
     ↓
Remove stop words
     ↓
Lemmatization
     ↓
TF-IDF Vectorization
     ↓
Cosine Similarity
     ↓
Relevance Validation
     ↓
Best Matching FAQ
```

Example:

```text
Original:
"Does this controller work with computers?"

After preprocessing:
"controller work computer"
```

---

## Why TF-IDF?

TF-IDF stands for:

```text
Term Frequency - Inverse Document Frequency
```

It gives higher importance to useful words while reducing the importance of common words.

Words such as:

```text
controller
playstation
xbox
multiplayer
compatible
```

are generally more informative than words such as:

```text
the
is
and
this
```

The chatbot converts all FAQ questions and the user's question into TF-IDF vectors.

---

## Cosine Similarity

Cosine similarity measures how similar two text vectors are.

The value normally ranges from:

```text
0.0 → very different
1.0 → highly similar
```

Example:

```text
User:
Is this compatible with Xbox One?

Matched FAQ:
Is it compatible with Xbox one?

Similarity:
100%
```

---

## Relevance Filtering

A high cosine similarity score does not always mean the questions are actually related.

For example:

```text
User:
What is the weather today?

Bad match:
If I order this today, when will I get it?
```

Both questions contain the word:

```text
today
```

A simple TF-IDF system may therefore produce an incorrect match.

To reduce false matches, this project also checks:

- Cosine similarity score
- Number of meaningful shared words
- Query-term coverage
- Low-information words
- Several top candidates instead of only the first result

Low-information words such as:

```text
today
tomorrow
something
anything
new
old
tell
please
```

cannot create a valid match by themselves.

---

## Project Structure

```text
FAQChatbot/
│
├── backend/
│   ├── app.py
│   ├── chatbot_engine.py
│   ├── download_dataset.py
│   ├── test_api.py
│   ├── requirements.txt
│   │
│   └── dataset/
│       └── qa_Video_Games.json.gz
│
├── src/
│   ├── components/
│   │   ├── ChatInput.jsx
│   │   ├── ChatMessage.jsx
│   │   ├── SuggestedQuestions.jsx
│   │   └── TypingIndicator.jsx
│   │
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

## Prerequisites

Install:

- Node.js 18 or newer
- npm
- Python 3.10 or newer
- pip

Check versions:

```bash
node -v
npm -v
python3 --version
```

---

## Frontend Installation

Open the project directory:

```bash
cd FAQChatbot
```

Install dependencies:

```bash
npm install
```

If required:

```bash
npm install lucide-react
npm install -D tailwindcss @tailwindcss/vite
```

---

## Backend Installation

Open the backend folder:

```bash
cd backend
```

Create a virtual environment:

```bash
python3 -m venv .venv
```

Activate it on macOS/Linux:

```bash
source .venv/bin/activate
```

On Windows:

```text
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

## Download the Original Dataset

From inside the `backend` directory:

```bash
python download_dataset.py
```

The file will be saved as:

```text
backend/dataset/qa_Video_Games.json.gz
```

---

## Start the Backend

Inside:

```text
FAQChatbot/backend
```

activate the environment:

```bash
source .venv/bin/activate
```

Then:

```bash
python app.py
```

The backend should run at:

```text
http://127.0.0.1:5000
```

---

## Start the Frontend

Open another terminal in the project root:

```bash
npm run dev
```

The frontend normally runs at:

```text
http://localhost:5173
```

---

## Vite Proxy

The frontend sends requests to `/api/...`, and Vite forwards them to Flask.

Example `vite.config.js`:

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    port: 5173,

    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
    },
  },
});
```

---

## API Endpoints

### Health Check

```http
GET /api/health
```

Example response:

```json
{
  "status": "ok",
  "dataset": "Amazon Video Games Question/Answer Dataset",
  "faq_count": 9567,
  "model": "NLTK + TF-IDF + Cosine Similarity",
  "similarity_threshold": 0.34
}
```

The exact FAQ count may vary because duplicate or malformed entries can be removed.

### FAQ Suggestions

```http
GET /api/suggestions?count=4
```

The returned questions come from the original dataset.

### Chat Endpoint

```http
POST /api/chat
```

Request:

```json
{
  "question": "Is this compatible with Xbox One?"
}
```

Example successful response:

```json
{
  "answer": "Original answer from the Amazon dataset",
  "matched_question": "Is it compatible with Xbox one?",
  "similarity": 1.0,
  "matched": true,
  "asin": "PRODUCT_ID",
  "shared_terms": [
    "compatible",
    "xbox"
  ]
}
```

---

## No-Match Response

If the question is unrelated:

```text
What is the weather today?
```

the chatbot should reject the result rather than return an unrelated FAQ answer.

---

## Testing the API

Health check:

```bash
curl http://127.0.0.1:5000/api/health
```

Relevant question:

```bash
curl -X POST http://127.0.0.1:5000/api/chat -H "Content-Type: application/json" -d '{"question":"Is this compatible with Xbox One?"}'
```

Unrelated question:

```bash
curl -X POST http://127.0.0.1:5000/api/chat -H "Content-Type: application/json" -d '{"question":"What is the weather today?"}'
```

---

## Example Questions

### Relevant

```text
Is this compatible with Xbox One?
Can I use this controller on PC?
Does this game support multiplayer?
Does this game require internet?
Is this compatible with PS4?
Does this include a charging cable?
Can two people play this game together?
```

### Unrelated

These should normally be rejected:

```text
What is the weather today?
Who is the president?
How do I cook chicken?
Tell me something new.
What is artificial intelligence?
```

---

## Frontend Design

The interface includes:

- Midnight-ocean theme
- Glass-style cards
- Cyan and sky-blue accents
- Warm amber highlights
- Animated background aurora
- Chat bubbles
- Typing animation
- Suggested FAQ buttons
- Responsive sidebar
- Scrollable messages
- Sticky header
- Sticky input area

---

## Responsive Design

The application works on:

- Smartphones
- Tablets
- Laptops
- Desktop monitors
- Large screens

On smaller screens, the sidebar is hidden and the chat becomes full width.

On larger screens, the sidebar and chat interface appear together.

---

## Important Files

### `backend/app.py`

Handles:

```text
/api/health
/api/suggestions
/api/chat
```

### `backend/chatbot_engine.py`

Contains:

- Dataset loading
- NLP preprocessing
- Stop-word removal
- Lemmatization
- TF-IDF generation
- Cosine similarity
- Relevance filtering
- FAQ selection

### `backend/download_dataset.py`

Downloads the original Amazon Video Games Q&A dataset.

### `src/App.jsx`

Controls:

- Chat state
- Backend communication
- Dataset suggestions
- Messages
- Loading state
- Backend connection status

---

## Troubleshooting

### `@tailwindcss/vite` cannot be resolved

```bash
npm install -D tailwindcss @tailwindcss/vite
rm -rf node_modules/.vite
npm run dev
```

### `lucide-react` cannot be resolved

```bash
npm install lucide-react
```

### Dataset not found

```bash
cd backend
python download_dataset.py
```

Check:

```bash
ls dataset
```

You should see:

```text
qa_Video_Games.json.gz
```

### Vite Proxy Error / ECONNREFUSED

If you see:

```text
http proxy error: /api/chat
ECONNREFUSED
```

the Flask backend is not running.

Start it:

```bash
cd backend
source .venv/bin/activate
python app.py
```

---

## Assignment Requirements Covered

| Requirement | Implementation |
|---|---|
| Collect FAQs | Original Amazon Video Games Q&A dataset |
| Preprocess text | NLTK |
| Text cleaning | Lowercase, punctuation removal, stop-word removal |
| NLP normalization | Lemmatization |
| Convert text to features | TF-IDF |
| Similarity matching | Cosine Similarity |
| Find best FAQ | Top candidate search + relevance filter |
| Display answer | React chatbot |
| Simple chat UI | React + Tailwind CSS |
| Reject irrelevant queries | Custom relevance gate |

---

## Advantages

- No paid AI API required
- Uses a real original dataset
- Demonstrates classical NLP concepts
- Fast after startup
- Easy to explain academically
- Transparent matching process
- Shows similarity score
- Rejects many unrelated queries

---

## Limitations

Because this is a retrieval-based FAQ chatbot:

- It cannot create completely new answers
- It only knows information contained in the dataset
- Vocabulary differences can reduce similarity
- TF-IDF does not fully understand semantic meaning
- Product context may be ambiguous because many products are mixed in the dataset

---

## Future Improvements

Possible improvements:

- Sentence-BERT embeddings
- Semantic search
- Product-specific filtering using ASIN
- Product-name detection
- Category filtering
- Spell correction
- Query expansion
- Conversation history
- User feedback
- Admin dashboard
- Search analytics
- Public deployment

---

## Run Both Applications

### Terminal 1 — Backend

```bash
cd backend
source .venv/bin/activate
python app.py
```

### Terminal 2 — Frontend

```bash
npm run dev
```

Then visit:

```text
http://localhost:5173
```

---

## Author

**Hamim**

---

## Project

**Task 2 — Chatbot for FAQs**

This project demonstrates how NLP preprocessing, TF-IDF vectorization, cosine similarity, and relevance filtering can be used to create a retrieval-based FAQ chatbot using an original question-answer dataset.

---

## Dataset Attribution

The project uses the Amazon Question/Answer dataset associated with the UCSD Amazon Product Data collection by Julian McAuley and collaborators.

Dataset page:

```text
https://cseweb.ucsd.edu/~jmcauley/datasets/amazon/qa/
```

Please follow the dataset authors' terms and citation guidance when using the data for academic or research work.

---

## License

This project is intended primarily for educational and academic use.

If publishing the source code publicly, consider adding an appropriate software license such as MIT. The dataset remains subject to the terms and attribution requirements of its original publisher.
