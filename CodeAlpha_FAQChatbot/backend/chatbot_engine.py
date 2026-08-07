from __future__ import annotations

import ast
import gzip
import os
import random
import re
from dataclasses import dataclass

import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


@dataclass(frozen=True)
class FAQRecord:
    question: str
    answer: str
    asin: str
    question_type: str


class FAQChatbot:
    def __init__(
        self,
        dataset_path: str,
        similarity_threshold: float = 0.34,
    ):
        self.dataset_path = dataset_path
        self.similarity_threshold = similarity_threshold

        self._prepare_nltk()

        self.stop_words = set(stopwords.words("english"))
        self.lemmatizer = WordNetLemmatizer()

        # These words often produce misleading FAQ matches by themselves.
        self.low_information_terms = {
            "today",
            "tomorrow",
            "yesterday",
            "something",
            "anything",
            "thing",
            "new",
            "old",
            "tell",
            "know",
            "please",
        }

        self.records = self._load_dataset()
        self.faq_count = len(self.records)

        if not self.records:
            raise RuntimeError("No FAQ records were loaded from the dataset.")

        self.original_questions = [r.question for r in self.records]
        self.processed_questions = [
            self.preprocess(r.question) for r in self.records
        ]

        self.vectorizer = TfidfVectorizer(
            lowercase=False,
            ngram_range=(1, 2),
            sublinear_tf=True,
            min_df=2,
            max_features=60000,
        )

        self.faq_matrix = self.vectorizer.fit_transform(
            self.processed_questions
        )

    @staticmethod
    def _prepare_nltk():
        resources = {
            "corpora/stopwords": "stopwords",
            "corpora/wordnet": "wordnet",
            "corpora/omw-1.4": "omw-1.4",
        }

        for resource_path, package_name in resources.items():
            try:
                nltk.data.find(resource_path)
            except LookupError:
                nltk.download(package_name, quiet=True)

    def _load_dataset(self) -> list[FAQRecord]:
        if not os.path.exists(self.dataset_path):
            raise FileNotFoundError(
                f"Dataset not found: {self.dataset_path}"
            )

        records = []
        seen_questions = set()

        with gzip.open(
            self.dataset_path,
            "rt",
            encoding="utf-8",
            errors="replace",
        ) as file:
            for line in file:
                line = line.strip()

                if not line:
                    continue

                try:
                    item = ast.literal_eval(line)
                except (ValueError, SyntaxError):
                    continue

                question = str(item.get("question", "")).strip()
                answer = str(item.get("answer", "")).strip()

                if not question or not answer:
                    continue

                question_key = question.casefold()

                if question_key in seen_questions:
                    continue

                seen_questions.add(question_key)

                records.append(
                    FAQRecord(
                        question=question,
                        answer=answer,
                        asin=str(item.get("asin", "")).strip(),
                        question_type=str(
                            item.get("questionType", "")
                        ).strip(),
                    )
                )

        return records

    def preprocess(self, text: str) -> str:
        text = text.lower()
        text = re.sub(r"[^a-z0-9\s]", " ", text)
        text = re.sub(r"\s+", " ", text).strip()

        tokens = []

        for token in text.split():
            if len(token) <= 1:
                continue

            if token in self.stop_words:
                continue

            tokens.append(self.lemmatizer.lemmatize(token))

        return " ".join(tokens) or text

    def _meaningful_token_sets(
        self,
        query: str,
        candidate: str,
    ) -> tuple[set[str], set[str], set[str]]:
        query_tokens = {
            token
            for token in query.split()
            if token not in self.low_information_terms
        }

        candidate_tokens = {
            token
            for token in candidate.split()
            if token not in self.low_information_terms
        }

        shared = query_tokens & candidate_tokens

        return query_tokens, candidate_tokens, shared

    def _passes_relevance_gate(
        self,
        processed_question: str,
        processed_candidate: str,
        cosine_score: float,
    ) -> tuple[bool, dict]:
        query_tokens, candidate_tokens, shared = (
            self._meaningful_token_sets(
                processed_question,
                processed_candidate,
            )
        )

        shared_count = len(shared)

        if not query_tokens:
            return False, {
                "shared_terms": [],
                "shared_term_count": 0,
                "query_term_count": 0,
                "coverage": 0.0,
            }

        coverage = shared_count / len(query_tokens)

        # Main rule:
        # A normal question must share at least two meaningful terms.
        # This stops:
        #   "weather today"
        # from matching:
        #   "order today get"
        #
        # Very short questions are accepted only when the cosine score is
        # exceptionally high and all meaningful query terms overlap.
        if len(query_tokens) == 1:
            passes = (
                shared_count == 1
                and cosine_score >= 0.82
            )
        else:
            passes = (
                shared_count >= 2
                and coverage >= 0.40
                and cosine_score >= self.similarity_threshold
            )

        return passes, {
            "shared_terms": sorted(shared),
            "shared_term_count": shared_count,
            "query_term_count": len(query_tokens),
            "coverage": round(coverage, 4),
        }

    def answer(self, user_question: str) -> dict:
        processed_question = self.preprocess(user_question)

        if not processed_question:
            return {
                "answer": (
                    "I couldn't understand that question. "
                    "Please ask a more specific Video Games product question."
                ),
                "matched_question": None,
                "similarity": 0.0,
                "matched": False,
            }

        user_vector = self.vectorizer.transform([processed_question])

        similarities = cosine_similarity(
            user_vector,
            self.faq_matrix,
        ).ravel()

        # Look at several top candidates instead of blindly accepting top-1.
        top_indices = similarities.argsort()[-5:][::-1]

        best_rejected = None

        for index in top_indices:
            index = int(index)
            score = float(similarities[index])
            record = self.records[index]
            processed_candidate = self.processed_questions[index]

            passes, relevance = self._passes_relevance_gate(
                processed_question,
                processed_candidate,
                score,
            )

            candidate_data = {
                "record": record,
                "score": score,
                "relevance": relevance,
            }

            if best_rejected is None:
                best_rejected = candidate_data

            if passes:
                return {
                    "answer": record.answer,
                    "matched_question": record.question,
                    "similarity": round(score, 4),
                    "matched": True,
                    "asin": record.asin or None,
                    "question_type": record.question_type or None,
                    "shared_terms": relevance["shared_terms"],
                    "coverage": relevance["coverage"],
                }

        # Nothing in the top candidates passed the relevance gate.
        closest_record = best_rejected["record"]
        closest_score = best_rejected["score"]
        closest_relevance = best_rejected["relevance"]

        return {
            "answer": (
                "I couldn't find a relevant match in the original Video Games "
                "FAQ dataset. Please ask a more specific question about a game, "
                "console, controller, compatibility, multiplayer, installation, "
                "edition, cable, headset, or another gaming product feature."
            ),
            "matched_question": closest_record.question,
            "similarity": round(closest_score, 4),
            "matched": False,
            "asin": closest_record.asin or None,
            "shared_terms": closest_relevance["shared_terms"],
            "coverage": closest_relevance["coverage"],
        }

    def get_suggestions(self, count: int = 4) -> list[str]:
        candidates = [
            question
            for question in self.original_questions
            if 20 <= len(question) <= 90
        ]

        if not candidates:
            candidates = self.original_questions

        random_generator = random.Random(42)

        return random_generator.sample(
            candidates,
            min(count, len(candidates)),
        )
