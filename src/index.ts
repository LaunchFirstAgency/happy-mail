/**
 * @packageDocumentation
 * Happy Mail - Email validation and deliverability checking for Node.js
 *
 * @example
 * ```typescript
 * import { HappyEmailClient, isValid } from '@launchfirstagency/happy-mail';
 *
 * const client = new HappyEmailClient({ preset: 'production' });
 * const result = await client.validateEmail('user@example.com');
 *
 * if (isValid(result)) {
 *   console.log('Email is valid!');
 * }
 * ```
 */

import {
  HappyEmailClient,
  HappyEmailClientOptions,
  BatchValidationOptions,
  BatchValidationResult,
  ValidateAndNormalizeResult,
  DomainInfo,
} from "./client";
import { MailValidatorResponse, MailBoxCanReceiveStatus, EmailType, MXHostType, DomainParts, Email } from "./types";
import {
  BulkJobRequest,
  BulkJobResponse,
  BulkJobStatus,
  BulkJobResults,
  JobResultsQuery,
  JobSearchQuery,
  InputLocationType,
} from "./validation/neverbounce-bulk-verification";
import { CertificateInfo } from "./util/ssl-checker";

// ============================================================================
// PRIMARY API - Main Client
// ============================================================================

/**
 * Main client for email validation and verification
 * @public
 */
export {
  HappyEmailClient,
  type HappyEmailClientOptions,
  type BatchValidationOptions,
  type BatchValidationResult,
  type ValidateAndNormalizeResult,
  type DomainInfo,
};

// ============================================================================
// RESULT INTERPRETATION - Helper Functions
// ============================================================================

/**
 * Result interpretation helpers for understanding validation results
 * @public
 */
export {
  isValid,
  isSafeToSend,
  shouldReject,
  getRiskLevel,
  getRejectionReasons,
  getRecommendations,
  getScore,
  EmailValidationResult,
  type RiskLevel,
  type RejectionReason,
} from "./validation/result-helpers";

// ============================================================================
// CONFIGURATION - Presets and Options
// ============================================================================

/**
 * Configuration presets for common use cases
 * @public
 */
export {
  getPreset,
  PRESETS,
  PRODUCTION_PRESET,
  DEVELOPMENT_PRESET,
  STRICT_PRESET,
  LENIENT_PRESET,
  PRESET_DESCRIPTIONS,
  type PresetName,
} from "./presets";

// ============================================================================
// ERROR HANDLING - Custom Errors and Retry Utilities
// ============================================================================

/**
 * Error classes and utilities for error handling
 * @public
 */
export {
  HappyMailError,
  ValidationError,
  NetworkError,
  APIError,
  ConfigurationError,
  ErrorCode,
  retryWithBackoff,
  isHappyMailError,
  isRecoverableError,
  type RetryConfig,
} from "./errors";

// ============================================================================
// TYPE SAFETY - Branded Types
// ============================================================================

/**
 * Branded types for compile-time email validation
 * @public
 */
export {
  type ValidatedEmail,
  type SafeEmail,
  type NormalizedEmail,
  isValidatedEmail,
  isSafeEmail,
  isNormalizedEmail,
  assertValidatedEmail,
  assertSafeEmail,
  assertNormalizedEmail,
} from "./types/branded";

// ============================================================================
// TYPES - Response and Configuration Types
// ============================================================================

/**
 * Type definitions for validation responses and configurations
 * @public
 */
export {
  type MailValidatorResponse,
  type MailBoxCanReceiveStatus,
  type Email,
  type EmailType,
  type MXHostType,
  type DomainParts,
};

// ============================================================================
// BULK VERIFICATION - NeverBounce Types
// ============================================================================

/**
 * Types for bulk email verification operations
 * @public
 */
export {
  type BulkJobRequest,
  type BulkJobResponse,
  type BulkJobStatus,
  type BulkJobResults,
  type JobResultsQuery,
  type JobSearchQuery,
  InputLocationType,
};

// ============================================================================
// UTILITIES - Email and Domain Utilities
// ============================================================================

/**
 * Email validation and manipulation utilities
 * @public
 */
export {
  isValidEmail,
  normalizeEmailAddress,
  splitEmailDomain,
} from "./util/helpers";

/**
 * MX record utilities
 * @public
 */
export {
  resolveMxRecords,
  checkPort,
  lowestPriorityMxRecord,
} from "./util/mx";

/**
 * String and entropy utilities
 * @public
 */
export {
  calculateStringEntropy,
} from "./util/string-utils";

/**
 * SSL certificate utilities
 * @public
 */
export {
  checkSSLCertificate,
  getDaysBetween,
  getDaysRemaining,
  type CertificateInfo,
} from "./util/ssl-checker";

/**
 * Domain age and WHOIS utilities
 * @public
 */
export {
  whois,
} from "./util/domain-expiry";

/**
 * Spam checking utilities
 * @public
 */
export {
  checkSpamList,
} from "./inbox-health/spam-check";

/**
 * Logging utilities
 * @public
 */
export {
  Logger,
} from "./util/logger";

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

/**
 * Default export for convenience
 * @public
 */
export default HappyEmailClient;
