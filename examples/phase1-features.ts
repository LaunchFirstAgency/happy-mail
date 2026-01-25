/**
 * Phase 1 Features Demo
 *
 * This example demonstrates the new features added in Phase 1 of the improvement plan:
 * 1. Result interpretation helpers
 * 2. Batch validation operations
 * 3. Unified API with utilities as separate exports
 */

import {
  HappyEmailClient,
  // Result interpretation helpers
  isValid,
  isSafeToSend,
  getRiskLevel,
  getRejectionReasons,
  getRecommendations,
  getScore,
  EmailValidationResult,
  // Utility functions (no longer on the client class)
  isValidEmail,
  normalizeEmailAddress,
  splitEmailDomain,
} from "@launchfirstagency/happy-mail";

async function demonstrateResultHelpers() {
  console.log("\n=== Result Interpretation Helpers Demo ===\n");

  const client = new HappyEmailClient();

  // Validate an email
  const result = await client.validateEmail("test@example.com");

  // Old way (manual checking):
  console.log("Manual checking:");
  if (
    result.risks.validSyntax &&
    result.risks.canReceive === "SAFE" &&
    !result.risks.disposableDomain
  ) {
    console.log("  ✓ Email is valid");
  }

  // New way (helper functions):
  console.log("\nUsing helper functions:");
  console.log("  isValid():", isValid(result));
  console.log("  isSafeToSend():", isSafeToSend(result));
  console.log("  getRiskLevel():", getRiskLevel(result));
  console.log("  getScore():", getScore(result), "/100");
  console.log("  getRejectionReasons():", getRejectionReasons(result));
  console.log("  getRecommendations():", getRecommendations(result));

  // Or use the wrapper class for a fluent API:
  console.log("\nUsing EmailValidationResult wrapper:");
  const enhancedResult = new EmailValidationResult(result);
  console.log("  isValid():", enhancedResult.isValid());
  console.log("  isSafeToSend():", enhancedResult.isSafeToSend());
  console.log("  getRiskLevel():", enhancedResult.getRiskLevel());
  console.log("  getScore():", enhancedResult.getScore(), "/100");
}

async function demonstrateBatchValidation() {
  console.log("\n=== Batch Validation Demo ===\n");

  const client = new HappyEmailClient();

  const emailList = [
    "user1@example.com",
    "user2@gmail.com",
    "user3@disposable.com",
    "invalid-email",
    "user5@company.com",
  ];

  // Basic batch validation
  console.log("Validating", emailList.length, "emails...\n");

  const results = await client.validateBatch(emailList, {
    concurrency: 3, // Process 3 emails at a time
    skipBounceCheck: true, // Skip bounce checks for faster validation
    onProgress: (completed, total) => {
      console.log(`Progress: ${completed}/${total} emails validated`);
    },
    continueOnError: true, // Keep going even if some validations fail
  });

  // Process results
  console.log("\nResults:");
  for (const result of results) {
    if (result.success && result.result) {
      const riskLevel = getRiskLevel(result.result);
      const score = getScore(result.result);
      console.log(
        `  ${result.email}: ${riskLevel} risk (score: ${score}/100)`
      );
    } else {
      console.log(`  ${result.email}: FAILED - ${result.error?.message}`);
    }
  }

  // Get statistics
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  const safeEmails = successful.filter(
    (r) => r.result && isSafeToSend(r.result)
  );

  console.log("\nStatistics:");
  console.log("  Total:", results.length);
  console.log("  Successful:", successful.length);
  console.log("  Failed:", failed.length);
  console.log("  Safe to send:", safeEmails.length);
}

async function demonstrateUtilityFunctions() {
  console.log("\n=== Utility Functions Demo ===\n");

  // These utilities are now separate exports instead of static methods on the client
  const email = "Test.User+tag@gmail.com";

  console.log("Email:", email);
  console.log("  isValidEmail():", isValidEmail(email));
  console.log("  normalizeEmailAddress():", normalizeEmailAddress(email, "GOOGLE"));
  console.log("  splitEmailDomain():", splitEmailDomain(email));
}

async function demonstrateFilteringAndDecisionMaking() {
  console.log("\n=== Filtering & Decision Making Demo ===\n");

  const client = new HappyEmailClient();

  const emails = [
    "good@example.com",
    "disposable@tempmail.com",
    "random123xyz@example.com",
    "business@company.com",
  ];

  console.log("Filtering emails by risk level...\n");

  const results = await client.validateBatch(emails, {
    skipBounceCheck: true,
  });

  // Categorize by risk level
  const lowRisk: string[] = [];
  const mediumRisk: string[] = [];
  const highRisk: string[] = [];

  for (const result of results) {
    if (result.success && result.result) {
      const level = getRiskLevel(result.result);
      switch (level) {
        case "low":
          lowRisk.push(result.email);
          break;
        case "medium":
          mediumRisk.push(result.email);
          break;
        case "high":
          highRisk.push(result.email);
          break;
      }
    }
  }

  console.log("Low risk emails:", lowRisk);
  console.log("Medium risk emails:", mediumRisk);
  console.log("High risk emails:", highRisk);

  // Decision making based on risk
  console.log("\nDecision making:");
  for (const result of results) {
    if (result.success && result.result) {
      console.log(`\n${result.email}:`);
      if (isSafeToSend(result.result)) {
        console.log("  ✓ Send email");
      } else {
        console.log("  ✗ Do not send");
        const reasons = getRejectionReasons(result.result);
        console.log("  Reasons:", reasons.join(", "));
        const recommendations = getRecommendations(result.result);
        recommendations.forEach((rec) => console.log("  -", rec));
      }
    }
  }
}

// Run all demos
async function main() {
  try {
    await demonstrateResultHelpers();
    await demonstrateBatchValidation();
    await demonstrateUtilityFunctions();
    await demonstrateFilteringAndDecisionMaking();
  } catch (error) {
    console.error("Error:", error);
  }
}

// Uncomment to run:
// main();
