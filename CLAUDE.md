# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript-based procedural avatar/image generator that creates 24x24 pixel bitmap images by layering traits based on weighted randomization with constraints. It's designed for generating NFT-style avatar collections (BitmapPunks).

## Development Commands

- **Build package**: `pnpm build`
- **Format code**: `pnpm format`
- **Lint code**: `pnpm lint`
- **Run tests**: `pnpm test` (watch mode), `pnpm test:run` (single run), `pnpm test:ui` (UI mode)
- **Run CLI locally**: `tsx src/bin.ts --seed user123 --out avatar.svg` or `tsx src/bin.ts --out avatar.svg`
- **Run TypeScript**: `tsx src/index.ts` (or any other .ts file)

## Requirements

- Node.js >= 20
- pnpm >= 10.8.1
- Package manager is locked to pnpm

## Build System

This package uses **tsup** for building and bundling:

- **Output formats**: Dual CJS (`dist/index.js`) and ESM (`dist/index.mjs`)
- **Type definitions**: Generated automatically (`dist/index.d.ts`)
- **Bundling**: All dependencies bundled, optimized with tree-shaking and minification
- **Remote Assets**: Configuration and trait data are loaded from AWS S3 instead of being bundled

The package is configured for npm publishing with proper entry points in `package.json`:
- `main`: CommonJS entry point for Node.js require()
- `module`: ESM entry point for modern bundlers
- `types`: TypeScript declarations
- `bin`: CLI entry point for `npx @bitmappunks/avatar-generator --seed ... --out ...`
- `exports`: Conditional exports supporting both CJS and ESM

Run `pnpm build` before publishing. The `prepublishOnly` script ensures builds are always fresh.

## Asset Management

**Assets are now loaded remotely from AWS S3:**

1. **Upload to S3**: Upload the current asset JSON files with `Content-Encoding: gzip`
2. **Update configuration**: Copy the asset URLs and SHA-256 hashes into `src/assets/remote-config.ts`
3. **Build**: Run `pnpm build` to create the lightweight package

This approach reduces the package size from ~832KB to ~50KB (93% reduction).

## Testing

This package uses **Vitest** for testing:

- **Test framework**: Vitest with TypeScript support
- **Test location**: `test/` directory
- **Configuration**: `vitest.config.ts`
- **Test files**:
  - `test/index.test.ts` - Tests for main `generateAvatarFor()` function with mocked remote assets
  - `test/cli.test.ts` - Tests for CLI argument parsing and SVG file output
  - `test/string-to-seeds.test.ts` - Tests for SHA-256 seed generation (determinism, bigint values, edge cases)

Run `pnpm test` for watch mode, `pnpm test:run` for single run, or `pnpm test:ui` for UI mode.

## Project Structure

```
src/
├── bin.ts                        # CLI executable wrapper for npx/package bin usage
├── cli.ts                        # CLI argument parsing and file output
├── index.ts                      # Main entry point with generateAvatarFor() function (now async)
├── string-to-seeds.ts            # SHA-256 based deterministic seed generation
├── load-assets.ts                # Asset loading and processing (now async)
├── load-remote-assets.ts         # Core remote asset fetcher with SHA-256 verification and caching
├── generate-traits.ts            # Trait selection with constraint logic
├── merge-layers.ts               # Layer merging with alpha blending
├── svg.ts                        # SVG generation and optimization
├── tiny-color.ts                 # Custom minimal TinyColor class for color handling
└── assets/
    └── remote-config.ts          # S3 URLs and SHA-256 hashes for remote assets

test/
├── cli.test.ts                   # Tests for CLI parsing and file writes
├── index.test.ts                 # Tests for main generateAvatarFor() function
└── string-to-seeds.test.ts       # Tests for deterministic seed generation

tsup.config.ts                    # Build configuration for dual CJS/ESM output
vitest.config.ts                  # Test configuration for Vitest
.npmignore                        # Files excluded from npm package
```

## Core Architecture

### Generation Pipeline

The image generation follows this flow (see `src/index.ts`):

1. **Load Assets** (`loadConfigAndTraits`) - Fetches configuration and trait data from S3 with SHA-256 verification (async)
2. **Generate Seeds** (`stringToSeeds`) - Converts input string to deterministic bigint seeds using SHA-256
3. **Select Traits** (`getRandomTraits`) - Uses weighted randomization with constraints to select traits for each step
4. **Merge Layers** (`mergeAllLayers`) - Combines trait layers with proper z-ordering and alpha blending
5. **Generate SVG** (`SVGImage.generateSVG`) - Converts merged pixel data to optimized SVG

### Key Concepts

**Entry Point** (`src/index.ts`):
- Exports `async generateAvatarFor(key: string)` as the main public API (now async due to remote loading)
- Returns a Promise resolving to an object with `svgBase64` containing the base64-encoded SVG of the generated 24x24 pixel avatar
- Orchestrates the entire generation pipeline

**CLI** (`src/cli.ts`, `src/bin.ts`):
- Supports `--seed <value>` and `--out <path>`, with random seed generation when `--seed` is omitted
- Decodes the generated base64 SVG and writes a plain `.svg` file to disk
- Publishes through the package `bin` field so `npx @bitmappunks/avatar-generator --seed ... --out ...` works directly

**Seed Generation** (`src/string-to-seeds.ts`):
- Uses `sha.js` library for deterministic SHA-256 hashing
- Converts input string to array of bigint seeds (one per generation step)
- Format: `SHA256(key-0)`, `SHA256(key-1)`, etc.
- Works in both Node.js and browser environments

**Asset Loading** (`src/load-assets.ts`, `src/load-remote-assets.ts`):
- Fetches config and traits data from AWS S3 as JSON files
- S3 serves files with `Content-Encoding: gzip` for automatic compression during transmission
- Uses `globalThis.fetch` for cross-platform compatibility (Node.js 20+, browsers, Edge Runtime)
- Implements SHA-256 integrity verification to ensure files haven't been tampered with
- Implements Promise-based caching to avoid redundant network requests
- Converts palette hex strings to TinyColor objects
- Merges trait metadata from config with pixel data from traits
- Applies constraint overrides (weights, whitelists, blacklists) from config

**Color Handling** (`src/tiny-color.ts`):
- Custom minimal TinyColor class for RGBA color representation
- Supports parsing from RGB/RGBA strings and object notation
- Provides `toHex8String()` method for SVG output (#rrggbbaa format)
- Optimized for bundle size by removing unnecessary features from third-party libraries
- Replaced `@ctrl/tinycolor` dependency to reduce package footprint

**Traits System** (`src/generate-traits.ts`):
- Each trait has an ID, weight, and multiple layers with pixel data
- Traits are organized into pools within generation steps
- Constraint system supports:
  - Pool whitelists/blacklists (traits can require or exclude specific pools)
  - Trait whitelists/blacklists (traits can require or exclude specific other traits)
- Empty trait (ID 0) is used when no valid traits match constraints
- Uses weighted randomization with bigint seeds for trait selection

**Layer Structure**:
- Layers have z-index for ordering, active regions for optimization (xTL, yTL, xBR, yBR)
- Pixel data uses palette indices (-1 = transparent)
- Active regions optimize storage by only storing non-empty pixel areas
- Asset data is stored as JSON on S3 and served with gzip compression
- Final canvas is always 24x24 pixels (`CANVAS_SIZE`)

**Layer Merging** (`src/merge-layers.ts`):
- Expands active regions back to full 24x24 canvas
- Sorts layers by z-index and merges using alpha compositing
- Optimized alpha blending algorithm (lines 64-82) for proper color mixing
- Handles fully opaque (a=1), fully transparent (a=0), and semi-transparent pixels
- Uses precomputed values to minimize division operations for performance
- Returns flattened 24x24 TinyColor array

**SVG Generation** (`src/svg.ts`):
- Takes flattened TinyColor array and generates optimized SVG
- Combines consecutive same-color pixels into horizontal paths
- Outputs crisp pixel art using `shape-rendering="crispEdges"`
- Supports base64 encoding via `toBase64()` method
- Uses fast color comparison to avoid unnecessary method calls
- Outputs colors in #rrggbbaa hex format for full alpha channel support

## Data Formats

**Traits Data Structure** (fetched from S3 as JSON):
```typescript
{
  id: number;
  layerPixels: Array<{
    zIndex: number;
    pixels: number[][];          // Palette indices, -1 = transparent
    activeRegion: { xTL, yTL, xBR, yBR };
  }>;
  palette: string[];             // Hex color strings
}
```

**Config Data Structure** (fetched from S3 as JSON):
```typescript
{
  steps: Array<{
    name: string;
    optionPools: Array<{
      name: string;
      traitsId: number[];
      traitsWeights: number[];
      poolsWhitelist/poolsBlacklist: Record<string, boolean>;
      traitsWhitelist/traitsBlacklist: Record<string, boolean>;
    }>;
  }>;
  traits: Array<{
    id: number;
    weight: number;
    poolsWhitelist/poolsBlacklist?: Record<string, boolean>;
    traitsWhitelist/traitsBlacklist?: Record<string, boolean>;
  }>;
}
```

**Remote Asset Configuration** (`src/assets/remote-config.ts`):
```typescript
export const REMOTE_ASSETS = {
  config: {
    url: 'https://your-bucket.s3.region.amazonaws.com/v1/config.json',
    sha256: 'expected-sha256-hash-here'
  },
  traits: {
    url: 'https://your-bucket.s3.region.amazonaws.com/v1/traits.json',
    sha256: 'expected-sha256-hash-here'
  }
};
```

**Asset Distribution**:
- JSON data is stored on AWS S3 with `Content-Encoding: gzip` header
- S3/browsers automatically decompress gzipped content during transmission
- SHA-256 hashes are hardcoded in `remote-config.ts` for integrity verification
- Fetching happens once at runtime with Promise-based caching for performance
- This approach reduces the npm package size by ~93% (from 832KB to ~50KB)

## Dependencies

**Runtime Dependencies**:
- `sha.js` (2.4.12) - SHA-256 hashing for deterministic seed generation and asset integrity verification

**Key Design Decisions**:
- Replaced `@ctrl/tinycolor` with custom minimal TinyColor implementation to reduce bundle size
- Removed `pako` dependency by leveraging S3's native gzip support via `Content-Encoding` header
- All remaining dependencies are bundled into the final package for zero external dependencies at runtime
- Asset data is fetched from S3 on first use and cached in memory to minimize network requests
- Uses `globalThis.fetch` for maximum cross-platform compatibility (Node.js 20+, browsers, Edge Runtime)
