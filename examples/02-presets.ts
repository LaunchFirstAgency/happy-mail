/**
 * Example: Using Configuration Presets
 *
 * This example demonstrates how to use the built-in configuration presets
 * for common use cases.
 */

import { HappyEmailClient, getPreset, PRESET_DESCRIPTIONS } from "../src/index";

async function main() {
  console.log("=".repeat(60));
  console.log("Configuration Presets Example");
  console.log("=".repeat(60));

  // ============================================================================
  // 1. Production Preset - Strict validation for production
  // ============================================================================
  console.log("\n1. Production Preset");
  console.log("-".repeat(60));

  const productionClient = new HappyEmailClient({ preset: "production" });

  console.log("Settings:");
  console.log("  - Bounce checks: ENABLED");
  console.log("  - Entropy threshold: 4.0 (stricter)");
  console.log("  - Min length for random check: 6");
  console.log("  - Logging: DISABLED");
  console.log("\nUse for: Production environments, high-value emails");

  const result1 = await productionClient.quickCheck("user@example.com");
  console.log(`\nValidation result: ${result1.risks.validSyntax ? "✅ Valid" : "❌ Invalid"}`);

  // ============================================================================
  // 2. Development Preset - Fast validation for development
  // ============================================================================
  console.log("\n2. Development Preset");
  console.log("-".repeat(60));

  const devClient = new HappyEmailClient({ preset: "development" });

  console.log("Settings:");
  console.log("  - Bounce checks: DISABLED (faster)");
  console.log("  - Entropy threshold: 5.5 (lenient)");
  console.log("  - Min length for random check: 10");
  console.log("  - Logging: ENABLED");
  console.log("\nUse for: Development, testing, rapid iteration");

  const result2 = await devClient.quickCheck("test.user@example.com");
  console.log(`\nValidation result: ${result2.risks.validSyntax ? "✅ Valid" : "❌ Invalid"}`);

  // ============================================================================
  // 3. Strict Preset - Maximum accuracy
  // ============================================================================
  console.log("\n3. Strict Preset");
  console.log("-".repeat(60));

  const strictClient = new HappyEmailClient({ preset: "strict" });

  console.log("Settings:");
  console.log("  - Bounce checks: ENABLED");
  console.log("  - Entropy threshold: 3.5 (very strict)");
  console.log("  - Min length for random check: 5");
  console.log("  - Logging: DISABLED");
  console.log("\nUse for: High-value campaigns, zero tolerance");

  const result3 = await strictClient.quickCheck("abc123@example.com");
  console.log(`\nValidation result: ${result3.risks.validSyntax ? "✅ Valid" : "❌ Invalid"}`);
  console.log(`Random email detected: ${result3.risks.likelyRandomlyGenerated ? "⚠️  Yes" : "✅ No"}`);

  // ============================================================================
  // 4. Lenient Preset - High acceptance rate
  // ============================================================================
  console.log("\n4. Lenient Preset");
  console.log("-".repeat(60));

  const lenientClient = new HappyEmailClient({ preset: "lenient" });

  console.log("Settings:");
  console.log("  - Bounce checks: DISABLED");
  console.log("  - Entropy threshold: 6.0 (very lenient)");
  console.log("  - Min length for random check: 12");
  console.log("  - Logging: ENABLED");
  console.log("\nUse for: Quick signup flows, minimal friction");

  const result4 = await lenientClient.quickCheck("abc123xyz@example.com");
  console.log(`\nValidation result: ${result4.risks.validSyntax ? "✅ Valid" : "❌ Invalid"}`);
  console.log(`Random email detected: ${result4.risks.likelyRandomlyGenerated ? "⚠️  Yes" : "✅ No"}`);

  // ============================================================================
  // 5. Override Preset Values
  // ============================================================================
  console.log("\n5. Override Preset Values");
  console.log("-".repeat(60));

  const customClient = new HappyEmailClient({
    preset: "production",
    loggingEnabled: true, // Override: enable logging in production
    entropyThreshold: 5.0, // Override: make it slightly more lenient
  });

  console.log("Starting with 'production' preset, then overriding:");
  console.log("  - loggingEnabled: true (was false)");
  console.log("  - entropyThreshold: 5.0 (was 4.0)");

  // ============================================================================
  // 6. Programmatic Access to Presets
  // ============================================================================
  console.log("\n6. Programmatic Access");
  console.log("-".repeat(60));

  console.log("\nAvailable presets:");
  Object.entries(PRESET_DESCRIPTIONS).forEach(([name, description]) => {
    console.log(`  - ${name}: ${description}`);
  });

  console.log("\nGet preset configuration:");
  const productionPreset = getPreset("production");
  console.log("Production preset settings:", productionPreset);

  // ============================================================================
  // 7. Choosing the Right Preset
  // ============================================================================
  console.log("\n7. Choosing the Right Preset");
  console.log("-".repeat(60));

  console.log("\nRecommendations:");
  console.log("\n📧 Email Signup Form (User Registration):");
  console.log("   → Use 'production' or 'strict' preset");
  console.log("   → You want high accuracy to prevent fake signups");

  console.log("\n🧪 Development & Testing:");
  console.log("   → Use 'development' preset");
  console.log("   → Fast validation, detailed logging");

  console.log("\n💌 Marketing Campaigns:");
  console.log("   → Use 'strict' preset");
  console.log("   → Zero tolerance for bad emails");

  console.log("\n🎮 Low-stakes Signups (Newsletters, etc.):");
  console.log("   → Use 'lenient' preset");
  console.log("   → Maximize acceptance, minimize friction");

  console.log("\n" + "=".repeat(60));
}

// Run the example
main().catch(console.error);
