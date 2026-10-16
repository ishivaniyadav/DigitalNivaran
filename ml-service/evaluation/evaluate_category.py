import os

import joblib
import pandas as pd

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix
)


BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

DATASET_PATH = os.path.join(
    BASE_DIR,
    "datasets",
    "category_test.csv"
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "saved_models",
    "category_model.pkl"
)

VECTORIZER_PATH = os.path.join(
    BASE_DIR,
    "saved_models",
    "tfidf_vectorizer.pkl"
)


def main():

    print("\nCATEGORY CLASSIFICATION EVALUATION")
    print("-----------------------------------")

    if not os.path.exists(DATASET_PATH):
        print(
            f"Dataset not found: {DATASET_PATH}"
        )
        return

    if not os.path.exists(MODEL_PATH):
        print(
            f"Model not found: {MODEL_PATH}"
        )
        return

    if not os.path.exists(VECTORIZER_PATH):
        print(
            f"Vectorizer not found: {VECTORIZER_PATH}"
        )
        return

    data = pd.read_csv(
        DATASET_PATH
    )

    required_columns = [
        "description",
        "category"
    ]

    for column in required_columns:
        if column not in data.columns:
            print(
                f"Missing column: {column}"
            )
            return

    data = data.dropna(
        subset=required_columns
    )

    descriptions = data[
        "description"
    ].astype(str)

    actual_categories = data[
        "category"
    ].astype(str)

    model = joblib.load(
        MODEL_PATH
    )

    vectorizer = joblib.load(
        VECTORIZER_PATH
    )

    transformed_data = vectorizer.transform(
        descriptions
    )

    predicted_categories = model.predict(
        transformed_data
    )

    accuracy = accuracy_score(
        actual_categories,
        predicted_categories
    )

    precision = precision_score(
        actual_categories,
        predicted_categories,
        average="weighted",
        zero_division=0
    )

    recall = recall_score(
        actual_categories,
        predicted_categories,
        average="weighted",
        zero_division=0
    )

    f1 = f1_score(
        actual_categories,
        predicted_categories,
        average="weighted",
        zero_division=0
    )

    print(
        f"\nTest samples: {len(data)}"
    )

    print(
        f"Accuracy : {accuracy:.4f}"
    )

    print(
        f"Precision: {precision:.4f}"
    )

    print(
        f"Recall   : {recall:.4f}"
    )

    print(
        f"F1-score : {f1:.4f}"
    )

    print("\nClassification Report")
    print(
        classification_report(
            actual_categories,
            predicted_categories,
            zero_division=0
        )
    )

    labels = sorted(
        set(actual_categories)
        | set(predicted_categories)
    )

    matrix = confusion_matrix(
        actual_categories,
        predicted_categories,
        labels=labels
    )

    print("Confusion Matrix")

    print(
        pd.DataFrame(
            matrix,
            index=[
                f"Actual: {label}"
                for label in labels
            ],
            columns=[
                f"Predicted: {label}"
                for label in labels
            ]
        )
    )


if __name__ == "__main__":
    main()