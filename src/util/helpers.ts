import isEmail from "validator/lib/isEmail";
import normalizeEmail from "validator/lib/normalizeEmail";
import parser from "tld-extract";
import { type DomainParts, MXHostType } from "@/types";

export function isValidEmail(email: string): boolean {
  return !!email && isEmail(email);
}

export function normalizeEmailAddress(email: string, provider: MXHostType): string {
  let normalEmail = normalizeEmail(email, {
    gmail_convert_googlemaildotcom: true, //convert googlemail.com to gmail.com
    gmail_remove_dots: true, //gmail dots don't matter
    all_lowercase: true,
    //removes + and everything after it
    gmail_remove_subaddress: true,
    outlookdotcom_remove_subaddress: true,
    yahoo_remove_subaddress: true,
    icloud_remove_subaddress: true,
  });

  if (provider === MXHostType.GOOGLE || provider === MXHostType.OUTLOOK) {
    const name = email.split("@")[0];
    const domain = email.split("@")[1];
    const cleanName = name.split("+")[0];
    normalEmail = `${cleanName}@${domain}`;

    return normalEmail.toLocaleLowerCase();
  }

  return normalEmail ? normalEmail.toLocaleLowerCase() : "INVALID";
}

export function splitEmailDomain(email: string): DomainParts | false {
  const address = email.split("@").pop();

  try {
    return parser(`http://${address}`);
  } catch (error) {
    console.error(`Invalid Domain for Email ${email}`, error);
    return false;
  }
}
