/**
 * Type definitions for tld-extract
 * This module doesn't have official types, so we declare them here
 */
declare module 'tld-extract' {
  interface TLDExtractResult {
    sub: string;
    domain: string;
    tld: string;
  }

  function tldExtract(hostname: string): TLDExtractResult | null;

  export = tldExtract;
}
