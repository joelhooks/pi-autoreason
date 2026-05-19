import { complete, type UserMessage, type Model } from "@earendil-works/pi-ai";
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import path from "node:path";
import { createActor } from "xstate";
import { writeFile } from "node:fs/promises";
import { autoreasonMachine } from "./machine.js";
import { randomizeCandidates, parseRanking, scoreBorda, shuffle } from "./borda.js";
import { AUTHOR_B_SYSTEM, AUTHOR_SYSTEM, CRITIC_SYSTEM, JUDGE_SYSTEM, SYNTHESIZER_SYSTEM, authorBPrompt, criticPrompt, initialPrompt, judgePrompt, synthPrompt, winnerText } from "./prompts.js";
import { prepareOutputDir, readMaybeFile, writeFinal, writeInitial, writePass, writeRunManifest } from "./artifacts.js";
import type { AutoreasonMode, AutoreasonOptions, AutoreasonRunSummary, CandidateSet, JudgeRanking } from "./types.js";

export interface RunParams {
  input: string;
  mode?: AutoreasonMode;
  source?: string;
  maxPasses?: number;
  convergence?: number;
  judges?: number;
  outputBaseDir?: string;
}

export async function runAutoreason(params: RunParams, ctx: ExtensionContext, signal?: AbortSignal): Promise<AutoreasonRunSummary> {
  if (!ctx.model) throw new Error("No model selected");
  const auth = await ctx.modelRegistry.getApiKeyAndHeaders(ctx.model);
  if (!auth.ok || !auth.apiKey) throw new Error(auth.ok ? `No API key for ${ctx.model.provider}` : auth.error);

  const input = await readMaybeFile(params.input);
  const source = params.source ? await readMaybeFile(params.source) : undefined;
  const mode = params.mode ?? (source ? "source" : "artifact");
  const id = new Date().toISOString().replace(/[:.]/g, "-");
  const outputDir = await prepareOutputDir(params.outputBaseDir ?? path.join(process.cwd(), ".pi-runs", "autoreason"), id);

  const options: AutoreasonOptions = {
    mode,
    task: input.source ? `Improve/refine the artifact from ${input.source}.` : input.text,
    initial: input.source ? input.text : undefined,
    sourceContext: source?.text,
    maxPasses: params.maxPasses ?? 5,
    convergence: params.convergence ?? 2,
    judges: params.judges ?? 3,
    outputDir,
  };

  await writeRunManifest(outputDir, options);
  await writeFile(path.join(outputDir, "task.md"), options.task);
  if (options.sourceContext) await writeFile(path.join(outputDir, "source-context.md"), options.sourceContext);

  const actor = createActor(autoreasonMachine, { input: options });
  actor.start();
  actor.send({ type: "start" });

  let incumbent: string;
  if (options.initial) {
    incumbent = options.initial;
  } else {
    incumbent = await callModel(ctx.model, auth.apiKey, auth.headers, AUTHOR_SYSTEM, initialPrompt(options.task, mode, undefined, options.sourceContext), signal);
    actor.send({ type: "generated.initial", incumbent });
  }
  await writeInitial(outputDir, incumbent);

  let consecutiveAWins = 0;
  let stopReason: AutoreasonRunSummary["stopReason"] = "max_passes";
  let pass = 0;

  for (pass = 1; pass <= options.maxPasses; pass++) {
    if (signal?.aborted) {
      stopReason = "aborted";
      break;
    }

    const critique = await callModel(ctx.model, auth.apiKey, auth.headers, CRITIC_SYSTEM, criticPrompt(options.task, incumbent, mode, options.sourceContext), signal);
    const revision = await callModel(ctx.model, auth.apiKey, auth.headers, AUTHOR_B_SYSTEM, authorBPrompt(options.task, incumbent, critique, mode, options.sourceContext), signal);
    const [left, right] = shuffle([incumbent, revision]);
    const synthesis = await callModel(ctx.model, auth.apiKey, auth.headers, SYNTHESIZER_SYSTEM, synthPrompt(options.task, left, right, mode, options.sourceContext), signal);

    const candidates: CandidateSet = { A: incumbent, B: revision, AB: synthesis };
    const rankings: JudgeRanking[] = [];
    for (let judge = 1; judge <= options.judges; judge++) {
      const randomized = randomizeCandidates(candidates, ["X", "Y", "Z"]);
      const raw = await callModel(ctx.model, auth.apiKey, auth.headers, JUDGE_SYSTEM, judgePrompt(options.task, randomized.prompt, mode, options.sourceContext), signal);
      const ranking = parseRanking(raw, randomized.labels);
      rankings.push({
        judge,
        labels: randomized.labels,
        rankingLabels: [],
        ranking,
        raw,
        parseError: ranking.length === 3 ? undefined : "Could not parse full RANKING line",
      });
    }

    const borda = scoreBorda(rankings);
    consecutiveAWins = borda.winner === "A" ? consecutiveAWins + 1 : 0;
    const artifacts = {
      pass,
      incumbent,
      critique,
      revision,
      synthesis,
      borda,
      winnerText: winnerText(candidates, borda.winner),
      consecutiveAWins,
    };
    await writePass(outputDir, artifacts);
    actor.send({ type: "pass.completed", artifacts });
    incumbent = artifacts.winnerText;

    if (consecutiveAWins >= options.convergence) {
      stopReason = "converged";
      break;
    }
  }

  const summary: AutoreasonRunSummary = {
    id,
    mode,
    task: options.task,
    outputDir,
    passes: Math.min(pass, options.maxPasses),
    stopReason,
    finalPath: path.join(outputDir, "final.md"),
    consecutiveAWins,
  };
  await writeFinal(outputDir, incumbent, summary);
  actor.stop();
  return summary;
}

async function callModel(model: Model<any>, apiKey: string, headers: Record<string, string> | undefined, systemPrompt: string, text: string, signal?: AbortSignal): Promise<string> {
  const message: UserMessage = { role: "user", content: [{ type: "text", text }], timestamp: Date.now() };
  const response = await complete(model, { systemPrompt, messages: [message] }, { apiKey, headers, signal });
  if (response.stopReason === "aborted") throw new Error("Aborted");
  return response.content.filter((c): c is { type: "text"; text: string } => c.type === "text").map((c) => c.text).join("\n");
}
