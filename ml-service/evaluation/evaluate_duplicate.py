import os

import pandas as pd

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix
)

from app.services.duplicate_service import is_duplicate


BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

DATASET_PATH = os.path.join(
    BASE_DIR,
    "datasets",
    "duplicate_test.csv"
)


def main():

    print("\nDUPLICATE DETECTION EVALUATION")
    print("------------------------------")

    if not os.path.exists(DATASET_PATH):
        print(
            f"Dataset not found: {DATASET_PATH}"
        )
        return

    data = pd.read_csv(
        DATASET_PATH
    )

    required_columns = [
        "description1",
        "description2",
        "label"
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

    actual = []
    predicted = []

    for _, row in data.iterrows():

        result = is_duplicate(
            str(row["description1"]),
            [
                str(row["description2"])
            ]
        )

        actual.append(
            int(row["label"])
        )

        predicted.append(
            1 if result["is_duplicate"]
            else 0
        )

    accuracy = accuracy_score(
        actual,
        predicted
    )

    precision = precision_score(
        actual,
        predicted,
        zero_division=0
    )

    recall = recall_score(
        actual,
        predicted,
        zero_division=0
    )

    f1 = f1_score(
        actual,
        predicted,
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

    print("\nConfusion Matrix")

    print(
        confusion_matrix(
            actual,
            predicted
        )
    )


if __name__ == "__main__":
    main()