# ADR 0001: Ship pi-autoreason as a Pi package

## Status

Accepted

## Context

Pi packages can bundle extensions and skills for install via `pi install git:github.com/joelhooks/pi-autoreason`. The goal is a reusable Autoreason workflow inside Pi, not a one-off local script.

## Decision

`pi-autoreason` is an installable Pi package with:

- an extension providing `/autoreason` and `autoreason_run`
- a skill documenting when and how to use the workflow
- shared TypeScript core modules for scoring, prompts, artifacts, and lifecycle modeling

## Consequences

- The package can be versioned and installed globally or per project.
- Runtime dependencies must live in `dependencies`; Pi core packages remain peer dependencies.
- The first implementation favors text/source artifacts over direct code edits.
