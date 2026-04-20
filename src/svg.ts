import { TinyColor } from "./tiny-color";

export class SVGImage {
  static generateSVG(
    width: number,
    height: number,
    pixels: TinyColor[][]
  ): string {
    const svgParts: string[] = [this.writeSVGHeader(width, height)];

    for (let y = 0; y < height; y++) {
      let startX = 0;
      let currentColor: TinyColor | null = null;

      const currentRow = pixels[y];
      for (let x = 0; x < width; x++) {
        const color = currentRow[x];

        if (color.a === 0) {
          if (currentColor) {
            svgParts.push(this.writePath(startX, y, x - startX, currentColor));
            currentColor = null;
          }
          startX = x + 1;
          continue;
        }

        if (!currentColor) {
          currentColor = color;
          startX = x;
        } else if (!this.isSameColorFast(color, currentColor)) {
          svgParts.push(this.writePath(startX, y, x - startX, currentColor));
          currentColor = color;
          startX = x;
        }
      }

      if (currentColor && startX < width) {
        svgParts.push(this.writePath(startX, y, width - startX, currentColor));
      }
    }

    svgParts.push("</svg>");
    return svgParts.join("");
  }

  static toBase64(svg: string): string {
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  private static writeSVGHeader(width: number, height: number): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  }

  private static writePath(
    x: number,
    y: number,
    width: number,
    color: TinyColor
  ): string {
    const hexColor = color.toHex8String();
    return `<path d="M${x} ${y}v1h${width}v-1" fill="${hexColor}"/>`;
  }

  private static isSameColorFast(c1: TinyColor, c2: TinyColor): boolean {
    // fast color comparison, avoid calling equals method
    return c1.r === c2.r && c1.g === c2.g && c1.b === c2.b && c1.a === c2.a;
  }
}
