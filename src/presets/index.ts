/**
 * Configuration presets for common use cases
 * @module presets
 */

import type { HappyEmailClientOptions } from "../client";

/**
 * Available preset names
 */
export type PresetName = "production" | "development" | "strict" | "lenient";

/**
 * Configuration preset for production environments
 *
 * Optimized for:
 * - High accuracy validation
 * - Strict filtering
 * - Real deliverability checking
 *
 * Settings:
 * - Bounce checks enabled
 * - Lower entropy threshold (catches more random emails)
 * - Lower minimum length for random check
 * - Logging disabled (for performance)
 */
export const PRODUCTION_PRESET: Partial<HappyEmailClientOptions> = {
  skipBounceCheckByDefault: false,
  entropyThreshold: 4.0,
  minLengthForRandomCheck: 6,
  loggingEnabled: false,
};

/**
 * Configuration preset for development environments
 *
 * Optimized for:
 * - Fast validation
 * - Lenient filtering
 * - Quick iteration
 *
 * Settings:
 * - Bounce checks disabled (faster)
 * - Higher entropy threshold (fewer false positives)
 * - Higher minimum length for random check
 * - Logging enabled (for debugging)
 */
export const DEVELOPMENT_PRESET: Partial<HappyEmailClientOptions> = {
  skipBounceCheckByDefault: true,
  entropyThreshold: 5.5,
  minLengthForRandomCheck: 10,
  loggingEnabled: true,
};

/**
 * Configuration preset for strict validation
 *
 * Optimized for:
 * - Maximum accuracy
 * - Zero tolerance for risky emails
 * - High-value campaigns
 *
 * Settings:
 * - Bounce checks enabled
 * - Very low entropy threshold (catches even slightly random emails)
 * - Very low minimum length for random check
 * - Logging disabled
 */
export const STRICT_PRESET: Partial<HappyEmailClientOptions> = {
  skipBounceCheckByDefault: false,
  entropyThreshold: 3.5,
  minLengthForRandomCheck: 5,
  loggingEnabled: false,
};

/**
 * Configuration preset for lenient validation
 *
 * Optimized for:
 * - High acceptance rate
 * - Minimal false positives
 * - Quick signup flows
 *
 * Settings:
 * - Bounce checks disabled
 * - Very high entropy threshold (only obvious random emails)
 * - High minimum length for random check
 * - Logging enabled
 */
export const LENIENT_PRESET: Partial<HappyEmailClientOptions> = {
  skipBounceCheckByDefault: true,
  entropyThreshold: 6.0,
  minLengthForRandomCheck: 12,
  loggingEnabled: true,
};

/**
 * Get a configuration preset by name
 *
 * @param preset - The preset name
 * @returns Configuration options for the preset
 *
 * @example
 * ```typescript
 * import { HappyEmailClient, getPreset } from '@launchfirstagency/happy-mail';
 *
 * const client = new HappyEmailClient({
 *   ...getPreset('production'),
 *   neverBounceApiKey: 'your-key', // Override or add options
 * });
 * ```
 */
export function getPreset(preset: PresetName): Partial<HappyEmailClientOptions> {
  switch (preset) {
    case "production":
      return PRODUCTION_PRESET;
    case "development":
      return DEVELOPMENT_PRESET;
    case "strict":
      return STRICT_PRESET;
    case "lenient":
      return LENIENT_PRESET;
    default:
      throw new Error(`Unknown preset: ${preset}`);
  }
}

/**
 * All available presets mapped by name
 */
export const PRESETS: Record<PresetName, Partial<HappyEmailClientOptions>> = {
  production: PRODUCTION_PRESET,
  development: DEVELOPMENT_PRESET,
  strict: STRICT_PRESET,
  lenient: LENIENT_PRESET,
};

/**
 * Preset descriptions for documentation
 */
export const PRESET_DESCRIPTIONS: Record<PresetName, string> = {
  production:
    "Optimized for production: accurate validation, strict filtering, bounce checks enabled",
  development:
    "Optimized for development: fast validation, lenient filtering, bounce checks disabled",
  strict:
    "Maximum accuracy: zero tolerance for risky emails, very low thresholds, ideal for high-value campaigns",
  lenient:
    "High acceptance rate: minimal false positives, high thresholds, ideal for quick signup flows",
};
