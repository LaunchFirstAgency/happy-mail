/**
 * Example: Utility Functions
 *
 * This example shows how to use the utility functions for:
 * - Email validation
 * - Email normalization
 * - Domain parsing
 * - Entropy calculation
 */
import { isValidEmail, normalizeEmailAddress, splitEmailDomain, calculateStringEntropy, Logger } from "../src/util";
import { MXHostType } from "../src/types";

// Enable logging for this example
Logger.setEnabled(true);

// Example email addresses
const emails = [
  "user@gmail.com",
  "John.Doe+newsletter@Gmail.com",
  "contact@example.com",
  "invalid-email",
  "user@sub.domain.co.uk",
];

function demoUtilities() {
  console.log("Email Validation and Utility Functions Demo\n");

  for (const email of emails) {
    console.log(`\nProcessing email: ${email}`);

    // Check if email is syntactically valid
    const isValid = isValidEmail(email);
    console.log(`- Valid syntax: ${isValid}`);

    if (isValid) {
      // Parse domain parts
      const domainParts = splitEmailDomain(email);
      if (domainParts) {
        console.log("- Domain parts:");
        console.log(`  - Domain: ${domainParts.domain}`);
        console.log(`  - TLD: ${domainParts.tld}`);
        console.log(`  - Subdomain: ${domainParts.sub || "none"}`);
      }

      // Normalize the email (assume Gmail for this example)
      const normalizedForGmail = normalizeEmailAddress(email, MXHostType.GOOGLE);
      console.log(`- Normalized for Gmail: ${normalizedForGmail}`);

      // Normalize the email (assume Outlook for this example)
      const normalizedForOutlook = normalizeEmailAddress(email, MXHostType.OUTLOOK);
      console.log(`- Normalized for Outlook: ${normalizedForOutlook}`);

      // Calculate entropy for the local part (username)
      const localPart = email.split("@")[0];
      const entropy = calculateStringEntropy(localPart);
      console.log(`- Username entropy: ${entropy.toFixed(2)} (higher value = more random)`);
    }
  }
}

// Run the demo
demoUtilities();
