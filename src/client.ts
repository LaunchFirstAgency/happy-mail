import {
  EmailValidationService,
  type IEmailVerificationService,
} from '@/validation/email-validation.service';
import { InboxHealthService } from '@/inbox-health/inbox-health.service';
import { NeverBounceService } from '@/validation/neverbounce-verification';
import { EmailVerificationService } from '@/validation/email-verification';
import { MailValidatorResponse, MXHostType } from '@/types';
import { RecordLookup } from '@/inbox-health/inbox-health.service';
import { Logger, normalizeEmailAddress } from '@/util';
import { NeverBounceBulkVerification } from './validation/neverbounce-bulk-verification';
import type {
  BulkJobRequest,
  BulkJobResponse,
  BulkJobStatus,
  BulkJobResults,
  JobResultsQuery,
  JobSearchQuery,
} from './validation/neverbounce-bulk-verification';
import { getPreset, type PresetName } from './presets';
import { isValid } from './validation/result-helpers';
import { ConfigurationError, ErrorCode } from './errors';

/**
 * Configuration options for HappyEmailClient
 */
export interface HappyEmailClientOptions {
  /** Configuration preset to use ('production', 'development', 'strict', 'lenient') */
  preset?: PresetName;
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
 * Result of validateAndNormalize convenience method
 */
export interface ValidateAndNormalizeResult {
  /** Whether the email is valid */
  isValid: boolean;
  /** Original email address */
  original: string;
  /** Normalized email address (only if valid) */
  normalized?: string;
  /** Full validation result */
  validation: MailValidatorResponse;
}

/**
 * Aggregate domain information
 */
export interface DomainInfo {
  /** Domain name */
  domain: string;
  /** Whether MX records exist */
  hasMX: boolean;
  /** MX record provider */
  mxProvider?: string;
  /** Whether SPF record exists */
  hasSPF: boolean;
  /** Whether DMARC record exists */
  hasDMARC: boolean;
  /** Whether SSL certificate is valid */
  hasSSL: boolean;
  /** Domain age in years */
  domainAge?: number;
  /** Overall health score (0-100) */
  healthScore: number;
  /** Health assessment */
  assessment: 'excellent' | 'good' | 'fair' | 'poor';
}

/**
 * Options for batch validation operations
 */
export interface BatchValidationOptions {
  /** Number of concurrent validations to run (default: 5) */
  concurrency?: number;
  /** Whether to skip bounce checks for all emails (default: uses client setting) */
  skipBounceCheck?: boolean;
  /** Progress callback function */
  onProgress?: (completed: number, total: number) => void;
  /** Whether to continue on errors (default: true) */
  continueOnError?: boolean;
}

/**
 * Result of a batch validation operation
 */
export interface BatchValidationResult {
  /** Email address that was validated */
  email: string;
  /** Validation result if successful */
  result?: MailValidatorResponse;
  /** Error if validation failed */
  error?: Error;
  /** Whether the validation was successful */
  success: boolean;
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
   * @throws {ConfigurationError} If configuration is invalid
   */
  constructor(options: HappyEmailClientOptions = {}) {
    // Apply preset if specified
    if (options.preset) {
      const presetConfig = getPreset(options.preset);
      // Preset values are defaults, explicit options override them
      this.options = { ...presetConfig, ...options };
    } else {
      this.options = options;
    }

    // Validate configuration
    this.validateConfiguration(this.options);

    // Configure logging
    Logger.setEnabled(this.options.loggingEnabled !== false); // Enable logging by default unless explicitly disabled

    // Initialize email verification service
    let emailVerificationService: IEmailVerificationService;
    if (options.emailVerificationService) {
      emailVerificationService = options.emailVerificationService;
    } else if (options.neverBounceApiKey) {
      emailVerificationService = new NeverBounceService({
        apiKey: options.neverBounceApiKey,
      });
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

  /**
   * Validate client configuration
   * @private
   */
  private validateConfiguration(options: HappyEmailClientOptions): void {
    if (options.entropyThreshold !== undefined) {
      if (options.entropyThreshold < 0 || options.entropyThreshold > 10) {
        throw new ConfigurationError(
          'entropyThreshold must be between 0 and 10',
          ErrorCode.INVALID_CONFIGURATION,
          {
            context: { entropyThreshold: options.entropyThreshold },
          }
        );
      }
    }

    if (options.minLengthForRandomCheck !== undefined) {
      if (options.minLengthForRandomCheck < 0) {
        throw new ConfigurationError(
          'minLengthForRandomCheck must be non-negative',
          ErrorCode.INVALID_CONFIGURATION,
          {
            context: {
              minLengthForRandomCheck: options.minLengthForRandomCheck,
            },
          }
        );
      }
    }
  }

  private ensureBulkVerification(): void {
    if (!this.bulkVerification) {
      throw new Error('NeverBounce API key is required for bulk operations');
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
      skipBounceCheck !== undefined
        ? skipBounceCheck
        : this.options.skipBounceCheckByDefault || false;

    try {
      return await this.emailValidationService.validate(email, shouldSkipBounceCheck);
    } catch (error) {
      Logger.error('Failed to validate email', error);
      throw error;
    }
  }

  /**
   * Validate multiple email addresses in batch with concurrency control
   * This is useful for validating lists of emails without using NeverBounce's bulk API
   * @param emails Array of email addresses to validate
   * @param options Batch validation options including concurrency and progress callback
   * @returns Array of batch validation results
   */
  async validateBatch(
    emails: string[],
    options: BatchValidationOptions = {}
  ): Promise<BatchValidationResult[]> {
    const { concurrency = 5, skipBounceCheck, onProgress, continueOnError = true } = options;

    const results: BatchValidationResult[] = [];
    const total = emails.length;
    let completed = 0;

    // Process emails in batches based on concurrency limit
    for (let i = 0; i < emails.length; i += concurrency) {
      const batch = emails.slice(i, Math.min(i + concurrency, emails.length));

      const batchPromises = batch.map(async (email) => {
        try {
          const result = await this.validateEmail(email, skipBounceCheck);
          return {
            email,
            result,
            success: true,
          } as BatchValidationResult;
        } catch (error) {
          if (!continueOnError) {
            throw error;
          }
          return {
            email,
            error: error instanceof Error ? error : new Error(String(error)),
            success: false,
          } as BatchValidationResult;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      completed += batchResults.length;
      if (onProgress) {
        onProgress(completed, total);
      }
    }

    return results;
  }

  /**
   * Validate an email and return the normalized version if valid.
   *
   * This convenience method combines validation and normalization in one call,
   * making it easy to both validate and get the canonical form of an email.
   *
   * @param email - Email address to validate and normalize
   * @param skipBounceCheck - Whether to skip bounce check (default: uses client setting)
   * @returns Validation and normalization result
   *
   * @example
   * ```typescript
   * const result = await client.validateAndNormalize('John.Doe+tag@Gmail.com');
   *
   * if (result.isValid && result.normalized) {
   *   // Use normalized email to check for duplicates
   *   const exists = await database.findByEmail(result.normalized);
   * }
   * ```
   */
  async validateAndNormalize(
    email: string,
    skipBounceCheck?: boolean
  ): Promise<ValidateAndNormalizeResult> {
    const validation = await this.validateEmail(email, skipBounceCheck);
    const valid = isValid(validation);

    let normalized: string | undefined;
    if (valid && validation.normalizedEmail) {
      normalized =
        typeof validation.normalizedEmail === 'string' ? validation.normalizedEmail : undefined;
    } else if (valid) {
      // Fallback normalization using provider info
      normalized = normalizeEmailAddress(email, validation.provider || MXHostType.OTHER);
    }

    return {
      isValid: valid,
      original: email,
      normalized,
      validation,
    };
  }

  /**
   * Quick email validation without bounce checking.
   *
   * This is an optimized method for fast validation that skips bounce checks
   * and focuses on syntax, disposable domain detection, and random email detection.
   *
   * Ideal for:
   * - Real-time form validation
   * - Quick signup flows
   * - Initial screening
   *
   * @param email - Email address to check
   * @returns Validation response
   *
   * @example
   * ```typescript
   * // Fast validation for form feedback
   * const result = await client.quickCheck('user@example.com');
   *
   * if (!result.risks.validSyntax) {
   *   return 'Invalid email format';
   * }
   * if (result.risks.disposableDomain) {
   *   return 'Disposable emails not allowed';
   * }
   * ```
   */
  async quickCheck(email: string): Promise<MailValidatorResponse> {
    return this.validateEmail(email, true); // Always skip bounce check
  }

  /**
   * Comprehensive email validation with all checks enabled.
   *
   * This method performs the most thorough validation possible, including:
   * - Syntax validation
   * - Disposable domain check
   * - Random email detection
   * - Bounce/deliverability check (if configured)
   *
   * Ideal for:
   * - High-value user signups
   * - Marketing campaign lists
   * - Critical email validation
   *
   * @param email - Email address to check
   * @returns Validation response
   *
   * @example
   * ```typescript
   * // Thorough validation for important signups
   * const result = await client.fullCheck('user@example.com');
   *
   * if (isSafeToSend(result)) {
   *   await createAccount(result.email);
   * }
   * ```
   */
  async fullCheck(email: string): Promise<MailValidatorResponse> {
    return this.validateEmail(email, false); // Always do bounce check
  }

  /**
   * Get aggregate domain health information.
   *
   * This convenience method performs all domain health checks in parallel
   * and returns an aggregate health score and assessment.
   *
   * Checks performed:
   * - MX records
   * - SPF records
   * - DMARC records
   * - SSL certificate
   * - Domain age
   *
   * @param email - Email address or domain to check
   * @returns Aggregate domain information
   *
   * @example
   * ```typescript
   * const info = await client.getDomainInfo('user@example.com');
   *
   * console.log(`Domain: ${info.domain}`);
   * console.log(`Health Score: ${info.healthScore}/100`);
   * console.log(`Assessment: ${info.assessment}`);
   *
   * if (info.assessment === 'poor') {
   *   console.log('Domain may have deliverability issues');
   * }
   * ```
   */
  async getDomainInfo(email: string): Promise<DomainInfo> {
    // Run all checks in parallel for efficiency
    const [mx, spf, dmarc, ssl, age] = await Promise.allSettled([
      this.checkMX(email),
      this.checkSPF(email),
      this.checkDMARC(email),
      this.checkSSL(email),
      this.getDomainAge(email),
    ]);

    // Extract domain from email
    const domain = email.includes('@') ? email.split('@')[1] : email;

    // Process results
    const hasMX = mx.status === 'fulfilled' && mx.value.exists;
    const mxProvider = mx.status === 'fulfilled' ? mx.value.provider : undefined;
    const hasSPF = spf.status === 'fulfilled' && spf.value.exists;
    const hasDMARC = dmarc.status === 'fulfilled' && dmarc.value.exists;
    const hasSSL = ssl.status === 'fulfilled' && 'validTo' in ssl.value;

    // Calculate domain age from creation date if available
    let domainAge: number | undefined;
    if (age.status === 'fulfilled' && 'createdOn' in age.value && age.value.createdOn) {
      try {
        const creationDate = new Date(age.value.createdOn);
        const ageInMilliseconds = Date.now() - creationDate.getTime();
        domainAge = ageInMilliseconds / (1000 * 60 * 60 * 24 * 365.25); // Convert to years
      } catch {
        domainAge = undefined;
      }
    }

    // Calculate health score (0-100)
    let healthScore = 0;
    const checks = [
      { passed: hasMX, weight: 30 }, // MX is most important
      { passed: hasSPF, weight: 20 }, // SPF is important
      { passed: hasDMARC, weight: 20 }, // DMARC is important
      { passed: hasSSL, weight: 15 }, // SSL is moderately important
      { passed: domainAge && domainAge >= 1, weight: 15 }, // Age is moderately important
    ];

    checks.forEach((check) => {
      if (check.passed) {
        healthScore += check.weight;
      }
    });

    // Determine assessment
    let assessment: 'excellent' | 'good' | 'fair' | 'poor';
    if (healthScore >= 85) {
      assessment = 'excellent';
    } else if (healthScore >= 65) {
      assessment = 'good';
    } else if (healthScore >= 40) {
      assessment = 'fair';
    } else {
      assessment = 'poor';
    }

    return {
      domain,
      hasMX,
      mxProvider,
      hasSPF,
      hasDMARC,
      hasSSL,
      domainAge,
      healthScore,
      assessment,
    };
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
