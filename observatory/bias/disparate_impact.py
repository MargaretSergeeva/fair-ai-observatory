"""Stage 3: disparate-impact and statistical-parity checks."""

from __future__ import annotations

import numpy as np
import pandas as pd

from observatory.ingestion.ingestion import AGE_COL, FOREIGN_COL, GENDER_COL

DIR_THRESHOLD = 0.80
SPD_THRESHOLD = 0.10


def band_age(*, series: pd.Series) -> pd.Series:
    result = pd.cut(
        series,
        bins=[17, 25, 35, 50, 100],
        labels=["18-25", "26-35", "36-50", "51+"],
    )
    if result.isna().any():
        raise ValueError("age values fall outside the supported 18-100 range")
    return result.astype(str)


def check_attribute(
    *,
    predictions: np.ndarray,
    groups: pd.Series,
    attribute_name: str,
    dir_threshold: float = DIR_THRESHOLD,
    spd_threshold: float = SPD_THRESHOLD,
) -> dict:
    if len(predictions) != len(groups):
        raise ValueError(f"length mismatch for {attribute_name}")
    table = pd.DataFrame(
        {"prediction": predictions, "group": groups.reset_index(drop=True)}
    )
    summary = (
        table.groupby("group", observed=True)["prediction"]
        .agg(n="count", n_approved="sum")
        .reset_index()
    )
    if len(summary) < 2:
        raise ValueError(f"{attribute_name} requires at least two represented groups")
    summary["approval_rate"] = summary["n_approved"] / summary["n"]
    maximum = float(summary["approval_rate"].max())
    if maximum == 0:
        raise ValueError(f"cannot compute DIR for {attribute_name}: all rates are zero")
    minimum = float(summary["approval_rate"].min())
    ratio = round(minimum / maximum, 4)
    difference = round(maximum - minimum, 4)
    passed = ratio >= dir_threshold and difference <= spd_threshold
    return {
        "attribute": attribute_name,
        "group_rates": [
            {
                "group": str(row["group"]),
                "n": int(row["n"]),
                "n_approved": int(row["n_approved"]),
                "approval_rate": round(float(row["approval_rate"]), 4),
            }
            for _, row in summary.iterrows()
        ],
        "dir": ratio,
        "spd": difference,
        "dir_threshold": dir_threshold,
        "spd_threshold": spd_threshold,
        "passed": passed,
    }


def run_disparate_impact_battery(
    *,
    predictions: np.ndarray,
    dataframe_test: pd.DataFrame,
    dir_threshold: float = DIR_THRESHOLD,
    spd_threshold: float = SPD_THRESHOLD,
) -> dict:
    groups = {
        "gender": dataframe_test[GENDER_COL],
        "age_group": band_age(series=dataframe_test[AGE_COL]),
        "foreign_worker": dataframe_test[FOREIGN_COL],
    }
    results = {
        name: check_attribute(
            predictions=predictions,
            groups=values,
            attribute_name=name,
            dir_threshold=dir_threshold,
            spd_threshold=spd_threshold,
        )
        for name, values in groups.items()
    }
    return {
        "results": results,
        "n_pass": sum(result["passed"] for result in results.values()),
        "n_fail": sum(not result["passed"] for result in results.values()),
        "any_violation": any(not result["passed"] for result in results.values()),
        "thresholds": {"dir": dir_threshold, "spd": spd_threshold},
    }
