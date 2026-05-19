import type { BordaResult, CandidateKey, JudgeRanking } from "./types.js";

const CANDIDATES: CandidateKey[] = ["A", "B", "AB"];

export function parseRanking(raw: string, labels: Record<string, CandidateKey>): CandidateKey[] {
  const labelKeys = Object.keys(labels).map(escapeRegExp).join("|");
  const rankingLine = raw.match(new RegExp(`RANKING\\s*:\\s*([^\\n]+)`, "i"));
  if (!rankingLine) return [];

  const found = [...rankingLine[1].matchAll(new RegExp(`\\b(${labelKeys})\\b`, "gi"))]
    .map((m) => m[1].toUpperCase())
    .filter((label, index, arr) => arr.indexOf(label) === index);

  return found.map((label) => labels[label]).filter(Boolean);
}

export function scoreBorda(rankings: JudgeRanking[]): BordaResult {
  const scores: Record<CandidateKey, number> = { A: 0, B: 0, AB: 0 };
  let validJudges = 0;

  for (const judge of rankings) {
    if (judge.ranking.length !== 3) continue;
    validJudges++;
    judge.ranking.forEach((candidate, index) => {
      scores[candidate] += 3 - index;
    });
  }

  let winner: CandidateKey = "A";
  for (const candidate of CANDIDATES) {
    if (candidate === "A") continue;
    if (scores[candidate] > scores[winner]) {
      winner = candidate;
    }
  }

  return { scores, winner, validJudges, rankings };
}

export function randomizeCandidates<T extends Record<CandidateKey, string>>(
  candidates: T,
  labels = ["X", "Y", "Z"],
): { prompt: string; labels: Record<string, CandidateKey> } {
  const shuffled = shuffle<CandidateKey>(["A", "B", "AB"]);
  const labelMap: Record<string, CandidateKey> = {};
  const parts = shuffled.map((candidate, index) => {
    const label = labels[index].toUpperCase();
    labelMap[label] = candidate;
    return `VERSION ${label}:\n---\n${candidates[candidate]}\n---`;
  });
  return { prompt: parts.join("\n\n"), labels: labelMap };
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
