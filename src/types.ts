export type AutoreasonMode = "artifact" | "source";

export interface AutoreasonOptions {
  mode: AutoreasonMode;
  task: string;
  initial?: string;
  sourceContext?: string;
  maxPasses: number;
  convergence: number;
  judges: number;
  outputDir: string;
}

export interface CandidateSet {
  A: string;
  B: string;
  AB: string;
}

export type CandidateKey = keyof CandidateSet;

export interface JudgeRanking {
  judge: number;
  labels: Record<string, CandidateKey>;
  rankingLabels: string[];
  ranking: CandidateKey[];
  raw: string;
  parseError?: string;
}

export interface BordaResult {
  scores: Record<CandidateKey, number>;
  winner: CandidateKey;
  validJudges: number;
  rankings: JudgeRanking[];
}

export interface PassArtifacts {
  pass: number;
  incumbent: string;
  critique: string;
  revision: string;
  synthesis: string;
  borda: BordaResult;
  winnerText: string;
  consecutiveAWins: number;
}

export interface AutoreasonRunSummary {
  id: string;
  mode: AutoreasonMode;
  task: string;
  outputDir: string;
  passes: number;
  stopReason: "converged" | "max_passes" | "aborted" | "failed";
  finalPath: string;
  consecutiveAWins: number;
}
