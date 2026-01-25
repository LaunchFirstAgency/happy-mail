/**
 * Example: Error Handling and Retry Strategies
 *
 * This example demonstrates how to handle errors gracefully using
 * custom error classes and retry utilities.
 */

import {
  HappyEmailClient,
  HappyMailError,
  ValidationError,
  NetworkError,
  APIError,
  ConfigurationError,
  ErrorCode,
  retryWithBackoff,
  isHappyMailError,
  isRecoverableError,
} from "../src/index";

async function main() {
  console.log("=".repeat(60));
  console.log("Error Handling Example");
  console.log("=".repeat(60));

  // ============================================================================
  // 1. Custom Error Classes
  // ============================================================================
  console.log("\n1. Custom Error Classes");
  console.log("-".repeat(60));

  const client = new HappyEmailClient({ preset: "production" });

  try {
    // This will succeed
    await client.validateEmail("valid@example.com");
    console.log("✅ Validation successful");
  } catch (error) {
    // Error handling examples
    if (error instanceof ValidationError) {
      console.log("❌ Validation Error:", error.message);
      console.log("   Code:", error.code);
      console.log("   Recoverable:", error.isRecoverable);
    } else if (error instanceof NetworkError) {
      console.log("🌐 Network Error:", error.message);
      console.log("   Code:", error.code);
      console.log("   Recoverable:", error.isRecoverable);
    } else if (error instanceof APIError) {
      console.log("🔌 API Error:", error.message);
      console.log("   Code:", error.code);
      console.log("   Recoverable:", error.isRecoverable);
    } else if (error instanceof ConfigurationError) {
      console.log("⚙️  Configuration Error:", error.message);
      console.log("   Code:", error.code);
      console.log("   Recoverable:", error.isRecoverable);
    }
  }

  // ============================================================================
  // 2. Error Codes
  // ============================================================================
  console.log("\n2. Error Codes for Programmatic Handling");
  console.log("-".repeat(60));

  try {
    // Example: Invalid configuration
    new HappyEmailClient({ entropyThreshold: -1 });
  } catch (error) {
    if (error instanceof ConfigurationError) {
      console.log("Caught configuration error:");
      console.log(`  Message: ${error.message}`);
      console.log(`  Code: ${error.code}`);

      // Handle specific error codes
      if (error.code === ErrorCode.INVALID_CONFIGURATION) {
        console.log("  → Fix: Check configuration values");
      }
    }
  }

  // ============================================================================
  // 3. Error Properties
  // ============================================================================
  console.log("\n3. Error Properties");
  console.log("-".repeat(60));

  try {
    new HappyEmailClient({ minLengthForRandomCheck: -5 });
  } catch (error) {
    if (isHappyMailError(error)) {
      console.log("Happy Mail Error detected:");
      console.log(`  Message: ${error.message}`);
      console.log(`  Code: ${error.code}`);
      console.log(`  Recoverable: ${error.isRecoverable}`);
      console.log(`  Timestamp: ${error.timestamp.toISOString()}`);
      console.log(`  Context:`, error.context);

      // Convert to JSON for logging
      const errorJSON = error.toJSON();
      console.log(`\n  JSON representation:`, JSON.stringify(errorJSON, null, 2));
    }
  }

  // ============================================================================
  // 4. Retry with Exponential Backoff
  // ============================================================================
  console.log("\n4. Retry with Exponential Backoff");
  console.log("-".repeat(60));

  console.log("Retrying validation with backoff strategy...\n");

  try {
    const result = await retryWithBackoff(
      async () => client.validateEmail("user@example.com"),
      {
        maxAttempts: 3,
        initialDelay: 1000, // 1 second
        maxDelay: 10000, // 10 seconds max
        backoffMultiplier: 2, // Double delay each time
        jitter: true, // Add randomness
      }
    );

    console.log("✅ Validation successful after retry");
    console.log(`   Email: ${result.email}`);
  } catch (error) {
    if (error instanceof NetworkError) {
      console.log("❌ Network error persisted after retries");
    }
  }

  // ============================================================================
  // 5. Error Recovery Patterns
  // ============================================================================
  console.log("\n5. Error Recovery Patterns");
  console.log("-".repeat(60));

  async function validateWithRecovery(email: string) {
    try {
      return await client.validateEmail(email);
    } catch (error) {
      if (isRecoverableError(error)) {
        console.log(`⚠️  Recoverable error, retrying: ${error.message}`);

        // Retry with backoff
        return await retryWithBackoff(
          async () => client.validateEmail(email),
          { maxAttempts: 3 }
        );
      } else {
        console.log(`❌ Non-recoverable error: ${error.message}`);
        throw error; // Re-throw non-recoverable errors
      }
    }
  }

  try {
    await validateWithRecovery("test@example.com");
    console.log("✅ Validation completed with recovery");
  } catch (error) {
    console.log("❌ Validation failed even after recovery attempts");
  }

  // ============================================================================
  // 6. Specific Error Handling
  // ============================================================================
  console.log("\n6. Handling Specific Error Codes");
  console.log("-".repeat(60));

  async function smartValidation(email: string) {
    try {
      return await client.validateEmail(email);
    } catch (error) {
      if (error instanceof APIError) {
        // Handle API-specific errors
        switch (error.code) {
          case ErrorCode.RATE_LIMIT_EXCEEDED:
            console.log("⏱️  Rate limited - waiting before retry...");
            await new Promise((resolve) => setTimeout(resolve, 5000));
            return await client.validateEmail(email);

          case ErrorCode.QUOTA_EXCEEDED:
            console.log("📊 Quota exceeded - use fallback method");
            return await client.quickCheck(email); // Fallback to quick check

          case ErrorCode.API_KEY_INVALID:
            console.log("🔑 Invalid API key - check configuration");
            throw error;

          case ErrorCode.API_UNAVAILABLE:
            console.log("🔌 API unavailable - retry with backoff");
            return await retryWithBackoff(
              async () => client.validateEmail(email),
              { maxAttempts: 5 }
            );

          default:
            throw error;
        }
      }

      throw error; // Re-throw if not an APIError
    }
  }

  console.log("Attempting smart validation...");
  try {
    await smartValidation("smart@example.com");
    console.log("✅ Smart validation successful");
  } catch (error) {
    console.log("❌ Smart validation failed");
  }

  // ============================================================================
  // 7. Type Guards for Error Handling
  // ============================================================================
  console.log("\n7. Type Guards for Error Handling");
  console.log("-".repeat(60));

  function handleError(error: unknown) {
    // Check if it's a Happy Mail error
    if (isHappyMailError(error)) {
      console.log(`Happy Mail Error: ${error.code}`);

      // Check if it's recoverable
      if (isRecoverableError(error)) {
        console.log("  → This error can be retried");
      } else {
        console.log("  → This error cannot be recovered");
      }

      // Check specific error types
      if (error instanceof ValidationError) {
        console.log("  → Type: Validation Error");
      } else if (error instanceof NetworkError) {
        console.log("  → Type: Network Error");
      } else if (error instanceof APIError) {
        console.log("  → Type: API Error");
      } else if (error instanceof ConfigurationError) {
        console.log("  → Type: Configuration Error");
      }
    } else {
      console.log("Unknown error:", error);
    }
  }

  // Test error handling
  try {
    new HappyEmailClient({ entropyThreshold: 999 });
  } catch (error) {
    handleError(error);
  }

  // ============================================================================
  // 8. Best Practices
  // ============================================================================
  console.log("\n8. Error Handling Best Practices");
  console.log("-".repeat(60));

  console.log("\n✅ DO:");
  console.log("  - Use custom error classes for type-safe error handling");
  console.log("  - Check error codes for programmatic handling");
  console.log("  - Use retryWithBackoff for recoverable errors");
  console.log("  - Log error context for debugging");
  console.log("  - Provide fallback strategies");

  console.log("\n❌ DON'T:");
  console.log("  - Ignore error types - use instanceof checks");
  console.log("  - Retry non-recoverable errors");
  console.log("  - Catch errors without handling them");
  console.log("  - Expose internal error details to users");

  console.log("\n💡 Error Handling Pattern:");
  console.log("  1. Catch specific error types");
  console.log("  2. Check if error is recoverable");
  console.log("  3. Retry with backoff if recoverable");
  console.log("  4. Log error details for debugging");
  console.log("  5. Provide user-friendly error messages");

  console.log("\n" + "=".repeat(60));
}

// Run the example
main().catch((error) => {
  console.error("Unhandled error in example:", error);
  process.exit(1);
});
