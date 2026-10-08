# Fair AI Observatory

**Demo**: https://fair-ai-observatory.netlify.app

**Interactive concept prototype for an EU AI Act-oriented fairness and robustness workflow.**

The reference use case is consumer credit scoring. The project demonstrates how dataset configuration, deterministic evaluation, human review, audit history, and compliance-document samples could fit into one product experience.

> This repository is a concept prototype, not a production compliance platform, conformity assessment, or source of legal advice.

## What the demo contains

| View | Purpose | Evidence type |
|---|---|---|
| Act 1 — Product Demo | Setup flow, simulated pipeline, fairness mitigation and dashboard | Scripted synthetic scenario |
| Act 2 — Process View | Milestones, agent roles, decision log and stakeholder panel | Scripted governance scenario |
| Pipeline Schema | Intended end-to-end architecture | Target architecture |
| UCI Reference Run | Six-stage fairness pipeline and robustness results on public UCI data | Reproducible Python-generated artifact |

The synthetic and real-data layers are intentionally separate. Act 1 retains its scripted product story. The UCI view renders the actual six-stage run: gender checks pass, foreign-worker proxy and equalized-odds checks expose findings, mitigation is attempted but remains incomplete, and boundary sensitivity fails.

## Current implementation

Implemented:

- responsive React/Vite concept demo;
- standalone Article 15 robustness battery;
- official UCI German Credit downloader with checksum and shape validation;
- deterministic XGBoost reference audit;
- reusable ingestion, baseline-model, disparate-impact, equalized-odds, intersectional-bias and Fairlearn-mitigation modules;
- machine-readable real-data result artifact;
- restored and regenerated DOCX compliance deliverables plus Markdown reading copies.

Shown as target architecture, but not implemented end to end:

- general dataset upload beyond the UCI reference contract;
- conversational setup agent;
- Great Expectations, dbt and Airflow pipeline;
- PostgreSQL, n8n and Jira integrations;
- continuous monitoring, retention enforcement and operational oversight controls.

## Run the demo

Prerequisites: Node.js and npm.

```bash
cd demo
npm ci
npm run dev
```

Production build check:

```bash
cd demo
npm run check
```

Netlify deployment is defined by the root [`netlify.toml`](netlify.toml). The site builds from `demo/` with Node.js 22 and publishes `demo/dist`.

## Reproduce the UCI reference run

Prerequisites: Python 3.10+.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

PYTHONPATH=. python scripts/download_uci_german_credit.py
PYTHONPATH=. python scripts/run_reference_audit.py
```

The downloader writes raw data to ignored `data/raw/`. The audit writes the repository artifact:

```text
artifacts/uci_german_credit_run.json
```

Captured reference results:

| Metric | Result |
|---|---:|
| Test accuracy | 73.67% |
| Gender disparate impact | 0.9977 — PASS |
| Foreign-worker proxy disparate impact | 0.7944 — FAIL |
| Post-mitigation foreign-worker DIR | 0.8342 — PASS |
| Post-mitigation foreign-worker parity gap | 0.1530 — FAIL |
| Boundary-sensitivity flip rate | 22.22% — FAIL |
| OOD flagged rate | 3.67% — INFO |

Mitigation targets the largest failed disparate-impact check (`foreign_worker`). It improves DIR but does not bring the parity gap below its diagnostic threshold; accuracy decreases from 73.67% to 72.33%. The result is explicitly recorded as incomplete.

The smaller `foreign_worker` test group contains only 13 rows. Its result and the mitigation attempt are exploratory signals that require more data, not compliance conclusions.

Full methodology and provenance: [UCI German Credit Reference Run](docs/reference-run/uci-german-credit.md).

Dataset: Hans Hofmann, *Statlog (German Credit Data)*, UCI Machine Learning Repository, DOI `10.24432/C5NC77`, CC BY 4.0.

## Documentation

Start at the [Documentation Index](docs/README.md).

Primary documents:

- [UCI Reference Run](docs/reference-run/uci-german-credit.md)
- [Annex IV sample](docs/compliance-samples/annex-iv.md)
- [Instructions for Use sample](docs/compliance-samples/instructions-for-use.md)
- [Annex IV DOCX](docs/Annex_IV_Technical_Documentation.docx)
- [Instructions for Use DOCX](docs/Instructions_for_Use.docx)
- [Project Charter](docs/project-management/project-charter.md)

`decisions.log` and `module_status.yaml` are sample governance artifacts used by the process concept.

## Repository structure

```text
fair-ai-observatory/
├── artifacts/
│   └── uci_german_credit_run.json
├── demo/
│   ├── ObservatoryDemo.jsx
│   ├── ProcessCommandCenter.jsx
│   ├── ObservatorySchema.jsx
│   └── ReferenceRun.jsx
├── docs/
│   ├── README.md
│   ├── concept/
│   ├── compliance-samples/
│   ├── project-management/
│   └── reference-run/
├── observatory/
│   ├── ingestion/
│   ├── model/
│   ├── bias/
│   ├── robustness/robustness.py
│   └── setup_agent/
├── scripts/
│   ├── download_uci_german_credit.py
│   └── run_reference_audit.py
├── tests/
│   └── test_pipeline.py
├── decisions.log
├── module_status.yaml
└── requirements.txt
```

## Methodology boundaries

- The `0.80` disparate-impact and `0.10` parity-gap thresholds are documented diagnostic choices, not EU AI Act bright lines.
- Synthetic Act 1 values must not be presented as UCI reference results.
- Passing selected fairness thresholds does not establish general fairness.
- The current robustness implementation is a technical spike, not production validation infrastructure.
- Humans retain authority over methodology, deployment, remediation and regulatory interpretation.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before changing audit behavior or evidence.

## License

Project code and documentation are available under the [MIT License](LICENSE). The UCI dataset has its own CC BY 4.0 license and attribution requirements.
