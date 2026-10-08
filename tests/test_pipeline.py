"""Executable contract tests for the six-stage reference pipeline."""

from __future__ import annotations

import unittest
from pathlib import Path

import numpy as np
import pandas as pd

from observatory.bias.counterfactual_fairness import check_attribute as check_eod
from observatory.bias.disparate_impact import check_attribute as check_di
from observatory.bias.intersectional import intersectional_approval_rates
from observatory.ingestion.ingestion import load_and_prepare
from scripts.run_reference_audit import run_audit

DATASET = Path("data/raw/german_credit/german.data")


class IngestionTest(unittest.TestCase):
    def test_protected_columns_are_not_model_features(self) -> None:
        result = load_and_prepare(dataset_path=DATASET)

        self.assertEqual(result["meta"]["rows"], 1000)
        self.assertEqual(result["meta"]["train_rows"], 700)
        self.assertEqual(result["meta"]["test_rows"], 300)
        for protected in result["meta"]["protected_columns_excluded"]:
            self.assertNotIn(protected, result["feature_columns"])


class FairnessMetricsTest(unittest.TestCase):
    def test_disparate_impact_known_example(self) -> None:
        result = check_di(
            predictions=np.array([1, 1, 1, 0, 1, 0, 0, 0]),
            groups=pd.Series(["a", "a", "a", "a", "b", "b", "b", "b"]),
            attribute_name="example",
        )

        self.assertEqual(result["dir"], 0.3333)
        self.assertEqual(result["spd"], 0.5)
        self.assertFalse(result["passed"])

    def test_equalized_odds_known_example(self) -> None:
        result = check_eod(
            y_true=np.array([1, 1, 0, 0, 1, 1, 0, 0]),
            y_pred=np.array([1, 1, 1, 0, 1, 0, 0, 0]),
            groups=pd.Series(["a", "a", "a", "a", "b", "b", "b", "b"]),
            attribute_name="example",
        )

        self.assertEqual(result["eod"], 0.5)
        self.assertFalse(result["passed"])

    def test_intersectional_minimum_n_gate(self) -> None:
        rates = intersectional_approval_rates(
            predictions=np.array([1, 0, 1, 1]),
            attributes={
                "gender": pd.Series(["f", "f", "m", "m"]),
                "age_group": pd.Series(["young", "young", "older", "older"]),
            },
            min_n=3,
        )

        self.assertTrue((~rates["sufficient_data"]).all())


class EndToEndTest(unittest.TestCase):
    def test_real_reference_run_executes_all_six_stages(self) -> None:
        report = run_audit(dataset_path=DATASET)

        self.assertEqual(report["artifact_version"], 2)
        self.assertEqual(
            set(report["pipeline"]),
            {
                "ingestion",
                "xgboost_baseline",
                "disparate_impact",
                "equalized_odds",
                "intersectional_bias",
                "mitigation",
            },
        )
        self.assertEqual(
            report["pipeline"]["mitigation"]["sensitive_attribute"],
            "foreign_worker",
        )


if __name__ == "__main__":
    unittest.main()
