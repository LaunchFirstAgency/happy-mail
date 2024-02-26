import { resolveMx, MxRecord } from "node:dns";

export async function resolveMxRecords(domain: string): Promise<MxRecord[]> {
  return new Promise((resolve, reject) => {
    resolveMx(domain, (err, addresses) => {
      if (err) {
        reject(err);
      } else {
        resolve(addresses);
      }
    });
  });
}

export const checkPort = (port: unknown): boolean =>
  !isNaN(parseFloat(port as string)) && Math.sign(port as number) === 1;

export const lowestPriorityMxRecord = (mxRecords: MxRecord[]): MxRecord =>
  mxRecords.reduce((prev, current) => (prev.priority < current.priority ? prev : current));
