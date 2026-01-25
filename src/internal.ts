/**
 * @packageDocumentation
 * Internal APIs for advanced users
 *
 * **Warning**: These APIs are internal implementation details and may change
 * without notice. Use at your own risk. For most use cases, prefer the public
 * HappyEmailClient API.
 *
 * @internal
 *
 * @example
 * ```typescript
 * // Only use if you need direct access to internal services
 * import { EmailValidationService } from '@launchfirstagency/happy-mail/internal';
 *
 * const service = new EmailValidationService();
 * const result = await service.validate('user@example.com');
 * ```
 */

// ============================================================================
// INTERNAL SERVICES - Advanced/Internal Use Only
// ============================================================================

/**
 * Email validation service
 * @internal
 */
export {
  EmailValidationService,
  type IEmailVerificationService,
  type EmailVerificationResponse,
} from './validation/email-validation.service';

/**
 * Inbox health checking service
 * @internal
 */
export { InboxHealthService, type RecordLookup } from './inbox-health/inbox-health.service';

/**
 * NeverBounce single email verification service
 * @internal
 */
export {
  NeverBounceService,
  NeverBounceResultType,
  NeverBounceFlagTypes,
} from './validation/neverbounce-verification';

/**
 * NeverBounce bulk verification service
 * @internal
 */
export { NeverBounceBulkVerification } from './validation/neverbounce-bulk-verification';

/**
 * Email verification service (SMTP-based)
 * @internal
 */
export {
  EmailVerificationService,
  EmailVerificationInfoCodes,
} from './validation/email-verification';

// ============================================================================
// NOTE FOR USERS
// ============================================================================

/**
 * These internal APIs are exposed for advanced use cases only.
 * For normal usage, prefer the HappyEmailClient public API.
 *
 * Example of correct usage:
 * ```typescript
 * import { HappyEmailClient } from '@launchfirstagency/happy-mail';
 *
 * const client = new HappyEmailClient();
 * const result = await client.validateEmail('user@example.com');
 * ```
 *
 * Only use internal APIs if you:
 * - Need direct access to services for testing
 * - Are building custom integrations
 * - Understand that these APIs may change without notice
 */
