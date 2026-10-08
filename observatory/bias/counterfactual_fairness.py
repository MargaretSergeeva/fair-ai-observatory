"""Stage 4: equalized-odds analysis.

The historical filename is retained, but this module measures group
equalized odds; it does not claim causal counterfactual fairness.
"""

from __future__ import annotations

from itertools import combinations

import numpy as np
import pandas as pd

from observatory.bias.disparate_impact import band_age
from observatory.ingestion.ingestion import AGE_COL, FOREIGN_COL, GENDER_COL

EOD_THRESHOLD = 0.10


def group_rates(
    *,
    y_true: np.ndarray,
    y_pred: np.ndarray,
    groups: pd.Series,
) -> pd.DataFrame:
    if len(y_true) != len(y_pred) or len(y_true) != len(groups):
        raise ValueError("equalized-odds inputs must have equal lengths")
    records = []
    for group in sorted(groups.unique()):
        mask = (groups.reset_index(drop=True) == group).to_numpy()
        actual = y_true[mask]
        predicted = y_pred[mask]
        tp = int(((predicted == 1) & (actual == 1)).sum())
        fp = int(((predicted == 1) & (actual == 0)).sum())
        fn = int(((predicted == 0) & (actual == 1)).sum())
        tn = int(((predicted == 0) & (actual == 0)).sum())
        positive = tp + fn
        negative = fp + tn
        records.append(
            {
                "group": str(group),
                "n": int(mask.sum()),
                "n_positive": positive,
                "n_negative": negative,
                "tpr": round(tp / positive, 4) if positive else None,
                "fpr": round(fp / negative, 4) if negative else None,
                "approval_rate": round((tp + fp) / int(mask.sum()), 4),
            }
        )
    return pd.DataFrame(records)


def check_attribute(
    *,
    y_true: np.ndarray,
    y_pred: np.ndarray,
    groups: pd.Series,
    attribute_name: str,
    eod_threshold: float = EOD_THRESHOLD,
) -> dict:
    rates = group_rates(y_true=y_true, y_pred=y_pred, groups=groups)
    valid = rates.dropna(subset=["tpr", "fpr"])
    if len(valid) < 2:
        return {
            "attribute": attribute_name,
            "status": "INSUFFICIENT_DATA",
            "passed": None,
            "eod": None,
            "eod_threshold": eod_threshold,
            "group_rates": rates.to_dict(orient="records"),
        }

    worst = None
    for (_, left), (_, right) in combinations(valid.iterrows(), 2):
        tpr_difference = abs(float(left["tpr"]) - float(right["tpr"]))
        fpr_difference = abs(float(left["fpr"]) - float(right["fpr"]))
        eod = max(tpr_difference, fpr_difference)
        if worst is None or eod > worst["eod"]:
            worst = {
                "groups": [str(left["group"]), str(right["group"])],
                "tpr_difference": round(tpr_difference, 4),
                "fpr_difference": round(fpr_difference, 4),
                "eod": round(eod, 4),
            }
    if worst is None:
        raise RuntimeError(f"failed to calculate equalized odds for {attribute_name}")
    passed = worst["eod"] <= eod_threshold
    return {
        "attribute": attribute_name,
        "status": "PASS" if passed else "FAIL",
        "passed": passed,
        "eod": worst["eod"],
        "eod_threshold": eod_threshold,
        "worst_pair": worst,
        "group_rates": rates.to_dict(orient="records"),
    }


def run_equalized_odds_battery(
    *,
    y_true: np.ndarray,
    y_pred: np.ndarray,
    dataframe_test: pd.DataFrame,
    eod_threshold: float = EOD_THRESHOLD,
) -> dict:
    groups = {
        "gender": dataframe_test[GENDER_COL],
        "age_group": band_age(series=dataframe_test[AGE_COL]),
        "foreign_worker": dataframe_test[FOREIGN_COL],
    }
    results = {
        name: check_attribute(
            y_true=y_true,
            y_pred=y_pred,
            groups=values,
            attribute_name=name,
            eod_threshold=eod_threshold,
        )
        for name, values in groups.items()
    }
    definitive = [result for result in results.values() if result["passed"] is not None]
    return {
        "results": results,
        "n_pass": sum(result["passed"] is True for result in definitive),
        "n_fail": sum(result["passed"] is False for result in definitive),
        "n_insufficient": len(results) - len(definitive),
        "any_violation": any(result["passed"] is False for result in definitive),
        "threshold": {"eod": eod_threshold},
    }
