from __future__ import annotations

import os
from flask import Flask, jsonify, request

from chatbot_engine import FAQChatbot

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(
    BASE_DIR,
    "dataset",
    "qa_Video_Games.json.gz",
)

app = Flask(__name__)

# A stronger threshold prevents generic/unrelated questions from receiving
# random-looking answers from the dataset.
chatbot = FAQChatbot(
    dataset_path=DATASET_PATH,
    similarity_threshold=0.34,
)


@app.get("/api/health")
def health():
    return jsonify(
        {
            "status": "ok",
            "dataset": "Amazon Video Games Question/Answer Dataset",
            "faq_count": chatbot.faq_count,
            "model": "NLTK + TF-IDF + Cosine Similarity",
            "similarity_threshold": chatbot.similarity_threshold,
        }
    )


@app.get("/api/suggestions")
def suggestions():
    count = request.args.get("count", default=4, type=int)
    count = max(1, min(count, 8))

    return jsonify(
        {
            "suggestions": chatbot.get_suggestions(count=count),
        }
    )


@app.post("/api/chat")
def chat():
    data = request.get_json(silent=True) or {}
    question = str(data.get("question", "")).strip()

    if not question:
        return jsonify({"error": "Please enter a question."}), 400

    if len(question) > 500:
        return jsonify(
            {"error": "Question must be 500 characters or fewer."}
        ), 400

    return jsonify(chatbot.answer(question))


@app.errorhandler(404)
def not_found(_error):
    return jsonify({"error": "Endpoint not found."}), 404


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
