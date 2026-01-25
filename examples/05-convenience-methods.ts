/**
 * Example: Convenience Methods
 *
 * This example demonstrates the convenience methods that simplify
 * common validation workflows.
 */

import { HappyEmailClient, isSafeToSend, isValid } from '../src/index';

async function main() {
  const client = new HappyEmailClient({ preset: 'production' });

  console.log('='.repeat(60));
  console.log('Convenience Methods Example');
  console.log('='.repeat(60));

  // ============================================================================
  // 1. quickCheck() - Fast Validation
  // ============================================================================
  console.log('\n1. quickCheck() - Fast Validation');
  console.log('-'.repeat(60));
  console.log('Use for: Real-time form validation, quick checks');
  console.log('Features: Skips bounce check for speed\n');

  const email1 = 'user@example.com';
  console.log(`Validating: ${email1}`);

  const quickResult = await client.quickCheck(email1);

  console.log('\nResult:');
  console.log(`  Valid syntax: ${quickResult.risks.validSyntax ? '✅' : '❌'}`);
  console.log(`  Disposable: ${quickResult.risks.disposableDomain ? '⚠️  Yes' : '✅ No'}`);
  console.log(`  Random: ${quickResult.risks.likelyRandomlyGenerated ? '⚠️  Yes' : '✅ No'}`);
  console.log(`  Provider: ${quickResult.provider}`);

  // Example: Form validation
  if (!quickResult.risks.validSyntax) {
    console.log('\n❌ Form validation: Invalid email format');
  } else if (quickResult.risks.disposableDomain) {
    console.log('\n⚠️  Form validation: Disposable emails not allowed');
  } else {
    console.log('\n✅ Form validation: Email accepted');
  }

  // ============================================================================
  // 2. fullCheck() - Comprehensive Validation
  // ============================================================================
  console.log('\n2. fullCheck() - Comprehensive Validation');
  console.log('-'.repeat(60));
  console.log('Use for: High-value signups, critical emails');
  console.log('Features: All checks including bounce verification\n');

  const email2 = 'important@example.com';
  console.log(`Validating: ${email2}`);

  const fullResult = await client.fullCheck(email2);

  console.log('\nResult:');
  console.log(`  Valid syntax: ${fullResult.risks.validSyntax ? '✅' : '❌'}`);
  console.log(`  Can receive: ${fullResult.risks.canReceive}`);
  console.log(`  Disposable: ${fullResult.risks.disposableDomain ? '⚠️  Yes' : '✅ No'}`);
  console.log(`  Email type: ${fullResult.type}`);

  if (isSafeToSend(fullResult)) {
    console.log('\n✅ Email is safe for high-value operations');
  } else {
    console.log('\n❌ Email should not be used for critical operations');
  }

  // ============================================================================
  // 3. validateAndNormalize() - Validation + Normalization
  // ============================================================================
  console.log('\n3. validateAndNormalize() - Validation + Normalization');
  console.log('-'.repeat(60));
  console.log('Use for: Duplicate detection, database storage');
  console.log('Features: Returns normalized email for comparison\n');

  const email3 = 'John.Doe+tag@Gmail.com';
  console.log(`Validating: ${email3}`);

  const normalizedResult = await client.validateAndNormalize(email3);

  console.log('\nResult:');
  console.log(`  Is valid: ${normalizedResult.isValid ? '✅' : '❌'}`);
  console.log(`  Original: ${normalizedResult.original}`);
  console.log(`  Normalized: ${normalizedResult.normalized}`);

  if (normalizedResult.isValid && normalizedResult.normalized) {
    console.log('\n💡 Use normalized email to check for duplicates:');
    console.log(`   await database.findByEmail('${normalizedResult.normalized}')`);
  }

  // Example: Preventing duplicate signups
  console.log('\n📝 Duplicate prevention example:');
  const testEmails = [
    'user@gmail.com',
    'User@Gmail.com',
    'u.s.e.r@gmail.com',
    'user+tag@gmail.com',
  ];

  console.log('\nOriginal emails:');
  for (const email of testEmails) {
    const result = await client.validateAndNormalize(email);
    console.log(`  ${email.padEnd(25)} → ${result.normalized}`);
  }
  console.log('\n💡 All normalize to the same email: same user!');

  // ============================================================================
  // 4. getDomainInfo() - Aggregate Domain Health
  // ============================================================================
  console.log('\n4. getDomainInfo() - Aggregate Domain Health');
  console.log('-'.repeat(60));
  console.log('Use for: Domain reputation checking, email infrastructure audit');
  console.log('Features: Runs all domain checks in parallel\n');

  const email4 = 'admin@example.com';
  console.log(`Checking domain for: ${email4}`);

  const domainInfo = await client.getDomainInfo(email4);

  console.log('\nDomain Health Report:');
  console.log(`  Domain: ${domainInfo.domain}`);
  console.log(`  Health Score: ${domainInfo.healthScore}/100`);
  console.log(`  Assessment: ${domainInfo.assessment.toUpperCase()}`);
  console.log('\nInfrastructure:');
  console.log(`  MX Records: ${domainInfo.hasMX ? '✅' : '❌'}`);
  console.log(`  MX Provider: ${domainInfo.mxProvider || 'Unknown'}`);
  console.log(`  SPF Record: ${domainInfo.hasSPF ? '✅' : '❌'}`);
  console.log(`  DMARC Record: ${domainInfo.hasDMARC ? '✅' : '❌'}`);
  console.log(`  SSL Certificate: ${domainInfo.hasSSL ? '✅' : '❌'}`);
  console.log(`  Domain Age: ${domainInfo.domainAge || 'Unknown'} years`);

  // Decision making based on domain health
  if (domainInfo.healthScore >= 75) {
    console.log('\n✅ Domain is well-configured for email');
  } else if (domainInfo.healthScore >= 50) {
    console.log('\n⚠️  Domain has some configuration issues');
  } else {
    console.log('\n❌ Domain may have serious deliverability issues');
  }

  // ============================================================================
  // 5. Workflow Combinations
  // ============================================================================
  console.log('\n5. Workflow Combinations');
  console.log('-'.repeat(60));

  console.log('\n📧 Signup Flow Workflow:');
  console.log('   1. quickCheck() → Validate format in real-time');
  console.log('   2. validateAndNormalize() → Check for duplicates');
  console.log('   3. fullCheck() → Verify deliverability before creating account');

  console.log('\n💌 Marketing Campaign Workflow:');
  console.log('   1. validateBatch() → Validate entire list');
  console.log('   2. fullCheck() → Double-check high-value contacts');
  console.log('   3. getDomainInfo() → Check domain reputation');

  console.log('\n🔧 Domain Audit Workflow:');
  console.log('   1. getDomainInfo() → Get comprehensive domain health');
  console.log('   2. checkMX(), checkSPF(), checkDMARC() → Individual checks');
  console.log('   3. Make recommendations based on missing records');

  // ============================================================================
  // 6. Performance Comparison
  // ============================================================================
  console.log('\n6. Performance Comparison');
  console.log('-'.repeat(60));

  const testEmail = 'perf.test@example.com';

  console.log('\nValidating:', testEmail);

  // Quick check (fast)
  const start1 = Date.now();
  await client.quickCheck(testEmail);
  const time1 = Date.now() - start1;
  console.log(`  quickCheck(): ${time1}ms ⚡ (fastest)`);

  // Validate and normalize
  const start2 = Date.now();
  await client.validateAndNormalize(testEmail);
  const time2 = Date.now() - start2;
  console.log(`  validateAndNormalize(): ${time2}ms`);

  // Full check (comprehensive)
  const start3 = Date.now();
  await client.fullCheck(testEmail);
  const time3 = Date.now() - start3;
  console.log(`  fullCheck(): ${time3}ms (most thorough)`);

  console.log('\n💡 Choose based on your needs:');
  console.log('   - Speed → quickCheck()');
  console.log('   - Accuracy → fullCheck()');
  console.log('   - Duplicate detection → validateAndNormalize()');
  console.log('   - Infrastructure → getDomainInfo()');

  console.log('\n' + '='.repeat(60));
}

// Run the example
main().catch(console.error);
