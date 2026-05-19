# pi-autoreason

Pi package for Autoreason-style self-refinement.

Based on the paper **Autoreason: Self-Refinement That Knows When to Stop**.

## What it does

Each pass creates and judges three candidates:

- `A`: unchanged incumbent
- `B`: adversarial revision based on a critic
- `AB`: synthesis of A and B

Fresh judges rank randomized candidates with Borda scoring. The incumbent wins ties. The loop stops when `A` wins `k=2` consecutive passes or when `maxPasses` is reached.

## Install

```bash
pi install git:github.com/joelhooks/pi-autoreason
```

Local dev:

```bash
pi -e /Users/joel/Code/joelhooks/pi-autoreason
```

## Commands

```bash
/autoreason <path-or-inline-task>
```

Examples:

```bash
/autoreason docs/plan.md --mode artifact
/autoreason extracted-paper.md --mode source --source autoreason.json
```

## Modes

- `artifact`: refine bounded text artifacts such as plans, PRDs, prompts, and specs.
- `source`: source-grounded reconstruction from provided source context. No new claims. Unsupported content becomes `needs_source`.

PDFs are not package scope. If a PDF was used during development, it was only to read the Autoreason paper.

## Runtime note

`/autoreason` does **not** run model calls inside the slash-command handler. It prepares an `autoreason_run` tool request in the editor. Submit that request when ready so the agent/tool lifecycle owns the long-running work instead of freezing the Pi TUI.

## Status

MVP scaffold. Core scoring, prompts, artifact persistence, command/tool entrypoints, and lifecycle machine are present. Full multi-pass model execution is implemented in the extension runner.
