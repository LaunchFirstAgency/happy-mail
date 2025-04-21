import { HappyEmailClient } from "./src/index";

async function validateEmailExample() {
  // Create a client with default options
  const client = new HappyEmailClient();

  // Basic validation without NeverBounce API
  console.log("\n--- Basic Email Validation ---");
  const basicValidation = await client.validateEmail("user@example.com");
  console.log(JSON.stringify(basicValidation, null, 2));

  // Create a client with NeverBounce API key (if available)
  if (process.env.NEVER_BOUNCE_API_KEY) {
    console.log("\n--- Enhanced Email Validation with NeverBounce ---");
    const enhancedClient = new HappyEmailClient({
      neverBounceApiKey: process.env.NEVER_BOUNCE_API_KEY,
    });
    const enhancedValidation = await enhancedClient.validateEmail("user@example.com");
    console.log(JSON.stringify(enhancedValidation, null, 2));
  }

  // Skip bounce check example
  console.log("\n--- Validation with Skip Bounce Check ---");
  const skipBounceValidation = await client.validateEmail("user@example.com", true);
  console.log(JSON.stringify(skipBounceValidation, null, 2));
}

async function inboxHealthExample() {
  const client = new HappyEmailClient();
  const email = "user@example.com";

  console.log("\n--- Inbox Health Checks ---");

  console.log("\nMX Records:");
  const mx = await client.checkMX(email);
  console.log(JSON.stringify(mx, null, 2));

  console.log("\nSPF Records:");
  const spf = await client.checkSPF(email);
  console.log(JSON.stringify(spf, null, 2));

  console.log("\nDMARC Records:");
  const dmarc = await client.checkDMARC(email);
  console.log(JSON.stringify(dmarc, null, 2));

  console.log("\nDKIM Records:");
  const dkim = await client.checkDKIM(email);
  console.log(JSON.stringify(dkim, null, 2));

  console.log("\nSSL Certificate:");
  const ssl = await client.checkSSL(email);
  console.log(JSON.stringify(ssl, null, 2));

  console.log("\nDomain Age:");
  const domainAge = await client.getDomainAge(email);
  console.log(JSON.stringify(domainAge, null, 2));
}

// Run examples
async function runExamples() {
  try {
    await validateEmailExample();
    await inboxHealthExample();
  } catch (error) {
    console.error("Error running examples:", error);
  }
}

runExamples();
