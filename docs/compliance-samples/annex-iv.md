# Technical Documentation

> **Synthetic reading copy.** This Markdown file preserves the scripted Act 1 scenario. The formal sample deliverable regenerated from the real UCI pipeline is [`../Annex_IV_Technical_Documentation.docx`](../Annex_IV_Technical_Documentation.docx).

Annex IV — EU AI Act · Consumer Credit Scoring Model

| SAMPLE DOCUMENTGenerated from a synthetic demonstration dataset (1,000 synthetic records, modeled on the UCI German Credit / Statlog structure) for methodology and portfolio demonstration. Not a regulatory filing for a production system. |
|---|

### Document Control

| System name | Consumer Credit Scoring Model — Fair AI Observatory pipeline |
|---|---|
| Dataset | german_credit_sample.csv (synthetic, 1,000 records, 21 columns) |
| Risk classification | EU AI Act Annex III — High-Risk (credit scoring) |
| Pipeline run | Run #1 |
| Report date | 21 June 2026 |
| Document status | Pending DPO review |

### Scope of This Document

This document covers the following obligations to the depth indicated. It is written to be precise about boundaries rather than implying broader coverage than what was built:

| Article | Coverage | Detail |
|---|---|---|
| Art. 9 — Risk management | Partial | Risk classification and point-in-time mitigation are documented (Section 4). Continuous/ongoing monitoring infrastructure is not yet built. |
| Art. 10 — Data governance | Full | All sub-clauses (a)–(g) addressed, including bias examination (Section 5). |
| Art. 12 — Record-keeping | Policy-level | Logging policy documented (Section 7). Automated retention enforcement is not yet built. |
| Art. 13 — Transparency | Separate document | See the companion Instructions for Use document — written for deployers, not included here. |
| Art. 14 — Human oversight | Partial | Sign-off mechanism documented (Section 8). Override/stop infrastructure is not yet built. |
| Art. 15 — Robustness | Full | Distribution shift, decision-boundary sensitivity, malformed-input handling, and OOD flagging all tested (Section 6). Cybersecurity coverage is policy-level only. |

## 1. General Description

Intended purpose: approve or deny consumer credit applications based on applicant financial and demographic data, supporting (not replacing) a human lending decision.

Classification: EU AI Act Annex III, high-risk — the system makes individual creditworthiness determinations affecting access to financial services.

Model type: gradient-boosted decision tree (XGBoost classifier), trained on tabular applicant data. Outputs a binary approve/deny decision derived from a predicted probability of good credit risk.

Version: Run #1 of the Fair AI Observatory pipeline, dated 21 June 2026.

### 2. Design Choices

Target variable: credit_risk (binary: good/bad), the standard label in the underlying dataset. Treating this as a binary classification problem was a deliberate simplification — a real deployment would likely use a continuous risk score reviewed by a human underwriter rather than an automated binary cutoff.

Model family: XGBoost was chosen for its native handling of mixed numeric/categorical tabular data and compatibility with Fairlearn's post-processing mitigation tools, over alternatives like logistic regression (more interpretable, less expressive) or deep tabular models (more expressive, harder to audit).

### 3. Data Collection & Preparation

Origin: UCI Statlog (German Credit) dataset structure; this run uses a synthetic sample matching its schema rather than the original data, for demonstration purposes.

Preparation pipeline: schema validation (Great Expectations) → feature transforms (dbt) → train/test split → model training. See Section 5.2 for validation results.

Assumptions: the target label reflects historical lending outcomes, which may themselves encode historical bias — this is a known limitation of any supervised model trained on past decisions, not specific to this pipeline.

Data sufficiency: 1,000 records total. Adequate for the top-level metrics in Section 5, but several intersectional subgroups fall below the minimum-n=30 policy (Section 5.4) — those cells are excluded rather than reported on insufficient data.

Known data gaps: no income-verification field, no geographic/regional indicator, no repeat-applicant history. A production system would need all three to meet the 'availability, quantity, and suitability' standard in Article 10(2)(e).

## 4. Risk Management (Article 9)

Risk identification: two risk categories were identified through this pipeline — disparate treatment risk (Section 5) and decision-instability risk (Section 6).

| Risk | Mitigation Applied |
|---|---|
| Disparate impact across gender/age subgroups | Fairlearn ThresholdOptimizer applied; see Section 5.3 for before/after results. |
| Decision instability near the approval boundary | Identified via Section 6.2; flagged for model review, no automated mitigation applied yet. |

Continuous monitoring: this report reflects a single pipeline run (Run #1). Ongoing risk management — re-running this battery on a schedule or on data-drift triggers — is part of the project roadmap but not yet implemented.

## 5. Data Governance & Bias Examination (Article 10)

### 5.1 Protected Attributes Identified

| Attribute | Detection Method | Confidence |
|---|---|---|
| gender | Decomposed from compound field personal_status_and_sex | High |
| marital_status | Decomposed from compound field personal_status_and_sex | High |
| age | Numeric column, value range 19–75 | High |
| foreign_worker | Statistical association with nationality (proxy) | Medium |

### 5.2 Data Quality Validation (Great Expectations)

| Check | Detail | Result |
|---|---|---|
| Schema match | 21/21 expected columns present | PASS |
| Null check — target | credit_risk: 0 nulls | PASS |
| Range check — age | 19–75, within expected bounds | PASS |
| Duplicate rows | 0 found | PASS |
| Value set — personal_status_and_sex | 4/4 expected categories | PASS |
| Outlier check — credit_amount | 3 values beyond 3× IQR | WARNING |

### 5.3 Bias Testing Results

Metrics, thresholds, and basis:

| Metric | Threshold | Basis |
|---|---|---|
| Disparate Impact Ratio | ≥ 0.80 | Diagnostic default — not a legal bright line |
| Statistical Parity Difference | ≤ 0.10 | Diagnostic default — not a legal bright line |
| Intersectional Analysis | min n = 30 per cell | Internal data-sufficiency policy |

Pre-mitigation:

| Metric | Result | Threshold | Outcome |
|---|---|---|---|
| Disparate Impact Ratio | 0.70 | 0.80 | FAIL |
| Statistical Parity Difference | 0.24 | 0.10 | FAIL |

Supporting figures: male approval rate 80% (320/400); female approval rate 56% (224/400).

Post-mitigation (Fairlearn ThresholdOptimizer, triggered by any_metric_violation):

| Metric | Result | Threshold | Outcome |
|---|---|---|---|
| Disparate Impact Ratio | 0.97 | 0.80 | PASS |
| Statistical Parity Difference | 0.02 | 0.10 | PASS |

Performance cost of mitigation, disclosed rather than omitted:

| Metric | Pre-Mitigation | Post-Mitigation | Δ |
|---|---|---|---|
| Accuracy | 78% | 75% | −3 pts |
| AUC-ROC | 0.81 | 0.79 | −0.02 |
| Precision | 0.74 | 0.71 | −0.03 |
| Recall | 0.69 | 0.72 | +0.03 |

### 5.4 Intersectional Breakdown

| Subgroup | n | Approval Rate | Note |
|---|---|---|---|
| Male · 18–25 | 142 | 71% |  |
| Male · 26+ | 258 | 84% |  |
| Female · 18–25 | 24 | — | Insufficient data (n < 30) — excluded |
| Female · 26+ | 234 | 58% |  |

## 6. Accuracy, Robustness & Cybersecurity (Article 15)

Four checks were run against the trained model, beyond the accuracy/fairness metrics already reported in Section 5. These test whether the model's behavior is stable, not just whether it's accurate on average.

### 6.1 Distribution Shift

A 15% inflation-style shift was applied to credit_amount and the model re-evaluated on the shifted test set.

| Check | Detail | Result |
|---|---|---|
| Distribution shift (credit_amount +15%) | accuracy 0.59 → 0.61 (Δ −0.02, tolerance 0.05) | PASS |

### 6.2 Decision Boundary Sensitivity

Applicants the model was least confident about (predicted probability 0.45–0.55) had their numeric features perturbed by ±5%, and the resulting decision was compared to the original.

| Check | Detail | Result |
|---|---|---|
| Decision boundary sensitivity | 27.6% of borderline decisions flipped (threshold 10%) | FAIL |

This is flagged for model review: a meaningful share of borderline applicants would receive a different decision under a small, plausible change to their inputs. This is distinct from the bias findings in Section 5 — it concerns decision stability, not disparate treatment between groups.

### 6.3 Malformed Input Handling

| Test Case | Expectation | Result |
|---|---|---|
| Valid row | Accepted | PASS |
| Negative credit_amount | Rejected | PASS |
| Missing age | Rejected | PASS |
| Age out of range (140) | Rejected | PASS |

### 6.4 Out-of-Distribution Flagging

0 of 300 test-set rows fell beyond 3 standard deviations of the training distribution (informational signal only — does not block prediction).

### 6.5 Cybersecurity

Current coverage is policy-level: input validation at the serving boundary (Section 6.3) is the primary control. Adversarial robustness testing beyond input-range checks, model-extraction resistance, and data-poisoning resistance are not yet implemented.

## 7. Record-Keeping (Article 12)

All methodology decisions, threshold choices, and test outcomes are written to a structured decisions.log, in the format: timestamp, event, source (setup_agent, pipeline, pm_assistant, or robustness_module).

- Logged events: schema/attribute detection decisions, threshold assignments, metric failures, mitigation triggers, robustness test failures.
- Retention: logs are retained for the lifetime of the pipeline run at minimum; a formal retention period aligned with applicable sectoral requirements has not yet been set as policy.
- Access: the log is human-readable and machine-parseable, intended to support both the PM assistant's status reporting and a future regulator audit request.
## 8. Human Oversight (Article 14)

Per Article 14, the methodology choices and results in this document require human sign-off before this configuration is used in production.

| Reviewer | Role | Decision | Date |
|---|---|---|---|
|  | DPO | Pending |  |

Current scope: a sign-off field, reviewed against this document. Override or stop mechanisms for a live system (e.g. a kill switch on the serving endpoint) are not yet built.

## 9. Audit Trail

| Time | Event | Source |
|---|---|---|
| 14:02 | Detected compound field personal_status_and_sex; decomposed into gender + marital_status | setup_agent |
| 14:03 | Classified as Annex III high-risk (credit scoring) | setup_agent |
| 14:04 | Disparate impact threshold set to 0.80 (diagnostic default) | setup_agent |
| 14:05 | Female · 18–25 cell excluded from intersectional analysis (n=24 < 30) | pipeline |
| 14:11 | Disparate impact 0.70 below threshold; ThresholdOptimizer mitigation applied | pipeline |
| 14:12 | Post-mitigation disparate impact 0.97; flagged for DPO review | pm_assistant |
| 14:18 | Decision boundary sensitivity 27.6% flip rate exceeds 10% threshold; flagged for model review | robustness_module |

## 10. Conclusion

Bias testing identified disparate impact below the diagnostic threshold; mitigation resolved it at a disclosed accuracy cost. Robustness testing separately identified a decision-stability issue at the approval boundary, unresolved as of this run. Both findings, the full data-governance record, and the audit trail above constitute the technical documentation basis for DPO sign-off prior to production use. Open items — continuous risk monitoring (Section 4), automated log retention (Section 7), oversight infrastructure (Section 8), and a resolution for the boundary-sensitivity finding (Section 6.2) — are tracked as roadmap items, not silently omitted.

