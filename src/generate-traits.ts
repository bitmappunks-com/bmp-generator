import { TinyColor } from "./tiny-color";

const EMPTY_TRAIT_ID = 0;

export type TJSONTraitData = {
  id: number;
  layerPixels: {
    zIndex: number;
    pixels: number[][];
    activeRegion: {
      xTL: number;
      yTL: number;
      xBR: number;
      yBR: number;
    };
  }[];
  palette: `rgb${string}`[];
};

interface ActiveRegion {
  xTL: number;
  yTL: number;
  xBR: number;
  yBR: number;
}

interface LayerMeta extends ActiveRegion {
  zIndex: number;
}

interface LayerMetaWithPixelsColor extends LayerMeta {
  pixels: TinyColor[][];
}

interface TraitRelations {
  poolsWhitelist?: { [poolName: string]: boolean };
  poolsBlacklist?: { [poolName: string]: boolean };
  traitsWhitelist?: { [traitId: number]: boolean };
  traitsBlacklist?: { [traitId: number]: boolean };
}

export type TraitData = {
  id: number;
  weight: number;
  layers: LayerMetaWithPixelsColor[];
} & TraitRelations;

interface OptionPool {
  name: string;
  poolsWhitelist: Record<string, boolean>;
  poolsBlacklist: Record<string, boolean>;
  traitsWhitelist: Record<string, boolean>;
  traitsBlacklist: Record<string, boolean>;
  traitsId: number[];
  traitsWeights: number[];
}

interface GenerateStep {
  name: string;
  optionPools: OptionPool[];
}

export type JSONConfigData = {
  steps: GenerateStep[];
  traits: {
    id: number;
    weight: number;
    poolsWhitelist?: Record<string, boolean>;
    poolsBlacklist?: Record<string, boolean>;
    traitsWhitelist?: Record<string, boolean>;
    traitsBlacklist?: Record<string, boolean>;
  }[];
};

type LogicTrait = {
  id: number;
  weight: number;
  poolsWhitelist?: Record<string, boolean>;
  poolsBlacklist?: Record<string, boolean>;
  traitsWhitelist?: Record<number, boolean>;
  traitsBlacklist?: Record<number, boolean>;
};

const MAX_TRAIT_ID = Number.MAX_SAFE_INTEGER;
const INNER_POOL_NAME = `DO_NOT_TOUCH`;

interface CandidateTrait {
  traitId: number;
  poolName: string;
  weight?: number;
}

function isMatchingConstraint(
  trait: LogicTrait,
  existingTraits: number[],
  existingPools: string[]
): boolean {
  return (
    isLimited(
      trait?.poolsBlacklist || {},
      Object.keys(trait?.poolsBlacklist || {}).length,
      trait?.poolsWhitelist || {},
      Object.keys(trait?.poolsWhitelist || {}).length,
      existingPools,
      INNER_POOL_NAME
    ) ||
    isLimited(
      trait?.traitsBlacklist || {},
      Object.keys(trait?.traitsBlacklist || {}).length,
      trait?.traitsWhitelist || {},
      Object.keys(trait?.traitsWhitelist || {}).length,
      existingTraits,
      MAX_TRAIT_ID
    )
  );
}

function filterTraits(
  step: GenerateStep,
  traits: Map<number, LogicTrait>,
  selectedTraits: number[],
  selectedPools: string[]
): { candidateTraits: CandidateTrait[]; totalWeight: number } {
  const candidateTraits: CandidateTrait[] = [];
  let totalWeight = 0;

  for (const pool of step.optionPools) {
    if (
      isLimited(
        pool.poolsBlacklist,
        Object.keys(pool.poolsBlacklist).length,
        pool.poolsWhitelist,
        Object.keys(pool.poolsWhitelist).length,
        selectedPools,
        INNER_POOL_NAME
      ) ||
      isLimited(
        pool.traitsBlacklist,
        Object.keys(pool.traitsBlacklist).length,
        pool.traitsWhitelist,
        Object.keys(pool.traitsWhitelist).length,
        selectedTraits,
        MAX_TRAIT_ID
      )
    ) {
      continue;
    }

    let traitIdx = -1;
    for (const traitId of pool.traitsId) {
      traitIdx += 1;

      const trait = traits.get(traitId);
      const isBlocked =
        trait && isMatchingConstraint(trait, selectedTraits, selectedPools);

      if (isBlocked) {
        continue;
      }

      let weight = pool.traitsWeights[traitIdx];
      if (!weight) weight = trait?.weight ?? 0;

      totalWeight += weight;

      candidateTraits.push({
        traitId,
        poolName: pool.name,
        weight,
      });
    }
  }

  return { candidateTraits, totalWeight };
}

function isLimited(
  blockList: Record<string | number, boolean>,
  blockCount: number,
  allowList: Record<string | number, boolean>,
  allowCount: number,
  values: (string | number)[],
  skipValue: string | number
): boolean {
  return (
    (allowCount > 0 && !listContains(allowList, values, skipValue)) ||
    (blockCount > 0 && listContains(blockList, values, skipValue))
  );
}

function listContains(
  list: Record<string | number, boolean>,
  values: (string | number)[],
  skipValue: string | number
): boolean {
  for (const value of values) {
    if (value === skipValue) continue;
    if (list[value]) return true;
  }
  return false;
}

export function getRandomTraits(
  steps: GenerateStep[],
  allTraitsMapById: Map<number, TraitData>,
  seeds: bigint[]
): { traitId: number; poolName: string }[] {
  if (steps.length !== seeds.length) {
    throw new Error("Steps and seeds length must match");
  }

  const selectedTraits: number[] = [];
  const selectedPools: string[] = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const seed = seeds[i];

    const { candidateTraits, totalWeight } = filterTraits(
      step,
      allTraitsMapById,
      selectedTraits,
      selectedPools
    );

    const { traitId, poolName } = getRandomTrait(
      candidateTraits,
      totalWeight,
      seed
    );

    selectedTraits.push(traitId);
    selectedPools.push(poolName);
  }

  return selectedTraits.map((traitId, index) => ({
    traitId,
    poolName: selectedPools[index],
  }));
}

function getRandomTrait(
  candidateTraits: CandidateTrait[],
  totalWeight: number,
  seed: bigint
): { traitId: number; poolName: string } {
  if (candidateTraits.length === 0 || totalWeight === 0) {
    return {
      traitId: EMPTY_TRAIT_ID,
      poolName: INNER_POOL_NAME,
    };
  }

  const randomValue = seed % BigInt(totalWeight);
  let accumulatedWeight = BigInt(0);

  for (const candidate of candidateTraits) {
    accumulatedWeight += BigInt(candidate.weight ?? 0);
    if (randomValue < accumulatedWeight) {
      return {
        traitId: candidate.traitId,
        poolName: candidate.poolName,
      };
    }
  }

  return {
    traitId: EMPTY_TRAIT_ID,
    poolName: INNER_POOL_NAME,
  };
}
