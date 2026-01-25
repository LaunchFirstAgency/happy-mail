import isEmail from 'validator/lib/isEmail';
import normalizeEmail from 'validator/lib/normalizeEmail';
import parser from 'tld-extract';
import { type DomainParts, MXHostType } from '@/types';
import { Logger } from './logger';

/**
 * Check if a string is a syntactically valid email address.
 *
 * This performs basic syntax validation according to RFC standards.
 * It does NOT check if the email can receive mail or if the domain exists.
 *
 * @param email - The email address to validate
 * @returns `true` if the email has valid syntax, `false` otherwise
 *
 * @example
 * ```typescript
 * import { isValidEmail } from '@launchfirstagency/happy-mail';
 *
 * isValidEmail('user@example.com');  // true
 * isValidEmail('invalid-email');     // false
 * isValidEmail('missing@');          // false
 * ```
 */
export function isValidEmail(email: string): boolean {
  return !!email && isEmail(email);
}

/**
 * Normalize an email address based on provider-specific rules.
 *
 * Different email providers handle addresses differently:
 * - **Gmail/Google**: Ignores dots and + tags (john.doe+tag@gmail.com → johndoe@gmail.com)
 * - **Outlook**: Removes + tags but preserves dots
 * - **Other**: Basic normalization (lowercase)
 *
 * Use this to detect duplicate accounts where users may use the same email
 * with different formatting.
 *
 * @param email - The email address to normalize
 * @param provider - The email provider type (GOOGLE, OUTLOOK, or OTHER)
 * @returns The normalized email address in lowercase
 *
 * @example
 * ```typescript
 * import { normalizeEmailAddress } from '@launchfirstagency/happy-mail';
 *
 * normalizeEmailAddress('John.Doe+tag@Gmail.com', 'GOOGLE');
 * // Returns: 'johndoe@gmail.com'
 *
 * normalizeEmailAddress('User+Tag@Outlook.com', 'OUTLOOK');
 * // Returns: 'user@outlook.com'
 * ```
 */
export function normalizeEmailAddress(email: string, provider: MXHostType): string {
  let normalEmail = normalizeEmail(email, {
    gmail_convert_googlemaildotcom: true, //convert googlemail.com to gmail.com
    gmail_remove_dots: true, //gmail dots don't matter
    all_lowercase: true,
    //removes + and everything after it
    gmail_remove_subaddress: true,
    outlookdotcom_remove_subaddress: true,
    yahoo_remove_subaddress: true,
    icloud_remove_subaddress: true,
  });

  if (provider === MXHostType.GOOGLE || provider === MXHostType.OUTLOOK) {
    const name = email.split('@')[0];
    const domain = email.split('@')[1];
    const cleanName = name.split('+')[0];
    normalEmail = `${cleanName}@${domain}`;

    return normalEmail.toLocaleLowerCase();
  }

  return normalEmail ? normalEmail.toLocaleLowerCase() : 'INVALID';
}

/**
 * Parse and split an email domain into its component parts.
 *
 * Extracts the domain, top-level domain (TLD), and subdomain from an email address.
 *
 * @param email - The email address to parse
 * @returns An object containing domain parts, or `false` if parsing fails
 *
 * @example
 * ```typescript
 * import { splitEmailDomain } from '@launchfirstagency/happy-mail';
 *
 * splitEmailDomain('user@example.com');
 * // Returns: { domain: 'example', tld: 'com', sub: '' }
 *
 * splitEmailDomain('admin@mail.example.co.uk');
 * // Returns: { domain: 'example', tld: 'co.uk', sub: 'mail' }
 *
 * splitEmailDomain('invalid');
 * // Returns: false
 * ```
 */
export function splitEmailDomain(email: string): DomainParts | false {
  const address = email.split('@').pop();

  try {
    const result = parser(`http://${address}`);
    return result || false;
  } catch (error) {
    Logger.error(`Invalid Domain for Email ${email}`, error);
    return false;
  }
}
