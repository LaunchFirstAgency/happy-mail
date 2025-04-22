import { HappyEmailClient, HappyEmailClientOptions } from "./client";
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

export {
  HappyEmailClient,
  HappyEmailClientOptions,
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
