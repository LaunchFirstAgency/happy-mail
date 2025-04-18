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
