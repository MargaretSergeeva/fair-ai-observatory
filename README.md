# Fair AI Observatory

**Open-source EU AI Act compliance and bias-detection pipeline for high-risk ML systems.**
Reference case: consumer credit scoring on the UCI Statlog German Credit dataset.

**Live demo:** https://fair-ai-observatory.netlify.app · [What the demo shows](docs/demo.md)

> Concept prototype – not a production compliance platform, conformity assessment or legal advice.

## Concept

The Observatory combines a deterministic data/ML pipeline with an AI-agent layer that assists development, project management and decision pressure-testing – and, as a product feature, helps new users configure the pipeline for their own datasets.

- **Implemented:** a six-stage Python reference pipeline – ingestion, XGBoost baseline, disparate impact, counterfactual fairness (equalized odds), intersectional bias and Fairlearn mitigation – plus an Article 15 robustness battery and generated Annex IV / Instructions for Use documents.
- **Target architecture:** orchestration with Airflow, data quality with Great Expectations and dbt, PostgreSQL storage, the conversational setup agent, and n8n/Jira integrations.
- **Next:** HMDA dataset support (v1.1).

## Governance model

**Human owner:** Margarita Sergeeva – sole decision-maker on anything that becomes part of the audit trail. Agents propose; the owner approves. This is non-negotiable for any output that functions as compliance evidence.

| Agent | Role | Decision authority |
|---|---|---|
| Developer | Implements, tests, flags PRs for review | None – never merges |
| PM Assistant | Tracks status, logs decisions, guides phase gates | None – surfaces, doesn't decide |
| Stakeholder Panel | Pressure-tests methodology decisions before commit | None – argues, doesn't decide |
| Setup Agent *(product feature)* | Helps end users configure their own pipeline | Proposes configuration; user approves |

## PM assistant mandate

A reporting tool tells you what happened. A PM assistant with this mandate also tells you what's *missing* before it becomes a problem – closer to a process coach than a dashboard. It:

- **Gatekeeps phase transitions** – checks that required artifacts exist before work moves on: a decision-log entry for every metric or threshold choice, a stakeholder-panel run for decisions with real trade-offs, and a scoped issue.
- **Grounds advice in a framework** – draws on the THRIVE AI-Augmented Project Management frameworks rather than generic advice.
- **Flags missing artifacts** – e.g. a module in progress without a risk note, or a decision made in conversation but never logged.
- **Reports and logs** – status reporting and decision logging.

## Project phases

| Phase | Status | Gate check |
|---|---|---|
| Initiation | Complete | Charter and stakeholder register exist |
| Planning | Complete for v1 (six-module scope, dataset choice) | Decision log covers scope calls (e.g. HMDA deferral) |
| Execution | In progress – six modules done, agent layer in progress | Each module has a logged decision trail |
| Monitoring & Control | In progress | Status digest and blocker tracking |
| Closure (v1 / v1.1) | Planned | HMDA support, setup agent, documentation complete |

## Tooling map

```text
Issue tracker (human-facing record)
   ⇅  sync workflows (target: n8n + Jira)
decisions.log / module_status.yaml (agent-facing state)
   ⇅
agent skills  →  developer | PM assistant | stakeholder panel
   ⇅
GitHub repo  →  Python reference pipeline (target: Airflow → Great Expectations → dbt → XGBoost/Fairlearn)
```

## Documentation

- [Demo description](docs/demo.md)
- [Project Charter](docs/project-management/project-charter.md)
- [UCI Reference Run](docs/reference-run/uci-german-credit.md)
- [Annex IV sample](docs/compliance-samples/annex-iv.md) · [DOCX](docs/Annex_IV_Technical_Documentation.docx)
- [Instructions for Use sample](docs/compliance-samples/instructions-for-use.md) · [DOCX](docs/Instructions_for_Use.docx)

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
│   ├── demo.md
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

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before changing audit behavior or evidence.

## License

Project code and documentation are available under the [MIT License](LICENSE). The UCI dataset has its own CC BY 4.0 license and attribution requirements.
