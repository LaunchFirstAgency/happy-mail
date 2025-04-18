import { Socket } from "node:net";

export class DomainAgeChecker {
  private static WHOIS_SERVERS: { [key: string]: string } = {
    com: "whois.verisign-grs.com",
    net: "whois.verisign-grs.com",
    org: "whois.pir.org",
    info: "whois.afilias.net",
    biz: "whois.biz",
    io: "whois.nic.io",
    co: "whois.nic.co",
    ai: "whois.nic.ai",
    uk: "whois.nic.uk",
    ru: "whois.tcinet.ru",
    au: "whois.auda.org.au",
    de: "whois.denic.de",
    cn: "whois.cnnic.cn",
    fr: "whois.nic.fr",
    nl: "whois.domain-registry.nl",
    eu: "whois.eu",
    br: "whois.registro.br",
    jp: "whois.jprs.jp",
    pl: "whois.dns.pl",
    ca: "whois.cira.ca",
    se: "whois.iis.se",
    ch: "whois.nic.ch",
    li: "whois.nic.ch",
    dk: "whois.dk-hostmaster.dk",
    us: "whois.nic.us",
    me: "whois.nic.me",
    tv: "tvwhois.verisign-grs.com",
    cc: "ccwhois.verisign-grs.com",
  };

  private static WHOIS_PORT = 43;

  private static getWhoisServer(domain: string): string {
    const tld = domain.split(".").pop()?.toLowerCase();
    return this.WHOIS_SERVERS[tld || ""] || "whois.verisign-grs.com";
  }

  static async checkDomainAge(domain: string): Promise<number> {
    const whoisServer = this.getWhoisServer(domain);
    const whoisData = await this.fetchWhoisData(domain, whoisServer);
    const creationDate = this.extractCreationDate(whoisData);

    if (!creationDate) {
      throw new Error("Creation date not found");
    }

    const ageInMilliseconds = Date.now() - creationDate.getTime();
    return ageInMilliseconds / (1000 * 60 * 60 * 24 * 365.25); // Convert to years
  }

  private static fetchWhoisData(domain: string, server: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const socket = new Socket();
      let data = "";

      socket.connect(this.WHOIS_PORT, server, () => {
        socket.write(`${domain}\r\n`);
      });

      socket.on("data", (chunk) => {
        data += chunk.toString();
      });

      socket.on("close", () => {
        resolve(data);
      });

      socket.on("error", (err) => {
        reject(err);
      });
    });
  }

  private static extractCreationDate(whoisData: string): Date | null {
    const match = whoisData.match(/Creation Date: (.+)/i);
    return match ? new Date(match[1]) : null;
  }
}
