import { HappyEmailClient, HappyEmailClientOptions } from "./client";
import { MailValidatorResponse, MailBoxCanReceiveStatus, EmailType, MXHostType } from "./types";
import {
  BulkJobRequest,
  BulkJobResponse,
  BulkJobStatus,
  BulkJobResults,
  JobResultsQuery,
  JobSearchQuery,
  InputLocationType,
} from "./validation/neverbounce-bulk-verification";

export {
  HappyEmailClient,
  HappyEmailClientOptions,
  MailValidatorResponse,
  MailBoxCanReceiveStatus,
  EmailType,
  MXHostType,
  // Bulk verification types
  BulkJobRequest,
  BulkJobResponse,
  BulkJobStatus,
  BulkJobResults,
  JobResultsQuery,
  JobSearchQuery,
  InputLocationType,
};

// Default export for convenience
export default HappyEmailClient;
