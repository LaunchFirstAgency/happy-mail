import { resolve4, lookup } from "dns";
const ipRegex =
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

function reverseIp(ip) {
  return ip.split(".").reverse().join(".");
}

function checkSpamhaus(ip: string) {
  const reversedIp = reverseIp(ip);
  //zen is policy list
  //https://www.spamhaus.org/blocklists/zen-blocklist
  const queryZenList = `${reversedIp}.zen.spamhaus.org`;

  //https://www.spamhaus.org/blocklists/spamhaus-blocklist
  const querySBL = `${reversedIp}.sbl.spamhaus.org`;

  //preferred as its faster
  resolve4(queryZenList, (err, addresses) => {
    if (err) {
      if (err.code === "ENOTFOUND") {
        console.log(`IP ${ip} is NOT listed in Zen Blocklist .`);
      } else {
        console.error(`Error resolving ${queryZenList}:`, err);
      }
    } else if (addresses && addresses.length > 0) {
      console.log(`IP ${ip} is listed in Zen Blocklist.`);
    }
  });

  resolve4(querySBL, (err, addresses) => {
    if (err) {
      if (err.code === "ENOTFOUND") {
        console.log(`IP ${ip} is NOT listed in SBL.`);
      } else {
        console.error(`Error resolving ${querySBL}:`, err);
      }
    } else if (addresses && addresses.length > 0) {
      console.log(`IP ${ip} is listed in SBL.`);
    }
  });
}

function resolveDomainToIpAndCheck(domain) {
  lookup(domain, (err, address) => {
    if (err) {
      console.error(`Error resolving domain ${domain}:`, err);
      return;
    }
    console.log(`Resolved IP for ${domain}: ${address}`);
    checkSpamhaus(address);
  });
}

export async function checkSpamList(domainOrIp: string) {
  // Check if input is an IP or domain
  if (ipRegex.test(domainOrIp)) {
    // It's an IP address
    console.log(`Directly checking IP: ${domainOrIp}`);
    checkSpamhaus(domainOrIp);
  } else {
    // It's a domain
    resolveDomainToIpAndCheck(domainOrIp);
  }
}
