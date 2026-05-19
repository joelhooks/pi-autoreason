import { setup, assign } from "xstate";
import type { AutoreasonOptions, PassArtifacts } from "./types.js";

export interface AutoreasonContext {
  options: AutoreasonOptions;
  incumbent: string;
  pass: number;
  consecutiveAWins: number;
  artifacts: PassArtifacts[];
  error?: string;
}

export type AutoreasonEvent =
  | { type: "start" }
  | { type: "generated.initial"; incumbent: string }
  | { type: "pass.completed"; artifacts: PassArtifacts }
  | { type: "abort" }
  | { type: "error"; error: string };

export const autoreasonMachine = setup({
  types: {
    context: {} as AutoreasonContext,
    events: {} as AutoreasonEvent,
    input: {} as AutoreasonOptions,
  },
  guards: {
    hasConverged: ({ context }) => context.consecutiveAWins >= context.options.convergence,
    hitMaxPasses: ({ context }) => context.pass >= context.options.maxPasses,
  },
  actions: {
    setInitial: assign({
      incumbent: ({ event }) => event.type === "generated.initial" ? event.incumbent : "",
    }),
    recordPass: assign(({ context, event }) => {
      if (event.type !== "pass.completed") return {};
      return {
        incumbent: event.artifacts.winnerText,
        pass: event.artifacts.pass,
        consecutiveAWins: event.artifacts.consecutiveAWins,
        artifacts: [...context.artifacts, event.artifacts],
      };
    }),
    setError: assign({
      error: ({ event }) => event.type === "error" ? event.error : "Unknown error",
    }),
  },
}).createMachine({
  id: "autoreason",
  initial: "idle",
  context: ({ input }) => ({
    options: input,
    incumbent: input.initial ?? "",
    pass: 0,
    consecutiveAWins: 0,
    artifacts: [],
  }),
  states: {
    idle: {
      on: {
        start: [
          { target: "critic", guard: ({ context }) => context.incumbent.length > 0 },
          { target: "generatingInitial" },
        ],
      },
    },
    generatingInitial: {
      on: {
        "generated.initial": { target: "critic", actions: ["setInitial"] },
        error: { target: "failed", actions: ["setError"] },
        abort: { target: "aborted" },
      },
    },
    critic: { on: { "pass.completed": { target: "selecting", actions: ["recordPass"] }, error: { target: "failed", actions: ["setError"] }, abort: { target: "aborted" } } },
    selecting: {
      always: [
        { target: "converged", guard: "hasConverged" },
        { target: "maxPasses", guard: "hitMaxPasses" },
        { target: "critic" },
      ],
    },
    converged: { type: "final" },
    maxPasses: { type: "final" },
    aborted: { type: "final" },
    failed: { type: "final" },
  },
});
