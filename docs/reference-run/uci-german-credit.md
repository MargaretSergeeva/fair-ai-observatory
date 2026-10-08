# UCI German Credit Reference Run

## Purpose

This reference run provides a real-data technical evidence layer separate from the scripted synthetic product scenario.

## Dataset

- Name: Statlog (German Credit Data)
- Provider: UCI Machine Learning Repository
- Source: <https://archive.ics.uci.edu/dataset/144/statloggermancreditdata>
- DOI: `10.24432/C5NC77`
- License: CC BY 4.0
- Raw shape: 1,000 rows, 20 features and one target column

The downloader accepts only the expected official archive SHA-256:

```text
e12d9d5def6845c0622634a1cd2ab87fa470668c4298f1ec52a4e403376a435b
```

It also validates the raw `1000 × 21` shape before writing the dataset.

## Reproduction

From the repository root:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

PYTHONPATH=. python scripts/download_uci_german_credit.py
PYTHONPATH=. python scripts/run_reference_audit.py
```

Raw data is stored under ignored `data/raw/german_credit/german.data`.

The generated aggregate artifact is:

```text
artifacts/uci_german_credit_run.json
```

## Methodology

- target `credit_risk == 1` is interpreted as good credit;
- train/test split: stratified 70/30, `random_state=42`;
- categorical features: one-hot encoded;
- model: XGBoost, 100 estimators, depth 4, learning rate 0.05;
- gender mapping follows the official `personal_status_sex` definitions;
- no hyperparameter tuning;
- official asymmetric cost matrix not applied;
- mitigation targets the largest failed disparate-impact check and reports its cost and residual failure.

## Captured results

| Metric | Result |
|---|---:|
| Test accuracy | 73.67% |
| Male predicted approval rate | 80.39% |
| Female predicted approval rate | 80.21% |
| Gender disparate impact | 0.9977 — PASS |
| Foreign-worker proxy disparate impact | 0.7944 — FAIL |
| Post-mitigation foreign-worker DIR | 0.8342 — PASS |
| Post-mitigation foreign-worker parity gap | 0.1530 — FAIL |
| Accuracy after mitigation | 72.33% |
| Distribution-shift degradation | 0.67% — PASS |
| Boundary-sensitivity flip rate | 22.22% — FAIL |
| Malformed input cases | 4/4 — PASS |
| OOD flagged rate | 3.67% — INFO |

The failed `foreign_worker` comparison is based on only 13 `A202` test rows (24 training rows). The metric and mitigation result are therefore unstable and must be treated as an exploratory signal, not a defensible group-level conclusion.

## Artifact reproducibility

With the runtime versions recorded inside the artifact, repeated local execution produced the same JSON SHA-256:

```text
fdbe43544c1a4d46e62a48775a47c18634e17abdb359ce3ebd952d82b0b7371e
```

Library upgrades can change model output. Regenerate intentionally and review the full metric diff rather than accepting drift silently.

## Interpretation boundary

This is an exploratory baseline, not a production model evaluation, legal assessment, or conformity claim. Passing the gender checks does not prove general fairness. The residual foreign-worker proxy disparity, equalized-odds findings, incomplete mitigation and failed boundary-sensitivity check remain open concerns.
