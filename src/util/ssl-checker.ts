//https://raw.githubusercontent.com/dyaa/ssl-checker/master/src/index.ts
import * as http from "node:http";
import * as https from "node:https";
import type { TLSSocket } from "node:tls";
import { checkPort } from "@/util/mx";

export interface IResolvedValues {
  valid: boolean;
  validFrom: string;
  validTo: string;
  daysRemaining: number;
  validFor: string[];
}

export const getDaysBetween = (validFrom: Date, validTo: Date): number =>
  Math.round(Math.abs(+validFrom - +validTo) / 8.64e7);
export const getDaysRemaining = (validFrom: Date, validTo: Date): number => {
  const daysRemaining = getDaysBetween(validFrom, validTo);

  // Normalize dates to midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to midnight
  const validToDate = new Date(validTo.getTime());
  validToDate.setHours(0, 0, 0, 0); // Set to midnight

  if (validToDate < today) {
    return -daysRemaining;
  } else if (validToDate.getTime() === today.getTime()) {
    return 0;
  }

  return daysRemaining;
};

const DEFAULT_OPTIONS: Partial<https.RequestOptions> = {
  agent: new https.Agent({
    maxCachedSessions: 0,
  }),
  method: "HEAD",
  port: 443,
  rejectUnauthorized: false,
  timeout: 5000,
};

export const sslChecker = (host: string, options: Partial<https.RequestOptions> = {}): Promise<IResolvedValues> =>
  new Promise((resolve, reject) => {
    options = Object.assign({}, DEFAULT_OPTIONS, options);

    if (!checkPort(options.port)) {
      reject(Error("Invalid port"));
      return;
    }

    try {
      const req = https.request({ host, ...options }, (res: http.IncomingMessage) => {
        const { valid_from, valid_to, subjectaltname } = (res.socket as TLSSocket).getPeerCertificate();

        if (!valid_from || !valid_to || !subjectaltname) {
          reject(new Error("No certificate"));
          return;
        }

        const validTo = new Date(valid_to);
        const validFor = subjectaltname.replace(/DNS:|IP Address:/g, "").split(", ");

        resolve({
          daysRemaining: getDaysRemaining(new Date(), validTo),
          valid: ((res.socket as { authorized?: boolean }).authorized as boolean) || false,
          validFrom: new Date(valid_from).toISOString(),
          validTo: validTo.toISOString(),
          validFor,
        });
      });

      req.on("error", reject);
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Timed Out"));
      });
      req.end();
    } catch (e) {
      reject(e);
    }
  });

// (() => {
//   const host = "chatkick.com";
//   sslChecker(host)
//     .then((data) => {
//       console.log(`Certificate for ${host} is ${data.valid ? "valid" : "invalid"}`);
//       console.log(`Valid from: ${data.validFrom}`);
//       console.log(`Valid to: ${data.validTo}`);
//       console.log(`Days remaining: ${data.daysRemaining}`);
//       console.log(`Valid for: ${data.validFor.join(", ")}`);
//     })
//     .catch((error) => {
//       console.error("Error:", error);
//     });
// })();
