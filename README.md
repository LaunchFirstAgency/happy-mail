# Happy Mail

Easy to use email validation and deliverability checking for Node.js applications.

[![npm version](https://img.shields.io/npm/v/@launchfirstagency/happy-mail.svg)](https://www.npmjs.com/package/@launchfirstagency/happy-mail)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Features

- ✅ **Email Validation** - Syntax validation, disposable domain detection, random email detection
- 🔍 **Deliverability Checking** - Verify if email addresses can receive mail
- 📊 **Inbox Health** - Check MX, SPF, DMARC, DKIM records, SSL certificates, and domain age
- 🚀 **Batch Processing** - Validate multiple emails efficiently with concurrency control
- 📈 **Result Interpretation** - Easy-to-use helpers for understanding validation results
- 🔌 **NeverBounce Integration** - Optional enhanced validation and bulk verification
- 🎯 **TypeScript First** - Full type safety with comprehensive TypeScript definitions
- 📦 **Dual Package** - Works with both CommonJS and ESM

---

## Installation

```bash
npm install @launchfirstagency/happy-mail
```

---

## Quick Start

```typescript
import { HappyEmailClient, isValid, getRiskLevel } from '@launchfirstagency/happy-mail';

// Create a client
const client = new HappyEmailClient();

// Validate an email
const result = await client.validateEmail('user@example.com');

// Check if valid using helper functions
if (isValid(result)) {
  console.log('✅ Email is valid!');
  console.log(`Risk Level: ${getRiskLevel(result)}`);
} else {
  console.log('❌ Email is invalid');
}
```

---

## Core Features

### 1. Email Validation

Validate email syntax, check for disposable domains, detect randomly generated addresses, and verify deliverability.

```typescript
import { HappyEmailClient } from '@launchfirstagency/happy-mail';

const client = new HappyEmailClient();

const result = await client.validateEmail('user@example.com');

console.log(result);
// {
//   email: 'user@example.com',
//   normalizedEmail: 'user@example.com',
//   domain: { domain: 'example', tld: 'com', sub: '' },
//   provider: 'OTHER',
//   type: 'PERSONAL',
//   risks: {
//     validSyntax: true,
//     disposableDomain: false,
//     canReceive: 'SAFE',
//     likelyRandomlyGenerated: false
//   }
// }
```

### 2. Result Interpretation Helpers

Use built-in helper functions to easily understand and act on validation results.

```typescript
import {
  HappyEmailClient,
  isValid,
  isSafeToSend,
  getRiskLevel,
  getScore,
  getRejectionReasons,
  getRecommendations,
} from '@launchfirstagency/happy-mail';

const client = new HappyEmailClient();
const result = await client.validateEmail('test@example.com');

// Simple checks
console.log(isValid(result));         // true/false
console.log(isSafeToSend(result));    // true/false (stricter)
console.log(getRiskLevel(result));    // 'low' | 'medium' | 'high'
console.log(getScore(result));        // 0-100

// Get specific reasons and recommendations
console.log(getRejectionReasons(result));  // ['disposable_domain', ...]
console.log(getRecommendations(result));   // ['Do not send...', ...]
```

**Or use the wrapper class for a fluent API:**

```typescript
import { EmailValidationResult } from '@launchfirstagency/happy-mail';

const enhanced = new EmailValidationResult(result);

if (enhanced.isSafeToSend()) {
  console.log(`Score: ${enhanced.getScore()}/100`);
  console.log(`Risk: ${enhanced.getRiskLevel()}`);
}
```

### 3. Batch Validation

Efficiently validate multiple emails with concurrency control and progress tracking.

```typescript
import { HappyEmailClient } from '@launchfirstagency/happy-mail';

const client = new HappyEmailClient();

const emails = [
  'user1@example.com',
  'user2@gmail.com',
  'user3@test.com'
];

const results = await client.validateBatch(emails, {
  concurrency: 5,           // Process 5 at a time
  skipBounceCheck: true,    // Skip bounce checks for speed
  onProgress: (done, total) => {
    console.log(`Progress: ${done}/${total}`);
  },
  continueOnError: true     // Keep going if some fail
});

// Process results
results.forEach(result => {
  if (result.success && result.result) {
    console.log(`✅ ${result.email}`);
  } else {
    console.log(`❌ ${result.email}: ${result.error?.message}`);
  }
});
```

### 4. Inbox Health Checking

Check domain health metrics including MX records, SPF, DMARC, DKIM, SSL certificates, and domain age.

```typescript
import { HappyEmailClient } from '@launchfirstagency/happy-mail';

const client = new HappyEmailClient();

// Check MX records
const mx = await client.checkMX('user@example.com');
console.log('MX Records:', mx.exists ? 'Found' : 'Not Found');

// Check SPF records
const spf = await client.checkSPF('user@example.com');
console.log('SPF:', spf.exists ? 'Configured' : 'Missing');

// Check DMARC records
const dmarc = await client.checkDMARC('user@example.com');
console.log('DMARC:', dmarc.exists ? 'Configured' : 'Missing');

// Check DKIM records
const dkim = await client.checkDKIM('user@example.com', 'selector');
console.log('DKIM:', dkim.exists ? 'Configured' : 'Missing');

// Check SSL certificate
const ssl = await client.checkSSL('user@example.com');
console.log('SSL Valid:', ssl.exists);

// Get domain age
const age = await client.getDomainAge('user@example.com');
console.log('Domain Age:', age.age, 'years');
```

### 5. Bulk Verification with NeverBounce

For large-scale email verification, use NeverBounce's bulk API.

```typescript
import { HappyEmailClient, InputLocationType } from '@launchfirstagency/happy-mail';

const client = new HappyEmailClient({
  neverBounceApiKey: 'your-api-key'
});

// Create a bulk verification job
const job = await client.createBulkJob({
  input: [
    { uid: '1', email: 'user1@example.com' },
    { uid: '2', email: 'user2@example.com' }
  ],
  inputLocation: InputLocationType.SUPPLIED,
  autoParse: true,
  autoStart: true
});

// Check job status
const status = await client.getJobStatus(job.jobId);

// Get results when complete
if (status.jobStatus === 'complete') {
  const results = await client.getJobResults(job.jobId);
  console.log(results);
}
```

---

## Configuration Options

```typescript
import { HappyEmailClient } from '@launchfirstagency/happy-mail';

const client = new HappyEmailClient({
  // Optional: NeverBounce API key for enhanced validation
  neverBounceApiKey: 'your-api-key',

  // Optional: Skip bounce checks by default (can be overridden per call)
  skipBounceCheckByDefault: true,

  // Optional: Entropy threshold for random email detection (default: 4.5)
  entropyThreshold: 5.0,

  // Optional: Minimum length for random email check (default: 8)
  minLengthForRandomCheck: 6,

  // Optional: Enable/disable logging (default: true)
  loggingEnabled: false,

  // Optional: Custom email verification service
  emailVerificationService: customService
});
```

---

## Utility Functions

Happy Mail exports utility functions for common email operations:

```typescript
import {
  isValidEmail,
  normalizeEmailAddress,
  splitEmailDomain,
  calculateStringEntropy,
  checkSpamList,
} from '@launchfirstagency/happy-mail';

// Check email syntax
isValidEmail('user@example.com');  // true

// Normalize email addresses
normalizeEmailAddress('John.Doe+tag@Gmail.com', 'GOOGLE');  // 'johndoe@gmail.com'

// Parse domain parts
splitEmailDomain('user@mail.example.com');
// { domain: 'example', tld: 'com', sub: 'mail' }

// Calculate entropy (randomness)
calculateStringEntropy('abc123xyz');  // Higher = more random

// Check spam lists
await checkSpamList('user@example.com');  // true/false
```

---

## Common Use Cases

### Form Validation

Validate email addresses during user signup or registration:

```typescript
import { HappyEmailClient, isValidEmail, isValid } from '@launchfirstagency/happy-mail';

async function validateFormEmail(email: string) {
  // Quick syntax check first
  if (!isValidEmail(email)) {
    return { valid: false, message: 'Invalid email format' };
  }

  // Full validation
  const client = new HappyEmailClient();
  const result = await client.validateEmail(email, true);

  if (!isValid(result)) {
    return { valid: false, message: 'Email cannot be used' };
  }

  return { valid: true };
}
```

### Email List Cleanup

Clean and validate existing email lists:

```typescript
import { HappyEmailClient, isSafeToSend, getScore } from '@launchfirstagency/happy-mail';

const client = new HappyEmailClient();

const results = await client.validateBatch(emailList, {
  concurrency: 10,
  onProgress: (done, total) => console.log(`${done}/${total}`)
});

const safeEmails = results
  .filter(r => r.success && r.result && isSafeToSend(r.result))
  .map(r => r.email);

console.log(`${safeEmails.length} safe emails out of ${emailList.length}`);
```

### Pre-Send Validation

Validate emails before sending marketing campaigns:

```typescript
import { HappyEmailClient, getRiskLevel, getScore } from '@launchfirstagency/happy-mail';

const client = new HappyEmailClient();

for (const email of campaignList) {
  const result = await client.validateEmail(email);
  const risk = getRiskLevel(result);
  const score = getScore(result);

  if (risk === 'low' && score >= 80) {
    // Safe to send
    await sendMarketingEmail(email);
  }
}
```

### Domain Reputation Checking

Check if a domain is properly configured for email:

```typescript
import { HappyEmailClient } from '@launchfirstagency/happy-mail';

const client = new HappyEmailClient();

const [mx, spf, dmarc, ssl] = await Promise.all([
  client.checkMX(email),
  client.checkSPF(email),
  client.checkDMARC(email),
  client.checkSSL(email)
]);

const score = [mx.exists, spf.exists, dmarc.exists, ssl.exists]
  .filter(Boolean).length * 25;

console.log(`Domain Health Score: ${score}%`);
```

---

## Examples

Complete working examples are available in the [examples](./examples/) directory:

- **[Quick Start](./examples/01-quick-start.ts)** - Basic email validation
- **[Result Interpretation](./examples/02-result-interpretation.ts)** - Using helper functions
- **[Batch Validation](./examples/03-batch-validation.ts)** - Validating multiple emails
- **[Form Validation](./examples/04-form-validation.ts)** - Real-time form validation
- **[Email List Cleanup](./examples/05-email-list-cleanup.ts)** - Cleaning existing lists
- **[Inbox Health](./examples/06-inbox-health.ts)** - Domain health checking
- **[Utilities](./examples/07-utilities.ts)** - Using utility functions
- **[Bulk Verification](./examples/bulk-verification.ts)** - NeverBounce bulk API
- **[Phase 1 Features](./examples/phase1-features.ts)** - All Phase 1 improvements

Run any example with:

```bash
npx ts-node examples/01-quick-start.ts
```

---

## TypeScript Support

Happy Mail is written in TypeScript and provides comprehensive type definitions:

```typescript
import type {
  HappyEmailClientOptions,
  MailValidatorResponse,
  MailBoxCanReceiveStatus,
  BatchValidationOptions,
  BatchValidationResult,
  RiskLevel,
  RejectionReason,
  EmailType,
  MXHostType,
} from '@launchfirstagency/happy-mail';
```

---

## API Reference

### HappyEmailClient

#### Constructor

```typescript
new HappyEmailClient(options?: HappyEmailClientOptions)
```

#### Methods

##### Validation

- `validateEmail(email: string, skipBounceCheck?: boolean): Promise<MailValidatorResponse>`
- `validateBatch(emails: string[], options?: BatchValidationOptions): Promise<BatchValidationResult[]>`

##### Inbox Health

- `checkMX(email: string): Promise<RecordLookup>`
- `checkSPF(email: string): Promise<RecordLookup>`
- `checkDMARC(email: string): Promise<RecordLookup>`
- `checkDKIM(email: string, dkimDomain?: string): Promise<RecordLookup>`
- `checkSSL(email: string): Promise<SSLCheckResult>`
- `getDomainAge(email: string): Promise<DomainAgeResult>`

##### Bulk Verification (NeverBounce)

- `createBulkJob(request: BulkJobRequest): Promise<BulkJobResponse>`
- `listJobs(): Promise<BulkJobStatus[]>`
- `getJobStatus(jobId: number): Promise<BulkJobStatus>`
- `getJobResults(jobId: string, query?: JobResultsQuery): Promise<BulkJobResults>`
- `downloadJobResults(jobId: string, query?: JobResultsQuery): Promise<Buffer>`
- `deleteJob(jobId: string): Promise<{ status: string }>`
- `searchJobs(query?: JobSearchQuery): Promise<SearchResults>`

### Result Helpers

#### Functions

- `isValid(result: MailValidatorResponse): boolean`
- `isSafeToSend(result: MailValidatorResponse): boolean`
- `shouldReject(result: MailValidatorResponse): boolean`
- `getRiskLevel(result: MailValidatorResponse): RiskLevel`
- `getScore(result: MailValidatorResponse): number`
- `getRejectionReasons(result: MailValidatorResponse): RejectionReason[]`
- `getRecommendations(result: MailValidatorResponse): string[]`

#### EmailValidationResult Class

Wrapper class providing a fluent API:

```typescript
const result = new EmailValidationResult(rawResult);
result.isValid();
result.isSafeToSend();
result.getRiskLevel();
result.getScore();
result.raw; // Access original response
```

### Utility Functions

- `isValidEmail(email: string): boolean`
- `normalizeEmailAddress(email: string, provider: MXHostType): string`
- `splitEmailDomain(email: string): DomainParts | false`
- `calculateStringEntropy(str: string): number`
- `checkSpamList(email: string): Promise<boolean>`
- `resolveMxRecords(domain: string): Promise<MxRecord[]>`
- `checkSSLCertificate(domain: string, port?: number): Promise<CertificateInfo>`
- `whois(domain: string): Promise<WhoisResult>`

---

## Requirements

- Node.js >= 20
- npm >= 10

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Run coverage
npm run coverage
```

---

## License

MIT License - see [LICENSE](./LICENSE) file for details

---

## Support

For issues, questions, or contributions, please visit our [GitHub repository](https://github.com/LaunchFirstAgency/happy-mail).
