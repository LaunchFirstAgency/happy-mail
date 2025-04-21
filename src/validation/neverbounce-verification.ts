import { EmailVerificationResponse, IEmailVerificationService } from "@/validation/email-validation.service";
import { EmailVerificationInfoCodes } from "@/validation/email-verification";
import { Logger } from "@/util";

/**
 * Error types from NeverBounce API
 * @see https://developers.neverbounce.com/reference/error-handling
 */

/**
 * Implementation of NeverBounce email verification service
 * @see https://developers.neverbounce.com/reference/single-check
 */
export class NeverBounceService implements IEmailVerificationService {
  protected readonly NEVER_BOUNCE_API_KEY: string = process.env.NEVER_BOUNCE_API_KEY ?? "";

  constructor({ apiKey }: { apiKey: string }) {
    if (!apiKey) {
      Logger.error("NEVER_BOUNCE_API_KEY not set");
      throw new Error("NEVER_BOUNCE_API_KEY not set");
    }

    this.NEVER_BOUNCE_API_KEY = apiKey;
  }

  /**
   * Verify an email address using NeverBounce API
   * @see https://developers.neverbounce.com/reference/single-check
   * @param email - Email address to verify
   */
  async verify(email: string): Promise<EmailVerificationResponse> {
    try {
      // Properly encode the email parameter (especially for emails with +)
      const encodedEmail = encodeURIComponent(email);

      // NeverBounce supports both GET and POST with different content types
      // Using GET with application/json headers as recommended
      const response = await fetch(
        `https://api.neverbounce.com/v4.2/single/check?key=${this.NEVER_BOUNCE_API_KEY}&email=${encodedEmail}&timeout=10`,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      const data = await response.json();
      // Check if the response indicates an error
      if (response.status > 299) {
        Logger.error(`NeverBounce API error: ${response.status}`, data);
        return this.handleErrorResponse(data, email);
      }

      // Make sure result is defined before proceeding
      if (!data) {
        return {
          success: false,
          info: "Invalid API response - missing result",
          addr: email,
          result: "unknown",
          code: EmailVerificationInfoCodes.SMTPConnectionError,
        };
      }

      return {
        success: true,
        info: `${data.result}${data.flags && data.flags.length ? ` - ${data.flags.join(", ")}` : ""}`,
        addr: email,
        result: data.result,
        code: this.mapResultToCode(data.result),
      };
    } catch (error: any) {
      // Handle HTTP errors (4xx/5xx)
      Logger.error("NeverBounce API request failed:", error);

      // Check for specific HTTP error status codes
      if (error.response) {
        const statusCode = error.response.statusCode;

        if (statusCode === 413) {
          return {
            success: false,
            info: "Email too large to process",
            addr: email,
            result: "unknown",
            code: EmailVerificationInfoCodes.SMTPConnectionError,
          };
        } else if (statusCode >= 500) {
          return {
            success: false,
            info: "NeverBounce service temporarily unavailable",
            addr: email,
            result: "unknown",
            code: EmailVerificationInfoCodes.SMTPConnectionError,
          };
        } else if (statusCode === 429) {
          return {
            success: false,
            info: "Rate limit exceeded",
            addr: email,
            result: "unknown",
            code: EmailVerificationInfoCodes.SMTPConnectionError,
          };
        }
      }

      return {
        success: false,
        info: "Failed to verify email with NeverBounce",
        addr: email,
        result: "unknown",
        code: EmailVerificationInfoCodes.SMTPConnectionError,
      };
    }
  }

  /**
   * Handle error responses from the NeverBounce API
   */
  private handleErrorResponse(response: NeverBounceResponse, email: string): EmailVerificationResponse {
    switch (response.status) {
      case NeverBounceErrorType.AuthFailure:
        Logger.error("NeverBounce authentication failure", response.message);
        return {
          success: false,
          info: "API authentication failure",
          addr: email,
          result: "unknown",
          code: EmailVerificationInfoCodes.SMTPConnectionError,
        };
      case NeverBounceErrorType.ThrottleTriggered:
        Logger.error("NeverBounce rate limit exceeded", response.message);
        return {
          success: false,
          info: "Rate limit exceeded",
          addr: email,
          result: "unknown",
          code: EmailVerificationInfoCodes.SMTPConnectionError,
        };
      case NeverBounceErrorType.TempUnavail:
        Logger.error("NeverBounce temporarily unavailable", response.message);
        return {
          success: false,
          info: "Service temporarily unavailable",
          addr: email,
          result: "unknown",
          code: EmailVerificationInfoCodes.SMTPConnectionError,
        };
      case NeverBounceErrorType.BadReferrer:
        Logger.error("NeverBounce bad referrer", response.message);
        return {
          success: false,
          info: "API credentials referrer issue",
          addr: email,
          result: "unknown",
          code: EmailVerificationInfoCodes.SMTPConnectionError,
        };
      default:
        Logger.error(`NeverBounce general error: ${response.status}`, response.message);
        return {
          success: false,
          info: response.message || "Unknown error occurred",
          addr: email,
          result: "unknown",
          code: EmailVerificationInfoCodes.SMTPConnectionError,
        };
    }
  }

  /**
   * Map NeverBounce result codes to our internal verification codes
   */
  private mapResultToCode(result: NeverBounceResultType): EmailVerificationInfoCodes {
    switch (result) {
      case "valid":
        return EmailVerificationInfoCodes.FinishedVerification;
      case "invalid":
        return EmailVerificationInfoCodes.SMTPConnectionError;
      case "disposable":
        return EmailVerificationInfoCodes.DomainNotFound;
      case "catchall":
        return EmailVerificationInfoCodes.FinishedVerification;
      case "unknown":
        return EmailVerificationInfoCodes.SMTPConnectionError;
      default:
        return EmailVerificationInfoCodes.SMTPConnectionError;
    }
  }
}
export enum NeverBounceErrorType {
  GeneralFailure = "general_failure",
  AuthFailure = "auth_failure",
  TempUnavail = "temp_unavail",
  ThrottleTriggered = "throttle_triggered",
  BadReferrer = "bad_referrer",
}
interface NeverBounceResponse {
  status: "success" | NeverBounceErrorType;
  result?: NeverBounceResultType;
  flags?: NeverBounceFlagTypes[] | string[];
  suggested_correction?: string;
  execution_time?: number;
  message?: string; // Error message when status is not success
}

type NeverBounceResultType = "valid" | "invalid" | "disposable" | "catchall" | "unknown";

export enum NeverBounceFlagTypes {
  "has_dns" = "has_dns",
  "has_dns_mx" = "has_dns_mx",
  "bad_syntax" = "bad_syntax",
  "free_email_host" = "free_email_host",
  "profanity" = "profanity",
  "role_account" = "role_account",
  "disposable_email" = "disposable_email",
  "government_host" = "government_host",
  "academic_host" = "academic_host",
  "military_host" = "military_host",
  "international_host" = "international_host",
  "squatter_host" = "squatter_host",
  "spelling_mistake" = "spelling_mistake",
  "bad_dns" = "bad_dns",
  "temporary_dns_error" = "temporary_dns_error",
  "connect_fails" = "connect_fails",
  "accepts_all" = "accepts_all",
  "contains_alias" = "contains_alias",
  "contains_subdomain" = "contains_subdomain",
  "smtp_connectable" = "smtp_connectable",
  "spamtrap_network" = "spamtrap_network",
  "historical_response" = "historical_response",
}
