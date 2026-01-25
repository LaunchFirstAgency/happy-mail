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
- 🎯 **Configuration Presets** - Production, development, strict, and lenient presets
- 🛡️ **Error Handling** - Custom error classes with retry strategies
- 🔌 **NeverBounce Integration** - Optional enhanced validation and bulk verification
- 💪 **TypeScript First** - Full type safety with strict mode and branded types
- 📦 **Dual Package** - Works with both CommonJS and ESM

---

## Installation

```bash
npm install @launchfirstagency/happy-mail
```

---

## Quick Start

```typescript
import { HappyEmailClient, isValid, isSafeToSend } from '@launchfirstagency/happy-mail';

// Create a client with a preset configuration
const client = new HappyEmailClient({ preset: 'production' });

// Validate an email
const result = await client.validateEmail('user@example.com');

// Check if valid using helper functions
if (isSafeToSend(result)) {
  console.log('✅ Email is safe to use!');
  console.log(`Quality Score: ${getScore(result)}/100`);
} else {
  console.log('❌ Email should not be used');
  console.log(getRejectionReasons(result));
}
```

---

## Table of Contents

- [Core Features](#core-features)
  - [Email Validation](#1-email-validation)
  - [Result Interpretation](#2-result-interpretation-helpers)
  - [Batch Validation](#3-batch-validation)
  - [Convenience Methods](#4-convenience-methods)
  - [Inbox Health](#5-inbox-health-checking)
  - [Domain Health Score](#6-domain-health-aggregate)
  - [Bulk Verification](#7-bulk-verification-with-neverbounce)
- [Configuration](#configuration)
  - [Presets](#configuration-presets)
  - [Custom Configuration](#custom-configuration)
  - [Error Handling](#error-handling)
- [TypeScript Support](#typescript-support)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Common Use Cases](#common-use-cases)

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
  shouldReject,
  getRiskLevel,
  getScore,
  getRejectionReasons,
  getRecommendations,
} from '@launchfirstagency/happy-mail';

const client = new HappyEmailClient();
const result = await client.validateEmail('test@example.com');

// Simple checks
console.log(isValid(result)); // true/false
console.log(isSafeToSend(result)); // true/false (stricter)
console.log(shouldReject(result)); // true/false
console.log(getRiskLevel(result)); // 'low' | 'medium' | 'high'
console.log(getScore(result)); // 0-100

// Get specific reasons and recommendations
console.log(getRejectionReasons(result));
// ['disposable_domain', 'invalid_syntax', 'cannot_receive', ...]

console.log(getRecommendations(result));
// ['Email appears valid and safe to use']
```

**Or use the wrapper class for a fluent API:**

```typescript
import { EmailValidationResult } from '@launchfirstagency/happy-mail';

const enhanced = new EmailValidationResult(result);

if (enhanced.isSafeToSend()) {
  console.log(`Score: ${enhanced.getScore()}/100`);
  console.log(`Risk: ${enhanced.getRiskLevel()}`);
  console.log(enhanced.getRecommendations());
}
```

### 3. Batch Validation

Efficiently validate multiple emails with concurrency control and progress tracking.

```typescript
import { HappyEmailClient } from '@launchfirstagency/happy-mail';

const client = new HappyEmailClient();

const emails = ['user1@example.com', 'user2@gmail.com', 'user3@test.com'];

const results = await client.validateBatch(emails, {
  concurrency: 5, // Process 5 at a time
  skipBounceCheck: true, // Skip bounce checks for speed
  onProgress: (done, total) => {
    console.log(`Progress: ${done}/${total}`);
  },
  continueOnError: true, // Keep going if some fail
});

// Process results
results.forEach((result) => {
  if (result.success && result.result) {
    console.log(`✅ ${result.email}`);
  } else {
    console.log(`❌ ${result.email}: ${result.error?.message}`);
  }
});
```

### 4. Convenience Methods

Happy Mail provides convenient methods for common validation workflows.

#### Quick Check (Fast Validation)

Ideal for real-time form validation - skips bounce checking for speed.

```typescript
import { HappyEmailClient } from '@launchfirstagency/happy-mail';

const client = new HappyEmailClient();

// Fast validation without bounce check
const result = await client.quickCheck('user@example.com');

if (!result.risks.validSyntax) {
  return 'Invalid email format';
}
if (result.risks.disposableDomain) {
  return 'Disposable emails not allowed';
}
```

#### Full Check (Comprehensive Validation)

Ideal for high-value signups - performs all checks including bounce verification.

```typescript
import { HappyEmailClient, isSafeToSend } from '@launchfirstagency/happy-mail';

const client = new HappyEmailClient();

// Comprehensive validation with all checks
const result = await client.fullCheck('user@example.com');

if (isSafeToSend(result)) {
  await createAccount(result.email);
}
```

#### Validate and Normalize

Combines validation and normalization in one call - useful for duplicate detection.

```typescript
import { HappyEmailClient } from '@launchfirstagency/happy-mail';

const client = new HappyEmailClient();

const result = await client.validateAndNormalize('John.Doe+tag@Gmail.com');

if (result.isValid && result.normalized) {
  // Check for duplicates using normalized email
  const exists = await database.findByEmail(result.normalized);
  // normalized: "johndoe@gmail.com"
}
```

### 5. Inbox Health Checking

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
const dkim = await client.checkDKIM('user@example.com');
console.log('DKIM:', dkim.exists ? 'Configured' : 'Missing');

// Check SSL certificate
const ssl = await client.checkSSL('user@example.com');
console.log('SSL Valid:', ssl.exists);

// Get domain age
const age = await client.getDomainAge('user@example.com');
console.log('Domain Age:', age.age, 'years');
```

### 6. Domain Health Aggregate

Get comprehensive domain health information with a single call.

```typescript
import { HappyEmailClient } from '@launchfirstagency/happy-mail';

const client = new HappyEmailClient();

const info = await client.getDomainInfo('user@example.com');

console.log(`Domain: ${info.domain}`);
console.log(`Health Score: ${info.healthScore}/100`);
console.log(`Assessment: ${info.assessment}`); // 'excellent' | 'good' | 'fair' | 'poor'

console.log(`Has MX: ${info.hasMX}`);
console.log(`MX Provider: ${info.mxProvider}`);
console.log(`Has SPF: ${info.hasSPF}`);
console.log(`Has DMARC: ${info.hasDMARC}`);
console.log(`Has SSL: ${info.hasSSL}`);
console.log(`Domain Age: ${info.domainAge} years`);

if (info.assessment === 'poor') {
  console.log('Domain may have deliverability issues');
}
```

### 7. Bulk Verification with NeverBounce

For large-scale email verification, use NeverBounce's bulk API.

```typescript
import { HappyEmailClient, InputLocationType } from '@launchfirstagency/happy-mail';

const client = new HappyEmailClient({
  neverBounceApiKey: 'your-api-key',
});

// Create a bulk verification job
const job = await client.createBulkJob({
  input: [
    { uid: '1', email: 'user1@example.com' },
    { uid: '2', email: 'user2@example.com' },
  ],
  inputLocation: InputLocationType.SUPPLIED,
  autoParse: true,
  autoStart: true,
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

## Configuration

### Configuration Presets

Happy Mail provides four built-in presets for common use cases:

#### Production Preset

Optimized for production environments with strict validation and high accuracy.

```typescript
const client = new HappyEmailClient({ preset: 'production' });
```

**Settings:**

- Bounce checks: **Enabled**
- Entropy threshold: **4.0** (stricter)
- Min length for random check: **6**
- Logging: **Disabled**

**Use for:** Production environments, high-value emails, critical signups

---

#### Development Preset

Optimized for development with fast validation and detailed logging.

```typescript
const client = new HappyEmailClient({ preset: 'development' });
```

**Settings:**

- Bounce checks: **Disabled** (faster)
- Entropy threshold: **5.5** (lenient)
- Min length for random check: **10**
- Logging: **Enabled**

**Use for:** Development, testing, rapid iteration

---

#### Strict Preset

Maximum accuracy with zero tolerance for risky emails.

```typescript
const client = new HappyEmailClient({ preset: 'strict' });
```

**Settings:**

- Bounce checks: **Enabled**
- Entropy threshold: **3.5** (very strict)
- Min length for random check: **5**
- Logging: **Disabled**

**Use for:** High-value campaigns, critical email validation, zero tolerance scenarios

---

#### Lenient Preset

High acceptance rate with minimal false positives.

```typescript
const client = new HappyEmailClient({ preset: 'lenient' });
```

**Settings:**

- Bounce checks: **Disabled**
- Entropy threshold: **6.0** (very lenient)
- Min length for random check: **12**
- Logging: **Enabled**

**Use for:** Quick signup flows, minimal friction, maximum acceptance

---

### Custom Configuration

Override preset values or create completely custom configurations:

```typescript
import { HappyEmailClient } from '@launchfirstagency/happy-mail';

const client = new HappyEmailClient({
  // Start with a preset
  preset: 'production',

  // Override specific values
  loggingEnabled: true,
  neverBounceApiKey: 'your-api-key',

  // Or configure from scratch
  skipBounceCheckByDefault: false,
  entropyThreshold: 4.5,
  minLengthForRandomCheck: 8,
});
```

**All Configuration Options:**

- `preset?: 'production' | 'development' | 'strict' | 'lenient'` - Use a preset configuration
- `neverBounceApiKey?: string` - NeverBounce API key for enhanced validation
- `skipBounceCheckByDefault?: boolean` - Skip bounce checks by default (default: false)
- `entropyThreshold?: number` - Entropy threshold for random email detection (default: 4.5)
- `minLengthForRandomCheck?: number` - Minimum length for random email check (default: 8)
- `loggingEnabled?: boolean` - Enable/disable logging (default: true)
- `emailVerificationService?: IEmailVerificationService` - Custom email verification service

---

### Error Handling

Happy Mail provides custom error classes for better error handling and recovery.

#### Error Classes

```typescript
import {
  HappyMailError,
  ValidationError,
  NetworkError,
  APIError,
  ConfigurationError,
  ErrorCode,
  isHappyMailError,
  isRecoverableError,
} from '@launchfirstagency/happy-mail';

try {
  const result = await client.validateEmail('user@example.com');
} catch (error) {
  if (error instanceof NetworkError) {
    // Network errors are recoverable - retry
    console.log('Network issue, retrying...');
  } else if (error instanceof APIError) {
    // Check specific error codes
    if (error.code === ErrorCode.RATE_LIMIT_EXCEEDED) {
      console.log('Rate limited, waiting...');
    }
  } else if (error instanceof ValidationError) {
    // Validation errors are not recoverable
    console.log('Invalid input:', error.message);
  } else if (error instanceof ConfigurationError) {
    // Configuration errors need fixing
    console.log('Configuration issue:', error.message);
  }
}
```

#### Error Properties

All Happy Mail errors include:

- `code: ErrorCode` - Programmatic error code
- `message: string` - Human-readable error message
- `isRecoverable: boolean` - Whether the error can be retried
- `timestamp: Date` - When the error occurred
- `cause?: Error` - Original error (if any)
- `context?: Record<string, unknown>` - Additional context

#### Error Codes

**Validation Errors:**

- `INVALID_EMAIL_SYNTAX`
- `INVALID_DOMAIN`
- `DISPOSABLE_DOMAIN`
- `VALIDATION_FAILED`

**Network Errors:**

- `NETWORK_ERROR`
- `TIMEOUT`
- `CONNECTION_REFUSED`
- `DNS_LOOKUP_FAILED`

**API Errors:**

- `API_ERROR`
- `API_KEY_MISSING`
- `API_KEY_INVALID`
- `RATE_LIMIT_EXCEEDED`
- `QUOTA_EXCEEDED`
- `API_UNAVAILABLE`

**Configuration Errors:**

- `INVALID_CONFIGURATION`
- `MISSING_REQUIRED_OPTION`

#### Retry with Exponential Backoff

Automatically retry failed operations with configurable backoff strategy:

```typescript
import { retryWithBackoff } from '@launchfirstagency/happy-mail';

const result = await retryWithBackoff(async () => client.validateEmail('user@example.com'), {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds max
  backoffMultiplier: 2, // Double delay each time
  jitter: true, // Add randomness to prevent thundering herd
});
```

The retry utility:

- ✅ Automatically retries recoverable errors (Network, API rate limits)
- ✅ Does not retry non-recoverable errors (Validation, Configuration)
- ✅ Uses exponential backoff to avoid overwhelming servers
- ✅ Adds jitter to prevent synchronized retries

---

## TypeScript Support

Happy Mail is written in TypeScript with full strict mode and provides comprehensive type definitions.

### Branded Types for Type Safety

Use branded types to ensure emails are validated at compile time:

```typescript
import type { ValidatedEmail, SafeEmail, NormalizedEmail } from '@launchfirstagency/happy-mail';

// Type-safe function that only accepts validated emails
function sendEmail(email: ValidatedEmail) {
  // TypeScript guarantees this email has been validated
  emailService.send(email);
}

// Type-safe function for marketing emails (stricter)
function sendMarketingEmail(email: SafeEmail) {
  // TypeScript guarantees this email is safe to send to
  marketingService.send(email);
}

// Usage with type assertions (after validation)
const result = await client.validateEmail('user@example.com');
if (isValid(result)) {
  await sendEmail(result.email as ValidatedEmail);
}

if (isSafeToSend(result)) {
  await sendMarketingEmail(result.email as SafeEmail);
}
```

### Type Guards and Assertions

```typescript
import {
  isValidatedEmail,
  isSafeEmail,
  assertValidatedEmail,
  assertSafeEmail,
} from '@launchfirstagency/happy-mail';

// Type guards (runtime checks)
if (isValidatedEmail(email)) {
  // TypeScript knows email is ValidatedEmail
}

// Assertions (throws if invalid)
assertValidatedEmail(email); // Throws if not validated
await sendEmail(email as ValidatedEmail); // Safe after assertion
```

### All Available Types

```typescript
import type {
  // Client types
  HappyEmailClientOptions,
  BatchValidationOptions,
  BatchValidationResult,
  ValidateAndNormalizeResult,
  DomainInfo,

  // Response types
  MailValidatorResponse,
  MailBoxCanReceiveStatus,
  EmailType,
  MXHostType,
  DomainParts,

  // Result helper types
  RiskLevel,
  RejectionReason,

  // Branded types
  ValidatedEmail,
  SafeEmail,
  NormalizedEmail,

  // Error types
  ErrorCode,
  RetryConfig,

  // Bulk verification types
  BulkJobRequest,
  BulkJobResponse,
  BulkJobStatus,
  BulkJobResults,
  InputLocationType,

  // Preset types
  PresetName,
} from '@launchfirstagency/happy-mail';
```

---

## API Reference

### HappyEmailClient

#### Constructor

```typescript
new HappyEmailClient(options?: HappyEmailClientOptions)
```

#### Validation Methods

- `validateEmail(email: string, skipBounceCheck?: boolean): Promise<MailValidatorResponse>`

  - Validate a single email address

- `validateBatch(emails: string[], options?: BatchValidationOptions): Promise<BatchValidationResult[]>`

  - Validate multiple emails with concurrency control

- `quickCheck(email: string): Promise<MailValidatorResponse>`

  - Fast validation without bounce checking

- `fullCheck(email: string): Promise<MailValidatorResponse>`

  - Comprehensive validation with all checks

- `validateAndNormalize(email: string, skipBounceCheck?: boolean): Promise<ValidateAndNormalizeResult>`
  - Validate and normalize in one call

#### Inbox Health Methods

- `checkMX(email: string): Promise<RecordLookup>`
- `checkSPF(email: string): Promise<RecordLookup>`
- `checkDMARC(email: string): Promise<RecordLookup>`
- `checkDKIM(email: string, dkimDomain?: string): Promise<RecordLookup>`
- `checkSSL(email: string): Promise<SSLCheckResult>`
- `getDomainAge(email: string): Promise<DomainAgeResult>`
- `getDomainInfo(email: string): Promise<DomainInfo>`
  - Get aggregate domain health information

#### Bulk Verification Methods (NeverBounce)

- `createBulkJob(request: BulkJobRequest): Promise<BulkJobResponse>`
- `listJobs(): Promise<BulkJobStatus[]>`
- `getJobStatus(jobId: number): Promise<BulkJobStatus>`
- `getJobResults(jobId: string, query?: JobResultsQuery): Promise<BulkJobResults>`
- `downloadJobResults(jobId: string, query?: JobResultsQuery): Promise<Buffer>`
- `deleteJob(jobId: string): Promise<{ status: string }>`
- `searchJobs(query?: JobSearchQuery): Promise<SearchResults>`

### Result Helper Functions

- `isValid(result: MailValidatorResponse): boolean`

  - Check if email passed basic validation

- `isSafeToSend(result: MailValidatorResponse): boolean`

  - Check if email is safe to send to (stricter)

- `shouldReject(result: MailValidatorResponse): boolean`

  - Check if email should be rejected

- `getRiskLevel(result: MailValidatorResponse): RiskLevel`

  - Get risk classification: 'low' | 'medium' | 'high'

- `getScore(result: MailValidatorResponse): number`

  - Get quality score (0-100)

- `getRejectionReasons(result: MailValidatorResponse): RejectionReason[]`

  - Get specific rejection reasons

- `getRecommendations(result: MailValidatorResponse): string[]`
  - Get actionable recommendations

### EmailValidationResult Class

Wrapper class providing a fluent API:

```typescript
const result = new EmailValidationResult(rawResult);

result.isValid(); // boolean
result.isSafeToSend(); // boolean
result.shouldReject(); // boolean
result.getRiskLevel(); // 'low' | 'medium' | 'high'
result.getScore(); // 0-100
result.getRejectionReasons(); // string[]
result.getRecommendations(); // string[]
result.raw; // Access original response
```

### Utility Functions

- `isValidEmail(email: string): boolean`

  - Quick syntax validation

- `normalizeEmailAddress(email: string, provider: MXHostType): string`

  - Normalize email based on provider rules

- `splitEmailDomain(email: string): DomainParts | false`

  - Parse domain parts from email

- `calculateStringEntropy(str: string): number`

  - Calculate string randomness

- `checkSpamList(domainOrIp: string): Promise<boolean>`

  - Check if domain/IP is on spam lists

- `resolveMxRecords(domain: string): Promise<MxRecord[]>`

  - Resolve MX records for domain

- `checkSSLCertificate(domain: string, port?: number): Promise<CertificateInfo>`

  - Check SSL certificate

- `whois(domain: string): Promise<WhoisResult>`
  - Get WHOIS information

### Error Utilities

- `retryWithBackoff<T>(fn: () => Promise<T>, config?: RetryConfig): Promise<T>`

  - Retry function with exponential backoff

- `isHappyMailError(error: unknown): boolean`

  - Check if error is a Happy Mail error

- `isRecoverableError(error: unknown): boolean`
  - Check if error can be retried

### Preset Functions

- `getPreset(name: PresetName): Partial<HappyEmailClientOptions>`

  - Get configuration preset by name

- `PRESETS: Record<PresetName, Partial<HappyEmailClientOptions>>`

  - All available presets

- `PRESET_DESCRIPTIONS: Record<PresetName, string>`
  - Descriptions of all presets

---

## Common Use Cases

### Form Validation

Validate email addresses during user signup or registration:

```typescript
import { HappyEmailClient, isValidEmail, isValid } from '@launchfirstagency/happy-mail';

const client = new HappyEmailClient({ preset: 'development' });

async function validateFormEmail(email: string) {
  // Quick syntax check first
  if (!isValidEmail(email)) {
    return { valid: false, message: 'Invalid email format' };
  }

  // Fast validation without bounce check
  const result = await client.quickCheck(email);

  if (!isValid(result)) {
    return { valid: false, message: 'Email cannot be used' };
  }

  if (result.risks.disposableDomain) {
    return { valid: false, message: 'Disposable emails not allowed' };
  }

  return { valid: true };
}
```

### Email List Cleanup

Clean and validate existing email lists:

```typescript
import { HappyEmailClient, isSafeToSend, getScore } from '@launchfirstagency/happy-mail';

const client = new HappyEmailClient({ preset: 'production' });

const results = await client.validateBatch(emailList, {
  concurrency: 10,
  onProgress: (done, total) => console.log(`${done}/${total}`),
});

const safeEmails = results
  .filter((r) => r.success && r.result && isSafeToSend(r.result))
  .map((r) => ({
    email: r.email,
    score: getScore(r.result!),
  }));

console.log(`${safeEmails.length} safe emails out of ${emailList.length}`);
```

### Pre-Send Validation

Validate emails before sending marketing campaigns:

```typescript
import { HappyEmailClient, getRiskLevel, getScore } from '@launchfirstagency/happy-mail';

const client = new HappyEmailClient({ preset: 'strict' });

for (const email of campaignList) {
  const result = await client.fullCheck(email);
  const risk = getRiskLevel(result);
  const score = getScore(result);

  if (risk === 'low' && score >= 80) {
    // Safe to send
    await sendMarketingEmail(email);
  } else {
    console.log(`Skipping ${email}: ${risk} risk, score ${score}`);
  }
}
```

### Domain Reputation Checking

Check if a domain is properly configured for email:

```typescript
import { HappyEmailClient } from '@launchfirstagency/happy-mail';

const client = new HappyEmailClient();

const info = await client.getDomainInfo('user@example.com');

console.log(`Domain: ${info.domain}`);
console.log(`Health Score: ${info.healthScore}/100`);
console.log(`Assessment: ${info.assessment}`);

if (info.healthScore >= 75) {
  console.log('✅ Domain is well configured');
} else {
  console.log('⚠️  Domain may have issues:');
  if (!info.hasMX) console.log('  - Missing MX records');
  if (!info.hasSPF) console.log('  - Missing SPF record');
  if (!info.hasDMARC) console.log('  - Missing DMARC record');
}
```

### Error Handling with Retry

Handle errors gracefully with automatic retries:

```typescript
import {
  HappyEmailClient,
  retryWithBackoff,
  NetworkError,
  APIError,
  ErrorCode,
} from '@launchfirstagency/happy-mail';

const client = new HappyEmailClient({ preset: 'production' });

try {
  const result = await retryWithBackoff(async () => client.validateEmail('user@example.com'), {
    maxAttempts: 3,
    initialDelay: 1000,
    backoffMultiplier: 2,
  });

  console.log('Validation successful:', result);
} catch (error) {
  if (error instanceof NetworkError) {
    console.error('Network issue persists after retries');
  } else if (error instanceof APIError) {
    if (error.code === ErrorCode.RATE_LIMIT_EXCEEDED) {
      console.error('Rate limit exceeded');
    } else if (error.code === ErrorCode.API_KEY_INVALID) {
      console.error('Invalid API key');
    }
  }
}
```

---

## Examples

Complete working examples are available in the [examples](./examples/) directory:

- **[Quick Start](./examples/01-quick-start.ts)** - Basic email validation
- **[Configuration Presets](./examples/02-presets.ts)** - Using configuration presets
- **[Result Interpretation](./examples/03-result-interpretation.ts)** - Using helper functions
- **[Batch Validation](./examples/04-batch-validation.ts)** - Validating multiple emails
- **[Convenience Methods](./examples/05-convenience-methods.ts)** - quickCheck, fullCheck, etc.
- **[Error Handling](./examples/06-error-handling.ts)** - Custom errors and retry strategies
- **[Inbox Health](./examples/07-inbox-health.ts)** - Domain health checking
- **[Branded Types](./examples/08-branded-types.ts)** - Type-safe email handling
- **[Utilities](./examples/09-utilities.ts)** - Using utility functions
- **[Bulk Verification](./examples/10-bulk-verification.ts)** - NeverBounce bulk API

Run any example with:

```bash
npx ts-node examples/01-quick-start.ts
```

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

# Run tests with coverage
npm run coverage

# Build
npm run build

# View coverage report
open coverage/lcov-report/index.html
```

---

## License

AGPL License - see [LICENSE](./LICENSE) file for details

---

## Support

For issues, questions, or contributions, please visit our [GitHub repository](https://github.com/LaunchFirstAgency/happy-mail).

---

**Made with ❤️ by Launch First Agency**
