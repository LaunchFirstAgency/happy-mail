# Happy Mail

Easy to use email validation and deliverability checking.

A few of the things you can do with happy mail:

1. Validate email syntax
2. Check for disposable domain usage
3. Verify the email's mail server is alive and well
4. Verify if an email's inbox can receive
5. Determine the hosting provider
6. See if an email addresses DNS has proper records for quality sending (SPF, DKIM, DMARC, etc.)

## Getting Started

```bash
npm i @launchfirstagency/happy-mail
```

## Usage Examples

Complete working examples are available in the [examples](./examples/) directory. Below are short snippets to get you started:

### Email Validation

```typescript
import { EmailValidationService } from '@launchfirstagency/happy-mail';

// Create validation service
const validationService = new EmailValidationService();

// Validate an email address
const result = await validationService.validate('user@example.com');

// Check the results
console.log(`Valid Syntax: ${result.risks.validSyntax}`);
console.log(`Disposable Domain: ${result.risks.disposableDomain}`);
```

📄 **[View complete email validation example](./examples/validate-email.ts)**

### Inbox Health Checking

```typescript
import { InboxHealthService } from '@launchfirstagency/happy-mail';

// Create inbox health service
const inboxHealthService = new InboxHealthService();

// Check MX records
const mx = await inboxHealthService.lookupMX('user@example.com');
console.log('MX Records:', mx.exists ? 'Found' : 'Not Found');
```

📄 **[View complete inbox health example](./examples/inbox-health.ts)**

### Utility Functions

```typescript
import { isValidEmail, normalizeEmailAddress } from '@launchfirstagency/happy-mail/util';
import { MXHostType } from '@launchfirstagency/happy-mail/types';

// Check email syntax
const isValid = isValidEmail('user+tag@gmail.com');

// Normalize email address
const normalized = normalizeEmailAddress('User+Newsletter@Gmail.com', MXHostType.GOOGLE);
```

📄 **[View complete utilities example](./examples/utilities.ts)**

## API Documentation

### Validation

The `EmailValidationService` provides:

- Syntax validation
- Disposable domain checking
- Random email detection
- Deliverability verification

### Inbox Health

The `InboxHealthService` provides:

- MX record verification
- SPF, DKIM, and DMARC checking
- SSL certificate verification
- Domain age information

### Utilities

Various helper functions:

- Email syntax validation
- Email normalization
- Domain parsing and destructuring
- String entropy calculation (for random/fake email detection)
- Logging utilities

## Examples

For more detailed examples, check out the [examples folder](./examples):

- [Email validation](./examples/validate-email.ts)
- [Inbox health checking](./examples/inbox-health.ts)
- [Utility functions](./examples/utilities.ts)

You can run any example with:

```bash
npx ts-node examples/validate-email.ts
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

# happy-email

A powerful library for email validation and inbox health checking.

## Features

- Comprehensive email validation with syntax and deliverability checks
- Email bounce verification (single and bulk)
- Disposable domain detection
- Random email generation detection
- MX, SPF, DMARC, and DKIM record checks
- SSL certificate verification
- Domain age information
- Bulk email verification with NeverBounce integration

## Installation

```bash
npm install happy-email
```

## Usage

### Basic Email Validation

```typescript
import { HappyEmailClient } from 'happy-email';

// Create a client with default options
const client = new HappyEmailClient();

// Validate an email
const validation = await client.validateEmail('user@example.com');

// Check various risk factors
if (validation.risks.validSyntax && 
    validation.risks.canReceive === 'SAFE' && 
    !validation.risks.disposableDomain) {
  console.log('Email is valid and safe to use');
}
```

### Using NeverBounce for Enhanced Validation

```typescript
import { HappyEmailClient } from 'happy-email';

// Create a client with NeverBounce API key
const client = new HappyEmailClient({
  neverBounceApiKey: 'your-api-key'
});

// Validate an email with enhanced verification
const validation = await client.validateEmail('user@example.com');
```

### Bulk Email Verification

```typescript
import { ExtendedHappyEmailClient, InputLocationType } from 'happy-email';

// Create a client with NeverBounce API key
const client = new ExtendedHappyEmailClient({
  neverBounceApiKey: 'your-api-key'
});

// Create a bulk verification job with a list of emails
const emails = [
  { uid: '1', email: 'user1@example.com' },
  { uid: '2', email: 'user2@example.com' }
];

const job = await client.createBulkJob({
  input: emails,
  input_location: InputLocationType.SUPPLIED,
  auto_parse: true,
  auto_start: true
});

// Check job status
const status = await client.getJobStatus(job.job_id);

// Get results when complete
if (status.job_status === 'complete') {
  const results = await client.getJobResults(job.job_id);
  console.log(results);
}
```

### Checking Inbox Health

```typescript
import { HappyEmailClient } from 'happy-email';

// Create a client with default options
const client = new HappyEmailClient();

// Check MX records
const mxRecords = await client.checkMX('user@example.com');

// Check SPF records
const spfRecords = await client.checkSPF('user@example.com');

// Check DMARC records
const dmarcRecords = await client.checkDMARC('user@example.com');

// Check DKIM records
const dkimRecords = await client.checkDKIM('user@example.com');

// Check SSL certificate
const sslDetails = await client.checkSSL('user@example.com');

// Get domain age information
const domainAge = await client.getDomainAge('user@example.com');
```

### Client Configuration Options

```typescript
import { HappyEmailClient } from 'happy-email';

// Create a client with custom configuration
const client = new HappyEmailClient({
  // Optional NeverBounce API key for enhanced validation
  neverBounceApiKey: 'your-api-key',
  
  // Skip bounce checks by default (can be overridden in validateEmail calls)
  skipBounceCheckByDefault: true,
  
  // Custom entropy threshold for random email detection (default: 4.5)
  entropyThreshold: 5.0,
  
  // Custom minimum length for random email check (default: 8)
  minLengthForRandomCheck: 6
});
```

## Bulk Verification Features

The ExtendedHappyEmailClient provides additional methods for bulk email verification:

- `createBulkJob`: Create a new bulk verification job
- `listJobs`: List all verification jobs
- `getJobStatus`: Get the status of a specific job
- `getJobResults`: Get the results of a completed job
- `downloadJobResults`: Download job results as a file
- `deleteJob`: Delete a job
- `searchJobs`: Search jobs with filters

### Bulk Verification Options

When creating a bulk verification job, you can specify various options:

```typescript
const job = await client.createBulkJob({
  // Input can be an array of emails or a remote URL
  input: emails,
  input_location: InputLocationType.SUPPLIED,
  
  // Optional configuration
  filename: 'my-emails.csv',
  auto_parse: true,
  auto_start: true,
  run_sample: false,
  
  // Webhook configuration
  callback_url: 'https://my-webhook.com/callback',
  callback_headers: { 'X-Custom-Header': 'value' },
  
  // Additional options
  allow_manual_review: true,
  request_meta_data: { leverage_historical_data: 1 }
});
```

## Advanced Usage

### Accessing Underlying Services

```typescript
import { HappyEmailClient } from 'happy-email';

const client = new HappyEmailClient();

// Access the email validation service directly for advanced usage
const emailValidationService = client.getEmailValidationService();

// Access the inbox health service directly for advanced usage
const inboxHealthService = client.getInboxHealthService();
```

## Examples

Complete working examples are available in the examples directory:

- [Basic validation](./examples/validate-email.ts)
- [Bulk verification](./examples/bulk-verification.ts)
- [Inbox health](./examples/inbox-health.ts)

