"""Run all six UCI German Credit pipeline stages and write one artifact."""

from __future__ import annotations

import argparse
import hashlib
import json
import platform
from pathlib import Path

import fairlearn
import numpy as np
import pandas as pd
import sklearn
import xgboost

from observatory.bias.counterfactual_fairness import run_equalized_odds_battery
from observatory.bias.disparate_impact import run_disparate_impact_battery
from observatory.bias.intersectional import run_intersectional_battery
from observatory.bias.mitigation import run_mitigation_pipeline
from observatory.bias.disparate_impact import band_age
from observatory.ingestion.ingestion import AGE_COL, FOREIGN_COL, GENDER_COL
from observatory.model.model import train_and_evaluate
from observatory.robustness.robustness import run_robustness_battery

DATASET_SOURCE = "https://archive.ics.uci.edu/dataset/144/statloggermancreditdata"
DATASET_DOI = "10.24432/C5NC77"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run the reproducible UCI German Credit fairness pipeline."
    )
    parser.add_argument(
        "--dataset",
        type=Path,
        default=Path("data/raw/german_credit/german.data"),
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("artifacts/uci_german_credit_run.json"),
    )
    return parser.parse_args()


def build_numeric_schema(*, dataframe: pd.DataFrame) -> dict[str, dict]:
    return {
        column: {
            "dtype": "numeric",
            "range": (float(dataframe[column].min()), float(dataframe[column].max())),
        }
        for column in dataframe.columns
    }


def build_group_rates(
    *,
    dataframe_test: pd.DataFrame,
    y_test: pd.Series,
    disparate_impact: dict,
) -> dict[str, dict]:
    output = {}
    gender_result = disparate_impact["results"]["gender"]
    for row in gender_result["group_rates"]:
        group = row["group"]
        mask = dataframe_test[GENDER_COL] == group
        output[group] = {
            "n": int(mask.sum()),
            "actual_good_rate": round(float(y_test[mask].mean()), 4),
            "predicted_approval_rate": row["approval_rate"],
        }
    return output


def run_audit(*, dataset_path: Path) -> dict:
    baseline = train_and_evaluate(dataset_path=dataset_path)
    data = baseline["ingestion_data"]
    predictions = baseline["preds_test"]
    y_true = data["y_test"].to_numpy()

    disparate_impact = run_disparate_impact_battery(
        predictions=predictions,
        dataframe_test=data["df_test"],
    )
    equalized_odds = run_equalized_odds_battery(
        y_true=y_true,
        y_pred=predictions,
        dataframe_test=data["df_test"],
    )
    intersectional = run_intersectional_battery(
        predictions=predictions,
        dataframe_test=data["df_test"],
    )
    failed_disparate_impact = [
        result
        for result in disparate_impact["results"].values()
        if not result["passed"]
    ]
    if failed_disparate_impact:
        mitigation_target = max(
            failed_disparate_impact,
            key=lambda result: result["spd"],
        )["attribute"]
        sensitive_columns = {
            "gender": (
                data["df_train"][GENDER_COL],
                data["df_test"][GENDER_COL],
            ),
            "age_group": (
                band_age(series=data["df_train"][AGE_COL]),
                band_age(series=data["df_test"][AGE_COL]),
            ),
            "foreign_worker": (
                data["df_train"][FOREIGN_COL],
                data["df_test"][FOREIGN_COL],
            ),
        }
        sensitive_train, sensitive_test = sensitive_columns[mitigation_target]
        mitigation = run_mitigation_pipeline(
            model=baseline["model"],
            X_train=data["X_train"],
            y_train=data["y_train"],
            X_test=data["X_test"],
            y_test=data["y_test"],
            sensitive_train=sensitive_train,
            sensitive_test=sensitive_test,
            sensitive_attribute=mitigation_target,
            baseline_predictions=predictions,
        )
        mitigation["status"] = "triggered"
        mitigation["trigger"] = (
            f"largest failed disparate-impact check: {mitigation_target}"
        )
    else:
        mitigation = {
            "status": "not_triggered",
            "reason": "all disparate-impact checks passed",
        }

    schema = build_numeric_schema(dataframe=data["X_train"])
    valid_row = data["X_test"].iloc[0].to_dict()
    malformed_cases = [
        ("valid row", valid_row, False),
        (
            "negative credit_amount",
            {**valid_row, "credit_amount": -1.0},
            True,
        ),
        (
            "missing duration_months",
            {**valid_row, "duration_months": None},
            True,
        ),
        (
            "credit_amount outside training range",
            {
                **valid_row,
                "credit_amount": schema["credit_amount"]["range"][1] + 1.0,
            },
            True,
        ),
    ]
    robustness = run_robustness_battery(
        model=baseline["model"],
        X_train=data["X_train"],
        X_test=data["X_test"],
        y_test=data["y_test"],
        shift_spec={"credit_amount": 1.15},
        schema=schema,
        feature_order=data["feature_columns"],
        malformed_cases=malformed_cases,
        numeric_columns=["duration_months", "credit_amount", "installment_rate"],
    )

    group_rates = build_group_rates(
        dataframe_test=data["df_test"],
        y_test=data["y_test"],
        disparate_impact=disparate_impact,
    )
    gender_di = disparate_impact["results"]["gender"]
    return {
        "artifact_version": 2,
        "provenance": {
            "dataset": "Statlog (German Credit Data)",
            "source": DATASET_SOURCE,
            "doi": DATASET_DOI,
            "license": "CC BY 4.0",
            "dataset_sha256": hashlib.sha256(dataset_path.read_bytes()).hexdigest(),
            "execution": "deterministic local six-stage fairness pipeline",
        },
        "runtime": {
            "python": platform.python_version(),
            "numpy": np.__version__,
            "pandas": pd.__version__,
            "scikit_learn": sklearn.__version__,
            "xgboost": xgboost.__version__,
            "fairlearn": fairlearn.__version__,
        },
        "methodology": {
            "train_test_split": "70/30 stratified, random_state=42",
            "target": "credit_risk == 1 interpreted as good credit",
            "model": baseline["model_meta"],
            "limitations": [
                "Exploratory reference baseline; no hyperparameter tuning.",
                "Diagnostic thresholds are methodology choices, not legal bright lines.",
                "The foreign_worker A202 test group has n=13; its disparity and mitigation results are unstable and require more data.",
                "The result is not a conformity assessment or legal opinion.",
            ],
        },
        "dataset": data["meta"],
        "baseline": {
            **baseline["performance"],
            "group_rates": group_rates,
            "disparate_impact": gender_di["dir"],
            "statistical_parity_gap": gender_di["spd"],
            "diagnostic_thresholds_passed": {
                "disparate_impact_gte_0_80": gender_di["dir"] >= 0.80,
                "statistical_parity_gap_lte_0_10": gender_di["spd"] <= 0.10,
            },
            "top_features": baseline["feature_importance"][:10],
        },
        "pipeline": {
            "ingestion": data["meta"],
            "xgboost_baseline": baseline["performance"],
            "disparate_impact": disparate_impact,
            "equalized_odds": equalized_odds,
            "intersectional_bias": intersectional,
            "mitigation": mitigation,
        },
        "robustness": robustness,
    }


def main() -> None:
    args = parse_args()
    report = run_audit(dataset_path=args.dataset)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Reference audit written to {args.output}")


if __name__ == "__main__":
    main()
