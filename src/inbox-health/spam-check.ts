import { resolve4, lookup } from "node:dns";
import { promisify } from "node:util";
import { Logger } from "@/util";
const resolve4Async = promisify(resolve4);
const lookupAsync = promisify(lookup);
const ipRegex =
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

function reverseIp(ip) {
  return ip.split(".").reverse().join(".");
}

async function checkSpamhaus(ip: string) {
  const reversedIp = reverseIp(ip);
  //zen is policy list
  //https://www.spamhaus.org/blocklists/zen-blocklist
  const queryZenList = `${reversedIp}.zen.spamhaus.org`;

  //https://www.spamhaus.org/blocklists/spamhaus-blocklist
  const querySBL = `${reversedIp}.sbl.spamhaus.org`;

  const results: { isListed: boolean; list: string }[] = [];
  try {
    const response = await resolve4Async(querySBL);
    if (response && response.length > 0) {
      results.push({ isListed: true, list: "SBL" });
    }
  } catch (error) {
    if (error.code === "ENOTFOUND") {
      results.push({ isListed: false, list: "SBL" });
    }
  }

  try {
    const response = await resolve4Async(queryZenList);
    if (response && response.length > 0) {
      results.push({ isListed: true, list: "Zen" });
    }
  } catch (error) {
    if (error.code === "ENOTFOUND") {
      results.push({ isListed: false, list: "Zen" });
    }
  }

  return results;
}

async function resolveDomainToIpAndCheck(domain) {
  try {
    const address = await lookupAsync(domain, { family: 4 });
    Logger.log(`Resolved IP for ${domain}: ${address.address}`);
    return await checkSpamhaus(address.address);
  } catch (error) {
    if (error) {
      Logger.error(`Error resolving domain ${domain}:`, error);
      return;
    }
  }
}

export async function checkSpamList(domainOrIp: string) {
  // Check if input is an IP or domain
  if (ipRegex.test(domainOrIp)) {
    // It's an IP address
    Logger.log(`Directly checking IP: ${domainOrIp}`);
    return await checkSpamhaus(domainOrIp);
  } else {
    // It's a domain
    return await resolveDomainToIpAndCheck(domainOrIp);
  }
}
