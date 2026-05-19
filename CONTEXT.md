# pi-autoreason Context

## Purpose

`pi-autoreason` brings the Autoreason paper's refinement loop into Pi as an installable package.

It is not a generic "make this better" loop. It is a constrained tournament that keeps "do nothing" as a first-class option, records receipts, and stops when the incumbent survives repeated challenges.

## Glossary

### Autoreason loop
A refinement workflow where each pass compares three candidates: the unchanged incumbent `A`, an adversarial revision `B`, and a synthesis `AB`. Fresh judges rank the candidates blindly, Borda scores select the winner, and the winner becomes the next incumbent.

### Incumbent (`A`)
The current best artifact. It is always included unchanged in every judge panel so restraint is structurally possible.

### Adversarial revision (`B`)
A fresh-agent revision motivated by concrete problems found by a critic. It should not make unmotivated changes.

### Synthesis (`AB`)
A fresh-agent synthesis of `A` and `B` with randomized labels. It should integrate the strongest elements, not average them.

### Blind Borda panel
A set of fresh judges that rank randomized candidates. First place receives 3 points, second 2, third 1. Ties are resolved conservatively in favor of the incumbent.

### Convergence
The loop stops when the incumbent wins `k=2` consecutive passes, matching the paper's practical default.

### Source-grounded mode
A stricter profile for documents derived from PDFs/books/manuals/source material. It may reorganize, clarify, and repair extraction/layout issues, but must not add claims not supported by source context. Missing evidence becomes `needs_source`.

## Paper-derived operating constraints

- Use fresh, isolated roles for critic, author, synthesizer, and judges.
- Keep `A` unchanged as a first-class candidate.
- Prefer 3 judges in-loop; reserve 7 judges for final comparisons if needed.
- Use Borda count, not first-place majority vote.
- Use chain-of-thought/decomposed judge prompts by default because the paper found faster convergence.
- Treat scope constraints as mandatory for strong models and source-grounded work.
- Record every pass as artifacts: critique, B, AB, judge rankings, winner, and stop reason.
