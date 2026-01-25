/**
 * Result Interpretation Example
 *
 * This example demonstrates the new Phase 1 result interpretation helpers
 * that make it easy to understand and act on validation results.
 */

import {
  HappyEmailClient,
  isValid,
  isSafeToSend,
  shouldReject,
  getRiskLevel,
  getRejectionReasons,
  getRecommendations,
  getScore,
  EmailValidationResult,
} from '@launchfirstagency/happy-mail';

async function demonstrateResultHelpers() {
  console.log('=== Result Interpretation Helpers ===\n');

  const client = new HappyEmailClient();
  const testEmails = [
    'john.doe@gmail.com',
    'business@company.com',
    'test@tempmail.com', // Likely disposable
    'abc123xyz@example.com', // Likely random
  ];

  for (const email of testEmails) {
    console.log(`\n--- Validating: ${email} ---`);
    const result = await client.validateEmail(email, true);

    // Method 1: Using individual helper functions
    console.log('\nUsing helper functions:');
    console.log(`  isValid(): ${isValid(result)}`);
    console.log(`  isSafeToSend(): ${isSafeToSend(result)}`);
    console.log(`  shouldReject(): ${shouldReject(result)}`);
    console.log(`  getRiskLevel(): ${getRiskLevel(result)}`);
    console.log(`  getScore(): ${getScore(result)}/100`);

    // Show rejection reasons if applicable
    const reasons = getRejectionReasons(result);
    if (reasons.length > 0) {
      console.log(`  Rejection reasons: ${reasons.join(', ')}`);
    }

    // Show recommendations
    const recommendations = getRecommendations(result);
    console.log('\n  Recommendations:');
    recommendations.forEach((rec) => console.log(`    - ${rec}`));

    // Method 2: Using the wrapper class for fluent API
    console.log('\nUsing EmailValidationResult wrapper:');
    const enhanced = new EmailValidationResult(result);
    console.log(`  Risk: ${enhanced.getRiskLevel()}`);
    console.log(`  Score: ${enhanced.getScore()}/100`);
    console.log(`  Safe to send: ${enhanced.isSafeToSend()}`);
  }
}

// Run the example
demonstrateResultHelpers().catch(console.error);
