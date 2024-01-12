import MailValidatorResponse, { MailBoxCanReceiveStatus } from "../types/mail-validator-response";
import { isValidEmail, normalizeEmailAddress, splitEmailDomain } from "../util/helpers";
import { DomainParts } from "../types/domain";
import BounceVerificationService, { NeverBounceFlagTypes } from "./bounce-verification.service";
import { EmailType } from "../types/email";
import { MXHostType } from "../types/mx-host";
import { lowestPriorityMxRecord, resolveMxRecords } from "../util/mx";

const DISPOSABLE_DOMAINS = require("./data/disposable-email-domains.json");
const WILDCARD_DISPOSABLE_DOMAINS = require("./data/wildcard-disposable-email-domains.json");
const PERSONAL_DOMAINS = require("./data/personal-email-domains.json");

//@ts-ignore

export default class EmailValidationService {
  private bounceVerificationService: BounceVerificationService;
  constructor() {
    this.bounceVerificationService = new BounceVerificationService();
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
      const mxRecs = await resolveMxRecords(domain.domain);

      if (!mxRecs) {
        return MXHostType.UNKNOWN;
      }

      const firstRecEx = lowestPriorityMxRecord(mxRecs).exchange;

      if (firstRecEx.includes("google")) {
        return MXHostType.GOOGLE;
      }

      if (firstRecEx.includes("outlook.com")) {
        return MXHostType.OUTLOOK;
      }
      //TODO more host types
      return MXHostType.OTHER;
    } catch (error) {
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
    const bounceVerification = await this.bounceVerificationService.checkNeverBounce(email);
    console.log("Bounce Verification", bounceVerification);

    if (bounceVerification.status === "auth_failure") {
      console.warn("NeverBounce Auth Failure");
      return MailBoxCanReceiveStatus.UNKNOWN;
    }

    if (bounceVerification.flags.includes(NeverBounceFlagTypes["spamtrap_network"])) {
      return MailBoxCanReceiveStatus.HIGH_RISK;
    }
    //allows for catchall servers (e.g. msft behind a firewall) to pass
    return bounceVerification.result !== "invalid" ? MailBoxCanReceiveStatus.SAFE : MailBoxCanReceiveStatus.UNSAFE;
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

(async () => {
  const email = "dan@zzqaau.rest";
  const service = new EmailValidationService();
  const result = await service.validate(email);
  console.log(result);
})();
