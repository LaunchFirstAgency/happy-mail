# Happy Email Examples

This directory contains example scripts showing how to use the Happy Email library.

## Running the Examples


To run these examples:

1. Make sure you have the dependencies installed:
   ```bash
   npm install
   ```

2. Run an example using ts-node:
   ```bash
   npx ts-node examples/validate-email.ts
   ```

## Available Examples

### Email Validation (`validate-email.ts`)

Shows how to validate email addresses, checking for:
- Valid syntax
- Disposable domains
- Random/generated email detection
- Email normalization

### Inbox Health Check (`inbox-health.ts`)

Demonstrates how to check the DNS and security settings for an email domain:
- MX record verification
- SPF, DKIM, and DMARC record checking
- SSL certificate validation
- Domain age information

### Utility Functions (`utilities.ts`)

Highlights the individual utility functions available:
- Email validation
- Email normalization
- Domain parsing
- Entropy calculation (for random email detection)

## Notes

- Some examples may make network calls to external services or DNS lookups
- The examples use dummy/example email addresses, but you can modify them to test with real addresses
- For functions that might make API calls (like bounce verification), the examples skip those parts to avoid hitting rate limits 