import { resolveTxt } from "node:dns";
import { promisify } from "node:util";
import { EmailValidationService } from "../validation/email-validation.service";
import sslChecker from "../util/ssl-checker";
import { whois } from "../util/domain-expiry";
import { splitEmailDomain } from "../util/helpers";
import { resolveMxRecords } from "../util/mx";
import { constructGoogleDkimSelector, constructOutlookDkimSelector, validateDkim } from "./dkim";
import { MXHostType } from "../types/mx-host";

const resolveTxtAsync = promisify(resolveTxt);
export class InboxHealthService {
  private emailValidationService: EmailValidationService;
  constructor() {
    this.emailValidationService = new EmailValidationService();
  }
  async lookupMX(email: string) {
    const domainParts = splitEmailDomain(email);
    if (!domainParts) return;
    const mx = await resolveMxRecords(domainParts.domain);
    const mxProvider = await this.emailValidationService.getMXHostByDomain(domainParts);

    return { exists: !!mx, provider: mxProvider };
  }

  async lookupTxt(email: string) {
    const domainParts = splitEmailDomain(email);
    if (!domainParts) return;
    const txt = await resolveTxtAsync(domainParts.domain);
    console.log(txt);
    let dmarc: string | null = null;
    let spf: string | null = null;
    for (const t in txt) {
      for (const r in txt[t]) {
        if (txt[t][r].includes("v=DMARC1")) {
          dmarc = txt[t][r];
        }
        if (txt[t][r].includes("v=spf1")) {
          spf = txt[t][r];
        }
      }
    }
    return { exists: !!spf, record: spf } as any;
  }

  async lookupDMARC(email: string) {
    const domainParts = splitEmailDomain(email);
    if (!domainParts) return;
    try {
      const txt = await resolveTxtAsync(`_dmarc.${domainParts.domain}`);
      let dmarc: string | null = null;
      for (const t in txt) {
        for (const r in txt[t]) {
          if (txt[t][r].includes("v=DMARC1")) {
            dmarc = txt[t][r];
          }
        }
      }

      return { exists: !!dmarc, record: dmarc };
    } catch (error) {
      console.info("No DMARC Found", error);
      return { exists: false };
    }
  }

  //https://github.com/enbits/nodejs-dkim-dns-validator/blob/master/dkimValidator.js
  async lookupDKIM(email: string, dkimDomain) {
    const domainParts = splitEmailDomain(email);
    try {
      if (!domainParts) return { exists: false };
      const mx = await this.lookupMX(email);
      const domainKey =
        mx?.provider === MXHostType.GOOGLE
          ? constructGoogleDkimSelector(domainParts)
          : constructOutlookDkimSelector(domainParts);
      const txt = await resolveTxtAsync(`${domainKey}`);
      const dkimValidation = validateDkim(txt);
      return { exists: dkimValidation.result, record: dkimValidation.dkimRecord };
    } catch (error) {
      console.info("No DKIM Found", error);
      return { exists: false };
    }
  }

  async checkSSL(email: string) {
    const domainParts = splitEmailDomain(email);

    if (!domainParts) return { exists: false };
    try {
      const getSslDetails = await sslChecker(domainParts.domain);
      return getSslDetails;
    } catch (error) {
      console.warn("No SSL", email);
      return { exists: false };
    }
  }

  /**
   * Not Yet Implemented
   * @param domain
   */
  async checkSecurityHeaders(domain: string) {
    throw new Error("Method not implemented.");
    /**
     * {
          'Strict-Transport-Security': headers['strict-transport-security'] || 'Not set',
          'X-Frame-Options': headers['x-frame-options'] || 'Not set',
          'X-XSS-Protection': headers['x-xss-protection'] || 'Not set',
          'X-Content-Type-Options': headers['x-content-type-options'] || 'Not set'
        }
     */
  }
}

// (async () => {
//   const inboxHealthService = new InboxHealthService();
//   const email = "dan@chatkick.com";
//   const mx = await inboxHealthService.lookupMX(email);
//   console.log(mx);
//   const txt = await inboxHealthService.lookupTxt(email);
//   console.log(txt);
//   const dmarc = await inboxHealthService.lookupDMARC(email);
//   console.log(dmarc);
//   const dkim = await inboxHealthService.lookupDKIM(email, "google._domainkey.chatkick.com");
//   console.log(dkim);
//   const ssl = await inboxHealthService.checkSSL(email);
//   console.log(ssl);
//   const domainAge = await inboxHealthService.domainAge(email);
//   console.log(domainAge);
// })();
