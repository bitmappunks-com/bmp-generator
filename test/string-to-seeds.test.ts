import { describe, expect, it } from "vitest";
import { stringToSeeds } from "../src/string-to-seeds";

describe("stringToSeeds", () => {
  it("should generate correct number of seeds", () => {
    const seeds = stringToSeeds("test", 5);

    expect(seeds).toHaveLength(5);
  });

  it("should generate bigint seeds", () => {
    const seeds = stringToSeeds("test", 3);

    seeds.forEach((seed) => {
      expect(typeof seed).toBe("bigint");
    });
  });

  it("should generate deterministic seeds for same input", () => {
    const seeds1 = stringToSeeds("deterministic", 4);
    const seeds2 = stringToSeeds("deterministic", 4);

    expect(seeds1).toEqual(seeds2);
  });

  it("should generate different seeds for different inputs", () => {
    const seeds1 = stringToSeeds("input1", 3);
    const seeds2 = stringToSeeds("input2", 3);

    expect(seeds1).not.toEqual(seeds2);
  });

  it("should generate different seeds for each step", () => {
    const seeds = stringToSeeds("test", 5);

    const uniqueSeeds = new Set(seeds.map(String));
    expect(uniqueSeeds.size).toBe(5);
  });

  it("should handle empty string input", () => {
    const seeds = stringToSeeds("", 3);

    expect(seeds).toHaveLength(3);
    seeds.forEach((seed) => {
      expect(typeof seed).toBe("bigint");
    });
  });

  it("should handle unicode characters", () => {
    const seeds1 = stringToSeeds("你好", 3);
    const seeds2 = stringToSeeds("你好", 3);

    expect(seeds1).toEqual(seeds2);
    expect(seeds1).toHaveLength(3);
  });

  it("should generate positive bigint values", () => {
    const seeds = stringToSeeds("positive-test", 5);

    seeds.forEach((seed) => {
      expect(seed).toBeGreaterThan(0n);
    });
  });

  it("should handle zero seed count", () => {
    const seeds = stringToSeeds("test", 0);

    expect(seeds).toHaveLength(0);
  });

  it("should handle large seed count", () => {
    const seeds = stringToSeeds("large-count", 100);

    expect(seeds).toHaveLength(100);
    seeds.forEach((seed) => {
      expect(typeof seed).toBe("bigint");
    });
  });
});
