import * as dns from "node:dns";
import * as net from "node:net";
import { checkPort, lowestPriorityMxRecord, resolveMxRecords } from "../util/mx";
import { isValidEmail } from "../util/helpers";

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
type EmailVerificationOptions = {
  port?: number;
  sender?: string;
  timeout?: number;
  fqdn?: string;
  ignore?: boolean | string; //set an ending response code integer to ignore, such as 450 for greylisted emails
  dns?: string | string[];
};

const defaultOptions: EmailVerificationOptions = {
  port: 25,
  sender: "name@example.org",
  timeout: 0,
  fqdn: "mail.example.org",
  ignore: false,
};

const errors = {
  missing: {
    email: "Missing email parameter",
    options: "Missing options parameter",
  },
  invalid: {
    port: "Invalid MX Port",
    email: "Invalid Email Structure",
  },
  exception: {},
};

export enum EmailVerificationInfoCodes {
  FinishedVerification = 1,
  InvalidEmailStructure = 2,
  NoMxRecords = 3,
  SMTPConnectionTimeout = 4,
  DomainNotFound = 5,
  SMTPConnectionError = 6,
  InvalidPort = 7,
}

function optionsDefaults(options?: EmailVerificationOptions): EmailVerificationOptions {
  return { ...defaultOptions, ...options };
}

function dnsConfig(options: EmailVerificationOptions): void {
  try {
    if (Array.isArray(options.dns)) {
      dns.setServers(options.dns);
    } else if (typeof options.dns === "string") {
      dns.setServers([options.dns]);
    }
  } catch (e) {
    throw new Error("Invalid DNS Options");
  }
}

export async function verifyEmail(email: string, options: EmailVerificationOptions): Promise<any> {
  if (!isValidEmail(email)) {
    throw new Error(errors.invalid.email);
  }
  if (options.port && !checkPort(options.port)) {
    throw new Error(errors.invalid.port);
  }

  const opts = optionsDefaults(options);
  if (opts.dns) dnsConfig(opts);

  console.info("# Verifying " + email);

  const domain = email.split(/[@]/).splice(-1)[0].toLowerCase();
  console.info("Resolving DNS... " + domain);

  try {
    const addresses = await resolveMxRecords(domain);

    if (addresses.length === 0) {
      return { success: false, info: "No MX Records", code: EmailVerificationInfoCodes.NoMxRecords };
    }

    // Find the lowest priority mail server
    let lowestPriorityAddress = lowestPriorityMxRecord(addresses);

    console.info(`Choosing ${lowestPriorityAddress.exchange} for connection`);
    const smtpResult = await beginSMTPQueries(email, lowestPriorityAddress.exchange, options);
    return smtpResult;
  } catch (err) {
    return { success: false, info: "Domain not found", code: EmailVerificationInfoCodes.DomainNotFound };
  }
}

// Define constants for SMTP response codes
const SMTP_READY = "220";
const SMTP_OK = "250";
const SMTP_FAIL = "550"; //TODO: other failure codes
async function beginSMTPQueries(email: string, smtpServer: string, options: EmailVerificationOptions): Promise<any> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(options.port ?? 25, smtpServer);
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
        console.log("sending RCPT TO");
        sendCommand(`RCPT TO:<${email}>\r\n`, () => {
          stage++;
        });
      } else {
        socket.end();
      }
    };

    // Function to handle the response after RCPT TO command
    const handleStage3 = () => {
      console.log("sending quit", response);
      sendCommand("QUIT\r\n", () => {
        //console.log("QUIT", response);
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
        return (success = false);
      });
      socket.end();
    };

    // Function to send a command to the SMTP server
    const sendCommand = (cmd: string, callback?: any) => {
      socket.write(cmd, callback);
    };

    socket.on("data", (data) => {
      response += data.toString();
      const completed = response.slice(-1) === "\n";
      console.log("completed", completed, stage);
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
      console.error("Error", err);
      reject({
        success: false,
        info: "SMTP connection error",
        addr: email,
        code: EmailVerificationInfoCodes.SMTPConnectionError,
        tryagain,
      });
    });

    socket.on("end", () => {
      resolve({
        success,
        info: `${email} is ${success ? "a valid" : "an invalid"} address`,
        addr: email,
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
        code: EmailVerificationInfoCodes.SMTPConnectionTimeout,
        tryagain,
      });
    });

    if (options.timeout && options.timeout > 0) {
      socket.setTimeout(options.timeout);
    }
  });
}
