import sha from "sha.js";

export function stringToSeeds(key: string, numSeeds: number): bigint[] {
  const seeds: bigint[] = [];

  for (let i = 0; i < numSeeds; i++) {
    const hash = sha("sha256").update(`${key}-${i}`).digest("hex");
    seeds.push(BigInt("0x" + hash));
  }

  return seeds;
}
