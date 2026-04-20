import { afterEach, describe, expect, it, vi } from "vitest";

describe("parseCliArgs", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads --seed and --out values", async () => {
    const { parseCliArgs } = await import("../src/cli");

    expect(parseCliArgs(["--seed", "user123", "--out", "avatar.svg"])).toEqual({
      seed: "user123",
      out: "avatar.svg",
    });
  });

  it("allows omitting --seed", async () => {
    const { parseCliArgs } = await import("../src/cli");

    expect(parseCliArgs(["--out", "avatar.svg"])).toEqual({
      out: "avatar.svg",
    });
  });

  it("throws when --out is missing", async () => {
    const { parseCliArgs } = await import("../src/cli");

    expect(() => parseCliArgs(["--seed", "user123"])).toThrow(
      "--out is required"
    );
  });
});

describe("runCli", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes decoded SVG output", async () => {
    const generateAvatarFor = vi.fn().mockResolvedValue({
      svgBase64: `data:image/svg+xml;base64,${Buffer.from("<svg/>").toString("base64")}`,
    });
    const writeFileSync = vi.fn();
    const { runCli } = await import("../src/cli");

    await runCli(["--seed", "user123", "--out", "avatar.svg"], {
      generateAvatarFor,
      writeFileSync,
    });

    expect(generateAvatarFor).toHaveBeenCalledWith("user123");
    expect(writeFileSync).toHaveBeenCalledWith("avatar.svg", "<svg/>", "utf8");
  });

  it("generates a seed when --seed is missing", async () => {
    const generateAvatarFor = vi.fn().mockResolvedValue({
      svgBase64: `data:image/svg+xml;base64,${Buffer.from("<svg/>").toString("base64")}`,
    });
    const writeFileSync = vi.fn();
    const createSeed = vi.fn().mockReturnValue("random-seed");
    const { runCli } = await import("../src/cli");

    await runCli(["--out", "avatar.svg"], {
      generateAvatarFor,
      writeFileSync,
      createSeed,
    });

    expect(createSeed).toHaveBeenCalledTimes(1);
    expect(generateAvatarFor).toHaveBeenCalledWith("random-seed");
    expect(writeFileSync).toHaveBeenCalledWith("avatar.svg", "<svg/>", "utf8");
  });
});
