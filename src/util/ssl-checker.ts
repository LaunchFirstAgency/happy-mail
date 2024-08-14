import { connect } from "node:tls";

export interface CertificateInfo {
  valid: boolean;
  issuer: string;
  subject: string;
  validFrom: string;
  validTo: string;
  daysRemaining: number;
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

export async function checkSSLCertificate(domain: string): Promise<CertificateInfo> {
  return new Promise((resolve, reject) => {
    const socket = connect({
      host: domain,
      port: 443,
      rejectUnauthorized: false, // Allow self-signed certificates
    });

    socket.on("secureConnect", () => {
      const cert = socket.getPeerCertificate();

      if (cert) {
        const now = new Date();
        const validFrom = new Date(cert.valid_from);
        const validTo = new Date(cert.valid_to);
        const daysRemaining = Math.ceil((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        const certInfo: CertificateInfo = {
          valid: socket.authorized,
          issuer: cert.issuer.O,
          subject: cert.subject.CN,
          validFrom: validFrom.toISOString(),
          validTo: validTo.toISOString(),
          daysRemaining: daysRemaining,
        };

        resolve(certInfo);
      } else {
        reject(new Error("No certificate information available"));
      }

      socket.end();
    });

    socket.on("error", (error) => {
      reject(error);
    });
  });
}

// (() => {
//   const domain = "example.com";
//   checkSSLCertificate(domain)
//     .then((certInfo) => {
//       console.log("SSL Certificate Information:");
//       console.log(JSON.stringify(certInfo, null, 2));
//     })
//     .catch((error) => {
//       console.error("Error checking SSL certificate:", error.message);
//     });
// })();
