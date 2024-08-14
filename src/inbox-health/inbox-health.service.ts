import { resolveTxt } from "node:dns";
import { promisify } from "node:util";
import { EmailValidationService } from "@/validation/email-validation.service";
import { checkSSLCertificate, whois, splitEmailDomain, resolveMxRecords } from "@/util";
import { constructGoogleDkimSelector, constructOutlookDkimSelector, validateDkim } from "@/inbox-health/dkim";
import { MXHostType } from "@/types/mx-host";

const resolveTxtAsync = promisify(resolveTxt);
export type RecordLookup = { exists: boolean; records: string | string[] | null };

export class InboxHealthService {
  private emailValidationService: EmailValidationService;
  constructor() {
    this.emailValidationService = new EmailValidationService();
  }
  async lookupMX(email: string) {
    const domainParts = splitEmailDomain(email);
    if (!domainParts) return { exists: false, records: null };
    const mx = await resolveMxRecords(domainParts.domain);
    const mxProvider = await this.emailValidationService.getMXHostByDomain(domainParts);

    return { exists: !!mx, records: mx, provider: mxProvider };
  }

  async lookupSpf(email: string): Promise<RecordLookup> {
    const domainParts = splitEmailDomain(email);
    if (!domainParts) return { exists: false, records: null };
    const txt = await resolveTxtAsync(domainParts.domain);
    let spf: string | null = null;
    for (const t in txt) {
      for (const r in txt[t]) {
        if (txt[t][r].includes("v=spf1")) {
          spf = txt[t][r];
        }
      }
    }
    return { exists: !!spf, records: spf };
  }

  async lookupDMARC(email: string): Promise<RecordLookup> {
    const domainParts = splitEmailDomain(email);
    if (!domainParts) return { exists: false, records: null };
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

      return { exists: !!dmarc, records: dmarc };
    } catch (error) {
      console.info("No DMARC Found", error);
      return { exists: false, records: null };
    }
  }

  //https://github.com/enbits/nodejs-dkim-dns-validator/blob/master/dkimValidator.js
  async lookupDKIM(email: string, dkimDomain): Promise<RecordLookup> {
    const domainParts = splitEmailDomain(email);
    try {
      if (!domainParts) return { exists: false, records: null };
      const mx = await this.lookupMX(email);
      const domainKey =
        mx?.provider === MXHostType.GOOGLE
          ? constructGoogleDkimSelector(domainParts)
          : constructOutlookDkimSelector(domainParts);
      const txt = await resolveTxtAsync(`${domainKey}`);
      const dkimValidation = validateDkim(txt);
      return { exists: dkimValidation.result, records: dkimValidation.dkimRecord };
    } catch (error) {
      console.info("No DKIM Found", error);
      return { exists: false, records: null };
    }
  }

  async checkSSL(email: string) {
    const domainParts = splitEmailDomain(email);

    if (!domainParts) return { exists: false };
    try {
      const getSslDetails = await checkSSLCertificate(domainParts.domain);
      return getSslDetails;
    } catch (error) {
      console.warn("No SSL", email);
      return { exists: false };
    }
  }

  async domainAge(email: string) {
    const domainParts = splitEmailDomain(email);

    if (!domainParts) return { exists: false };

    const domainAge = await whois(domainParts.domain);

    return domainAge;
  }
}

// (async () => {
//   const inboxHealthService = new InboxHealthService();
//   const email = "dan@chatkick.com";
//   const mx = await inboxHealthService.lookupMX(email);
//   console.log(mx);
//   const txt = await inboxHealthService.lookupSpf(email);
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
