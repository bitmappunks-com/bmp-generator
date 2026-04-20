import { describe, expect, it, vi } from "vitest";
import type { JSONConfigData, TJSONTraitData } from "../src/generate-traits";

function createTrait(
  id: number,
  color: `rgb${string}`,
  x: number,
  y: number
): TJSONTraitData {
  return {
    id,
    palette: [color],
    layerPixels: [
      {
        zIndex: id,
        pixels: [[0]],
        activeRegion: {
          xTL: x,
          yTL: y,
          xBR: x + 1,
          yBR: y + 1,
        },
      },
    ],
  };
}

const MOCK_CONFIG: JSONConfigData = {
  steps: [
    {
      name: "background",
      optionPools: [
        {
          name: "background",
          poolsWhitelist: {},
          poolsBlacklist: {},
          traitsWhitelist: {},
          traitsBlacklist: {},
          traitsId: [1, 2],
          traitsWeights: [1, 1],
        },
      ],
    },
    {
      name: "eyes",
      optionPools: [
        {
          name: "eyes",
          poolsWhitelist: {},
          poolsBlacklist: {},
          traitsWhitelist: {},
          traitsBlacklist: {},
          traitsId: [3, 4],
          traitsWeights: [1, 1],
        },
      ],
    },
    {
      name: "mouth",
      optionPools: [
        {
          name: "mouth",
          poolsWhitelist: {},
          poolsBlacklist: {},
          traitsWhitelist: {},
          traitsBlacklist: {},
          traitsId: [5, 6],
          traitsWeights: [1, 1],
        },
      ],
    },
  ],
  traits: Array.from({ length: 6 }, (_, index) => ({
    id: index + 1,
    weight: 1,
  })),
};

const MOCK_TRAITS: TJSONTraitData[] = [
  createTrait(1, "rgb(255, 0, 0)", 0, 0),
  createTrait(2, "rgb(0, 0, 255)", 0, 0),
  createTrait(3, "rgb(0, 255, 0)", 10, 10),
  createTrait(4, "rgb(255, 255, 0)", 10, 10),
  createTrait(5, "rgb(255, 0, 255)", 20, 20),
  createTrait(6, "rgb(0, 255, 255)", 20, 20),
];

vi.mock("../src/load-remote-assets", () => ({
  fetchRemoteConfig: vi.fn(async () => MOCK_CONFIG),
  fetchRemoteTraits: vi.fn(async () => MOCK_TRAITS),
}));

import { generateAvatarFor } from "../src/index";

describe("generateAvatarFor", () => {
  it("should generate SVG output with base64 encoding", async () => {
    const result = await generateAvatarFor("test-key");

    expect(result).toHaveProperty("svgBase64");
    expect(typeof result.svgBase64).toBe("string");
    expect(result.svgBase64.length).toBeGreaterThan(0);
  });

  it("should generate deterministic output for same input", async () => {
    const key = "deterministic-test";
    const result1 = await generateAvatarFor(key);
    const result2 = await generateAvatarFor(key);
    expect(result1.svgBase64).toBe(result2.svgBase64);
  });

  it("should generate different output for different inputs", async () => {
    const result1 = await generateAvatarFor("key-1");
    const result2 = await generateAvatarFor("key-2");

    expect(result1.svgBase64).not.toBe(result2.svgBase64);
  });

  it("should generate valid base64-encoded SVG", async () => {
    const result = await generateAvatarFor("svg-test");
    const svgBase64 = result.svgBase64;

    expect(svgBase64).toMatch(/^data:image\/svg\+xml;base64,/);

    const base64Data = svgBase64.replace(/^data:image\/svg\+xml;base64,/, "");
    const svgData = Buffer.from(base64Data, "base64").toString("utf-8");

    expect(svgData).toContain("<svg");
    expect(svgData).toContain('width="24"');
    expect(svgData).toContain('height="24"');
    expect(svgData).toContain('shape-rendering="crispEdges"');
    expect(svgData).toContain("</svg>");
  });

  it("should handle empty string input", async () => {
    const result = await generateAvatarFor("");

    expect(result).toHaveProperty("svgBase64");
    expect(typeof result.svgBase64).toBe("string");
  });

  it("should handle unicode characters in input", async () => {
    const result = await generateAvatarFor("你好世界🌍");

    expect(result).toHaveProperty("svgBase64");
    expect(typeof result.svgBase64).toBe("string");
    expect(result.svgBase64.length).toBeGreaterThan(0);
  });

  it("should generate consistent output for repeated calls", async () => {
    const key = "repeat-test";
    const results = await Promise.all(
      Array.from({ length: 5 }, () => generateAvatarFor(key))
    );

    const firstResult = results[0].svgBase64;
    results.forEach((result) => {
      expect(result.svgBase64).toBe(firstResult);
    });
  });
});
