# Instructions for Use

> **Synthetic reading copy.** This Markdown file preserves the scripted Act 1 scenario. The formal sample deliverable regenerated from the real UCI pipeline is [`../Instructions_for_Use.docx`](../Instructions_for_Use.docx).

Article 13 — EU AI Act · Consumer Credit Scoring Model

| SAMPLE DOCUMENTGenerated from a synthetic demonstration dataset for methodology and portfolio demonstration. Not a regulatory filing for a production system. |
|---|

This document is written for the team deploying this model — compliance staff, loan officers, and IT operations — not for data scientists. For the full technical methodology, see the companion [Annex IV Technical Documentation](annex-iv.md).

## 1. Intended Purpose

This system supports a human decision to approve or deny a consumer credit application. It is a decision-support tool, not an automated final decision-maker — every output should be reviewed by a qualified loan officer before action is taken on it, particularly for denials and for any application flagged below.

This system should not be used for any purpose other than consumer credit decisioning — for example, it has not been validated for business/commercial lending, insurance underwriting, or employment screening, and should not be repurposed for those without separate validation.

## 2. Performance Characteristics

On the evaluation dataset used for this report, the model performed as follows:

| Overall accuracy | 75% (after fairness mitigation; 78% before) |
|---|---|
| Disparate impact across gender | 0.97 (within target range, post-mitigation) |
| Decision stability at the approval boundary | Below target — see Section 3 |

These figures reflect performance on the evaluation dataset described in the Technical Documentation. Performance on your institution's actual applicant population may differ and should be monitored after deployment (Section 5).

## 3. Known Limitations

Be aware of the following before relying on this system's output:

- Borderline decisions are less stable than they appear. For applicants near the approval threshold, a small difference in reported figures can change the outcome. Treat any decision flagged as "borderline" by the system as requiring manual review, not automatic acceptance.
- Some demographic subgroups are underrepresented in the evaluation data. Approval-rate fairness has not been separately verified for combinations of attributes with very few applicants in the data (for example, a specific age range within a specific gender) — these were excluded from formal analysis rather than reported on insufficient evidence.
- The model was not evaluated on income-verification data, geographic/regional indicators, or repeat-applicant history, because the evaluation dataset does not include them. If your deployment includes these factors, request a re-evaluation before relying on the model for those applicants.
- The model reflects patterns in historical lending data, which may itself encode past human bias. Mitigation was applied for the attributes tested (Section 2), but this does not guarantee fairness on attributes or combinations not tested.
## 4. Required Human Oversight

Per Article 14, this system must not be used without the following oversight in place:

- A named reviewer (e.g. a Data Protection Officer or equivalent) must sign off on the configuration described in the Technical Documentation before production use.
- Any application the system flags as borderline, or any denial, should be reviewed by a human loan officer with the authority to override the system's output.
- Reviewers should be able to explain — in plain terms, to the applicant — why a decision was made, drawing on the factors described in this document rather than the model's internal scoring logic.
## 5. Maintenance & Monitoring

This report reflects a single evaluation run. To keep it valid over time:

- Re-run the fairness and robustness evaluation periodically (recommended: quarterly, or immediately after any meaningful change in applicant population or underlying data sources).
- Monitor real-world approval rates by demographic group on an ongoing basis — the figures in Section 2 are a snapshot, not a guarantee.
- If approval-rate patterns shift meaningfully from what's reported here, treat that as a trigger for re-evaluation, not something to investigate only at the next scheduled review.
## 6. Provider Contact

Questions about this system's behavior, or requests to report an issue, should be directed to the system provider's compliance contact (to be completed before deployment).
