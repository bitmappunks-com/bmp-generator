import { TinyColor } from "./tiny-color";

interface ActiveRegion {
  xTL: number;
  yTL: number;
  xBR: number;
  yBR: number;
}

interface LayerMeta extends ActiveRegion {
  zIndex: number;
}

interface LayerMetaWithPalette extends LayerMeta {
  pixels: TinyColor[][];
}

export const CANVAS_SIZE = 24;
export const TRANSPARENT_COLOR = new TinyColor({ r: 0, g: 0, b: 0, a: 0 });

interface IImageItem {
  name: string;
  image: string;
  zIndex: number;
}

export type TImageList = IImageItem[];

const resumeFullRegionLayer = (layer: LayerMetaWithPalette) => {
  const baseFrame = Array.from({ length: CANVAS_SIZE }, () =>
    Array.from({ length: CANVAS_SIZE }, () => TRANSPARENT_COLOR)
  );

  const pixels = layer.pixels.flat().filter(Boolean);
  let pixelIndex = 0;
  
  for (let y = layer.yTL ?? 0; y < (layer.yBR ?? 0); y++) {
    for (let x = layer.xTL ?? 0; x < (layer.xBR ?? 0); x++) {
      baseFrame[y][x] = pixels[pixelIndex++] || TRANSPARENT_COLOR;
    }
  }

  return baseFrame;
};

export const mergeAllLayers = (layers: LayerMetaWithPalette[]) => {
  const baseLayer = Array.from({ length: CANVAS_SIZE }, () =>
    Array.from({ length: CANVAS_SIZE }, () => TRANSPARENT_COLOR)
  );

  for (const layer of layers) {
    const fullLayer = resumeFullRegionLayer(layer);
    
    for (let y = 0; y < CANVAS_SIZE; y++) {
      for (let x = 0; x < CANVAS_SIZE; x++) {
        const fg = fullLayer[y][x];
        const bg = baseLayer[y][x];

        if (fg.a === 1) {
          baseLayer[y][x] = fg;
        } else if (fg.a === 0) {
          // do nothing
        } else {
          const fgAlpha = Math.round(fg.a * 255);
          const bgAlpha = Math.round(bg.a * 255);
          const w2 = 255 - fgAlpha;

          const outAlpha = fgAlpha + Math.floor((bgAlpha * w2) / 255);

          if (outAlpha === 0) {
            baseLayer[y][x] = TRANSPARENT_COLOR;
          } else {
            // optimize alpha blending calculation
            const invOutAlpha = 1 / outAlpha;
            const bgAlphaW2 = bgAlpha * w2;
            
            const r = Math.floor((fg.r * fgAlpha + Math.floor(bg.r * bgAlphaW2 / 255)) * invOutAlpha);
            const g = Math.floor((fg.g * fgAlpha + Math.floor(bg.g * bgAlphaW2 / 255)) * invOutAlpha);
            const b = Math.floor((fg.b * fgAlpha + Math.floor(bg.b * bgAlphaW2 / 255)) * invOutAlpha);

            baseLayer[y][x] = new TinyColor({ r, g, b, a: outAlpha / 255 });
          }
        }
      }
    }
  }

  return baseLayer;
};
