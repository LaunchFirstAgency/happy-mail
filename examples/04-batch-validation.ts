/**
 * Batch Validation Example
 *
 * This example demonstrates the new Phase 1 batch validation feature
 * which makes it easy to validate multiple emails efficiently.
 */

import {
  HappyEmailClient,
  isSafeToSend,
  getRiskLevel,
  getScore,
} from "@launchfirstagency/happy-mail";

async function demonstrateBatchValidation() {
  console.log("=== Batch Email Validation ===\n");

  const client = new HappyEmailClient();

  // List of emails to validate
  const emails = [
    "user1@gmail.com",
    "user2@example.com",
    "test@disposable.com",
    "invalid-email",
    "abc123xyz@example.com",
    "business@company.com",
    "john.doe@outlook.com",
    "random987xyz@test.com",
  ];

  console.log(`Validating ${emails.length} emails...\n`);

  // Validate all emails with options
  const results = await client.validateBatch(emails, {
    concurrency: 3, // Process 3 emails at a time
    skipBounceCheck: true, // Skip bounce checks for speed
    onProgress: (completed, total) => {
      console.log(`Progress: ${completed}/${total} emails validated`);
    },
    continueOnError: true, // Keep going even if some fail
  });

  console.log("\n=== Validation Results ===\n");

  // Process and categorize results
  const safeEmails: string[] = [];
  const riskyEmails: string[] = [];
  const invalidEmails: string[] = [];

  for (const result of results) {
    if (!result.success) {
      invalidEmails.push(result.email);
      console.log(`❌ ${result.email}: ERROR - ${result.error?.message}`);
      continue;
    }

    if (!result.result) continue;

    const riskLevel = getRiskLevel(result.result);
    const score = getScore(result.result);
    const safe = isSafeToSend(result.result);

    console.log(
      `${safe ? "✅" : "⚠️ "} ${result.email}: ${riskLevel} risk (score: ${score}/100)`
    );

    if (safe) {
      safeEmails.push(result.email);
    } else if (riskLevel === "low" || riskLevel === "medium") {
      riskyEmails.push(result.email);
    } else {
      invalidEmails.push(result.email);
    }
  }

  // Summary statistics
  console.log("\n=== Summary ===");
  console.log(`Total emails: ${emails.length}`);
  console.log(`Safe to send: ${safeEmails.length}`);
  console.log(`Risky: ${riskyEmails.length}`);
  console.log(`Invalid: ${invalidEmails.length}`);

  // Show which emails to use
  console.log("\n=== Safe Emails ===");
  safeEmails.forEach((email) => console.log(`  ✓ ${email}`));

  if (riskyEmails.length > 0) {
    console.log("\n=== Risky Emails (Review Recommended) ===");
    riskyEmails.forEach((email) => console.log(`  ⚠ ${email}`));
  }

  if (invalidEmails.length > 0) {
    console.log("\n=== Invalid Emails (Do Not Use) ===");
    invalidEmails.forEach((email) => console.log(`  ✗ ${email}`));
  }
}

// Run the example
demonstrateBatchValidation().catch(console.error);
