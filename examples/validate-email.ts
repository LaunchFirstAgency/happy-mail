/**
 * Example: Basic Email Validation
 *
 * This example shows how to use the EmailValidationService to:
 * - Validate email syntax
 * - Check for disposable domains
 * - Detect random/generated email addresses
 * - Check if an email can receive mail
 */
import { EmailValidationService } from "../src";
import { Logger } from "../src/util";

// Enable logging for this example
Logger.setEnabled(true);

// Example emails to validate
const emails = [
  "user@gmail.com", // Valid personal email
  "contact@example.com", // Valid business email
  "invalid-email", // Invalid email format
  "user@disposable.com", // Disposable domain (example)
  "a8fg34jh@example.com", // Likely random email
  "user+tag@gmail.com", // Email with tags
];

async function validateEmails() {
  const validationService = new EmailValidationService();

  console.log("Validating multiple email addresses:\n");

  for (const email of emails) {
    console.log(`\nValidating: ${email}`);
    try {
      // Skip bounce check for this example to avoid external API calls
      const result = await validationService.validate(email, true);

      console.log("Result:");
      console.log(`  - Email: ${result.email}`);
      console.log(`  - Normalized: ${result.normalizedEmail || "N/A"}`);
      console.log(`  - Provider: ${result.provider}`);
      console.log(`  - Type: ${result.type}`);
      console.log("  - Risks:");
      console.log(`    - Valid Syntax: ${result.risks.validSyntax}`);
      console.log(`    - Disposable Domain: ${result.risks.disposableDomain}`);
      console.log(`    - Random/Generated: ${result.risks.likelyRandomlyGenerated}`);
      console.log(`    - Can Receive: ${result.risks.canReceive}`);
    } catch (error) {
      console.error(`Error validating ${email}:`, error.message);
    }
  }
}

// Run the example
validateEmails()
  .then(() => console.log("\nValidation complete!"))
  .catch((err) => console.error("Error running example:", err));
