/**
 * Branded types for type-safe email handling
 * @module types/branded
 */

/**
 * Brand symbol for validated emails
 * @internal
 */
declare const VALIDATED_EMAIL_BRAND: unique symbol;

/**
 * Brand symbol for safe emails
 * @internal
 */
declare const SAFE_EMAIL_BRAND: unique symbol;

/**
 * Brand symbol for normalized emails
 * @internal
 */
declare const NORMALIZED_EMAIL_BRAND: unique symbol;

/**
 * A validated email address that has passed basic validation checks.
 *
 * This type ensures that emails passed to certain functions have been
 * validated, preventing accidental use of unvalidated email addresses.
 *
 * @example
 * ```typescript
 * import { HappyEmailClient, type ValidatedEmail } from '@launchfirstagency/happy-mail';
 *
 * const client = new HappyEmailClient();
 *
 * async function sendEmail(email: ValidatedEmail) {
 *   // Type guarantees this email has been validated
 *   await emailService.send(email);
 * }
 *
 * const result = await client.validateEmail('user@example.com');
 * if (result.risks.validSyntax) {
 *   // Type assertion is safe here because we checked
 *   await sendEmail(result.email as ValidatedEmail);
 * }
 * ```
 */
export type ValidatedEmail = string & {
  readonly [VALIDATED_EMAIL_BRAND]: true;
};

/**
 * A safe email address that has passed all validation checks and is safe to send to.
 *
 * This is a stricter type than ValidatedEmail, indicating the email has:
 * - Valid syntax
 * - SAFE delivery status
 * - Not disposable
 * - Not randomly generated
 *
 * @example
 * ```typescript
 * import { HappyEmailClient, type SafeEmail, isSafeToSend } from '@launchfirstagency/happy-mail';
 *
 * const client = new HappyEmailClient();
 *
 * async function sendMarketingEmail(email: SafeEmail) {
 *   // Type guarantees this email is safe to send to
 *   await marketingService.send(email);
 * }
 *
 * const result = await client.validateEmail('user@example.com');
 * if (isSafeToSend(result)) {
 *   await sendMarketingEmail(result.email as SafeEmail);
 * }
 * ```
 */
export type SafeEmail = ValidatedEmail & { readonly [SAFE_EMAIL_BRAND]: true };

/**
 * A normalized email address.
 *
 * Normalized emails have been processed according to provider rules:
 * - Converted to lowercase
 * - Dots removed (Gmail)
 * - Plus addressing removed
 *
 * @example
 * ```typescript
 * import { normalizeEmailAddress, type NormalizedEmail } from '@launchfirstagency/happy-mail';
 *
 * function checkDuplicate(email: NormalizedEmail) {
 *   // Check if normalized email exists in database
 *   return database.exists(email);
 * }
 *
 * const normalized = normalizeEmailAddress('John.Doe+tag@Gmail.com', 'GOOGLE');
 * await checkDuplicate(normalized as NormalizedEmail);
 * ```
 */
export type NormalizedEmail = string & {
  readonly [NORMALIZED_EMAIL_BRAND]: true;
};

/**
 * Type guard to check if a value is a validated email
 *
 * @param value - The value to check
 * @returns True if the value is a ValidatedEmail
 */
export function isValidatedEmail(value: unknown): value is ValidatedEmail {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Type guard to check if a value is a safe email
 *
 * @param value - The value to check
 * @returns True if the value is a SafeEmail
 */
export function isSafeEmail(value: unknown): value is SafeEmail {
  return isValidatedEmail(value);
}

/**
 * Type guard to check if a value is a normalized email
 *
 * @param value - The value to check
 * @returns True if the value is a NormalizedEmail
 */
export function isNormalizedEmail(value: unknown): value is NormalizedEmail {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Assert that a string is a validated email
 *
 * @param email - The email to assert
 * @returns The email as a ValidatedEmail
 * @throws If the email is not valid
 */
export function assertValidatedEmail(email: string): asserts email is ValidatedEmail {
  if (!email || email.length === 0) {
    throw new Error('Invalid email: empty string');
  }
}

/**
 * Assert that a string is a safe email
 *
 * @param email - The email to assert
 * @returns The email as a SafeEmail
 * @throws If the email is not safe
 */
export function assertSafeEmail(email: string): asserts email is SafeEmail {
  assertValidatedEmail(email);
}

/**
 * Assert that a string is a normalized email
 *
 * @param email - The email to assert
 * @returns The email as a NormalizedEmail
 * @throws If the email is not normalized
 */
export function assertNormalizedEmail(email: string): asserts email is NormalizedEmail {
  if (!email || email.length === 0) {
    throw new Error('Invalid email: empty string');
  }
}
