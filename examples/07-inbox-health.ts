/**
 * Inbox Health Checking Example
 *
 * This example demonstrates how to check domain health metrics including
 * MX, SPF, DMARC, DKIM records, SSL certificates, and domain age.
 */

import { HappyEmailClient } from '@launchfirstagency/happy-mail';

async function checkDomainHealth(email: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🏥 INBOX HEALTH CHECK: ${email}`);
  console.log('='.repeat(60) + '\n');

  const client = new HappyEmailClient();

  try {
    // Check MX records
    console.log('📬 Checking MX Records...');
    const mx = await client.checkMX(email);
    console.log(`  Status: ${mx.exists ? '✅ Found' : '❌ Not Found'}`);
    if (mx.exists) {
      console.log(`  Provider: ${mx.provider}`);
      console.log(`  Records: ${mx.records?.length || 0} MX record(s)`);
    }

    // Check SPF records
    console.log('\n🛡️  Checking SPF Records...');
    const spf = await client.checkSPF(email);
    console.log(`  Status: ${spf.exists ? '✅ Found' : '❌ Not Found'}`);
    if (spf.exists && spf.records) {
      console.log(`  Value: ${spf.records.join(', ')}`);
    }

    // Check DMARC records
    console.log('\n🔒 Checking DMARC Records...');
    const dmarc = await client.checkDMARC(email);
    console.log(`  Status: ${dmarc.exists ? '✅ Found' : '❌ Not Found'}`);
    if (dmarc.exists && dmarc.records) {
      console.log(`  Value: ${dmarc.records.join(', ')}`);
    }

    // Check DKIM records (requires selector, so might fail)
    console.log('\n🔑 Checking DKIM Records...');
    try {
      const dkim = await client.checkDKIM(email, 'default');
      console.log(`  Status: ${dkim.exists ? '✅ Found' : '❌ Not Found'}`);
    } catch (error) {
      console.log('  ⚠️  Could not verify (DKIM selector unknown)');
    }

    // Check SSL certificate
    console.log('\n🔐 Checking SSL Certificate...');
    const ssl = await client.checkSSL(email);
    console.log(`  Status: ${ssl.exists ? '✅ Valid' : '❌ Not Found/Invalid'}`);
    if (ssl.exists) {
      console.log(`  Valid From: ${ssl.validFrom}`);
      console.log(`  Valid To: ${ssl.validTo}`);
      console.log(`  Days Remaining: ${ssl.daysRemaining}`);
      if (ssl.daysRemaining && ssl.daysRemaining < 30) {
        console.log('  ⚠️  WARNING: Certificate expires soon!');
      }
    }

    // Check domain age
    console.log('\n📅 Checking Domain Age...');
    const domainAge = await client.getDomainAge(email);
    console.log(`  Status: ${domainAge.exists ? '✅ Found' : '❌ Not Found'}`);
    if (domainAge.exists) {
      console.log(`  Creation Date: ${domainAge.creationDate}`);
      console.log(`  Age: ${domainAge.age} years`);
      if (domainAge.age && domainAge.age < 1) {
        console.log('  ⚠️  WARNING: Domain is very new (less than 1 year old)');
      }
    }

    // Overall health summary
    console.log('\n' + '-'.repeat(60));
    console.log('📊 HEALTH SUMMARY');
    console.log('-'.repeat(60));

    const healthChecks = [
      { name: 'MX Records', passed: mx.exists },
      { name: 'SPF Record', passed: spf.exists },
      { name: 'DMARC Record', passed: dmarc.exists },
      { name: 'SSL Certificate', passed: ssl.exists },
      {
        name: 'Domain Age',
        passed: domainAge.exists && (domainAge.age || 0) >= 1,
      },
    ];

    const passedChecks = healthChecks.filter((check) => check.passed).length;
    const totalChecks = healthChecks.length;
    const healthScore = Math.round((passedChecks / totalChecks) * 100);

    healthChecks.forEach((check) => {
      const icon = check.passed ? '✅' : '❌';
      console.log(`  ${icon} ${check.name}`);
    });

    console.log(
      `\n  Overall Score: ${healthScore}% (${passedChecks}/${totalChecks} checks passed)`
    );

    if (healthScore >= 80) {
      console.log('  🎉 Excellent! Domain is well configured.');
    } else if (healthScore >= 60) {
      console.log('  ⚠️  Good, but some improvements recommended.');
    } else {
      console.log('  ❌ Poor domain health. Configuration issues detected.');
    }

    console.log('\n' + '='.repeat(60) + '\n');
  } catch (error) {
    console.error('Error checking domain health:', error);
  }
}

// Example: Check multiple domains
async function compareMultipleDomains() {
  console.log('\n🔍 Comparing Multiple Domains\n');

  const domains = ['user@gmail.com', 'contact@example.com', 'admin@company.com'];

  for (const email of domains) {
    await checkDomainHealth(email);
    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

// Run the example
const emailToCheck = process.argv[2] || 'user@gmail.com';

console.log('\nUsage: ts-node inbox-health.ts [email@domain.com]');
checkDomainHealth(emailToCheck).catch(console.error);

// Uncomment to compare multiple domains:
// compareMultipleDomains().catch(console.error);
