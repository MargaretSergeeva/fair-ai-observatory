"""Stage 6: Fairlearn ThresholdOptimizer mitigation and disclosure."""

from __future__ import annotations

import warnings

import numpy as np
import pandas as pd
from fairlearn.metrics import (
    demographic_parity_difference,
    demographic_parity_ratio,
    equalized_odds_difference,
)
from fairlearn.postprocessing import ThresholdOptimizer
from sklearn.metrics import accuracy_score, precision_score, recall_score

from observatory.bias.disparate_impact import check_attribute

FAIRNESS_CONSTRAINT = "demographic_parity"


def fairness_metrics(
    *,
    y_true: np.ndarray,
    predictions: np.ndarray,
    sensitive: pd.Series,
) -> dict:
    return {
        "demographic_parity_difference": round(
            float(
                demographic_parity_difference(
                    y_true,
                    predictions,
                    sensitive_features=sensitive,
                )
            ),
            4,
        ),
        "demographic_parity_ratio": round(
            float(
                demographic_parity_ratio(
                    y_true,
                    predictions,
                    sensitive_features=sensitive,
                )
            ),
            4,
        ),
        "equalized_odds_difference": round(
            float(
                equalized_odds_difference(
                    y_true,
                    predictions,
                    sensitive_features=sensitive,
                )
            ),
            4,
        ),
    }


def performance_metrics(*, y_true: np.ndarray, predictions: np.ndarray) -> dict:
    return {
        "accuracy": round(float(accuracy_score(y_true, predictions)), 4),
        "precision": round(
            float(precision_score(y_true, predictions, zero_division=0)), 4
        ),
        "recall": round(float(recall_score(y_true, predictions, zero_division=0)), 4),
        "approval_rate": round(float(predictions.mean()), 4),
    }


def run_mitigation_pipeline(
    *,
    model,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    sensitive_train: pd.Series,
    sensitive_test: pd.Series,
    sensitive_attribute: str,
    baseline_predictions: np.ndarray,
    constraint: str = FAIRNESS_CONSTRAINT,
) -> dict:
    optimizer = ThresholdOptimizer(
        estimator=model,
        constraints=constraint,
        predict_method="predict_proba",
        objective="accuracy_score",
        prefit=True,
    )
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", FutureWarning)
        optimizer.fit(
            X=X_train,
            y=y_train,
            sensitive_features=sensitive_train,
        )
        mitigated_predictions = optimizer.predict(
            X=X_test,
            sensitive_features=sensitive_test,
            random_state=42,
        )

    y_true = y_test.to_numpy()
    before_performance = performance_metrics(
        y_true=y_true,
        predictions=baseline_predictions,
    )
    after_performance = performance_metrics(
        y_true=y_true,
        predictions=mitigated_predictions,
    )
    before_fairness = fairness_metrics(
        y_true=y_true,
        predictions=baseline_predictions,
        sensitive=sensitive_test,
    )
    after_fairness = fairness_metrics(
        y_true=y_true,
        predictions=mitigated_predictions,
        sensitive=sensitive_test,
    )
    post_check = check_attribute(
        predictions=mitigated_predictions,
        groups=sensitive_test,
        attribute_name=sensitive_attribute,
    )
    return {
        "constraint": constraint,
        "sensitive_attribute": sensitive_attribute,
        "performance": {
            "before": before_performance,
            "after": after_performance,
            "accuracy_cost": round(
                before_performance["accuracy"] - after_performance["accuracy"], 4
            ),
        },
        "fairness": {"before": before_fairness, "after": after_fairness},
        "disparate_impact_after": post_check,
        "mitigation_passed": post_check["passed"],
    }
