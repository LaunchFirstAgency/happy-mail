import { MailBoxCanReceiveStatus, MailValidatorResponse } from "../types/mail-validator-response";
import { isValidEmail, normalizeEmailAddress, splitEmailDomain } from "../util/helpers";
import { DomainParts } from "../types/domain";
import { NeverBounceService, NeverBounceFlagTypes } from "./bounce-verification.service";
import { EmailType } from "../types/email";
import { MXHostType } from "../types/mx-host";
import { lowestPriorityMxRecord, resolveMxRecords } from "../util/mx";
import { EmailVerificationInfoCodes, EmailVerificationService } from "./email-verification";
import { checkSpamList } from ".";

const DISPOSABLE_DOMAINS = require("./data/disposable-email-domains.json");
const WILDCARD_DISPOSABLE_DOMAINS = require("./data/wildcard-disposable-email-domains.json");
const PERSONAL_DOMAINS = require("./data/personal-email-domains.json");

export interface IEmailVerificationService {
  verify(email: string): Promise<EmailVerificationResponse>;
}

//todo: consider adding detail flags like NeverBounceFlagTypes enum
export type EmailVerificationResponse = {
  success: boolean;
  info: string;
  addr: string;
  code: EmailVerificationInfoCodes;
  tryagain?: boolean;
};
export class EmailValidationService {
  private emailVerificationService: IEmailVerificationService;
  constructor() {
    this.emailVerificationService = process.env.NEVER_BOUNCE_API_KEY
      ? new NeverBounceService()
      : new EmailVerificationService(); //todo: probably make this default, and waterfall?
  }

  async validate(email: string): Promise<MailValidatorResponse> {
    try {
      const isValid = isValidEmail(email);
      const domainParts = splitEmailDomain(email);
      const provider = await this.getMXHostByDomain(domainParts);
      const normalized = normalizeEmailAddress(email, provider);

      const isAllowableDomain = this.isDomainAllowed(email);
      const canReceiveEmails = await this.bounceCheck(normalized);
      const emailType = this.getEmailType(email, domainParts);
      return {
        email: email,
        normalizedEmail: normalized,
        domain: domainParts,
        validSyntax: isValid,
        canReceive: canReceiveEmails,
        disposableDomain: !isAllowableDomain,
        provider: provider,
        type: provider === MXHostType.UNKNOWN ? EmailType.UNKNOWN : emailType,
      };
    } catch (error) {
      console.error("Failed to validate email", error);
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
      console.error("Failed to get MX Host", error);
      return MXHostType.UNKNOWN;
    }
  }

  /**
   * Checks disposable domain list (e.g. mailinator)
   * @param email
   * @returns
   */
  isDomainAllowed(email: string): boolean {
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
    console.log("Bounce Verification", bounceVerification);

    if (!bounceVerification.success) {
      console.warn("Verification Failure");
      return MailBoxCanReceiveStatus.UNSAFE;
    }

    //todo: add more checks for flags
    if (bounceVerification.info.includes(NeverBounceFlagTypes["spamtrap_network"])) {
      return MailBoxCanReceiveStatus.HIGH_RISK;
    }
    //completed + successful
    return bounceVerification.success && bounceVerification.code === EmailVerificationInfoCodes.FinishedVerification
      ? MailBoxCanReceiveStatus.SAFE
      : MailBoxCanReceiveStatus.UNKNOWN;
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

    //todo: see if support in name

    return EmailType.BUSINESS;
  }
}

//todo: handle proofpoint server
//todo: if mx fails, maybe reverse dns to mail server to ensure its live, check if a single stage passed, and mark grey

// (async () => {
//   const email = "dan@d.com";
//   const service = new EmailValidationService();
//   const result = await service.validate(email);
//   const lists = await checkSpamList("74.105.21.182");
//   console.log(result);
//   console.log(lists);
// })();
