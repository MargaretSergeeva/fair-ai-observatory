# Contributing

## Before you open a PR

Follow the conventions below and respect the sign-off boundary for anything that touches the audit trail.

## Key conventions

- Always run with `PYTHONPATH=.`
- `pandas<3.0` is pinned — do not bump without checking Fairlearn compatibility
- Write to `decisions.log` for any judgment call (threshold choice, scope change, deferred item)
- Run the full test suite, not just the touched module — bias modules share data assumptions

## What needs human review

- Anything that changes a fairness metric's output or mitigation behavior
- Anything that becomes part of the audit trail
- Any new protected-attribute detection or decomposition logic

## What doesn't need ceremony

- Typos, logging changes, refactors with no behavior change, test scaffolding

## Areas especially welcome

- Additional fairness metrics or mitigation strategies
- New dataset adapters (HMDA, Home Credit, Lending Club)
- Article 15 robustness extensions
- Translations of the compliance documentation
- Resolution of the boundary-sensitivity open finding (see `decisions.log`)
