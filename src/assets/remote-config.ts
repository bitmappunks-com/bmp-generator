/**
 * Remote asset configuration for S3-hosted resources
 *
 * Asset versioning strategy:
 * - Each version uses a unique path (e.g., v1/, v2/)
 * - SHA-256 hashes are hardcoded for integrity verification
 * - To update assets: upload new files to a new version path and update this config
 */

export interface RemoteAssetConfig {
  url: string;
  sha256: string;
}

export interface RemoteAssetsConfig {
  config: RemoteAssetConfig;
  traits: RemoteAssetConfig;
}

/**
 * IMPORTANT: Before deploying, you must:
 * 1. Upload the updated asset JSON files to S3 with Content-Encoding: gzip
 * 2. Update the URLs and sha256 hashes below
 */
export const REMOTE_ASSETS: RemoteAssetsConfig = {
  config: {
    url: "https://bmp-punks.s3.ap-east-1.amazonaws.com/generator-assets/v1/config.json",
    sha256: "7ca55a0c9324cbb489458a24aee302d31a08b7699911e953898a6f15c5bef7ad",
  },
  traits: {
    url: "https://bmp-punks.s3.ap-east-1.amazonaws.com/generator-assets/v1/traits.json",
    sha256: "43c417821133128bcd5d3f3e5dc4c517aca76cc19155f54c34d201f59f38f55a",
  },
};
