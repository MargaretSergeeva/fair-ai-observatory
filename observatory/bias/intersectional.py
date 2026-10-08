"""Stage 5: intersectional approval-rate analysis with a minimum-n gate."""

from __future__ import annotations

from itertools import combinations

import numpy as np
import pandas as pd

from observatory.bias.disparate_impact import DIR_THRESHOLD, SPD_THRESHOLD, band_age
from observatory.ingestion.ingestion import AGE_COL, FOREIGN_COL, GENDER_COL

MIN_N = 30


def intersectional_approval_rates(
    *,
    predictions: np.ndarray,
    attributes: dict[str, pd.Series],
    min_n: int = MIN_N,
) -> pd.DataFrame:
    if min_n <= 0:
        raise ValueError("min_n must be positive")
    table = pd.DataFrame({"prediction": predictions})
    for name, values in attributes.items():
        if len(values) != len(predictions):
            raise ValueError(f"length mismatch for intersectional attribute {name}")
        table[name] = values.reset_index(drop=True)
    grouped = (
        table.groupby(list(attributes), observed=True)["prediction"]
        .agg(n="count", n_approved="sum")
        .reset_index()
    )
    grouped["approval_rate"] = grouped["n_approved"] / grouped["n"]
    grouped["sufficient_data"] = grouped["n"] >= min_n
    grouped["exclusion_reason"] = grouped.apply(
        lambda row: None
        if row["sufficient_data"]
        else f"n={int(row['n'])} < min_n={min_n}",
        axis=1,
    )
    return grouped


def evaluate_cells(
    *,
    rates: pd.DataFrame,
    dir_threshold: float,
    spd_threshold: float,
) -> dict:
    valid = rates[rates["sufficient_data"]]
    if len(valid) < 2:
        return {
            "status": "INSUFFICIENT_DATA",
            "passed": None,
            "dir": None,
            "spd": None,
            "n_valid_cells": int(len(valid)),
            "n_excluded_cells": int((~rates["sufficient_data"]).sum()),
        }
    maximum = float(valid["approval_rate"].max())
    if maximum == 0:
        raise ValueError("cannot compute intersectional DIR: all valid rates are zero")
    minimum = float(valid["approval_rate"].min())
    ratio = round(minimum / maximum, 4)
    difference = round(maximum - minimum, 4)
    passed = ratio >= dir_threshold and difference <= spd_threshold
    return {
        "status": "PASS" if passed else "FAIL",
        "passed": passed,
        "dir": ratio,
        "spd": difference,
        "n_valid_cells": int(len(valid)),
        "n_excluded_cells": int((~rates["sufficient_data"]).sum()),
    }


def run_intersectional_battery(
    *,
    predictions: np.ndarray,
    dataframe_test: pd.DataFrame,
    min_n: int = MIN_N,
    dir_threshold: float = DIR_THRESHOLD,
    spd_threshold: float = SPD_THRESHOLD,
) -> dict:
    attributes = {
        "gender": dataframe_test[GENDER_COL],
        "age_group": band_age(series=dataframe_test[AGE_COL]),
        "foreign_worker": dataframe_test[FOREIGN_COL],
    }
    combinations_to_check = [
        (left, right) for left, right in combinations(attributes, 2)
    ] + [tuple(attributes)]
    results = {}
    for names in combinations_to_check:
        rates = intersectional_approval_rates(
            predictions=predictions,
            attributes={name: attributes[name] for name in names},
            min_n=min_n,
        )
        result = evaluate_cells(
            rates=rates,
            dir_threshold=dir_threshold,
            spd_threshold=spd_threshold,
        )
        result["attributes"] = list(names)
        result["cell_table"] = [
            {
                **{
                    column: (
                        round(float(value), 4)
                        if column == "approval_rate"
                        else int(value)
                        if column in {"n", "n_approved"}
                        else bool(value)
                        if column == "sufficient_data"
                        else value
                    )
                    for column, value in row.items()
                }
            }
            for row in rates.to_dict(orient="records")
        ]
        results[" × ".join(names)] = result
    definitive = [result for result in results.values() if result["passed"] is not None]
    return {
        "results": results,
        "n_pass": sum(result["passed"] is True for result in definitive),
        "n_fail": sum(result["passed"] is False for result in definitive),
        "n_insufficient": len(results) - len(definitive),
        "any_violation": any(result["passed"] is False for result in definitive),
        "min_n_policy": min_n,
        "thresholds": {"dir": dir_threshold, "spd": spd_threshold},
    }
