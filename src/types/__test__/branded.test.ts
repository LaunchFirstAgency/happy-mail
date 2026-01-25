import { describe, expect, test } from "@jest/globals";
import {
  type ValidatedEmail,
  type SafeEmail,
  type NormalizedEmail,
  isValidatedEmail,
  isSafeEmail,
  isNormalizedEmail,
  assertValidatedEmail,
  assertSafeEmail,
  assertNormalizedEmail,
} from "../branded";

describe("Branded Types", () => {
  describe("isValidatedEmail", () => {
    test("should return true for non-empty string", () => {
      expect(isValidatedEmail("test@example.com")).toBe(true);
    });

    test("should return false for empty string", () => {
      expect(isValidatedEmail("")).toBe(false);
    });

    test("should return false for non-string values", () => {
      expect(isValidatedEmail(null)).toBe(false);
      expect(isValidatedEmail(undefined)).toBe(false);
      expect(isValidatedEmail(123)).toBe(false);
      expect(isValidatedEmail({})).toBe(false);
    });
  });

  describe("isSafeEmail", () => {
    test("should return true for non-empty string", () => {
      expect(isSafeEmail("test@example.com")).toBe(true);
    });

    test("should return false for empty string", () => {
      expect(isSafeEmail("")).toBe(false);
    });

    test("should return false for non-string values", () => {
      expect(isSafeEmail(null)).toBe(false);
      expect(isSafeEmail(undefined)).toBe(false);
      expect(isSafeEmail(123)).toBe(false);
    });
  });

  describe("isNormalizedEmail", () => {
    test("should return true for non-empty string", () => {
      expect(isNormalizedEmail("test@example.com")).toBe(true);
    });

    test("should return false for empty string", () => {
      expect(isNormalizedEmail("")).toBe(false);
    });

    test("should return false for non-string values", () => {
      expect(isNormalizedEmail(null)).toBe(false);
      expect(isNormalizedEmail(undefined)).toBe(false);
      expect(isNormalizedEmail(123)).toBe(false);
    });
  });

  describe("assertValidatedEmail", () => {
    test("should not throw for valid email string", () => {
      expect(() => {
        assertValidatedEmail("test@example.com");
      }).not.toThrow();
    });

    test("should throw for empty string", () => {
      expect(() => {
        assertValidatedEmail("");
      }).toThrow("Invalid email: empty string");
    });

    test("should allow type narrowing", () => {
      const email = "test@example.com";
      assertValidatedEmail(email);
      // After assertion, TypeScript knows this is a ValidatedEmail
      const validated: ValidatedEmail = email as ValidatedEmail;
      expect(validated).toBe("test@example.com");
    });
  });

  describe("assertSafeEmail", () => {
    test("should not throw for valid email string", () => {
      expect(() => {
        assertSafeEmail("test@example.com");
      }).not.toThrow();
    });

    test("should throw for empty string", () => {
      expect(() => {
        assertSafeEmail("");
      }).toThrow("Invalid email: empty string");
    });

    test("should allow type narrowing", () => {
      const email = "test@example.com";
      assertSafeEmail(email);
      // After assertion, TypeScript knows this is a SafeEmail
      const safe: SafeEmail = email as SafeEmail;
      expect(safe).toBe("test@example.com");
    });
  });

  describe("assertNormalizedEmail", () => {
    test("should not throw for valid email string", () => {
      expect(() => {
        assertNormalizedEmail("test@example.com");
      }).not.toThrow();
    });

    test("should throw for empty string", () => {
      expect(() => {
        assertNormalizedEmail("");
      }).toThrow("Invalid email: empty string");
    });

    test("should allow type narrowing", () => {
      const email = "test@example.com";
      assertNormalizedEmail(email);
      // After assertion, TypeScript knows this is a NormalizedEmail
      const normalized: NormalizedEmail = email as NormalizedEmail;
      expect(normalized).toBe("test@example.com");
    });
  });

  describe("Type Safety", () => {
    test("ValidatedEmail should be assignable to string", () => {
      const validated = "test@example.com" as ValidatedEmail;
      const str: string = validated;
      expect(str).toBe("test@example.com");
    });

    test("SafeEmail should be assignable to ValidatedEmail and string", () => {
      const safe = "test@example.com" as SafeEmail;
      const validated: ValidatedEmail = safe;
      const str: string = safe;
      expect(validated).toBe("test@example.com");
      expect(str).toBe("test@example.com");
    });

    test("NormalizedEmail should be assignable to string", () => {
      const normalized = "test@example.com" as NormalizedEmail;
      const str: string = normalized;
      expect(str).toBe("test@example.com");
    });
  });

  describe("Usage Examples", () => {
    function sendEmail(email: ValidatedEmail): boolean {
      return email.length > 0;
    }

    function sendMarketingEmail(email: SafeEmail): boolean {
      return email.length > 0;
    }

    function checkDuplicate(email: NormalizedEmail): boolean {
      return email.includes("@");
    }

    test("should work with ValidatedEmail in functions", () => {
      const email = "test@example.com" as ValidatedEmail;
      expect(sendEmail(email)).toBe(true);
    });

    test("should work with SafeEmail in functions", () => {
      const email = "test@example.com" as SafeEmail;
      expect(sendMarketingEmail(email)).toBe(true);
    });

    test("should work with NormalizedEmail in functions", () => {
      const email = "test@example.com" as NormalizedEmail;
      expect(checkDuplicate(email)).toBe(true);
    });

    test("should allow SafeEmail where ValidatedEmail is expected", () => {
      const safe = "test@example.com" as SafeEmail;
      // SafeEmail extends ValidatedEmail, so this should work
      expect(sendEmail(safe)).toBe(true);
    });
  });
});
