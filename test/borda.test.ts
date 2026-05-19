import { describe, expect, it } from "vitest";
import { parseRanking, scoreBorda } from "../src/borda.js";
import type { JudgeRanking } from "../src/types.js";

describe("borda", () => {
  it("parses randomized labels from a RANKING line", () => {
    const ranking = parseRanking("Reasoning...\nRANKING: Z, X, Y", { X: "A", Y: "B", Z: "AB" });
    expect(ranking).toEqual(["AB", "A", "B"]);
  });

  it("scores Borda and breaks ties in favor of incumbent A", () => {
    const rankings: JudgeRanking[] = [
      { judge: 1, labels: {}, rankingLabels: [], ranking: ["B", "A", "AB"], raw: "" },
      { judge: 2, labels: {}, rankingLabels: [], ranking: ["A", "B", "AB"], raw: "" },
    ];
    const result = scoreBorda(rankings);
    expect(result.scores).toEqual({ A: 5, B: 5, AB: 2 });
    expect(result.winner).toBe("A");
  });
});
