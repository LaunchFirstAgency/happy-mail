import { describe, expect, test, jest } from "@jest/globals";
import {
  HappyMailError,
  ValidationError,
  NetworkError,
  APIError,
  ConfigurationError,
  ErrorCode,
  retryWithBackoff,
  isHappyMailError,
  isRecoverableError,
} from "../index";

describe("Error Classes", () => {
  describe("HappyMailError", () => {
    test("should create error with message and code", () => {
      const error = new HappyMailError("Test error", ErrorCode.UNKNOWN_ERROR);

      expect(error.message).toBe("Test error");
      expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(error.isRecoverable).toBe(false);
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    test("should support recoverable errors", () => {
      const error = new HappyMailError("Test error", ErrorCode.NETWORK_ERROR, {
        isRecoverable: true,
      });

      expect(error.isRecoverable).toBe(true);
    });

    test("should support error cause", () => {
      const cause = new Error("Original error");
      const error = new HappyMailError("Test error", ErrorCode.UNKNOWN_ERROR, {
        cause,
      });

      expect(error.cause).toBe(cause);
    });

    test("should support context", () => {
      const context = { userId: 123, email: "test@example.com" };
      const error = new HappyMailError("Test error", ErrorCode.VALIDATION_FAILED, {
        context,
      });

      expect(error.context).toEqual(context);
    });

    test("should convert to JSON", () => {
      const error = new HappyMailError("Test error", ErrorCode.API_ERROR, {
        context: { test: "value" },
      });

      const json = error.toJSON();

      expect(json.name).toBe("HappyMailError");
      expect(json.message).toBe("Test error");
      expect(json.code).toBe(ErrorCode.API_ERROR);
      expect(json.isRecoverable).toBe(false);
      expect(json.context).toEqual({ test: "value" });
      expect(json.timestamp).toBeDefined();
    });
  });

  describe("ValidationError", () => {
    test("should create validation error", () => {
      const error = new ValidationError("Invalid email", ErrorCode.INVALID_EMAIL_SYNTAX);

      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toBeInstanceOf(HappyMailError);
      expect(error.code).toBe(ErrorCode.INVALID_EMAIL_SYNTAX);
      expect(error.isRecoverable).toBe(false);
    });

    test("should default to VALIDATION_FAILED code", () => {
      const error = new ValidationError("Invalid");

      expect(error.code).toBe(ErrorCode.VALIDATION_FAILED);
    });
  });

  describe("NetworkError", () => {
    test("should create network error", () => {
      const error = new NetworkError("Connection failed", ErrorCode.CONNECTION_REFUSED);

      expect(error).toBeInstanceOf(NetworkError);
      expect(error).toBeInstanceOf(HappyMailError);
      expect(error.code).toBe(ErrorCode.CONNECTION_REFUSED);
      expect(error.isRecoverable).toBe(true);
    });

    test("should be recoverable by default", () => {
      const error = new NetworkError("Network issue");

      expect(error.isRecoverable).toBe(true);
    });
  });

  describe("APIError", () => {
    test("should create API error", () => {
      const error = new APIError("API failed", ErrorCode.API_ERROR);

      expect(error).toBeInstanceOf(APIError);
      expect(error).toBeInstanceOf(HappyMailError);
      expect(error.code).toBe(ErrorCode.API_ERROR);
    });

    test("should mark rate limit errors as recoverable", () => {
      const error = new APIError("Rate limited", ErrorCode.RATE_LIMIT_EXCEEDED);

      expect(error.isRecoverable).toBe(true);
    });

    test("should mark API unavailable as recoverable", () => {
      const error = new APIError("API down", ErrorCode.API_UNAVAILABLE);

      expect(error.isRecoverable).toBe(true);
    });

    test("should mark invalid API key as not recoverable", () => {
      const error = new APIError("Invalid key", ErrorCode.API_KEY_INVALID);

      expect(error.isRecoverable).toBe(false);
    });

    test("should allow explicit isRecoverable override", () => {
      const error = new APIError("Custom error", ErrorCode.API_ERROR, {
        isRecoverable: true,
      });

      expect(error.isRecoverable).toBe(true);
    });
  });

  describe("ConfigurationError", () => {
    test("should create configuration error", () => {
      const error = new ConfigurationError("Invalid config", ErrorCode.INVALID_CONFIGURATION);

      expect(error).toBeInstanceOf(ConfigurationError);
      expect(error).toBeInstanceOf(HappyMailError);
      expect(error.code).toBe(ErrorCode.INVALID_CONFIGURATION);
      expect(error.isRecoverable).toBe(false);
    });
  });
});

describe("Retry Utilities", () => {
  describe("retryWithBackoff", () => {
    test("should succeed on first try", async () => {
      const fn = jest.fn<() => Promise<string>>(async () => "success");

      const result = await retryWithBackoff(fn, { maxAttempts: 3 });

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test("should retry on recoverable error", async () => {
      let attempt = 0;
      const fn = jest.fn<() => Promise<string>>(async () => {
        attempt++;
        if (attempt === 1) {
          throw new NetworkError("Temporary failure");
        }
        return "success";
      });

      const result = await retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelay: 10,
      });

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(2);
    });

    test("should not retry on non-recoverable error", async () => {
      const error = new ValidationError("Invalid");
      const fn = jest.fn<() => Promise<string>>(async () => {
        throw error;
      });

      await expect(
        retryWithBackoff(fn, { maxAttempts: 3 })
      ).rejects.toThrow(error);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    test("should throw last error after max attempts", async () => {
      const error = new NetworkError("Persistent failure");
      const fn = jest.fn<() => Promise<string>>(async () => {
        throw error;
      });

      await expect(
        retryWithBackoff(fn, { maxAttempts: 3, initialDelay: 10 })
      ).rejects.toThrow(error);

      expect(fn).toHaveBeenCalledTimes(3);
    });

    test("should apply exponential backoff", async () => {
      let attempt = 0;
      const fn = jest.fn<() => Promise<string>>(async () => {
        attempt++;
        if (attempt < 3) {
          throw new NetworkError(`Fail ${attempt}`);
        }
        return "success";
      });

      const startTime = Date.now();
      await retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelay: 100,
        backoffMultiplier: 2,
        jitter: false,
      });
      const elapsed = Date.now() - startTime;

      // Should wait 100ms then 200ms (no jitter)
      // Allow some tolerance for timing
      expect(elapsed).toBeGreaterThanOrEqual(250);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    test("should respect max delay", async () => {
      let attempt = 0;
      const fn = jest.fn<() => Promise<string>>(async () => {
        attempt++;
        if (attempt === 1) {
          throw new NetworkError("Fail");
        }
        return "success";
      });

      await retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 50,
        jitter: false,
      });

      // Should cap delay at 50ms, not use 1000ms
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe("isHappyMailError", () => {
    test("should identify HappyMailError", () => {
      const error = new HappyMailError("Test");
      expect(isHappyMailError(error)).toBe(true);
    });

    test("should identify subclass errors", () => {
      expect(isHappyMailError(new ValidationError("Test"))).toBe(true);
      expect(isHappyMailError(new NetworkError("Test"))).toBe(true);
      expect(isHappyMailError(new APIError("Test"))).toBe(true);
      expect(isHappyMailError(new ConfigurationError("Test"))).toBe(true);
    });

    test("should reject standard errors", () => {
      expect(isHappyMailError(new Error("Test"))).toBe(false);
    });

    test("should reject non-errors", () => {
      expect(isHappyMailError("error")).toBe(false);
      expect(isHappyMailError(null)).toBe(false);
      expect(isHappyMailError(undefined)).toBe(false);
    });
  });

  describe("isRecoverableError", () => {
    test("should identify recoverable errors", () => {
      const error = new NetworkError("Temporary");
      expect(isRecoverableError(error)).toBe(true);
    });

    test("should reject non-recoverable errors", () => {
      const error = new ValidationError("Invalid");
      expect(isRecoverableError(error)).toBe(false);
    });

    test("should reject standard errors", () => {
      expect(isRecoverableError(new Error("Test"))).toBe(false);
    });
  });
});
