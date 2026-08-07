# FAQ Chatbot Backend

Python Flask backend for the FAQ Chatbot assignment.

## NLP pipeline

```text
Original Amazon Video Games Q/A Dataset
            ↓
Load question + answer records
            ↓
NLTK preprocessing
- lowercase
- punctuation cleaning
- token cleanup
- stop-word removal
- lemmatization
            ↓
TF-IDF Vectorizer
            ↓
Cosine Similarity
            ↓
Best matching original FAQ
            ↓
Return the original answer
```

## Dataset

This project uses the original Amazon Question/Answer Dataset published by
Julian McAuley / UCSD.

Category used:

```text
Video Games
```

Expected filename:

```text
backend/dataset/qa_Video_Games.json.gz
```

Official dataset page:

```text
https://cseweb.ucsd.edu/~jmcauley/datasets/amazon/qa/
```

Original Video Games file:

```text
https://mcauleylab.ucsd.edu/public_datasets/data/amazon/qa/qa_Video_Games.json.gz
```

The dataset is not included in this ZIP. Download it using the included script.

## 1. Create a Python virtual environment

From the project root:

```bash
cd backend

python3 -m venv .venv
source .venv/bin/activate
```

On Windows:

```text
.venv\Scripts\activate
```

## 2. Install packages

```bash
pip install -r requirements.txt
```

## 3. Download the original dataset

```bash
python download_dataset.py
```

This creates:

```text
backend/dataset/qa_Video_Games.json.gz
```

## 4. Run Flask

```bash
python app.py
```

Expected address:

```text
http://127.0.0.1:5000
```

The first startup may take a little longer because:

- NLTK resources are downloaded if missing.
- The original FAQ dataset is parsed.
- TF-IDF vectors are generated.

After initialization, the same fitted model is reused for requests.

## API

### Health

```http
GET /api/health
```

Example:

```json
{
  "status": "ok",
  "dataset": "Amazon Video Games Question/Answer Dataset",
  "faq_count": 13307,
  "model": "TF-IDF + Cosine Similarity"
}
```

The exact loaded FAQ count can vary slightly if malformed or duplicate
question-answer records are discarded.

### Chat

```http
POST /api/chat
Content-Type: application/json
```

Request:

```json
{
  "question": "Does it work on PlayStation?"
}
```

Successful match:

```json
{
  "answer": "Original answer from the dataset",
  "matched_question": "Original matched FAQ question",
  "similarity": 0.72,
  "matched": true,
  "asin": "..."
}
```

Low-similarity result:

```json
{
  "answer": "Sorry, I could not find a sufficiently similar FAQ in the dataset. Please try rephrasing your question.",
  "matched_question": "...",
  "similarity": 0.08,
  "matched": false,
  "asin": "..."
}
```

### Dataset suggestions

```http
GET /api/suggestions?count=4
```

Returns original FAQ questions from the dataset.

## Connect to the React frontend

Your current Vite configuration should contain:

```js
server: {
  port: 5173,
  proxy: {
    "/api": {
      target: "http://127.0.0.1:5000",
      changeOrigin: true
    }
  }
}
```

Start Flask in one terminal:

```bash
cd backend
source .venv/bin/activate
python app.py
```

Start React in another terminal from the project root:

```bash
npm run dev
```

Then use:

```text
http://localhost:5173
```

## Important frontend change

The demo frontend currently contains:

```js
const [backendReady] = useState(false);
```

Change it to:

```js
const [backendReady] = useState(true);
```

Otherwise the frontend intentionally stays in demo mode and will never call
`/api/chat`.

## Similarity threshold

The default threshold is:

```python
0.20
```

It can be adjusted in `app.py`:

```python
chatbot = FAQChatbot(
    dataset_path=DATASET_PATH,
    similarity_threshold=0.20,
)
```

Higher threshold:
- fewer wrong matches
- more "no suitable FAQ" responses

Lower threshold:
- more answers
- greater chance of unrelated matches

## Assignment requirements covered

- Collect FAQs: original Amazon Q/A dataset
- NLP preprocessing: NLTK
- Text cleaning: lowercase, punctuation removal, stopword removal, lemmatization
- Feature extraction: TF-IDF
- Similarity matching: cosine similarity
- Best answer returned as chatbot response
- React UI connects through `/api/chat`
