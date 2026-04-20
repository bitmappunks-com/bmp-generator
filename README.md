# @bitmappunks/avatar-generator

A TypeScript-based procedural avatar generator that creates deterministic 24x24 pixel punk images.


## Installation

```bash
npm install @bitmappunks/avatar-generator
# or
pnpm add @bitmappunks/avatar-generator
# or
yarn add @bitmappunks/avatar-generator
```

## Quick Start

```typescript
import { generateAvatarFor } from '@bitmappunks/avatar-generator';

// Generate a deterministic 24x24 pixel avatar
const avatar = await generateAvatarFor('user123');

// Use the base64-encoded SVG
console.log(avatar.svgBase64);

// In HTML
const img = document.createElement('img');
img.src = avatar.svgBase64;
```

## CLI

```bash
npx @bitmappunks/avatar-generator --seed user123 --out avatar.svg
# or let the CLI generate a random seed
npx @bitmappunks/avatar-generator --out avatar.svg
```

## License

MIT - see [LICENSE](LICENSE) file for details

## Author

BitmapPunks
