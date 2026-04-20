import { TinyColor } from "./tiny-color";

import { TraitData, JSONConfigData, TJSONTraitData } from "./generate-traits";
import { TRANSPARENT_COLOR } from "./merge-layers";
import { fetchRemoteConfig, fetchRemoteTraits } from "./load-remote-assets";

export async function loadConfigAndTraits() {
  const [CONFIG, TRAITS] = await Promise.all([
    fetchRemoteConfig<JSONConfigData>(),
    fetchRemoteTraits<TJSONTraitData[]>(),
  ]);

  const allTraits: TraitData[] = TRAITS.map((trait) => {
    const palette = trait.palette.map((_color) => new TinyColor(_color));

    return {
      id: trait.id,
      weight: 1,
      layers: trait.layerPixels.map((layer, idx) => {
        return {
          id: idx + 1,
          pixels: layer.pixels.map((row) =>
            row.map((paletteIndex) => {
              if (paletteIndex === -1) {
                return TRANSPARENT_COLOR;
              }

              const color = palette[paletteIndex];

              return color || TRANSPARENT_COLOR;
            })
          ),
          zIndex: layer.zIndex,
          xTL: layer.activeRegion.xTL,
          yTL: layer.activeRegion.yTL,
          xBR: layer.activeRegion.xBR,
          yBR: layer.activeRegion.yBR,
        };
      }),
    };
  });

  const allTraitsMapById = new Map<number, TraitData>(
    allTraits.map((trait) => [trait.id, trait])
  );
  CONFIG.traits.forEach((t) => {
    const trait = allTraitsMapById.get(t.id);
    if (!trait) {
      return;
    }
    trait.weight = t.weight;

    if (t.poolsWhitelist && Object.entries(t.poolsWhitelist).length > 0) {
      trait.poolsWhitelist = Object.fromEntries(
        Object.entries(t.poolsWhitelist)
          .map<[string, boolean]>(([key, value]) => [key, value])
          .filter(([key]) => {
            const pool = CONFIG.steps.find((step) =>
              step.optionPools.find((p) => p.name === key)
            );
            return !!pool;
          })
      );
    }
    if (t.poolsBlacklist && Object.entries(t.poolsBlacklist).length > 0) {
      trait.poolsBlacklist = Object.fromEntries(
        Object.entries(t.poolsBlacklist)
          .map<[string, boolean]>(([key, value]) => [key, value])
          .filter(([key]) => {
            const pool = CONFIG.steps.find((step) =>
              step.optionPools.find((p) => p.name === key)
            );
            return !!pool;
          })
      );
    }

    if (t.traitsWhitelist && Object.entries(t.traitsWhitelist).length > 0) {
      trait.traitsWhitelist = Object.fromEntries(
        Object.entries(t.traitsWhitelist)
          .map<[number, boolean]>(([key, value]) => [Number(key), value])
          .filter(([key]) => !!allTraitsMapById.has(key))
      );
    }
    if (t.traitsBlacklist && Object.entries(t.traitsBlacklist).length > 0) {
      trait.traitsBlacklist = Object.fromEntries(
        Object.entries(t.traitsBlacklist)
          .map<[number, boolean]>(([key, value]) => [Number(key), value])
          .filter(([key]) => !!allTraitsMapById.has(key))
      );
    }

    allTraitsMapById.set(trait.id, trait);
  });

  return {
    config: CONFIG as unknown as JSONConfigData,
    traits: allTraitsMapById,
  };
}
