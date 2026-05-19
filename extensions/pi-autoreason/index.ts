import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import path from "node:path";
import { runAutoreason } from "../../src/runner.js";
import type { AutoreasonMode } from "../../src/types.js";

function parseCommandArgs(args: string): { input: string; mode?: AutoreasonMode; source?: string; maxPasses?: number; judges?: number } {
  const parts = args.match(/(?:[^\s"]+|"[^"]*")+/g)?.map((p) => p.replace(/^"|"$/g, "")) ?? [];
  const out: { input: string; mode?: AutoreasonMode; source?: string; maxPasses?: number; judges?: number } = { input: "" };
  const positional: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === "--mode") out.mode = parts[++i] as AutoreasonMode;
    else if (part === "--source") out.source = parts[++i];
    else if (part === "--max-passes") out.maxPasses = Number(parts[++i]);
    else if (part === "--judges") out.judges = Number(parts[++i]);
    else positional.push(part);
  }
  out.input = positional.join(" ").trim();
  return out;
}

export default function (pi: ExtensionAPI) {
  pi.registerCommand("autoreason", {
    description: "Prepare an Autoreason tool request without blocking the Pi TUI",
    handler: async (args, ctx) => {
      const parsed = parseCommandArgs(args ?? "");
      if (!parsed.input) {
        ctx.ui.notify("Usage: /autoreason <path-or-task> [--mode artifact|source] [--source path] [--max-passes 5] [--judges 3]", "error");
        return;
      }

      const request = [
        "Run pi-autoreason with the `autoreason_run` tool.",
        "",
        "Parameters:",
        `- input: ${JSON.stringify(parsed.input)}`,
        parsed.mode ? `- mode: ${parsed.mode}` : "- mode: artifact",
        parsed.source ? `- source: ${JSON.stringify(parsed.source)}` : undefined,
        `- maxPasses: ${parsed.maxPasses ?? 3}`,
        `- judges: ${parsed.judges ?? 3}`,
        "",
        "Important: this is intentionally run as a normal agent tool call, not inside the slash-command handler, so the TUI does not lock up.",
      ].filter(Boolean).join("\n");

      if (ctx.hasUI) {
        ctx.ui.setEditorText(request);
        ctx.ui.notify("Autoreason request loaded into the editor. Submit it when ready.", "info");
      } else {
        ctx.ui.notify(request, "info");
      }
    },
  });

  pi.registerTool({
    name: "autoreason_run",
    label: "Autoreason Run",
    description: "Run an Autoreason A/B/AB blind Borda refinement loop on an inline task or file path.",
    parameters: Type.Object({
      input: Type.String({ description: "Inline task text or path to a UTF-8 text/Markdown file" }),
      mode: Type.Optional(Type.Union([Type.Literal("artifact"), Type.Literal("source")], { description: "artifact for normal docs; source for source-grounded reconstruction" })),
      source: Type.Optional(Type.String({ description: "Optional source context path/text for source-grounded mode" })),
      maxPasses: Type.Optional(Type.Number({ description: "Maximum passes. Default 5." })),
      judges: Type.Optional(Type.Number({ description: "In-loop judge count. Default 3." })),
    }),
    async execute(_toolCallId, params, signal, _onUpdate, ctx) {
      const summary = await runAutoreason({
        input: params.input,
        mode: params.mode as AutoreasonMode | undefined,
        source: params.source,
        maxPasses: params.maxPasses,
        judges: params.judges,
        outputBaseDir: path.join(process.cwd(), ".pi-runs", "autoreason"),
      }, ctx, signal);
      return {
        content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
        details: summary,
      };
    },
  });
}
