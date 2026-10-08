"""
robustness.py — Article 15 (Accuracy, Robustness & Cybersecurity) checks.

EU AI Act Article 15 requires high-risk systems to achieve an appropriate
level of accuracy, robustness, and cybersecurity, and to be resilient
against errors, faults, and attempts to exploit vulnerabilities.

For a tabular credit-scoring model, "robustness" decomposes into four
concrete, testable properties:

  1. distribution_shift_test       — does performance hold up if the input
                                      population drifts from training data?
  2. decision_boundary_sensitivity — do small, plausible input changes flip
                                      decisions for borderline applicants?
  3. malformed_input_handling      — does the system reject bad input
                                      cleanly, or fail silently/crash?
  4. out_of_distribution_flag      — are out-of-range queries flagged for
                                      lower confidence rather than scored
                                      as if they were normal?

As with the fairness thresholds elsewhere in this repo, every numeric
threshold below is a DOCUMENTED METHODOLOGY CHOICE for DPO sign-off,
not a value mandated by the Act itself.

Conventions: run with PYTHONPATH=. ; pandas<3.0 pinned project-wide.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score


class InputValidationError(Exception):
    """Raised when an input row fails schema validation. Catch this at the
    serving boundary — never let a malformed row reach model.predict()
    silently."""


# ---------------------------------------------------------------------------
# 1. Distribution shift
# ---------------------------------------------------------------------------
def distribution_shift_test(*, model, X_test, y_test, shift_spec, tolerance=0.05):
    """Re-evaluates accuracy after applying a plausible real-world drift to
    one or more numeric columns (e.g. inflation on credit_amount).

    shift_spec: {column_name: multiplicative_factor}, e.g. {"credit_amount": 1.15}
    tolerance:  max acceptable accuracy drop (diagnostic default 0.05)
    """
    baseline_pred = model.predict(X_test)
    baseline_acc = accuracy_score(y_test, baseline_pred)

    X_shifted = X_test.copy()
    for col, factor in shift_spec.items():
        if col in X_shifted.columns:
            X_shifted[col] = X_shifted[col] * factor

    shifted_pred = model.predict(X_shifted)
    shifted_acc = accuracy_score(y_test, shifted_pred)
    degradation = baseline_acc - shifted_acc

    return {
        "test": "distribution_shift",
        "shift_spec": shift_spec,
        "baseline_accuracy": round(float(baseline_acc), 4),
        "shifted_accuracy": round(float(shifted_acc), 4),
        "degradation": round(float(degradation), 4),
        "tolerance": tolerance,
        "passed": bool(degradation <= tolerance),
    }


# ---------------------------------------------------------------------------
# 2. Decision boundary sensitivity
# ---------------------------------------------------------------------------
def decision_boundary_sensitivity(
    *, model, X_test, proba_band=(0.45, 0.55), perturbation_pct=0.05,
    flip_threshold=0.10, numeric_cols=None, random_state=42,
):
    """For applicants the model is least confident about, applies a small
    (+/- perturbation_pct) random perturbation to numeric features and
    measures how often the approve/deny decision flips.

    A high flip rate near the decision boundary means the model's
    creditworthiness line is unstable, not just imprecise — exactly the
    kind of fragility Article 15 is concerned with.
    """
    probas = model.predict_proba(X_test)[:, 1]
    borderline_mask = (probas >= proba_band[0]) & (probas <= proba_band[1])
    X_borderline = X_test[borderline_mask]

    if len(X_borderline) == 0:
        return {
            "test": "decision_boundary_sensitivity",
            "n_borderline": 0,
            "flip_rate": None,
            "flip_threshold": flip_threshold,
            "passed": True,
            "note": "no borderline cases in proba_band — widen the band to get signal",
        }

    if numeric_cols is None:
        numeric_cols = X_borderline.select_dtypes(include=[np.number]).columns.tolist()
    rng = np.random.RandomState(random_state)
    X_perturbed = X_borderline.copy()
    for col in numeric_cols:
        noise = rng.uniform(-perturbation_pct, perturbation_pct, size=len(X_perturbed))
        X_perturbed[col] = X_perturbed[col] * (1 + noise)

    original_decisions = model.predict(X_borderline)
    perturbed_decisions = model.predict(X_perturbed)
    flip_rate = float((original_decisions != perturbed_decisions).mean())

    return {
        "test": "decision_boundary_sensitivity",
        "n_borderline": int(len(X_borderline)),
        "perturbation_pct": perturbation_pct,
        "flip_rate": round(flip_rate, 4),
        "flip_threshold": flip_threshold,
        "passed": bool(flip_rate <= flip_threshold),
    }


# ---------------------------------------------------------------------------
# 3. Malformed input handling
# ---------------------------------------------------------------------------
def validate_row(*, row: dict, schema: dict) -> None:
    """Validates a single input row against a schema. Raises
    InputValidationError with every problem found, rather than failing on
    the first one — useful for a single clear rejection message.

    schema: {column: {"dtype": "numeric"|"categorical",
                       "range": (min, max),       # numeric only, optional
                       "categories": [...]}}      # categorical only, optional
    """
    errors = []
    for col, spec in schema.items():
        if col not in row or row[col] is None or (isinstance(row[col], float) and np.isnan(row[col])):
            errors.append(f"{col}: missing value")
            continue
        val = row[col]
        if spec["dtype"] == "numeric":
            if not isinstance(val, (int, float, np.integer, np.floating)):
                errors.append(f"{col}: expected numeric, got {type(val).__name__}")
            elif "range" in spec and not (spec["range"][0] <= val <= spec["range"][1]):
                errors.append(f"{col}: value {val} outside expected range {spec['range']}")
        elif spec["dtype"] == "categorical":
            if "categories" in spec and val not in spec["categories"]:
                errors.append(f"{col}: unexpected category '{val}' (expected one of {spec['categories']})")
    if errors:
        raise InputValidationError("; ".join(errors))


def validate_and_predict(*, model, row: dict, schema: dict, feature_order: list):
    """Validates, then predicts. This is the function that should sit at
    the actual serving boundary — never call model.predict() on raw,
    unvalidated input."""
    validate_row(row=row, schema=schema)
    row_df = pd.DataFrame([row])[feature_order]
    return model.predict(row_df)[0]


def malformed_input_handling_test(*, model, schema, feature_order, test_cases):
    """test_cases: list of (description, row_dict, should_be_rejected).
    Confirms the system rejects what it should and accepts what it should —
    silent failure on bad input is the actual risk Article 15 names."""
    results = []
    for desc, row, should_reject in test_cases:
        try:
            validate_and_predict(
                model=model,
                row=row,
                schema=schema,
                feature_order=feature_order,
            )
            rejected = False
        except InputValidationError:
            rejected = True
        results.append({
            "case": desc,
            "expected_reject": should_reject,
            "actually_rejected": rejected,
            "passed": rejected == should_reject,
        })
    return results


# ---------------------------------------------------------------------------
# 4. Out-of-distribution flagging
# ---------------------------------------------------------------------------
def out_of_distribution_flag(
    *, X_train, X_query, numeric_cols=None, z_threshold=3.0
):
    """Flags query rows whose numeric features fall beyond z_threshold
    standard deviations from the training distribution. Informational only
    — it signals lower confidence, it does not block a prediction. Blocking
    is a product decision, not something this function should impose."""
    if numeric_cols is None:
        numeric_cols = X_train.select_dtypes(include=[np.number]).columns.tolist()
    means = X_train[numeric_cols].mean()
    stds = X_train[numeric_cols].std().replace(0, np.nan)

    z_scores = (X_query[numeric_cols] - means) / stds
    flagged = z_scores.abs().gt(z_threshold).any(axis=1)

    return {
        "test": "out_of_distribution",
        "n_queried": int(len(X_query)),
        "n_flagged": int(flagged.sum()),
        "flagged_rate": round(float(flagged.mean()), 4),
        "z_threshold": z_threshold,
        "note": "informational — flags signal lower confidence, do not block prediction",
    }


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------
def run_robustness_battery(
    *,
    model,
    X_train,
    X_test,
    y_test,
    shift_spec,
    schema,
    feature_order,
    malformed_cases,
    numeric_columns,
):
    """Runs all four checks and returns one combined report, in the same
    shape as the bias modules' output so the PM assistant / decisions.log
    integration introduced earlier works unchanged."""
    return {
        "distribution_shift": distribution_shift_test(
            model=model,
            X_test=X_test,
            y_test=y_test,
            shift_spec=shift_spec,
        ),
        "decision_boundary_sensitivity": decision_boundary_sensitivity(
            model=model,
            X_test=X_test,
            numeric_cols=numeric_columns,
        ),
        "malformed_input_handling": malformed_input_handling_test(
            model=model,
            schema=schema,
            feature_order=feature_order,
            test_cases=malformed_cases,
        ),
        "out_of_distribution": out_of_distribution_flag(
            X_train=X_train,
            X_query=X_test,
            numeric_cols=numeric_columns,
        ),
    }


def to_decision_log_entries(*, report, source="robustness_module"):
    """Converts failed/flagged results into decisions.log-style lines,
    matching the format used by the bias modules and the PM assistant."""
    entries = []
    ds = report["distribution_shift"]
    if not ds["passed"]:
        entries.append(
            f"Distribution shift test FAILED: accuracy dropped {ds['degradation']} "
            f"under shift {ds['shift_spec']} (tolerance {ds['tolerance']}) — source: {source}"
        )
    dbs = report["decision_boundary_sensitivity"]
    if dbs["flip_rate"] is not None and not dbs["passed"]:
        entries.append(
            f"Decision boundary sensitivity FAILED: {dbs['flip_rate']:.1%} of borderline "
            f"decisions flipped under {dbs['perturbation_pct']:.0%} perturbation "
            f"(threshold {dbs['flip_threshold']:.0%}) — source: {source}"
        )
    failed_cases = [c for c in report["malformed_input_handling"] if not c["passed"]]
    for c in failed_cases:
        entries.append(
            f"Malformed input handling FAILED on case '{c['case']}': expected "
            f"reject={c['expected_reject']}, got reject={c['actually_rejected']} — source: {source}"
        )
    ood = report["out_of_distribution"]
    if ood["flagged_rate"] > 0:
        entries.append(
            f"Out-of-distribution: {ood['flagged_rate']:.1%} of queried rows beyond "
            f"z={ood['z_threshold']} of training distribution (informational) — source: {source}"
        )
    return entries


def print_report(*, report):
    print("ARTICLE 15 — ROBUSTNESS BATTERY")
    print("=" * 60)

    ds = report["distribution_shift"]
    status = "PASS" if ds["passed"] else "FAIL"
    print(f"\n[1] Distribution shift — {status}")
    print(f"    shift: {ds['shift_spec']}")
    print(f"    accuracy {ds['baseline_accuracy']} -> {ds['shifted_accuracy']} "
          f"(degradation {ds['degradation']}, tolerance {ds['tolerance']})")

    dbs = report["decision_boundary_sensitivity"]
    status = "PASS" if dbs["passed"] else "FAIL"
    print(f"\n[2] Decision boundary sensitivity — {status}")
    print(f"    n_borderline={dbs['n_borderline']}  flip_rate={dbs['flip_rate']}  "
          f"threshold={dbs['flip_threshold']}")

    print(f"\n[3] Malformed input handling")
    for c in report["malformed_input_handling"]:
        status = "PASS" if c["passed"] else "FAIL"
        print(f"    [{status}] {c['case']} "
              f"(expected_reject={c['expected_reject']}, actual={c['actually_rejected']})")

    ood = report["out_of_distribution"]
    print(f"\n[4] Out-of-distribution flagging — informational")
    print(f"    {ood['n_flagged']}/{ood['n_queried']} rows flagged "
          f"({ood['flagged_rate']:.1%}) at z>{ood['z_threshold']}")

    print("\n" + "=" * 60)
    log_entries = to_decision_log_entries(report=report)
    if log_entries:
        print(f"{len(log_entries)} entries would be written to decisions.log:")
        for e in log_entries:
            print(f"  - {e}")
    else:
        print("No failures or flags — nothing written to decisions.log.")


# ---------------------------------------------------------------------------
# Standalone demo — synthetic data, same shape as the German Credit pipeline
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    from sklearn.model_selection import train_test_split
    from xgboost import XGBClassifier

    rng = np.random.RandomState(7)
    n = 1000
    age = rng.randint(19, 76, n)
    credit_amount = np.round(np.exp(rng.normal(8.2, 0.6, n)))
    duration_months = rng.randint(6, 60, n)
    employment_years = np.clip(rng.normal(6, 4, n), 0, 40).round(1)
    gender = rng.choice(["male", "female"], n)

    risk_score = (
        0.015 * (credit_amount / 1000)
        + 0.04 * duration_months
        - 0.08 * employment_years
        - 0.01 * age
        + rng.normal(0, 1.5, n)
    )
    credit_risk = (risk_score < np.median(risk_score)).astype(int)  # 1 = good

    df = pd.DataFrame({
        "age": age,
        "credit_amount": credit_amount,
        "duration_months": duration_months,
        "employment_years": employment_years,
        "gender_male": (gender == "male").astype(int),
        "credit_risk": credit_risk,
    })

    feature_order = ["age", "credit_amount", "duration_months", "employment_years", "gender_male"]
    X = df[feature_order]
    y = df["credit_risk"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

    model = XGBClassifier(n_estimators=100, max_depth=4, eval_metric="logloss", random_state=42)
    model.fit(X_train, y_train)

    schema = {
        "age": {"dtype": "numeric", "range": (18, 100)},
        "credit_amount": {"dtype": "numeric", "range": (0, 50000)},
        "duration_months": {"dtype": "numeric", "range": (1, 72)},
        "employment_years": {"dtype": "numeric", "range": (0, 50)},
        "gender_male": {"dtype": "numeric", "range": (0, 1)},
    }
    malformed_cases = [
        ("valid row", {"age": 35, "credit_amount": 5000, "duration_months": 24,
                        "employment_years": 5, "gender_male": 1}, False),
        ("negative credit_amount", {"age": 35, "credit_amount": -500, "duration_months": 24,
                                     "employment_years": 5, "gender_male": 1}, True),
        ("missing age", {"age": None, "credit_amount": 5000, "duration_months": 24,
                          "employment_years": 5, "gender_male": 1}, True),
        ("age out of range", {"age": 140, "credit_amount": 5000, "duration_months": 24,
                               "employment_years": 5, "gender_male": 1}, True),
    ]

    report = run_robustness_battery(
        model=model,
        X_train=X_train,
        X_test=X_test,
        y_test=y_test,
        shift_spec={"credit_amount": 1.15},  # simulate 15% inflation
        schema=schema,
        feature_order=feature_order,
        malformed_cases=malformed_cases,
        numeric_columns=[
            "age",
            "credit_amount",
            "duration_months",
            "employment_years",
        ],
    )

    print_report(report=report)
