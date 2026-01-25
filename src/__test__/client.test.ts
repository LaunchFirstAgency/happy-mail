import { describe, expect, test, jest, beforeEach } from "@jest/globals";
import { HappyEmailClient } from "../client";
import { ConfigurationError, ErrorCode } from "../errors";
import { MailBoxCanReceiveStatus } from "../types";

describe("HappyEmailClient", () => {
  describe("Constructor", () => {
    test("should create client with default options", () => {
      const client = new HappyEmailClient();
      expect(client).toBeInstanceOf(HappyEmailClient);
    });

    test("should create client with preset", () => {
      const client = new HappyEmailClient({ preset: "production" });
      expect(client).toBeInstanceOf(HappyEmailClient);
    });

    test("should allow preset override", () => {
      // Preset sets skipBounceCheckByDefault to false, but we override it
      const client = new HappyEmailClient({
        preset: "production",
        skipBounceCheckByDefault: true,
      });
      expect(client).toBeInstanceOf(HappyEmailClient);
    });

    test("should throw ConfigurationError for invalid entropyThreshold", () => {
      expect(() => {
        new HappyEmailClient({ entropyThreshold: -1 });
      }).toThrow(ConfigurationError);

      expect(() => {
        new HappyEmailClient({ entropyThreshold: 11 });
      }).toThrow(ConfigurationError);
    });

    test("should throw ConfigurationError for invalid minLengthForRandomCheck", () => {
      expect(() => {
        new HappyEmailClient({ minLengthForRandomCheck: -1 });
      }).toThrow(ConfigurationError);
    });

    test("should accept valid configuration", () => {
      const client = new HappyEmailClient({
        entropyThreshold: 5.0,
        minLengthForRandomCheck: 8,
        loggingEnabled: false,
      });
      expect(client).toBeInstanceOf(HappyEmailClient);
    });
  });

  describe("validateEmail", () => {
    let client: HappyEmailClient;

    beforeEach(() => {
      client = new HappyEmailClient({ skipBounceCheckByDefault: true });
    });

    test("should validate email with valid syntax", async () => {
      const result = await client.validateEmail("test@example.com");

      expect(result).toBeDefined();
      expect(result.email).toBe("test@example.com");
      expect(result.risks.validSyntax).toBe(true);
    });

    test("should reject email with invalid syntax", async () => {
      const result = await client.validateEmail("invalid-email");

      expect(result.risks.validSyntax).toBe(false);
    });

    test("should respect skipBounceCheck parameter", async () => {
      const result = await client.validateEmail("test@example.com", true);
      expect(result).toBeDefined();
    });
  });

  describe("quickCheck", () => {
    let client: HappyEmailClient;

    beforeEach(() => {
      client = new HappyEmailClient();
    });

    test("should perform quick validation", async () => {
      const result = await client.quickCheck("test@example.com");

      expect(result).toBeDefined();
      expect(result.email).toBe("test@example.com");
      expect(result.risks.validSyntax).toBe(true);
    });

    test("should skip bounce check", async () => {
      const result = await client.quickCheck("test@example.com");
      // Quick check should skip bounce check, so result should complete fast
      expect(result).toBeDefined();
    });
  });

  describe("fullCheck", () => {
    let client: HappyEmailClient;

    beforeEach(() => {
      client = new HappyEmailClient({ skipBounceCheckByDefault: true });
    });

    test("should perform full validation", async () => {
      const result = await client.fullCheck("test@example.com");

      expect(result).toBeDefined();
      expect(result.email).toBe("test@example.com");
    });
  });

  describe("validateAndNormalize", () => {
    let client: HappyEmailClient;

    beforeEach(() => {
      client = new HappyEmailClient({ skipBounceCheckByDefault: true });
    });

    test("should validate and normalize valid email", async () => {
      const result = await client.validateAndNormalize("Test@Example.com");

      expect(result.isValid).toBe(true);
      expect(result.original).toBe("Test@Example.com");
      expect(result.normalized).toBeDefined();
      expect(result.normalized?.toLowerCase()).toBe("test@example.com");
    });

    test("should return normalized for valid email", async () => {
      const result = await client.validateAndNormalize("John.Doe+tag@Gmail.com");

      expect(result.isValid).toBe(true);
      expect(result.normalized).toBeDefined();
    });

    test("should not return normalized for invalid email", async () => {
      const result = await client.validateAndNormalize("invalid");

      expect(result.isValid).toBe(false);
      expect(result.normalized).toBeUndefined();
    });

    test("should include full validation result", async () => {
      const result = await client.validateAndNormalize("test@example.com");

      expect(result.validation).toBeDefined();
      expect(result.validation.email).toBe("test@example.com");
      expect(result.validation.risks).toBeDefined();
    });
  });

  describe("validateBatch", () => {
    let client: HappyEmailClient;

    beforeEach(() => {
      client = new HappyEmailClient({ skipBounceCheckByDefault: true });
    });

    test("should validate multiple emails", async () => {
      const emails = ["test1@example.com", "test2@example.com", "test3@example.com"];

      const results = await client.validateBatch(emails);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);
      expect(results[0].result?.email).toBe("test1@example.com");
      expect(results[1].result?.email).toBe("test2@example.com");
      expect(results[2].result?.email).toBe("test3@example.com");
    });

    test("should handle errors with continueOnError", async () => {
      const emails = ["valid@example.com", "invalid", "another@example.com"];

      const results = await client.validateBatch(emails, {
        continueOnError: true,
      });

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true); // Invalid syntax is not an error, just a result
      expect(results[2].success).toBe(true);
    });

    test("should call progress callback", async () => {
      const emails = ["test1@example.com", "test2@example.com"];
      const progressCalls: [number, number][] = [];

      await client.validateBatch(emails, {
        onProgress: (completed, total) => {
          progressCalls.push([completed, total]);
        },
      });

      expect(progressCalls.length).toBeGreaterThan(0);
      const lastCall = progressCalls[progressCalls.length - 1];
      expect(lastCall[0]).toBe(2); // completed
      expect(lastCall[1]).toBe(2); // total
    });

    test("should respect concurrency limit", async () => {
      const emails = Array.from({ length: 10 }, (_, i) => `test${i}@example.com`);

      const results = await client.validateBatch(emails, {
        concurrency: 2,
      });

      expect(results).toHaveLength(10);
      expect(results.every((r) => r.success)).toBe(true);
    });

    test("should allow skipBounceCheck override", async () => {
      const emails = ["test@example.com"];

      const results = await client.validateBatch(emails, {
        skipBounceCheck: true,
      });

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
    });
  });

  describe("getDomainInfo", () => {
    let client: HappyEmailClient;

    beforeEach(() => {
      client = new HappyEmailClient();
    });

    test("should return domain info for email", async () => {
      const info = await client.getDomainInfo("test@gmail.com");

      expect(info).toBeDefined();
      expect(info.domain).toBe("gmail.com");
      expect(info.healthScore).toBeGreaterThanOrEqual(0);
      expect(info.healthScore).toBeLessThanOrEqual(100);
      expect(["excellent", "good", "fair", "poor"]).toContain(info.assessment);
    });

    test("should return domain info for domain only", async () => {
      const info = await client.getDomainInfo("example.com");

      expect(info).toBeDefined();
      expect(info.domain).toBe("example.com");
    }, 10000);

    test("should calculate health score", async () => {
      const info = await client.getDomainInfo("test@example.com");

      expect(typeof info.healthScore).toBe("number");
      expect(info.healthScore).toBeGreaterThanOrEqual(0);
      expect(info.healthScore).toBeLessThanOrEqual(100);
    });

    test("should provide health assessment", async () => {
      const info = await client.getDomainInfo("test@gmail.com");

      expect(info.assessment).toBeDefined();
      expect(["excellent", "good", "fair", "poor"]).toContain(info.assessment);
    });

    test("should handle domain checks gracefully", async () => {
      // Even if some checks fail, should still return result
      const info = await client.getDomainInfo("nonexistent-domain-12345.com");

      expect(info).toBeDefined();
      expect(info.domain).toBe("nonexistent-domain-12345.com");
    });
  });

  describe("Bulk Verification Methods", () => {
    test("should throw error when NeverBounce API key is missing", async () => {
      const client = new HappyEmailClient();

      await expect(client.listJobs()).rejects.toThrow("NeverBounce API key is required for bulk operations");
    });
  });

  describe("Service Accessors", () => {
    let client: HappyEmailClient;

    beforeEach(() => {
      client = new HappyEmailClient();
    });

    test("should provide access to EmailValidationService", () => {
      const service = client.getEmailValidationService();
      expect(service).toBeDefined();
    });

    test("should provide access to InboxHealthService", () => {
      const service = client.getInboxHealthService();
      expect(service).toBeDefined();
    });

    test("should provide access to BulkVerification", () => {
      const service = client.getBulkVerification();
      expect(service).toBeNull(); // No API key provided
    });

    test("should return BulkVerification when API key provided", () => {
      const clientWithKey = new HappyEmailClient({
        neverBounceApiKey: "test-key",
      });
      const service = clientWithKey.getBulkVerification();
      expect(service).not.toBeNull();
    });
  });

  describe("Logging Configuration", () => {
    test("should enable logging by default", () => {
      const client = new HappyEmailClient();
      expect(client.isLoggingEnabled()).toBe(true);
    });

    test("should allow disabling logging", () => {
      const client = new HappyEmailClient({ loggingEnabled: false });
      expect(client.isLoggingEnabled()).toBe(false);
    });

    test("should respect preset logging settings", () => {
      const prodClient = new HappyEmailClient({ preset: "production" });
      expect(prodClient.isLoggingEnabled()).toBe(false);

      const devClient = new HappyEmailClient({ preset: "development" });
      expect(devClient.isLoggingEnabled()).toBe(true);
    });
  });
});
