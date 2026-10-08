# Fair AI Observatory — Project Charter & Management Approach

## 1. Concept Summary

The Fair AI Observatory is an open-source EU AI Act compliance and bias-detection pipeline for high-risk ML systems, built against the UCI Statlog German Credit dataset as the reference case. It combines a deterministic data/ML pipeline (Airflow, PostgreSQL, Great Expectations, dbt, XGBoost, Fairlearn) with an AI-agent layer that assists development, project management, and decision pressure-testing — and, as a product feature, helps new users configure the pipeline for their own datasets.


**Current state:** six core modules complete (ingestion, XGBoost baseline, disparate impact, counterfactual fairness, intersectional bias, Fairlearn mitigation). HMDA dataset support deferred to v1.1.

## 2. Project Governance Model

**Human owner:** Margarita — sole decision-maker on anything that becomes part of the audit trail. Agents propose; she approves. This is non-negotiable for any output that functions as compliance evidence.

**Agent team:**
| Agent | Role | Decision authority |
|---|---|---|
| Developer | Implements, tests, flags PRs for review | None — never merges |
| PM Assistant | Tracks status, logs decisions, guides phase gates, syncs Jira | None — surfaces, doesn't decide |
| Stakeholder Panel | Pressure-tests methodology decisions pre-commit | None — argues, doesn't decide |
| Setup Agent *(product feature, not project team)* | Helps end users configure their own pipeline | Proposes config only; user approves |

## 3. PM Assistant — Expanded Mandate

The PM assistant's job is broader than status reporting. Across the project lifecycle, it:

- **Gatekeeps phase transitions** — before work moves from one phase to the next (e.g. starting a new module's "Execution"), checks that the required artifacts from the prior gate exist: a decision log entry for the metric/threshold choice, a stakeholder panel run if the decision had real tradeoffs, a Jira issue created and scoped.
- **Nudges toward best practice, grounded in the actual course material** — not generic PM advice. It draws on the THRIVE AI-Augmented Project Management frameworks rather than generic advice.
- **Flags missing artifacts** — e.g. a module marked "in progress" with no risk note, a decision made in conversation but never logged, a stakeholder register entry with no defined engagement approach.
- **Still does the original job** — status reporting, decision logging, Jira sync.

The distinction that matters: a reporting tool tells you what happened. A PM assistant with this mandate also tells you what's *missing* before it becomes a problem — closer to a process coach than a dashboard.

## 4. Stakeholder Register (project-level — real people, not the simulated panel)

| Stakeholder | Interest | Influence | Engagement |
|---|---|---|---|
| Margarita (Owner/PM) | Full ownership, learning outcome | Full | Daily |
| THRIVE faculty/evaluators | Assessment against program rubric | Assignment-scoped | Per deliverable |
| Future open-source contributors | Potential collaborators, code quality | TBD — none yet | Via repo, once public |
| End users (compliance teams, hypothetical) | Eventual adopters of the setup agent | Shapes setup agent design | Via setup agent feedback loop, once built |


## 5. Project Phases

| Phase | Status | PM Assistant gate check |
|---|---|---|
| Initiation | Retroactively formalized by this document | Charter + stakeholder register exist |
| Planning | Partially done (six-module scope, dataset choice) | Decision log covers scope calls (HMDA deferral, etc.) |
| Execution | In progress — six modules done, agent layer being built | Each module has a logged decision trail; Jira issue exists |
| Monitoring & Control | Starting now, via PM assistant + Jira sync | Weekly status digest running; blockers tracked |
| Closure (v1 / v1.1) | Not started | HMDA support, setup agent shipped, documentation complete |

## 6. Tooling Map

```
Jira (human-facing record)
   ⇅  n8n sync workflows
decisions.log / module_status.yaml (agent-facing state)
   ⇅
agent skills  →  developer | PM assistant | stakeholder panel
   ⇅
GitHub repo  →  Airflow → Great Expectations → dbt → XGBoost/Fairlearn pipeline
```
