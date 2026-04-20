import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";

import { generateAvatarFor } from "./index";

export interface CliArgs {
  seed?: string;
  out: string;
}

export interface CliDeps {
  generateAvatarFor: typeof generateAvatarFor;
  writeFileSync: typeof writeFileSync;
  createSeed: () => string;
}

const defaultDeps: CliDeps = {
  generateAvatarFor,
  writeFileSync,
  createSeed: randomUUID,
};

export function parseCliArgs(argv: string[]): CliArgs {
  let seed: string | undefined;
  let out = "";

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--seed") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--seed requires a value");
      }
      seed = value;
      index += 1;
      continue;
    }

    if (arg === "--out") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--out requires a value");
      }
      out = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!out) {
    throw new Error("--out is required");
  }

  return { seed, out };
}

function decodeSvg(svgBase64: string): string {
  const prefix = "data:image/svg+xml;base64,";

  if (!svgBase64.startsWith(prefix)) {
    throw new Error("Generator returned invalid SVG data");
  }

  return Buffer.from(svgBase64.slice(prefix.length), "base64").toString("utf8");
}

export async function runCli(
  argv: string[],
  deps: CliDeps = defaultDeps
): Promise<void> {
  const { seed, out } = parseCliArgs(argv);
  const activeSeed = seed ?? deps.createSeed();
  const { svgBase64 } = await deps.generateAvatarFor(activeSeed);
  const svg = decodeSvg(svgBase64);

  deps.writeFileSync(out, svg, "utf8");
}
