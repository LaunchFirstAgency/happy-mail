import got from "got";

//NeverBounce and ZeroBounce Checks

const NEVER_BOUNCE_API_KEY = process.env.NEVER_BOUNCE_API_KEY;

export default class BounceVerificationService {
  constructor() {}

  smtpConnectionWorks() {
    //https://github.com/EmailVerify/email-verify/blob/master/index.js
  }

  /**
   * https://developers.neverbounce.com/reference/single-check
   * @param email
   */
  async checkNeverBounce(email: string): Promise<NeverBounceResponse> {
    const URL = `https://api.neverbounce.com/v4/single/check?key=${NEVER_BOUNCE_API_KEY}&email=${email}`;
    const response = await got.post(URL).json<NeverBounceResponse>();
    return response;
  }
}

interface NeverBounceResponse {
  status: "success" | "failure" | "auth_failure";
  //https://neverbounce.com/help/understanding-and-downloading-results/result-codes
  result: "valid" | "invalid" | "disposable" | "catchall" | "unknown";
  flags: NeverBounceFlagTypes[] | string[];
  suggested_correction: string;
  execution_time: number;
}

export enum NeverBounceFlagTypes {
  "has_dns" = "has_dns",
  "has_dns_mx" = "has_dns_mx",
  "bad_syntax" = "bad_syntax", //
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
  "bad_dns" = "bad_dns", //
  "temporary_dns_error" = "temporary_dns_error",
  "connect_fails" = "connect_fails", //
  "accepts_all" = "accepts_all",
  "contains_alias" = "contains_alias",
  "contains_subdomain" = "contains_subdomain",
  "smtp_connectable" = "smtp_connectable",
  "spamtrap_network" = "spamtrap_network", //bad
}
