from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import pandas as pd

from app.services.duplicate_service import is_duplicate


app = FastAPI(
    title="Smart Civic ML Service",
    version="1.0.0"
)


category_model = joblib.load(
    "saved_models/category_model.pkl"
)

tfidf_vectorizer = joblib.load(
    "saved_models/tfidf_vectorizer.pkl"
)

priority_model = joblib.load(
    "saved_models/priority_model.pkl"
)


class ComplaintRequest(BaseModel):
    description: str


class PriorityRequest(BaseModel):
    category: str
    severity: int
    repeated_reports: int
    location_sensitivity: int


class DuplicateRequest(BaseModel):
    description: str
    existing_descriptions: list[str]


@app.get("/")
def home():
    return {
        "success": True,
        "message": "Smart Civic ML service is running"
    }


@app.get("/health")
def health():
    return {
        "success": True,
        "message": "ML service is healthy"
    }


@app.post("/predict/category")
def predict_category(request: ComplaintRequest):
    text = [request.description]

    text_tfidf = tfidf_vectorizer.transform(text)

    prediction = category_model.predict(
        text_tfidf
    )[0]

    return {
        "success": True,
        "category": prediction
    }


@app.post("/predict/priority")
def predict_priority(request: PriorityRequest):

    data = pd.DataFrame([
        {
            "category": request.category,
            "severity": request.severity,
            "repeated_reports": request.repeated_reports,
            "location_sensitivity": request.location_sensitivity
        }
    ])

    prediction = priority_model.predict(data)[0]

    return {
        "success": True,
        "priority": prediction
    }


@app.post("/predict/duplicate")
def predict_duplicate(request: DuplicateRequest):

    result = is_duplicate(
        request.description,
        request.existing_descriptions
    )

    return {
        "success": True,
        "is_duplicate": result["is_duplicate"],
        "similarity": result["similarity"],
        "matched_index": result["matched_index"]
    }