export class TinyColor {
  r: number;
  g: number;
  b: number;
  a: number;

  constructor(
    input: `rgb${string}` | { r: number; g: number; b: number; a: number }
  ) {
    if (typeof input === "string") {
      const parsed = this.parseRgbString(input);
      this.r = parsed.r;
      this.g = parsed.g;
      this.b = parsed.b;
      this.a = parsed.a;
    } else {
      this.r = Math.round(input.r);
      this.g = Math.round(input.g);
      this.b = Math.round(input.b);
      this.a = input.a;
    }
  }

  private parseRgbString(rgb: string): {
    r: number;
    g: number;
    b: number;
    a: number;
  } {
    const match = rgb.match(
      /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/
    );

    if (!match) {
      throw new Error(`Invalid RGB/RGBA color format: ${rgb}`);
    }

    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    const a = match[4] !== undefined ? parseFloat(match[4]) : 1;

    return { r, g, b, a };
  }

  toHex8String(): string {
    const r = this.r.toString(16).padStart(2, "0");
    const g = this.g.toString(16).padStart(2, "0");
    const b = this.b.toString(16).padStart(2, "0");
    const a = Math.round(this.a * 255)
      .toString(16)
      .padStart(2, "0");

    return `#${r}${g}${b}${a}`;
  }
}
