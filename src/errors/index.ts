/**
 * Custom error classes for Happy Mail SDK
 * Provides specific error types for better error handling and debugging
 * @module errors
 */

/**
 * Error codes for programmatic error handling
 */
export enum ErrorCode {
  // Validation Errors (1xxx)
  INVALID_EMAIL_SYNTAX = "INVALID_EMAIL_SYNTAX",
  INVALID_DOMAIN = "INVALID_DOMAIN",
  DISPOSABLE_DOMAIN = "DISPOSABLE_DOMAIN",
  VALIDATION_FAILED = "VALIDATION_FAILED",

  // Network Errors (2xxx)
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT",
  CONNECTION_REFUSED = "CONNECTION_REFUSED",
  DNS_LOOKUP_FAILED = "DNS_LOOKUP_FAILED",

  // API Errors (3xxx)
  API_ERROR = "API_ERROR",
  API_KEY_MISSING = "API_KEY_MISSING",
  API_KEY_INVALID = "API_KEY_INVALID",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  QUOTA_EXCEEDED = "QUOTA_EXCEEDED",
  API_UNAVAILABLE = "API_UNAVAILABLE",

  // Configuration Errors (4xxx)
  INVALID_CONFIGURATION = "INVALID_CONFIGURATION",
  MISSING_REQUIRED_OPTION = "MISSING_REQUIRED_OPTION",

  // Unknown Errors
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Base error class for all Happy Mail errors
 *
 * @example
 * ```typescript
 * try {
 *   await client.validateEmail('user@example.com');
 * } catch (error) {
 *   if (error instanceof HappyMailError) {
 *     console.log(`Error code: ${error.code}`);
 *     console.log(`Recoverable: ${error.isRecoverable}`);
 *   }
 * }
 * ```
 */
export class HappyMailError extends Error {
  /**
   * Error code for programmatic handling
   */
  public readonly code: ErrorCode;

  /**
   * Whether this error is potentially recoverable (e.g., retry might succeed)
   */
  public readonly isRecoverable: boolean;

  /**
   * Original error that caused this error, if any
   */
  public readonly cause?: Error;

  /**
   * Timestamp when the error occurred
   */
  public readonly timestamp: Date;

  /**
   * Additional context or metadata about the error
   */
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    options?: {
      isRecoverable?: boolean;
      cause?: Error;
      context?: Record<string, unknown>;
    }
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.isRecoverable = options?.isRecoverable ?? false;
    this.cause = options?.cause;
    this.timestamp = new Date();
    this.context = options?.context;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Get a JSON representation of the error
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      isRecoverable: this.isRecoverable,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Error thrown when email validation fails
 *
 * @example
 * ```typescript
 * try {
 *   await client.validateEmail('invalid');
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     console.log('Validation failed:', error.message);
 *     console.log('Reason:', error.code);
 *   }
 * }
 * ```
 */
export class ValidationError extends HappyMailError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.VALIDATION_FAILED,
    options?: {
      cause?: Error;
      context?: Record<string, unknown>;
    }
  ) {
    super(message, code, {
      ...options,
      isRecoverable: false, // Validation errors are not recoverable
    });
  }
}

/**
 * Error thrown when network operations fail
 *
 * Network errors are typically recoverable and can be retried.
 *
 * @example
 * ```typescript
 * try {
 *   await client.validateEmail('user@example.com');
 * } catch (error) {
 *   if (error instanceof NetworkError && error.isRecoverable) {
 *     // Retry the operation
 *     await retryWithBackoff(() => client.validateEmail('user@example.com'));
 *   }
 * }
 * ```
 */
export class NetworkError extends HappyMailError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.NETWORK_ERROR,
    options?: {
      cause?: Error;
      context?: Record<string, unknown>;
    }
  ) {
    super(message, code, {
      ...options,
      isRecoverable: true, // Network errors can often be retried
    });
  }
}

/**
 * Error thrown when API operations fail
 *
 * Some API errors are recoverable (rate limits), others are not (invalid API key).
 *
 * @example
 * ```typescript
 * try {
 *   await client.validateEmail('user@example.com');
 * } catch (error) {
 *   if (error instanceof APIError) {
 *     if (error.code === ErrorCode.RATE_LIMIT_EXCEEDED) {
 *       // Wait and retry
 *       await sleep(error.context?.retryAfter || 1000);
 *       await client.validateEmail('user@example.com');
 *     } else if (error.code === ErrorCode.API_KEY_INVALID) {
 *       // Cannot recover - need valid API key
 *       console.error('Invalid API key');
 *     }
 *   }
 * }
 * ```
 */
export class APIError extends HappyMailError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.API_ERROR,
    options?: {
      cause?: Error;
      context?: Record<string, unknown>;
      isRecoverable?: boolean;
    }
  ) {
    const isRecoverable =
      options?.isRecoverable ??
      // Rate limits and unavailable API are recoverable
      (code === ErrorCode.RATE_LIMIT_EXCEEDED ||
      code === ErrorCode.API_UNAVAILABLE);

    super(message, code, {
      ...options,
      isRecoverable,
    });
  }
}

/**
 * Error thrown when configuration is invalid
 *
 * @example
 * ```typescript
 * try {
 *   new HappyEmailClient({ entropyThreshold: -1 }); // Invalid value
 * } catch (error) {
 *   if (error instanceof ConfigurationError) {
 *     console.log('Invalid configuration:', error.message);
 *   }
 * }
 * ```
 */
export class ConfigurationError extends HappyMailError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INVALID_CONFIGURATION,
    options?: {
      cause?: Error;
      context?: Record<string, unknown>;
    }
  ) {
    super(message, code, {
      ...options,
      isRecoverable: false, // Configuration errors cannot be retried
    });
  }
}

/**
 * Retry strategy configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts?: number;
  /** Initial delay in milliseconds */
  initialDelay?: number;
  /** Maximum delay in milliseconds */
  maxDelay?: number;
  /** Backoff multiplier for exponential backoff */
  backoffMultiplier?: number;
  /** Whether to add jitter to prevent thundering herd */
  jitter?: boolean;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitter: true,
};

/**
 * Retry a function with exponential backoff
 *
 * @param fn - The async function to retry
 * @param config - Retry configuration
 * @returns The result of the function
 * @throws The last error if all retries fail
 *
 * @example
 * ```typescript
 * import { retryWithBackoff } from '@launchfirstagency/happy-mail';
 *
 * const result = await retryWithBackoff(
 *   async () => {
 *     return await client.validateEmail('user@example.com');
 *   },
 *   {
 *     maxAttempts: 3,
 *     initialDelay: 1000,
 *     backoffMultiplier: 2,
 *   }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxAttempts,
    initialDelay,
    maxDelay,
    backoffMultiplier,
    jitter,
  } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: Error | undefined;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if error is not recoverable
      if (error instanceof HappyMailError && !error.isRecoverable) {
        throw error;
      }

      // Don't delay on last attempt
      if (attempt === maxAttempts) {
        break;
      }

      // Calculate delay with exponential backoff
      let currentDelay = Math.min(delay, maxDelay);

      // Add jitter if enabled (±25% randomization)
      if (jitter) {
        const jitterAmount = currentDelay * 0.25;
        currentDelay += Math.random() * jitterAmount * 2 - jitterAmount;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, currentDelay));

      // Increase delay for next attempt
      delay *= backoffMultiplier;
    }
  }

  throw lastError;
}

/**
 * Check if an error is a Happy Mail error
 */
export function isHappyMailError(error: unknown): error is HappyMailError {
  return error instanceof HappyMailError;
}

/**
 * Check if an error is recoverable
 */
export function isRecoverableError(error: unknown): boolean {
  return error instanceof HappyMailError && error.isRecoverable;
}
