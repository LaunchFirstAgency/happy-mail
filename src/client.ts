import { EmailValidationService, IEmailVerificationService } from "@/validation/email-validation.service";
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
   * Create a new HappyEmailClient
   * @param options Configuration options for the client
   */
  constructor(options: HappyEmailClientOptions = {}) {
    this.options = options;

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
}
