import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AutoreasonOptions, AutoreasonRunSummary, PassArtifacts } from "./types.js";

export async function readMaybeFile(value: string): Promise<{ text: string; source?: string }> {
  try {
    const statPath = path.resolve(value);
    const text = await readFile(statPath, "utf8");
    return { text, source: statPath };
  } catch {
    return { text: value };
  }
}

export function createRunId(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export async function prepareOutputDir(baseDir: string, id = createRunId()): Promise<string> {
  const outputDir = path.resolve(baseDir, id);
  await mkdir(outputDir, { recursive: true });
  return outputDir;
}

export async function writeRunManifest(outputDir: string, options: AutoreasonOptions): Promise<void> {
  await writeJson(path.join(outputDir, "manifest.json"), {
    createdAt: new Date().toISOString(),
    mode: options.mode,
    task: options.task,
    maxPasses: options.maxPasses,
    convergence: options.convergence,
    judges: options.judges,
  });
}

export async function writeInitial(outputDir: string, incumbent: string): Promise<void> {
  await writeFile(path.join(outputDir, "initial.md"), incumbent);
}

export async function writePass(outputDir: string, pass: PassArtifacts): Promise<void> {
  const passDir = path.join(outputDir, `pass-${String(pass.pass).padStart(2, "0")}`);
  await mkdir(passDir, { recursive: true });
  await Promise.all([
    writeFile(path.join(passDir, "A.md"), pass.incumbent),
    writeFile(path.join(passDir, "critique.md"), pass.critique),
    writeFile(path.join(passDir, "B.md"), pass.revision),
    writeFile(path.join(passDir, "AB.md"), pass.synthesis),
    writeFile(path.join(passDir, "winner.md"), pass.winnerText),
    writeJson(path.join(passDir, "judges.json"), pass.borda),
  ]);
}

export async function writeFinal(outputDir: string, final: string, summary: AutoreasonRunSummary): Promise<void> {
  await writeFile(path.join(outputDir, "final.md"), final);
  await writeJson(path.join(outputDir, "summary.json"), summary);
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
}
