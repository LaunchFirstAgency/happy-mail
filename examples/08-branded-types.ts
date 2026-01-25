/**
 * Example: Type-Safe Email Handling with Branded Types
 *
 * This example demonstrates how to use branded types for compile-time
 * email validation and type safety.
 */

import {
  HappyEmailClient,
  type ValidatedEmail,
  type SafeEmail,
  type NormalizedEmail,
  isValidatedEmail,
  isSafeEmail,
  isNormalizedEmail,
  assertValidatedEmail,
  assertSafeEmail,
  assertNormalizedEmail,
  isValid,
  isSafeToSend,
  normalizeEmailAddress,
} from '../src/index';

// ============================================================================
// Type-Safe Functions
// ============================================================================

/**
 * Function that only accepts validated emails
 */
function sendTransactionalEmail(email: ValidatedEmail, subject: string, body: string) {
  console.log(`📧 Sending transactional email to: ${email}`);
  console.log(`   Subject: ${subject}`);
  console.log(`   ✅ Type guarantees this email has been validated`);
}

/**
 * Function that only accepts safe emails (stricter)
 */
function sendMarketingEmail(email: SafeEmail, campaign: string) {
  console.log(`💌 Sending marketing email to: ${email}`);
  console.log(`   Campaign: ${campaign}`);
  console.log(`   ✅ Type guarantees this email is safe to send to`);
}

/**
 * Function for duplicate detection
 */
function checkDuplicate(email: NormalizedEmail): boolean {
  console.log(`🔍 Checking for duplicate: ${email}`);
  console.log(`   ✅ Type guarantees this email is normalized`);

  // Simulate database check
  const existingEmails: NormalizedEmail[] = [
    'user@example.com' as NormalizedEmail,
    'admin@example.com' as NormalizedEmail,
  ];

  return existingEmails.includes(email);
}

async function main() {
  const client = new HappyEmailClient({ preset: 'production' });

  console.log('='.repeat(60));
  console.log('Branded Types Example');
  console.log('='.repeat(60));

  // ============================================================================
  // 1. ValidatedEmail - Basic Validation
  // ============================================================================
  console.log('\n1. ValidatedEmail - Basic Validation');
  console.log('-'.repeat(60));

  const email1 = 'user@example.com';
  console.log(`Validating: ${email1}`);

  const result1 = await client.validateEmail(email1);

  if (isValid(result1)) {
    // Type assertion after validation
    const validatedEmail = result1.email as ValidatedEmail;

    console.log('✅ Email passed validation');
    sendTransactionalEmail(validatedEmail, 'Welcome!', 'Thanks for signing up');
  } else {
    console.log('❌ Email failed validation');
  }

  // ============================================================================
  // 2. SafeEmail - Stricter Validation
  // ============================================================================
  console.log('\n2. SafeEmail - Stricter Validation');
  console.log('-'.repeat(60));

  const email2 = 'customer@example.com';
  console.log(`Validating: ${email2}`);

  const result2 = await client.fullCheck(email2);

  if (isSafeToSend(result2)) {
    // Type assertion for safe emails
    const safeEmail = result2.email as SafeEmail;

    console.log('✅ Email is safe to send to');
    sendMarketingEmail(safeEmail, 'Summer Sale 2025');
  } else {
    console.log('⚠️  Email is not safe for marketing');
  }

  // ============================================================================
  // 3. NormalizedEmail - Duplicate Detection
  // ============================================================================
  console.log('\n3. NormalizedEmail - Duplicate Detection');
  console.log('-'.repeat(60));

  const email3 = 'User@Example.com';
  console.log(`Checking: ${email3}`);

  const result3 = await client.validateAndNormalize(email3);

  if (result3.isValid && result3.normalized) {
    const normalizedEmail = result3.normalized as NormalizedEmail;

    console.log(`Original: ${result3.original}`);
    console.log(`Normalized: ${result3.normalized}`);

    const isDuplicate = checkDuplicate(normalizedEmail);
    console.log(`Is duplicate: ${isDuplicate ? 'Yes' : 'No'}`);
  }

  // ============================================================================
  // 4. Type Guards
  // ============================================================================
  console.log('\n4. Type Guards (Runtime Checks)');
  console.log('-'.repeat(60));

  const testEmail = 'test@example.com';

  // Type guards return boolean and narrow the type
  if (isValidatedEmail(testEmail)) {
    console.log(`✅ ${testEmail} is a ValidatedEmail`);
  } else {
    console.log(`❌ ${testEmail} is not validated (string is not branded)`);
  }

  // After validation, we can brand it
  const validatedResult = await client.validateEmail(testEmail);
  if (isValid(validatedResult)) {
    const branded = validatedResult.email as ValidatedEmail;

    if (isValidatedEmail(branded)) {
      console.log(`✅ Branded email passes type guard`);
    }
  }

  // ============================================================================
  // 5. Type Assertions
  // ============================================================================
  console.log('\n5. Type Assertions');
  console.log('-'.repeat(60));

  const email4 = 'assert@example.com';
  console.log(`Testing: ${email4}\n`);

  try {
    // Assertions throw if validation fails
    assertValidatedEmail(email4);
    console.log("❌ This won't print (assertion should throw for unbranded string)");
  } catch (error) {
    console.log('✅ Assertion correctly threw for unbranded string');
  }

  // After validation, assertion succeeds
  const validResult = await client.validateEmail(email4);
  if (isValid(validResult)) {
    const brandedEmail = validResult.email as ValidatedEmail;

    try {
      assertValidatedEmail(brandedEmail);
      console.log('✅ Assertion passed for branded email');

      // Now TypeScript knows this is validated
      sendTransactionalEmail(brandedEmail, 'Test', 'Body');
    } catch (error) {
      console.log('❌ Unexpected error');
    }
  }

  // ============================================================================
  // 6. Type Hierarchy
  // ============================================================================
  console.log('\n6. Type Hierarchy');
  console.log('-'.repeat(60));

  console.log('\nType relationships:');
  console.log('  SafeEmail extends ValidatedEmail');
  console.log('  ValidatedEmail extends string');
  console.log('  NormalizedEmail extends string\n');

  const email5 = 'hierarchy@example.com';
  const result5 = await client.fullCheck(email5);

  if (isSafeToSend(result5)) {
    const safeEmail = result5.email as SafeEmail;

    // SafeEmail can be used where ValidatedEmail is expected
    console.log('✅ SafeEmail works as ValidatedEmail:');
    sendTransactionalEmail(safeEmail, 'Test', 'Body');

    // SafeEmail also works for marketing
    console.log('\n✅ SafeEmail works for marketing:');
    sendMarketingEmail(safeEmail, 'Campaign');
  }

  // ============================================================================
  // 7. Practical Workflow
  // ============================================================================
  console.log('\n7. Practical Workflow');
  console.log('-'.repeat(60));

  console.log('\nSignup flow with type safety:\n');

  async function signupUser(email: string, password: string) {
    // Step 1: Validate
    const validation = await client.validateEmail(email);

    if (!isValid(validation)) {
      throw new Error('Invalid email');
    }

    const validatedEmail = validation.email as ValidatedEmail;

    // Step 2: Check for duplicates
    const normalized = normalizeEmailAddress(email, validation.provider);
    const normalizedEmail = normalized as NormalizedEmail;

    if (checkDuplicate(normalizedEmail)) {
      throw new Error('Email already registered');
    }

    // Step 3: Create account
    console.log('  → Creating account...');
    // await database.createUser({ email: normalizedEmail, password });

    // Step 4: Send welcome email
    console.log('  → Sending welcome email...');
    sendTransactionalEmail(validatedEmail, 'Welcome!', 'Thanks for joining!');

    console.log('  ✅ User signed up successfully!');
  }

  try {
    await signupUser('newuser@example.com', 'password123');
  } catch (error) {
    if (error instanceof Error) {
      console.log(`  ❌ Signup failed: ${error.message}`);
    }
  }

  // ============================================================================
  // 8. Benefits of Branded Types
  // ============================================================================
  console.log('\n8. Benefits of Branded Types');
  console.log('-'.repeat(60));

  console.log('\n✅ Compile-Time Safety:');
  console.log('  - TypeScript prevents passing unvalidated emails');
  console.log('  - Catches errors before runtime');
  console.log('  - Better IDE autocomplete and type checking');

  console.log('\n✅ Self-Documenting Code:');
  console.log('  - Function signatures show validation requirements');
  console.log('  - Clear intent: ValidatedEmail vs SafeEmail vs NormalizedEmail');
  console.log('  - Easier to understand and maintain');

  console.log('\n✅ Runtime Safety:');
  console.log('  - Type guards provide runtime checks');
  console.log('  - Assertions throw on invalid data');
  console.log('  - Combine with compile-time safety');

  console.log('\n💡 Best Practices:');
  console.log('  1. Validate at system boundaries (user input, APIs)');
  console.log('  2. Use branded types throughout your codebase');
  console.log('  3. Type guards for runtime validation');
  console.log('  4. Assertions for debugging');
  console.log('  5. Choose right type: Validated vs Safe vs Normalized');

  console.log('\n' + '='.repeat(60));
}

// Run the example
main().catch(console.error);
