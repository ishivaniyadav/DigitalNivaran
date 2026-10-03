import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

data = pd.read_csv("datasets/complaints.csv")

X = data["description"]
y = data["category"]

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

vectorizer = TfidfVectorizer(
    lowercase=True,
    stop_words="english"
)

X_train_tfidf = vectorizer.fit_transform(X_train)
X_test_tfidf = vectorizer.transform(X_test)

model = LogisticRegression(
    max_iter=1000
)

model.fit(X_train_tfidf, y_train)

accuracy = model.score(X_test_tfidf, y_test)

print("Model trained successfully")
print("Accuracy:", accuracy)

joblib.dump(model, "saved_models/category_model.pkl")
joblib.dump(vectorizer, "saved_models/tfidf_vectorizer.pkl")

print("Model saved successfully")