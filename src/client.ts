import { EmailValidationService, type IEmailVerificationService } from "@/validation/email-validation.service";
import { InboxHealthService } from "@/inbox-health/inbox-health.service";
import { NeverBounceService } from "@/validation/neverbounce-verification";
import { EmailVerificationService } from "@/validation/email-verification";
import { MailValidatorResponse } from "@/types";
import { RecordLookup } from "@/inbox-health/inbox-health.service";
import { Logger } from "@/util";
import { NeverBounceBulkVerification } from "./validation/neverbounce-bulk-verification";
import type {
  BulkJobRequest,
  BulkJobResponse,
  BulkJobStatus,
  BulkJobResults,
  JobResultsQuery,
  JobSearchQuery,
} from "./validation/neverbounce-bulk-verification";
import { isValidEmail, normalizeEmailAddress, splitEmailDomain } from "@/util/helpers";
import { resolveMxRecords, checkPort, lowestPriorityMxRecord } from "@/util/mx";
import { calculateStringEntropy } from "@/util/string-utils";
import { checkSSLCertificate, getDaysBetween, getDaysRemaining, type CertificateInfo } from "@/util/ssl-checker";
import { whois } from "@/util/domain-expiry";
import { type MxRecord } from "node:dns";

/**
 * Configuration options for HappyEmailClient
 */
export interface HappyEmailClientOptions {
  /** NeverBounce API key for enhanced email verification */
  neverBounceApiKey?: string;
  /** Custom email verification service */
  emailVerificationService?: IEmailVerificationService;
  /** Set to true to bypass bounce checks by default (can be overridden in validate calls) */
  skipBounceCheckByDefault?: boolean;
  /** Entropy threshold for random email detection (default: 4.5) */
  entropyThreshold?: number;
  /** Minimum length for random email check (default: 8) */
  minLengthForRandomCheck?: number;
  /** Enable or disable logging (default: true) */
  loggingEnabled?: boolean;
}

/**
 * HappyEmailClient provides a unified interface for email validation and inbox health services
 */
export class HappyEmailClient {
  private emailValidationService: EmailValidationService;
  private inboxHealthService: InboxHealthService;
  private bulkVerification: NeverBounceBulkVerification | null = null;
  private options: HappyEmailClientOptions;

  /**
   * Static utility methods available on the client
   */
  /**
   * Check if a string is a valid email address
   */
  static isValidEmail = isValidEmail;

  /**
   * Normalize an email address based on provider rules
   */
  static normalizeEmailAddress = normalizeEmailAddress;

  /**
   * Split an email domain into its component parts
   */
  static splitEmailDomain = splitEmailDomain;

  /**
   * Resolve MX records for a domain
   */
  static resolveMxRecords = resolveMxRecords;

  /**
   * Check if a port number is valid
   */
  static checkPort = checkPort;

  /**
   * Find the MX record with the lowest priority
   */
  static lowestPriorityMxRecord = lowestPriorityMxRecord;

  /**
   * Calculate the entropy (randomness) of a string
   */
  static calculateStringEntropy = calculateStringEntropy;

  /**
   * Check SSL certificate for a domain
   */
  static checkSSLCertificate = checkSSLCertificate;

  /**
   * Get days between two dates
   */
  static getDaysBetween = getDaysBetween;

  /**
   * Get days remaining until certificate expiry
   */
  static getDaysRemaining = getDaysRemaining;

  /**
   * Perform a WHOIS lookup for a domain
   */
  static whois = whois;

  /**
   * Enable or disable logging globally
   * @param enabled Whether logging should be enabled
   */
  static setLoggingEnabled(enabled: boolean): void {
    Logger.setEnabled(enabled);
  }

  /**
   * Create a new HappyEmailClient
   * @param options Configuration options for the client
   */
  constructor(options: HappyEmailClientOptions = {}) {
    this.options = options;

    // Configure logging
    Logger.setEnabled(options.loggingEnabled !== false); // Enable logging by default unless explicitly disabled

    // Initialize email verification service
    let emailVerificationService: IEmailVerificationService;
    if (options.emailVerificationService) {
      emailVerificationService = options.emailVerificationService;
    } else if (options.neverBounceApiKey) {
      emailVerificationService = new NeverBounceService({ apiKey: options.neverBounceApiKey });
      // Initialize bulk verification if NeverBounce API key is provided
      this.bulkVerification = new NeverBounceBulkVerification(options.neverBounceApiKey);
    } else {
      emailVerificationService = new EmailVerificationService();
    }

    // Initialize email validation service with the verification service
    this.emailValidationService = new EmailValidationService(emailVerificationService);

    // Configure thresholds if provided
    if (options.entropyThreshold !== undefined) {
      this.emailValidationService.entropyThreshold = options.entropyThreshold;
    }

    if (options.minLengthForRandomCheck !== undefined) {
      this.emailValidationService.minLengthForRandomCheck = options.minLengthForRandomCheck;
    }

    // Initialize inbox health service
    this.inboxHealthService = new InboxHealthService();
  }

  private ensureBulkVerification(): void {
    if (!this.bulkVerification) {
      throw new Error("NeverBounce API key is required for bulk operations");
    }
  }

  /**
   * Validate an email address
   * @param email Email address to validate
   * @param skipBounceCheck Whether to skip bounce check
   * @returns Validation response containing email details and risk assessment
   */
  async validateEmail(email: string, skipBounceCheck?: boolean): Promise<MailValidatorResponse> {
    const shouldSkipBounceCheck =
      skipBounceCheck !== undefined ? skipBounceCheck : this.options.skipBounceCheckByDefault || false;

    try {
      return await this.emailValidationService.validate(email, shouldSkipBounceCheck);
    } catch (error) {
      Logger.error("Failed to validate email", error);
      throw error;
    }
  }

  /**
   * Creates a new bulk verification job
   * @param request The job configuration
   * @returns The created job details
   */
  async createBulkJob(request: BulkJobRequest): Promise<BulkJobResponse> {
    this.ensureBulkVerification();
    return this.bulkVerification!.createBulkJob(request);
  }

  /**
   * Lists all bulk verification jobs
   * @returns Array of job statuses
   */
  async listJobs(): Promise<BulkJobStatus[]> {
    this.ensureBulkVerification();
    return this.bulkVerification!.listJobs();
  }

  /**
   * Gets the status of a specific bulk verification job
   * @param jobId The ID of the job to check
   * @returns The job status
   */
  async getJobStatus(jobId: number): Promise<BulkJobStatus> {
    this.ensureBulkVerification();
    return this.bulkVerification!.getJobStatus(jobId);
  }

  /**
   * Gets the results of a completed bulk verification job
   * @param jobId The ID of the job
   * @param query Optional query parameters
   * @returns The job results
   */
  async getJobResults(jobId: string, query?: JobResultsQuery): Promise<BulkJobResults> {
    this.ensureBulkVerification();
    return this.bulkVerification!.getJobResults(jobId, query);
  }

  /**
   * Downloads the results of a bulk verification job
   * @param jobId The ID of the job
   * @param query Optional query parameters
   * @returns The job results as a Buffer
   */
  async downloadJobResults(jobId: string, query?: JobResultsQuery): Promise<Buffer> {
    this.ensureBulkVerification();
    return this.bulkVerification!.downloadJobResults(jobId, query);
  }

  /**
   * Deletes a bulk verification job
   * @param jobId The ID of the job to delete
   * @returns The deletion status
   */
  async deleteJob(jobId: string): Promise<{ status: string }> {
    this.ensureBulkVerification();
    return this.bulkVerification!.deleteJob(jobId);
  }

  /**
   * Searches for bulk verification jobs with filters
   * @param query Search query parameters
   * @returns Paginated search results
   */
  async searchJobs(query?: JobSearchQuery): Promise<{
    totalResults: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
    jobs: BulkJobStatus[];
  }> {
    this.ensureBulkVerification();
    return this.bulkVerification!.searchJobs(query);
  }

  /**
   * Check MX records for an email's domain
   * @param email Email address to check
   * @returns MX record lookup results
   */
  async checkMX(email: string) {
    return this.inboxHealthService.lookupMX(email);
  }

  /**
   * Check SPF record for an email's domain
   * @param email Email address to check
   * @returns SPF record lookup results
   */
  async checkSPF(email: string): Promise<RecordLookup> {
    return this.inboxHealthService.lookupSpf(email);
  }

  /**
   * Check DMARC record for an email's domain
   * @param email Email address to check
   * @returns DMARC record lookup results
   */
  async checkDMARC(email: string): Promise<RecordLookup> {
    return this.inboxHealthService.lookupDMARC(email);
  }

  /**
   * Check DKIM record for an email's domain
   * @param email Email address to check
   * @param dkimDomain Optional DKIM domain if different from email domain
   * @returns DKIM record lookup results
   */
  async checkDKIM(email: string, dkimDomain?: string): Promise<RecordLookup> {
    return this.inboxHealthService.lookupDKIM(email, dkimDomain);
  }

  /**
   * Check SSL certificate for an email's domain
   * @param email Email address to check
   * @returns SSL certificate details
   */
  async checkSSL(email: string) {
    return this.inboxHealthService.checkSSL(email);
  }

  /**
   * Get domain age information for an email's domain
   * @param email Email address to check
   * @returns Domain age information
   */
  async getDomainAge(email: string) {
    return this.inboxHealthService.domainAge(email);
  }

  /**
   * Get direct access to the underlying EmailValidationService
   * @returns The EmailValidationService instance
   */
  getEmailValidationService(): EmailValidationService {
    return this.emailValidationService;
  }

  /**
   * Get direct access to the underlying InboxHealthService
   * @returns The InboxHealthService instance
   */
  getInboxHealthService(): InboxHealthService {
    return this.inboxHealthService;
  }

  /**
   * Get direct access to the underlying NeverBounceBulkVerification instance
   * @returns The NeverBounceBulkVerification instance or null if not initialized
   */
  getBulkVerification(): NeverBounceBulkVerification | null {
    return this.bulkVerification;
  }

  /**
   * Get the current logging state
   * @returns Whether logging is currently enabled
   */
  isLoggingEnabled(): boolean {
    return this.options.loggingEnabled !== false;
  }
}
