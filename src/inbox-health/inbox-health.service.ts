import { resolveTxt } from "node:dns";
import { promisify } from "node:util";
import EmailValidationService from "../validation/email-validation.service";
import sslChecker from "../util/ssl-checker";
import { whois } from "../util/domain-expiry";
import { splitEmailDomain } from "../util/helpers";
import { resolveMxRecords } from "../util/mx";

const resolveTxtAsync = promisify(resolveTxt);
export default class InboxHealthService {
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
    console.log(JSON.stringify(txt));
    let dmarc;
    let spf;
    for (const t in txt) {
      console.log(txt[t]);
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
      console.log(JSON.stringify(txt));
      let dmarc;
      for (const t in txt) {
        console.log(txt[t]);
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
      const txt = await resolveTxtAsync(`${dkimDomain}`);
      console.log(JSON.stringify(txt));
      let DKIM;
      for (const t in txt) {
        console.log(txt[t]);
        for (const r in txt[t]) {
          if (txt[t][r].includes("v=DKIM1")) {
            DKIM = txt[t][r];
          }
        }
      }
      return { exists: !!DKIM, record: DKIM };
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

  async domainAge(email: string) {
    const domainParts = splitEmailDomain(email);

    if (!domainParts) return { exists: false };

    const domainAge = await whois(domainParts.domain);

    return domainAge;
  }
}
