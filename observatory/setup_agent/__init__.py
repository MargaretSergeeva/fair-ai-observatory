"""
setup_agent — Fair AI Observatory

Conversational configuration agent. Wraps the Claude API with tool use
to scan a dataset and guide the user through configuring a compliant
fairness pipeline.

Conversation flow:
  1. Schema discovery  — infer columns, detect protected attributes (3 layers)
  2. Risk classification — map use case to EU AI Act risk tier
  3. Metric selection   — choose fairness checks for that tier + decision type
  4. Config draft       — generate pipeline_config.yaml for human review
  5. Handoff            — approved config → Airflow DAG (agent exits here)

See: docs/concept/overview.md for the concept rationale.
     decisions.log for every config choice made at runtime.
"""
