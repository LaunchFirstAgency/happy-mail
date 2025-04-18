import {
  isValidEmail,
  normalizeEmailAddress,
  splitEmailDomain,
  lowestPriorityMxRecord,
  resolveMxRecords,
  Logger,
  calculateStringEntropy,
} from "@/util";
import { type DomainParts, MailBoxCanReceiveStatus, MailValidatorResponse, EmailType, MXHostType } from "@/types";
import { NeverBounceService, NeverBounceFlagTypes } from "@/validation/neverbounce-verification";
import { EmailVerificationInfoCodes, EmailVerificationService } from "@/validation/email-verification";

const DISPOSABLE_DOMAINS = require("./data/disposable-email-domains.json");
const WILDCARD_DISPOSABLE_DOMAINS = require("./data/wildcard-disposable-email-domains.json");
const PERSONAL_DOMAINS = require("./data/personal-email-domains.json");

export interface IEmailVerificationService {
  verify(email: string): Promise<EmailVerificationResponse>;
}
type VerificationResult = "valid" | "invalid" | "disposable" | "catchall" | "unknown";
//todo: consider adding detail flags like NeverBounceFlagTypes enum
export type EmailVerificationResponse = {
  success: boolean;
  result: VerificationResult;
  info: string;
  addr: string;
  code: EmailVerificationInfoCodes;
  tryagain?: boolean;
};
export class EmailValidationService {
  private emailVerificationService: IEmailVerificationService;

  // Configurable thresholds for random email detection
  public entropyThreshold = 4.5;
  public minLengthForRandomCheck = 8;

  constructor(emailVerificationService?: IEmailVerificationService) {
    if (emailVerificationService) {
      this.emailVerificationService = emailVerificationService;
    } else {
      this.emailVerificationService = process.env.NEVER_BOUNCE_API_KEY
        ? new NeverBounceService({ apiKey: process.env.NEVER_BOUNCE_API_KEY })
        : new EmailVerificationService();
    }
  }

  async validate(email: string, skipBounceCheck = false): Promise<MailValidatorResponse> {
    try {
      const isValid = isValidEmail(email);
      const domainParts = splitEmailDomain(email);
      const provider = await this.getMXHostByDomain(domainParts);
      const normalized = normalizeEmailAddress(email, provider);

      const isAllowableDomain = this.isDomainAllowed(email);
      const canReceiveEmails = skipBounceCheck ? MailBoxCanReceiveStatus.UNKNOWN : await this.bounceCheck(normalized);
      const emailType = this.getEmailType(email, domainParts);
      const likelyRandom = this.isLikelyRandomEmail(email);
      return {
        email: email,
        normalizedEmail: normalized,
        domain: domainParts,
        provider: provider,
        type: provider === MXHostType.UNKNOWN ? EmailType.UNKNOWN : emailType,
        risks: {
          validSyntax: isValid,
          canReceive: canReceiveEmails,
          disposableDomain: !isAllowableDomain,
          likelyRandomlyGenerated: likelyRandom,
        },
      };
    } catch (error) {
      Logger.error("Failed to validate email", error);
      throw error;
    }
  }

  /**
   * Best guess of MX host
   * @param userEmail
   */
  async getMXHostByDomain(domain: DomainParts | false): Promise<MXHostType> {
    if (!domain) {
      return MXHostType.UNKNOWN;
    }

    try {
      const mailHost = domain.sub ? `${domain.sub}.${domain.domain}` : domain.domain;
      const mxRecs = await resolveMxRecords(mailHost);

      if (!mxRecs) {
        return MXHostType.UNKNOWN;
      }

      const firstRecEx = lowestPriorityMxRecord(mxRecs).exchange;

      if (firstRecEx.includes("google")) {
        return MXHostType.GOOGLE;
      }

      if (firstRecEx.includes("outlook.com") || firstRecEx.includes("microsoft.com")) {
        return MXHostType.OUTLOOK;
      }
      //TODO more host types
      return MXHostType.OTHER;
    } catch (error) {
      Logger.error("Failed to get MX Host", error);
      return MXHostType.UNKNOWN;
    }
  }

  /**
   * Checks disposable domain list (e.g. mailinator)
   * @param email
   * @returns
   */
  isDomainAllowed(email: string): boolean {
    // Check if email is valid first
    if (!isValidEmail(email)) {
      return false;
    }

    const domain = email.split("@").pop();
    if (!domain || DISPOSABLE_DOMAINS.includes(domain)) {
      return false;
    }
    //todo: if user sets to check wildcard domains
    // if (wildcardDisposableDomains.includes(domain)) {
    //   return false;
    // }

    return true;
  }

  async bounceCheck(email: string): Promise<MailBoxCanReceiveStatus> {
    const bounceVerification = await this.emailVerificationService.verify(email);
    Logger.log("Bounce Verification", bounceVerification);
    if (bounceVerification.info.includes(NeverBounceFlagTypes["spamtrap_network"])) {
      Logger.warn("Spamtrap Network - HIGH RISK");
      return MailBoxCanReceiveStatus.HIGH_RISK;
    }
    //completed + successful
    if (
      bounceVerification.success &&
      bounceVerification.code === EmailVerificationInfoCodes.FinishedVerification &&
      bounceVerification.result === "valid"
    ) {
      return MailBoxCanReceiveStatus.SAFE;
    }
    if (bounceVerification.result === "invalid") {
      Logger.warn("Verification Failure");
      return MailBoxCanReceiveStatus.UNSAFE;
    }

    //todo: add more checks for flags

    //unknown/possible catchall
    return MailBoxCanReceiveStatus.UNKNOWN;
  }

  /**
   * Checks known personal email providers
   * Checks domain to see if site active
   * REGEX to see if is a support email
   * @param email
   * @param domain
   * @returns
   */
  getEmailType(email: string, domain: DomainParts | false): EmailType {
    if (domain && PERSONAL_DOMAINS.includes(domain.domain)) {
      return EmailType.PERSONAL;
    }
    if (domain && domain.tld === "gov") {
      return EmailType.GOVERNMENT;
    }
    if (domain && domain.tld === "edu") {
      return EmailType.EDUCATION;
    }

    if (email && email.split("@")[0].includes("support")) {
      return EmailType.SUPPORT;
    }

    return EmailType.BUSINESS;
  }

  isLikelyRandomEmail(email: string): boolean {
    // Split the email into local part and domain
    const [localPart, domain] = email.split("@");

    // Use the extracted entropy calculation utility
    const localPartEntropy = calculateStringEntropy(localPart);

    // Check if the local part is long enough and has high entropy
    if (localPart.length >= this.minLengthForRandomCheck && localPartEntropy > this.entropyThreshold) {
      return true;
    }

    // Additional checks
    const hasExcessiveNumbers = /\d{5,}/.test(localPart);
    const hasLongConsecutiveConsonants = /[bcdfghjklmnpqrstvwxyz]{5,}/i.test(localPart);

    return hasExcessiveNumbers || hasLongConsecutiveConsonants;
  }
}
