import { setServers } from "dns";
import { createConnection } from "net";
import { resolveMxRecords, isValidEmail, Logger } from "@/util";
import { EmailVerificationResponse, IEmailVerificationService } from "@/validation/email-validation.service";

/**
 *
 * Situations to handle:
 * 550 5.7.1 Service unavailable, Client host [74.105.21.182] blocked using Spamhaus. To request removal from this list see https://www.spamhaus.org/query/ip/74.105.21.182 AS(1450) [DM6NAM12FT101.eop-nam12.prod.protection.outlook.com 2024-03-08T18:27:57.188Z 08DC3ECF83FA972F]
 *
 */

/**
 * {
    port : integer, port to connect with defaults to 25
    sender : email, sender address, defaults to name@example.org
    timeout : integer, socket timeout defaults to 0 which is no timeout
    fqdn : domain, used as part of the HELO, defaults to mail.example.org
    dns: ip address, or array of ip addresses (as strings), used to set the servers of the dns check,
    ignore: 
   }
 */

// Define constants for SMTP response codes
const SMTP_READY = "220";
const SMTP_OK = "250";
const SMTP_FAIL = "550"; //TODO: other failure codes

export enum EmailVerificationInfoCodes {
  FinishedVerification = 1,
  InvalidEmailStructure = 2,
  NoMxRecords = 3,
  SMTPConnectionTimeout = 4,
  DomainNotFound = 5,
  SMTPConnectionError = 6,
  InvalidPort = 7,
  DNSOnlyVerification = 8,
}

type EmailVerificationOptions = {
  ports?: number[];
  sender?: string;
  timeout?: number;
  fqdn?: string;
  ignore?: boolean | string;
  dns?: string | string[];
  dnsOnly?: boolean;
};
/**
 * Email Verification Service
 *
 * This service is used to verify email addresses using SMTP.
 * It will try to connect to the email server and send a message to the email address.
 *
 * NOTE: Because most servers and ISPs block ports 25, 465, and 587, this service may fail/timeout.
 * - 25: SMTP
 * - 465: SMTPS
 * - 587: Submission
 *
 * If the email address is valid, the service will return a success status.
 * If the email address is invalid, the service will return a failure status.
 */
export class EmailVerificationService implements IEmailVerificationService {
  protected readonly defaultOptions: EmailVerificationOptions = {
    ports: [25, 465, 587], // Try submission and SMTPS ports first
    sender: "user@example.com",
    timeout: 10000, // 10 seconds timeout
    fqdn: "mail.example.org",
    ignore: false,
    dnsOnly: false,
  };

  constructor() {}

  async verify(
    email: string,
    options: EmailVerificationOptions = this.defaultOptions,
    mxRecordsIndex: number = 0,
  ): Promise<EmailVerificationResponse> {
    if (!isValidEmail(email)) {
      return {
        success: false,
        info: "Invalid Email Structure",
        addr: email,
        result: "invalid",
        code: EmailVerificationInfoCodes.InvalidEmailStructure,
      };
    }

    const opts = this.optionsDefaults(options);
    if (opts.dns) this.dnsConfig(opts);

    Logger.log("# Verifying " + email);

    const domain = email.split(/[@]/).splice(-1)[0].toLowerCase();
    Logger.log("Resolving DNS... " + domain);

    try {
      const addresses = await resolveMxRecords(domain);

      if (addresses.length === 0) {
        return {
          success: false,
          addr: email,
          info: "No MX Records",
          result: "invalid",
          code: EmailVerificationInfoCodes.NoMxRecords,
        };
      }

      // If dnsOnly option is set, return success if MX records exist
      if (opts.dnsOnly) {
        return {
          success: true,
          addr: email,
          info: "MX Records found (DNS-only check)",
          result: "unknown",
          code: EmailVerificationInfoCodes.DNSOnlyVerification,
        };
      }

      // Sort MX records by priority in descending order
      addresses.sort((a, b) => b.priority - a.priority);

      // If we have tried all MX records without success, return failure
      if (mxRecordsIndex >= addresses.length) {
        return {
          success: false,
          addr: email,
          info: "All MX records failed",
          result: "unknown",
          code: EmailVerificationInfoCodes.DomainNotFound,
        };
      }

      const currentMxRecord = addresses[mxRecordsIndex];
      Logger.log(`Attempting connection to ${currentMxRecord.exchange} with priority ${currentMxRecord.priority}`);

      for (const port of opts.ports ?? []) {
        try {
          const smtpResult = await this.beginSMTPQueries(email, currentMxRecord.exchange, { ...opts, port });
          // If the SMTP query was successful, return the result
          return smtpResult;
        } catch (smtpError) {
          Logger.error(`Error connecting to ${currentMxRecord.exchange} on port ${port}: ${smtpError.message}`);
          // Continue to the next port
        }
      }

      // If all ports failed, try the next MX record
      return this.verify(email, opts, mxRecordsIndex + 1);
    } catch (err) {
      return {
        success: false,
        addr: email,
        info: "Domain not found",
        result: "invalid",
        code: EmailVerificationInfoCodes.DomainNotFound,
      };
    }
  }
  private async beginSMTPQueries(
    email: string,
    smtpServer: string,
    options: EmailVerificationOptions & { port: number },
  ): Promise<EmailVerificationResponse> {
    return new Promise((resolve, reject) => {
      //force use of ipv4
      const socket = createConnection({ port: options.port ?? 25, host: smtpServer, autoSelectFamily: true });
      let response = "";
      let stage = 0;
      let success = false;
      let tryagain = false; //doesnt actually retry automatically, just lets calling function know to retry if it wants

      // Function to handle the initial SMTP response
      const handleStage0 = () => {
        if (response.indexOf(SMTP_READY) > -1) {
          sendCommand(`EHLO ${options.fqdn}\r\n`, () => {
            response = "";
            stage++;
          });
          return stage + 1;
        } else {
          socket.end();
        }
      };

      // Function to handle the response after EHLO command
      const handleStage1 = () => {
        if (response.indexOf(SMTP_OK) > -1) {
          // Connection Worked, now try MAIL FROM
          sendCommand(`MAIL FROM:<${options.sender}>\r\n`, () => {
            stage++;
          });
        } else {
          Logger.log("response", response);
          if (response.indexOf("421") > -1 || response.indexOf("450") > -1 || response.indexOf("451") > -1) {
            tryagain = true;
          }
          socket.end();
        }
      };

      // Function to handle the response after MAIL FROM command
      const handleStage2 = () => {
        if (response.indexOf(SMTP_OK) > -1) {
          // MAIL Worked, now try RCPT TO
          Logger.log("sending RCPT TO");
          sendCommand(`RCPT TO:<${email}>\r\n`, () => {
            stage++;
          });
        } else {
          socket.end();
        }
      };

      // Function to handle the response after RCPT TO command
      const handleStage3 = () => {
        Logger.log("sending quit", response);
        sendCommand("QUIT\r\n", () => {
          //Logger.log("QUIT", response);
          if (response.indexOf(SMTP_FAIL) > -1) {
            return (success = false);
          }
          // SMTP may connect properly on quit, but still issue a 550 indicating invalid address
          if (
            response.indexOf(SMTP_OK) > -1 ||
            (options.ignore && typeof options.ignore === "string" && response.indexOf(options.ignore) > -1)
          ) {
            // RCPT Worked, the address is valid
            return (success = true);
          }
          socket.end();
          return (success = false);
        });
      };

      // Function to send a command to the SMTP server
      const sendCommand = (cmd: string, callback?: any) => {
        socket.write(cmd, callback);
      };

      socket.on("data", (data) => {
        response += data.toString();
        const completed = response.slice(-1) === "\n";
        Logger.log("completed", completed, stage);
        if (completed && stage <= 3) {
          switch (stage) {
            case 0:
              handleStage0();
              break;
            case 1:
              handleStage1();
              break;
            case 2:
              handleStage2();
              break;
            case 3:
              handleStage3();
              break;
          }
        }
      });

      socket.on("error", (err) => {
        reject({
          success: false,
          info: "SMTP connection error",
          addr: email,
          result: "invalid",
          code: EmailVerificationInfoCodes.SMTPConnectionError,
          tryagain,
        });
      });

      socket.on("end", () => {
        resolve({
          success,
          info: `${email} is ${success ? "a valid" : "an invalid"} address`,
          addr: email,
          result: success ? "valid" : "invalid",
          code: EmailVerificationInfoCodes.FinishedVerification,
          tryagain,
        });
      });

      socket.on("timeout", () => {
        socket.destroy();
        reject({
          success: false,
          info: "Connection Timed Out",
          addr: email,
          result: "unknown",
          code: EmailVerificationInfoCodes.SMTPConnectionTimeout,
          tryagain,
        });
      });

      if (options.timeout && options.timeout > 0) {
        socket.setTimeout(options.timeout);
      }
    });
  }
  private dnsConfig(options: EmailVerificationOptions): void {
    try {
      if (Array.isArray(options.dns)) {
        setServers(options.dns);
      } else if (typeof options.dns === "string") {
        setServers([options.dns]);
      }
    } catch (e) {
      throw new Error("Invalid DNS Options");
    }
  }
  private optionsDefaults(options?: EmailVerificationOptions): EmailVerificationOptions {
    return { ...this.defaultOptions, ...options };
  }
}
