import { MXHostType } from "./mx-host";
import { EmailType } from "./email";
import { DomainParts } from "./domain";

export enum MailBoxCanReceiveStatus {
  SAFE = "SAFE",
  UNKNOWN = "UNKNOWN",
  UNSAFE = "UNSAFE",
  HIGH_RISK = "HIGH_RISK",
}
export type MailValidatorResponse = {
  email: string;
  normalizedEmail: string | false;
  domain: DomainParts | false;
  provider: MXHostType;
  type: EmailType;
  risks: {
    validSyntax: boolean;
    disposableDomain: boolean;
    canReceive: MailBoxCanReceiveStatus;
    likelyRandomlyGenerated: boolean;
  };
};
