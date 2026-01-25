/**
 * Email List Cleanup Example
 *
 * This example shows how to clean and validate an existing email list,
 * filtering out invalid, risky, and disposable addresses.
 */

import {
  HappyEmailClient,
  isSafeToSend,
  getRiskLevel,
  getScore,
  getRejectionReasons,
} from "@launchfirstagency/happy-mail";

interface CleanupReport {
  total: number;
  safe: number;
  risky: number;
  invalid: number;
  safeEmails: string[];
  riskyEmails: Array<{ email: string; reasons: string[] }>;
  invalidEmails: Array<{ email: string; reasons: string[] }>;
}

async function cleanEmailList(emails: string[]): Promise<CleanupReport> {
  const client = new HappyEmailClient();

  const report: CleanupReport = {
    total: emails.length,
    safe: 0,
    risky: 0,
    invalid: 0,
    safeEmails: [],
    riskyEmails: [],
    invalidEmails: [],
  };

  console.log(`\n🧹 Cleaning email list with ${emails.length} addresses...\n`);

  // Validate all emails in batch
  const results = await client.validateBatch(emails, {
    concurrency: 5,
    skipBounceCheck: true,
    onProgress: (completed, total) => {
      const percent = Math.round((completed / total) * 100);
      process.stdout.write(`\rProgress: ${completed}/${total} (${percent}%)  `);
    },
  });

  console.log("\n");

  // Categorize results
  for (const result of results) {
    if (!result.success || !result.result) {
      report.invalid++;
      report.invalidEmails.push({
        email: result.email,
        reasons: ["validation_failed"],
      });
      continue;
    }

    const safe = isSafeToSend(result.result);
    const riskLevel = getRiskLevel(result.result);
    const score = getScore(result.result);

    if (safe && score >= 90) {
      report.safe++;
      report.safeEmails.push(result.email);
    } else if (riskLevel === "high" || score < 50) {
      report.invalid++;
      report.invalidEmails.push({
        email: result.email,
        reasons: getRejectionReasons(result.result),
      });
    } else {
      report.risky++;
      report.riskyEmails.push({
        email: result.email,
        reasons: getRejectionReasons(result.result),
      });
    }
  }

  return report;
}

function printReport(report: CleanupReport) {
  console.log("\n" + "=".repeat(60));
  console.log("📊 EMAIL LIST CLEANUP REPORT");
  console.log("=".repeat(60) + "\n");

  console.log(`Total emails processed: ${report.total}`);
  console.log(`✅ Safe emails: ${report.safe} (${Math.round((report.safe / report.total) * 100)}%)`);
  console.log(`⚠️  Risky emails: ${report.risky} (${Math.round((report.risky / report.total) * 100)}%)`);
  console.log(`❌ Invalid emails: ${report.invalid} (${Math.round((report.invalid / report.total) * 100)}%)`);

  console.log("\n" + "-".repeat(60));
  console.log("✅ SAFE EMAILS (Ready to use)");
  console.log("-".repeat(60));
  report.safeEmails.forEach((email) => console.log(`  ${email}`));

  if (report.riskyEmails.length > 0) {
    console.log("\n" + "-".repeat(60));
    console.log("⚠️  RISKY EMAILS (Review recommended)");
    console.log("-".repeat(60));
    report.riskyEmails.forEach(({ email, reasons }) => {
      console.log(`  ${email}`);
      console.log(`    Reasons: ${reasons.join(", ")}`);
    });
  }

  if (report.invalidEmails.length > 0) {
    console.log("\n" + "-".repeat(60));
    console.log("❌ INVALID EMAILS (Remove from list)");
    console.log("-".repeat(60));
    report.invalidEmails.forEach(({ email, reasons }) => {
      console.log(`  ${email}`);
      console.log(`    Reasons: ${reasons.join(", ")}`);
    });
  }

  console.log("\n" + "=".repeat(60));
  console.log(`💡 Recommendation: Use ${report.safe} safe emails for your campaign`);
  console.log("=".repeat(60) + "\n");
}

// Example usage
async function runEmailCleanup() {
  // Simulated email list (would typically come from a database or CSV)
  const emailList = [
    "john@gmail.com",
    "sarah@company.com",
    "test@tempmail.com",
    "invalid-email",
    "abc123xyz@example.com",
    "business@example.com",
    "user@outlook.com",
    "spam@disposable.com",
    "real.person@gmail.com",
    "another@company.com",
  ];

  const report = await cleanEmailList(emailList);
  printReport(report);

  // Example: Export safe emails to CSV
  console.log("\n📝 Example: Exporting safe emails to CSV...");
  console.log(`Safe emails CSV:\n${report.safeEmails.join("\n")}`);
}

// Run the example
runEmailCleanup().catch(console.error);
