import net from "node:net";
import streamConsumers from "node:stream/consumers";

const kDefaultSocketServer = "whois.iana.org";

function* lazyParseIanaWhoisResponse(rawResponseStr: string) {
  const lines = rawResponseStr.split(/\r?\n/);

  for (const line of lines) {
    const safeLine = line.trim();

    if (safeLine !== "" && safeLine.charAt(0) !== "%" && safeLine.includes(":")) {
      const [key, value] = safeLine.split(":");

      yield [key.trimStart(), value.trimStart()];
    }
  }
}

export async function whois(domain: string, server = kDefaultSocketServer) {
  const client = new net.Socket();
  setImmediate(() => client.connect(43, server, () => client.write(`${domain}\r\n`)));

  const rawResponseStr = await streamConsumers.text(client);
  const response = Object.fromEntries(lazyParseIanaWhoisResponse(rawResponseStr));

  if ("refer" in response && response.refer !== server) {
    return whois(domain, response.refer);
  }

  return {
    createdOn: response["Creation Date"],
    registrar: response["Registrar"],
    status: response["Domain Status"],
    ns: response["Name Server"],
    expiresAt: response["Registry Expiry Date"],
    lastUpdate: response["Updated Date"],
  };
}
