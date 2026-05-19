import type { AutoreasonMode, CandidateSet } from "./types.js";

export const AUTHOR_SYSTEM = "You are a senior consultant producing professional deliverables. Be specific, concrete, and practical. Tailor everything to the task constraints.";

export const CRITIC_SYSTEM = "You are a critical reviewer. Your only job is to find real problems. Be specific and concrete. Do not suggest fixes.";

export const AUTHOR_B_SYSTEM = "You are a senior consultant revising an artifact based on specific criticisms. Address each valid criticism directly. Do not make changes that are not motivated by an identified problem.";

export const SYNTHESIZER_SYSTEM = "You are a senior consultant. You are given two versions as equal inputs. Take the strongest elements from each and produce a coherent synthesis. This is not a compromise: pick the best answer per dimension.";

export const JUDGE_SYSTEM = "You are an independent evaluator. You have no authorship stake in any version. Think carefully before deciding.";

export function modeRules(mode: AutoreasonMode, sourceContext?: string): string {
  if (mode === "source") {
    return `SOURCE-GROUNDED MODE RULES:\n- Do not add claims, facts, recommendations, causal explanations, examples, or safety guidance that are not supported by the source.\n- You may preserve, reorganize, format, lightly clarify, and repair extraction/layout issues.\n- If content seems missing or unsupported, mark it as needs_source instead of filling the gap.\n- Prefer source-faithfulness over style.\n${sourceContext ? `\nSOURCE CONTEXT:\n---\n${sourceContext}\n---\n` : ""}`;
  }
  return "ARTIFACT MODE RULES:\n- Improve only within the task scope.\n- Prefer useful specificity over bloat.\n- Preserve good existing structure unless a concrete problem justifies changing it.";
}

export function initialPrompt(task: string, mode: AutoreasonMode, initial?: string, sourceContext?: string): string {
  return `${modeRules(mode, sourceContext)}\n\nTASK:\n---\n${task}\n---\n\n${initial ? `CURRENT ARTIFACT:\n---\n${initial}\n---\n\nProduce the best version of this artifact under the task constraints.` : "Produce the initial artifact under the task constraints."}`;
}

export function criticPrompt(task: string, incumbent: string, mode: AutoreasonMode, sourceContext?: string): string {
  return `${modeRules(mode, sourceContext)}\n\nORIGINAL TASK:\n---\n${task}\n---\n\nCURRENT INCUMBENT A:\n---\n${incumbent}\n---\n\nFind real problems with the incumbent. Focus on:\n- things that will not work as described\n- complexity that does not pay for itself\n- assumptions that are wrong\n- missing pieces that block the design\n- ${mode === "source" ? "claims or wording not supported by the source" : "scope creep or vague claims"}\n\nDo NOT propose fixes. Just the problems.`;
}

export function authorBPrompt(task: string, incumbent: string, critique: string, mode: AutoreasonMode, sourceContext?: string): string {
  return `${modeRules(mode, sourceContext)}\n\nORIGINAL TASK:\n---\n${task}\n---\n\nCURRENT INCUMBENT A:\n---\n${incumbent}\n---\n\nPROBLEMS FOUND:\n---\n${critique}\n---\n\nRevise the incumbent to address these problems. For each meaningful change, state which problem it fixes. Do not make changes that are not motivated by an identified problem.`;
}

export function synthPrompt(task: string, versionX: string, versionY: string, mode: AutoreasonMode, sourceContext?: string): string {
  return `${modeRules(mode, sourceContext)}\n\nORIGINAL TASK:\n---\n${task}\n---\n\nHere are two versions. Treat them as equal inputs.\n\nVERSION X:\n---\n${versionX}\n---\n\nVERSION Y:\n---\n${versionY}\n---\n\nProduce a synthesis that keeps the strongest elements from both. Pick the best version of each section and make them cohere.`;
}

export function judgePrompt(task: string, candidatesPrompt: string, mode: AutoreasonMode, sourceContext?: string): string {
  return `${modeRules(mode, sourceContext)}\n\nORIGINAL TASK:\n---\n${task}\n---\n\nThree versions have been produced. Evaluate how well each accomplishes the stated task.\n\n${candidatesPrompt}\n\nFor each version, think step by step:\n1. What does it get right?\n2. What does it get wrong or miss?\n3. ${mode === "source" ? "Are all visible claims supported by the source?" : "Are claims and numbers defensible?"}\n4. Is detail appropriate or bloated?\n\nThen rank all three from best to worst.\n\nRANKING: [best], [second], [worst]\n\nWhere each slot is one of the version labels exactly.`;
}

export function winnerText(candidates: CandidateSet, winner: keyof CandidateSet): string {
  return candidates[winner];
}
