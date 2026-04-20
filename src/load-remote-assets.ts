import shajs from "sha.js";
import { REMOTE_ASSETS, RemoteAssetConfig } from "./assets/remote-config";

/**
 * Fetches a remote asset from S3 and verifies its integrity using SHA-256
 * - Cross-platform compatible (Node.js 20+, browsers, Edge Runtime)
 * - Automatic gzip decompression (via Content-Encoding header)
 * - SHA-256 integrity verification
 * - In-memory caching to avoid redundant downloads
 * @param config - Remote asset configuration containing URL and expected SHA-256 hash
 * @returns Parsed JSON data from the remote asset
 * @throws Error if fetch fails, SHA-256 mismatch, or JSON parsing fails
 */
async function fetchRemoteAsset<T>(config: RemoteAssetConfig): Promise<T> {
  try {
    const response = await globalThis.fetch(config.url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch asset from ${config.url}: ${response.status} ${response.statusText}`
      );
    }

    const text = await response.text();

    const calculatedHash = shajs("sha256").update(text).digest("hex");

    if (calculatedHash !== config.sha256) {
      throw new Error(
        `SHA-256 mismatch for ${config.url}!\n` +
          `Expected: ${config.sha256}\n` +
          `Calculated: ${calculatedHash}\n` +
          `The file may have been tampered with or corrupted during transmission.`
      );
    }

    return JSON.parse(text) as T;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to load remote asset from ${config.url}: ${error.message}`
      );
    }
    throw error;
  }
}

/**
 * Fetches and caches the remote config data
 */
let cachedConfigPromise: Promise<any> | null = null;

export async function fetchRemoteConfig<T>(): Promise<T> {
  if (cachedConfigPromise === null) {
    cachedConfigPromise = fetchRemoteAsset<T>(REMOTE_ASSETS.config);
  }
  return cachedConfigPromise;
}

/**
 * Fetches and caches the remote traits data
 */
let cachedTraitsPromise: Promise<any> | null = null;

export async function fetchRemoteTraits<T>(): Promise<T> {
  if (cachedTraitsPromise === null) {
    cachedTraitsPromise = fetchRemoteAsset<T>(REMOTE_ASSETS.traits);
  }
  return cachedTraitsPromise;
}
