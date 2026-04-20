import { getRandomTraits } from "./generate-traits";
import { loadConfigAndTraits } from "./load-assets";
import { CANVAS_SIZE, mergeAllLayers } from "./merge-layers";
import { SVGImage } from "./svg";
import { stringToSeeds } from "./string-to-seeds";

let cachedConfigAndTraitsPromise: Promise<any> | null = null;

async function getCachedConfigAndTraits() {
  if (cachedConfigAndTraitsPromise === null) {
    cachedConfigAndTraitsPromise = loadConfigAndTraits();
  }
  return cachedConfigAndTraitsPromise;
}

export async function generateAvatarFor(key: string) {
  const { config, traits } = await getCachedConfigAndTraits();

  const randomSeeds = stringToSeeds(key, config.steps.length);

  const punk = getRandomTraits(config.steps, traits, randomSeeds);

  const layers: any[] = [];
  for (const trait of punk) {
    const traitData = traits.get(trait.traitId);
    if (traitData) {
      layers.push(...traitData.layers);
    }
  }

  layers.sort((a, b) => a.zIndex - b.zIndex);

  const pixels = mergeAllLayers(layers);

  const svg = SVGImage.generateSVG(CANVAS_SIZE, CANVAS_SIZE, pixels);
  const svgBase64 = SVGImage.toBase64(svg);

  return { svgBase64 };
}
