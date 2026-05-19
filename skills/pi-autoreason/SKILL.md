---
name: pi-autoreason
description: Run or design Autoreason-style refinement in Pi. Use when refining bounded artifacts, source-grounded PDF/book/manual extractions, PRDs, plans, prompts, or other documents where "do nothing" must remain a first-class option. Avoid for unbounded brainstorming or direct code edits unless a human explicitly accepts the cost and risk.
---

# pi-autoreason

Use `pi-autoreason` for structured self-refinement based on the Autoreason paper.

## Core loop

Each pass compares:

- `A`: unchanged incumbent
- `B`: adversarial revision from a critic's concrete problems
- `AB`: synthesis of `A` and `B`

Fresh judges rank randomized versions. Borda count chooses the winner. Ties go to `A`. Stop when `A` wins `k=2` consecutive passes.

## When to use

Good fits:

- bounded plans, PRDs, specs, implementation prompts
- extracted PDFs/books/manuals where source faithfulness matters
- docs with real tradeoffs and enough constraints
- mid-tier model workflows where generation is decent but selection is weak

Bad fits:

- vague “make it better” requests with no constraints
- template-filling where conservative editing is enough
- direct code edits without tests or explicit acceptance
- source-derived educational content unless source-grounded mode is used

## Source-grounded law

For PDFs/books/manuals/source-derived content:

- Do not invent claims.
- Preserve, reorganize, format, lightly clarify, and repair extraction/layout issues only.
- Mark missing/unsupported content as `needs_source`.
- Rank source faithfulness above polish.

## Commands

```bash
/autoreason path/to/artifact.md --mode artifact --max-passes 5 --judges 3
/autoreason extracted-paper.md --mode source --source extracted.json --max-passes 3
```

## Defaults from the paper

- 3 judges in-loop
- 7 judges for final comparisons when needed
- Borda scoring: 3/2/1
- conservative tie break: incumbent wins
- convergence: `k=2` consecutive `A` wins
- CoT/decomposed judge prompt by default
- record all pass artifacts

## Operator guidance

Before running, constrain the task. If the user has not supplied constraints, ask for:

1. target artifact type
2. hard source/context boundaries
3. max length or section shape
4. acceptance criteria for judges
5. whether cost is acceptable

For source mode, pass source context when available.
