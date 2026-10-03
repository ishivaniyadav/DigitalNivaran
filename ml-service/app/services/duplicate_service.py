import re

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def clean_text(text):
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()

    return text


def calculate_similarity(text1, text2):
    text1 = clean_text(text1)
    text2 = clean_text(text2)

    vectorizer = TfidfVectorizer()

    vectors = vectorizer.fit_transform([
        text1,
        text2
    ])

    similarity = cosine_similarity(
        vectors[0:1],
        vectors[1:2]
    )[0][0]

    return float(similarity)


def is_duplicate(
    new_description,
    existing_descriptions,
    threshold=0.70
):
    if not existing_descriptions:
        return {
            "is_duplicate": False,
            "similarity": 0,
            "matched_index": None
        }

    best_similarity = 0
    matched_index = None

    for index, description in enumerate(existing_descriptions):
        similarity = calculate_similarity(
            new_description,
            description
        )

        if similarity > best_similarity:
            best_similarity = similarity
            matched_index = index

    return {
        "is_duplicate": best_similarity >= threshold,
        "similarity": round(best_similarity, 4),
        "matched_index": matched_index
    }