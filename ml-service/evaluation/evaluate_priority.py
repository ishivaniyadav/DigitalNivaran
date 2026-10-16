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
    "priority_test.csv"
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "saved_models",
    "priority_model.pkl"
)


def main():

    print("\nPRIORITY MODEL EVALUATION")
    print("-------------------------")

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

    data = pd.read_csv(
        DATASET_PATH
    )

    required_columns = [
        "category",
        "severity",
        "repeated_reports",
        "location_sensitivity",
        "priority"
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

    X = data[
        [
            "category",
            "severity",
            "repeated_reports",
            "location_sensitivity"
        ]
    ]

    y = data["priority"]

    model = joblib.load(
        MODEL_PATH
    )

    predictions = model.predict(X)

    accuracy = accuracy_score(
        y,
        predictions
    )

    precision = precision_score(
        y,
        predictions,
        average="weighted",
        zero_division=0
    )

    recall = recall_score(
        y,
        predictions,
        average="weighted",
        zero_division=0
    )

    f1 = f1_score(
        y,
        predictions,
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
            y,
            predictions,
            zero_division=0
        )
    )

    labels = sorted(
        set(y)
        | set(predictions)
    )

    matrix = confusion_matrix(
        y,
        predictions,
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