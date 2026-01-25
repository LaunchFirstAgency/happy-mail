/**
 * Utility Functions Example
 *
 * This example demonstrates the utility functions available in Happy Mail,
 * now properly exported as top-level functions (not static methods).
 */

import {
  isValidEmail,
  normalizeEmailAddress,
  splitEmailDomain,
  calculateStringEntropy,
  checkSpamList,
} from "@launchfirstagency/happy-mail";

function demonstrateEmailValidation() {
  console.log("\n=== Email Syntax Validation ===\n");

  const testEmails = [
    "user@example.com",
    "John.Doe+newsletter@Gmail.com",
    "invalid-email",
    "test@sub.domain.co.uk",
    "missing@",
    "@missinglocal.com",
  ];

  testEmails.forEach((email) => {
    const valid = isValidEmail(email);
    console.log(`${valid ? "✅" : "❌"} ${email}`);
  });
}

function demonstrateEmailNormalization() {
  console.log("\n\n=== Email Normalization ===\n");

  const testCases = [
    { email: "John.Doe+newsletter@Gmail.com", provider: "GOOGLE" as const },
    { email: "User+Tag@Outlook.com", provider: "OUTLOOK" as const },
    { email: "Test.User@Example.com", provider: "OTHER" as const },
  ];

  testCases.forEach(({ email, provider }) => {
    const normalized = normalizeEmailAddress(email, provider);
    console.log(`Original:   ${email}`);
    console.log(`Normalized: ${normalized}`);
    console.log(`Provider:   ${provider}\n`);
  });

  console.log("💡 Tip: Normalization helps detect duplicate accounts");
  console.log("   Gmail ignores dots and + tags, so these are the same:");
  console.log("   - john.doe@gmail.com");
  console.log("   - johndoe@gmail.com");
  console.log("   - john.doe+spam@gmail.com");
}

function demonstrateDomainParsing() {
  console.log("\n\n=== Domain Parsing ===\n");

  const testEmails = [
    "user@gmail.com",
    "admin@mail.example.com",
    "contact@example.co.uk",
    "test@sub.domain.example.com",
  ];

  testEmails.forEach((email) => {
    const parts = splitEmailDomain(email);
    if (parts) {
      console.log(`Email: ${email}`);
      console.log(`  Domain: ${parts.domain}`);
      console.log(`  TLD: ${parts.tld}`);
      console.log(`  Subdomain: ${parts.sub || "(none)"}\n`);
    } else {
      console.log(`❌ ${email}: Invalid domain\n`);
    }
  });
}

function demonstrateEntropyCalculation() {
  console.log("\n=== String Entropy (Randomness Detection) ===\n");

  const testStrings = [
    "john.doe", // Normal username - low entropy
    "johndoe123", // Normal with numbers - medium entropy
    "abc123xyz", // Random looking - higher entropy
    "j8k3n4m9x2", // Very random - high entropy
    "contact", // Dictionary word - very low entropy
  ];

  console.log("Entropy scores (higher = more random):\n");

  testStrings.forEach((str) => {
    const entropy = calculateStringEntropy(str);
    let assessment = "";

    if (entropy < 3.0) {
      assessment = "Very low (likely legitimate)";
    } else if (entropy < 4.0) {
      assessment = "Low (probably legitimate)";
    } else if (entropy < 4.5) {
      assessment = "Medium (could be random)";
    } else {
      assessment = "High (likely random/fake)";
    }

    console.log(`  ${str.padEnd(20)} ${entropy.toFixed(2)} - ${assessment}`);
  });

  console.log("\n💡 Tip: High entropy usernames are often randomly generated");
  console.log("   and may indicate fake or bot-created accounts.");
}

async function demonstrateSpamCheck() {
  console.log("\n\n=== Spam List Checking ===\n");

  const testEmails = [
    "user@example.com",
    "test@gmail.com",
    "contact@company.com",
  ];

  console.log("Checking if emails are on spam lists...\n");

  for (const email of testEmails) {
    try {
      const isSpam = await checkSpamList(email);
      console.log(`${isSpam ? "⚠️ " : "✅"} ${email}: ${isSpam ? "Found on spam list!" : "Clean"}`);
    } catch (error) {
      console.log(`❌ ${email}: Error checking spam list`);
    }
  }
}

// Practical example: Detecting fake signups
function practicalExample() {
  console.log("\n\n=== Practical Example: Fake Signup Detection ===\n");

  const signups = [
    "john.doe@gmail.com",
    "abc123xyz@tempmail.com",
    "k8j3n4m9x2p@example.com",
  ];

  console.log("Analyzing signup attempts:\n");

  signups.forEach((email) => {
    console.log(`Checking: ${email}`);

    // Check syntax
    if (!isValidEmail(email)) {
      console.log("  ❌ Invalid email syntax - REJECT\n");
      return;
    }

    // Parse domain
    const domain = splitEmailDomain(email);
    if (!domain) {
      console.log("  ❌ Invalid domain - REJECT\n");
      return;
    }

    // Check entropy of local part
    const localPart = email.split("@")[0];
    const entropy = calculateStringEntropy(localPart);

    console.log(`  Domain: ${domain.domain}.${domain.tld}`);
    console.log(`  Username entropy: ${entropy.toFixed(2)}`);

    if (entropy > 4.5) {
      console.log("  ⚠️  High entropy - Likely FAKE - REVIEW REQUIRED\n");
    } else {
      console.log("  ✅ Looks legitimate - ACCEPT\n");
    }
  });
}

// Run all demonstrations
async function runAllExamples() {
  demonstrateEmailValidation();
  demonstrateEmailNormalization();
  demonstrateDomainParsing();
  demonstrateEntropyCalculation();
  await demonstrateSpamCheck();
  practicalExample();
}

// Run the examples
runAllExamples().catch(console.error);
