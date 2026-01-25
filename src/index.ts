import {
  HappyEmailClient,
  HappyEmailClientOptions,
  BatchValidationOptions,
  BatchValidationResult,
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

// Re-export result interpretation helpers
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

// Re-export utility functions
export {
  isValidEmail,
  normalizeEmailAddress,
  splitEmailDomain,
} from "./util/helpers";

export {
  resolveMxRecords,
  checkPort,
  lowestPriorityMxRecord,
} from "./util/mx";

export {
  calculateStringEntropy,
} from "./util/string-utils";

export {
  checkSSLCertificate,
  getDaysBetween,
  getDaysRemaining,
} from "./util/ssl-checker";

export {
  whois,
} from "./util/domain-expiry";

export {
  checkSpamList,
} from "./inbox-health/spam-check";

export {
  Logger,
} from "./util/logger";

// Export main client and types
export {
  HappyEmailClient,
  HappyEmailClientOptions,
  BatchValidationOptions,
  BatchValidationResult,
  MailValidatorResponse,
  MailBoxCanReceiveStatus,
  Email,
  EmailType,
  MXHostType,
  DomainParts,
  // Bulk verification types
  BulkJobRequest,
  BulkJobResponse,
  BulkJobStatus,
  BulkJobResults,
  JobResultsQuery,
  JobSearchQuery,
  InputLocationType,
  // Util types
  CertificateInfo,
};

// Default export for convenience
export default HappyEmailClient;
