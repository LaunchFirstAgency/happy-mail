/**
 * Quick Start Example
 *
 * This example demonstrates the simplest way to get started with Happy Mail.
 * It shows basic email validation using the HappyEmailClient.
 */

import { HappyEmailClient, isValid, getRiskLevel } from '@launchfirstagency/happy-mail';

async function quickStart() {
  console.log('=== Quick Start: Email Validation ===\n');

  // Create a client (no configuration needed for basic validation)
  const client = new HappyEmailClient();

  // Validate a single email
  const email = 'user@example.com';
  console.log(`Validating: ${email}`);

  const result = await client.validateEmail(email, true); // Skip bounce check for speed

  // Use helper functions for easy interpretation
  console.log(`Valid: ${isValid(result)}`);
  console.log(`Risk Level: ${getRiskLevel(result)}`);
  console.log(`Provider: ${result.provider}`);
  console.log(`Type: ${result.type}`);
  console.log('\nRisks:');
  console.log(`  - Valid Syntax: ${result.risks.validSyntax}`);
  console.log(`  - Disposable: ${result.risks.disposableDomain}`);
  console.log(`  - Random: ${result.risks.likelyRandomlyGenerated}`);
  console.log(`  - Can Receive: ${result.risks.canReceive}`);
}

// Run the example
quickStart().catch(console.error);
