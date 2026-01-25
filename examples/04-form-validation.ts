/**
 * Form Validation Example
 *
 * This example shows how to use Happy Mail for real-time form validation,
 * providing immediate feedback to users during signup or registration.
 */

import {
  HappyEmailClient,
  isValidEmail,
  isValid,
  getRejectionReasons,
  getRecommendations,
} from "@launchfirstagency/happy-mail";

// Simulated form validation function
async function validateFormEmail(email: string): Promise<{
  valid: boolean;
  message: string;
  suggestions: string[];
}> {
  // Quick syntax check first (no API call needed)
  if (!isValidEmail(email)) {
    return {
      valid: false,
      message: "Please enter a valid email address",
      suggestions: ["Check for typos", "Ensure format is correct (e.g., user@example.com)"],
    };
  }

  // Perform full validation
  const client = new HappyEmailClient();
  const result = await client.validateEmail(email, true); // Skip bounce check for speed

  if (isValid(result)) {
    return {
      valid: true,
      message: "Email looks good!",
      suggestions: [],
    };
  }

  // Get specific reasons and recommendations
  const reasons = getRejectionReasons(result);
  const recommendations = getRecommendations(result);

  // Create user-friendly message
  let message = "This email address cannot be used";
  if (reasons.includes("disposable_domain")) {
    message = "Disposable email addresses are not allowed";
  } else if (reasons.includes("randomly_generated")) {
    message = "This email address appears to be invalid";
  } else if (reasons.includes("invalid_syntax")) {
    message = "Please check your email address for typos";
  }

  return {
    valid: false,
    message,
    suggestions: recommendations,
  };
}

// Simulate form submissions
async function simulateFormValidation() {
  console.log("=== Form Validation Simulation ===\n");

  const formSubmissions = [
    "john.doe@gmail.com", // Valid
    "invalid-email", // Invalid syntax
    "test@tempmail.com", // Disposable
    "abc123xyz@example.com", // Random
    "business@company.com", // Valid
  ];

  for (const email of formSubmissions) {
    console.log(`\n--- User submits: ${email} ---`);

    const validation = await validateFormEmail(email);

    if (validation.valid) {
      console.log(`✅ ${validation.message}`);
      console.log("   → Proceed with registration");
    } else {
      console.log(`❌ ${validation.message}`);
      if (validation.suggestions.length > 0) {
        console.log("   Suggestions:");
        validation.suggestions.forEach((s) => console.log(`     • ${s}`));
      }
      console.log("   → Show error to user and prevent submission");
    }
  }
}

// Example of integration with a web framework
function exampleExpressMiddleware() {
  console.log("\n\n=== Example Express.js Integration ===\n");
  console.log(`
// Example Express.js route handler
app.post('/signup', async (req, res) => {
  const { email } = req.body;

  const validation = await validateFormEmail(email);

  if (!validation.valid) {
    return res.status(400).json({
      error: validation.message,
      suggestions: validation.suggestions
    });
  }

  // Proceed with user registration
  // ...
});
`);
}

// Run the example
simulateFormValidation()
  .then(() => exampleExpressMiddleware())
  .catch(console.error);
