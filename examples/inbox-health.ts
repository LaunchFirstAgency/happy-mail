/**
 * Example: Check Email Inbox Health
 *
 * This example shows how to use the InboxHealthService to:
 * - Check for SPF records
 * - Check for DMARC records
 * - Check for DKIM records
 * - Check SSL certificate
 * - Get domain age information
 */
import { InboxHealthService } from "../src";
import { Logger } from "../src/util";

// Enable logging for this example
Logger.setEnabled(true);

async function checkInboxHealth(email: string) {
  console.log(`Checking inbox health for: ${email}\n`);

  const inboxHealthService = new InboxHealthService();

  // Check MX records
  console.log("Checking MX records...");
  const mx = await inboxHealthService.lookupMX(email);
  console.log("MX Records:", mx.exists ? "Found" : "Not Found");
  console.log("MX Provider:", mx.provider);

  // Check SPF records
  console.log("\nChecking SPF records...");
  const spf = await inboxHealthService.lookupSpf(email);
  console.log("SPF Record:", spf.exists ? "Found" : "Not Found");
  if (spf.exists) {
    console.log("SPF Record Value:", spf.records);
  }

  // Check DMARC records
  console.log("\nChecking DMARC records...");
  const dmarc = await inboxHealthService.lookupDMARC(email);
  console.log("DMARC Record:", dmarc.exists ? "Found" : "Not Found");
  if (dmarc.exists) {
    console.log("DMARC Record Value:", dmarc.records);
  }

  // Check DKIM records (using a dummy selector name for the example)
  console.log("\nChecking DKIM records...");
  try {
    const dkim = await inboxHealthService.lookupDKIM(email, "default");
    console.log("DKIM Record:", dkim.exists ? "Found" : "Not Found");
  } catch (error) {
    console.log("DKIM check failed - this is expected in this example as we need correct selectors");
  }

  // Check SSL
  console.log("\nChecking SSL certificate...");
  const ssl = await inboxHealthService.checkSSL(email);
  console.log("SSL Certificate:", ssl.exists ? "Valid" : "Not Found/Invalid");
  if (ssl.exists) {
    console.log("Valid From:", ssl.validFrom);
    console.log("Valid To:", ssl.validTo);
    console.log("Days Remaining:", ssl.daysRemaining);
  }

  // Get domain age
  console.log("\nChecking domain age...");
  const domainAge = await inboxHealthService.domainAge(email);
  console.log("Domain Age Info:", domainAge.exists ? "Found" : "Not Found");
  if (domainAge.exists) {
    console.log("Creation Date:", domainAge.creationDate);
    console.log("Age (years):", domainAge.age);
  }
}

// Run the example with a real domain (replace with a valid email address)
const emailToCheck = "example@gmail.com";

checkInboxHealth(emailToCheck)
  .then(() => console.log("\nInbox health check complete!"))
  .catch((err) => console.error("Error running inbox health check:", err));
