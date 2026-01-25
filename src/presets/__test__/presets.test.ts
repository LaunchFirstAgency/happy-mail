import { describe, expect, test } from "@jest/globals";
import {
  getPreset,
  PRESETS,
  PRODUCTION_PRESET,
  DEVELOPMENT_PRESET,
  STRICT_PRESET,
  LENIENT_PRESET,
  PRESET_DESCRIPTIONS,
  type PresetName,
} from "../index";

describe("Configuration Presets", () => {
  describe("PRODUCTION_PRESET", () => {
    test("should have correct production settings", () => {
      expect(PRODUCTION_PRESET.skipBounceCheckByDefault).toBe(false);
      expect(PRODUCTION_PRESET.entropyThreshold).toBe(4.0);
      expect(PRODUCTION_PRESET.minLengthForRandomCheck).toBe(6);
      expect(PRODUCTION_PRESET.loggingEnabled).toBe(false);
    });
  });

  describe("DEVELOPMENT_PRESET", () => {
    test("should have correct development settings", () => {
      expect(DEVELOPMENT_PRESET.skipBounceCheckByDefault).toBe(true);
      expect(DEVELOPMENT_PRESET.entropyThreshold).toBe(5.5);
      expect(DEVELOPMENT_PRESET.minLengthForRandomCheck).toBe(10);
      expect(DEVELOPMENT_PRESET.loggingEnabled).toBe(true);
    });
  });

  describe("STRICT_PRESET", () => {
    test("should have correct strict settings", () => {
      expect(STRICT_PRESET.skipBounceCheckByDefault).toBe(false);
      expect(STRICT_PRESET.entropyThreshold).toBe(3.5);
      expect(STRICT_PRESET.minLengthForRandomCheck).toBe(5);
      expect(STRICT_PRESET.loggingEnabled).toBe(false);
    });

    test("should be stricter than production", () => {
      expect(STRICT_PRESET.entropyThreshold).toBeLessThan(PRODUCTION_PRESET.entropyThreshold!);
      expect(STRICT_PRESET.minLengthForRandomCheck).toBeLessThan(
        PRODUCTION_PRESET.minLengthForRandomCheck!
      );
    });
  });

  describe("LENIENT_PRESET", () => {
    test("should have correct lenient settings", () => {
      expect(LENIENT_PRESET.skipBounceCheckByDefault).toBe(true);
      expect(LENIENT_PRESET.entropyThreshold).toBe(6.0);
      expect(LENIENT_PRESET.minLengthForRandomCheck).toBe(12);
      expect(LENIENT_PRESET.loggingEnabled).toBe(true);
    });

    test("should be more lenient than development", () => {
      expect(LENIENT_PRESET.entropyThreshold).toBeGreaterThan(
        DEVELOPMENT_PRESET.entropyThreshold!
      );
      expect(LENIENT_PRESET.minLengthForRandomCheck).toBeGreaterThan(
        DEVELOPMENT_PRESET.minLengthForRandomCheck!
      );
    });
  });

  describe("getPreset", () => {
    test("should return production preset", () => {
      const preset = getPreset("production");
      expect(preset).toEqual(PRODUCTION_PRESET);
    });

    test("should return development preset", () => {
      const preset = getPreset("development");
      expect(preset).toEqual(DEVELOPMENT_PRESET);
    });

    test("should return strict preset", () => {
      const preset = getPreset("strict");
      expect(preset).toEqual(STRICT_PRESET);
    });

    test("should return lenient preset", () => {
      const preset = getPreset("lenient");
      expect(preset).toEqual(LENIENT_PRESET);
    });

    test("should throw error for unknown preset", () => {
      expect(() => getPreset("unknown" as PresetName)).toThrow("Unknown preset: unknown");
    });
  });

  describe("PRESETS", () => {
    test("should contain all preset names", () => {
      expect(Object.keys(PRESETS)).toEqual([
        "production",
        "development",
        "strict",
        "lenient",
      ]);
    });

    test("should map to correct preset objects", () => {
      expect(PRESETS.production).toEqual(PRODUCTION_PRESET);
      expect(PRESETS.development).toEqual(DEVELOPMENT_PRESET);
      expect(PRESETS.strict).toEqual(STRICT_PRESET);
      expect(PRESETS.lenient).toEqual(LENIENT_PRESET);
    });
  });

  describe("PRESET_DESCRIPTIONS", () => {
    test("should have descriptions for all presets", () => {
      expect(PRESET_DESCRIPTIONS.production).toBeDefined();
      expect(PRESET_DESCRIPTIONS.development).toBeDefined();
      expect(PRESET_DESCRIPTIONS.strict).toBeDefined();
      expect(PRESET_DESCRIPTIONS.lenient).toBeDefined();
    });

    test("descriptions should be non-empty strings", () => {
      Object.values(PRESET_DESCRIPTIONS).forEach((desc) => {
        expect(typeof desc).toBe("string");
        expect(desc.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Preset Ordering", () => {
    test("entropy thresholds should be ordered: strict < production < development < lenient", () => {
      expect(STRICT_PRESET.entropyThreshold).toBeLessThan(
        PRODUCTION_PRESET.entropyThreshold!
      );
      expect(PRODUCTION_PRESET.entropyThreshold).toBeLessThan(
        DEVELOPMENT_PRESET.entropyThreshold!
      );
      expect(DEVELOPMENT_PRESET.entropyThreshold).toBeLessThan(
        LENIENT_PRESET.entropyThreshold!
      );
    });

    test("min length thresholds should be ordered: strict < production < development < lenient", () => {
      expect(STRICT_PRESET.minLengthForRandomCheck).toBeLessThan(
        PRODUCTION_PRESET.minLengthForRandomCheck!
      );
      expect(PRODUCTION_PRESET.minLengthForRandomCheck).toBeLessThan(
        DEVELOPMENT_PRESET.minLengthForRandomCheck!
      );
      expect(DEVELOPMENT_PRESET.minLengthForRandomCheck).toBeLessThan(
        LENIENT_PRESET.minLengthForRandomCheck!
      );
    });
  });
});
