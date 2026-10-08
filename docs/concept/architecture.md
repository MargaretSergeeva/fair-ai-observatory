# Architecture and Evidence Boundaries

## Current implementation

```text
React concept demo
├── Act 1: scripted synthetic product scenario
├── Act 2: scripted governance/process scenario
├── Pipeline Schema: target architecture diagram
└── UCI Reference Run: renders repository JSON artifact

Python reference path
├── download official UCI archive
├── verify archive checksum and raw shape
├── decompose compound protected-attribute field and encode features
├── train deterministic XGBoost baseline without protected features
├── run disparate-impact and equalized-odds checks
├── run intersectional checks with minimum-n gates
├── apply Fairlearn mitigation to the largest failed disparate-impact check
├── execute robustness battery
└── write artifacts/uci_german_credit_run.json
```

Implemented Python code:

- `scripts/download_uci_german_credit.py`
- `scripts/run_reference_audit.py`
- `observatory/ingestion/ingestion.py`
- `observatory/model/model.py`
- `observatory/bias/disparate_impact.py`
- `observatory/bias/counterfactual_fairness.py`
- `observatory/bias/intersectional.py`
- `observatory/bias/mitigation.py`
- `observatory/robustness/robustness.py`

## Target architecture shown by the concept

```text
Dataset → Setup Agent → Human-approved configuration
       → Great Expectations → dbt → XGBoost
       → bias battery → Fairlearn mitigation
       → robustness battery
       → audit trail, dashboard and compliance documents
```

The following target components are not implemented end to end:

- dataset upload and general schema ingestion;
- conversational setup agent;
- Great Expectations validation suite;
- dbt transformations;
- Airflow orchestration;
- PostgreSQL persistence;
- n8n/Jira synchronization;
- continuous monitoring, retention enforcement, override and stop controls.

## Evidence classification

| Evidence | Source | Status |
|---|---|---|
| Synthetic fairness and mitigation values | `demo/ObservatoryDemo.jsx` | Scripted concept values |
| Synthetic process and stakeholder values | `demo/ProcessCommandCenter.jsx` | Scripted concept values |
| UCI six-stage fairness and robustness values | `artifacts/uci_german_credit_run.json` | Reproducible reference result |
| Annex IV and Instructions for Use | `docs/*.docx` | Regenerated sample deliverables from the real reference result |
| Markdown compliance reading copies | `docs/compliance-samples/` | Synthetic concept samples; not authoritative for the real run |
| Target pipeline | `demo/ObservatorySchema.jsx` | Architecture concept |

## Data boundary

Raw UCI data is downloaded into ignored `data/raw/` and is not required in the repository. The versioned artifact contains only aggregate results, provenance, runtime versions, methodology settings, and limitations.

## Known technical boundary

The standalone robustness module is a technical spike rather than production validation software. Its results are useful for the concept, but its input semantics and edge cases require further hardening before production use.
