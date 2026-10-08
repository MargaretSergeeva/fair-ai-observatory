"""Stage 2: train the fairness-through-unawareness XGBoost baseline."""

from __future__ import annotations

from pathlib import Path

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from xgboost import XGBClassifier

from observatory.ingestion.ingestion import load_and_prepare

MODEL_CONFIG = {
    "n_estimators": 100,
    "max_depth": 4,
    "learning_rate": 0.05,
    "random_state": 42,
    "eval_metric": "logloss",
}
DEFAULT_THRESHOLD = 0.50


def train(*, X_train, y_train) -> XGBClassifier:
    model = XGBClassifier(**MODEL_CONFIG)
    model.fit(X=X_train, y=y_train)
    return model


def evaluate(*, model, X_test, y_test, threshold: float) -> dict:
    probabilities = model.predict_proba(X_test)[:, 1]
    predictions = (probabilities >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_test, predictions).ravel()
    return {
        "predictions": predictions,
        "probabilities": probabilities,
        "metrics": {
            "threshold": threshold,
            "accuracy": round(float(accuracy_score(y_test, predictions)), 4),
            "auc_roc": round(float(roc_auc_score(y_test, probabilities)), 4),
            "precision": round(
                float(precision_score(y_test, predictions, zero_division=0)), 4
            ),
            "recall": round(
                float(recall_score(y_test, predictions, zero_division=0)), 4
            ),
            "f1": round(float(f1_score(y_test, predictions, zero_division=0)), 4),
            "approval_rate": round(float(predictions.mean()), 4),
            "confusion_matrix": {
                "true_negative": int(tn),
                "false_positive": int(fp),
                "false_negative": int(fn),
                "true_positive": int(tp),
            },
        },
    }


def feature_importance(*, model, feature_columns: list[str]) -> list[dict]:
    pairs = sorted(
        zip(feature_columns, model.feature_importances_, strict=True),
        key=lambda item: item[1],
        reverse=True,
    )
    return [
        {"feature": feature, "importance": round(float(score), 5)}
        for feature, score in pairs
    ]


def train_and_evaluate(
    *,
    dataset_path: str | Path,
    threshold: float = DEFAULT_THRESHOLD,
) -> dict:
    data = load_and_prepare(dataset_path=dataset_path)
    model = train(X_train=data["X_train"], y_train=data["y_train"])
    evaluation = evaluate(
        model=model,
        X_test=data["X_test"],
        y_test=data["y_test"],
        threshold=threshold,
    )
    return {
        "model": model,
        "preds_test": evaluation["predictions"],
        "probas_test": evaluation["probabilities"],
        "performance": evaluation["metrics"],
        "feature_importance": feature_importance(
            model=model,
            feature_columns=data["feature_columns"],
        ),
        "ingestion_data": data,
        "model_meta": {
            "model_type": "XGBoost gradient-boosted decision tree",
            "config": MODEL_CONFIG,
            "fairness_baseline": "protected attributes excluded from model features",
            "limitations": [
                "Excluding protected attributes does not prevent proxy discrimination.",
                "Exploratory benchmark; not a production credit model.",
                "The official asymmetric cost matrix is not applied.",
            ],
        },
    }
