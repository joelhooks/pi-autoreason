# ADR 0002: Model the Autoreason lifecycle with XState v5

## Status

Accepted

## Context

Autoreason has finite modes, retries, cancellation, pass caps, convergence state, and artifact writes. Boolean soup would hide important behavior.

## Decision

Represent the loop as an explicit XState v5 machine with states for initial generation, critic, author B, synthesis, judging, selecting, convergence, and failure.

## Consequences

- The workflow is inspectable and resumability-friendly.
- The initial MVP may execute the async calls in a simple runner, but the state machine remains the canonical lifecycle map.
