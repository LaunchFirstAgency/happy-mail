import { MXHostType } from "./mx-host";
import { EmailType } from "./email";
import { DomainParts } from "./domain";

export enum MailBoxCanReceiveStatus {
  SAFE = "SAFE",
  UNKNOWN = "UNKNOWN",
  UNSAFE = "UNSAFE",
  HIGH_RISK = "HIGH_RISK",
}
type MailValidatorResponse = {
  email: string;
  normalizedEmail: string | false;
  domain: DomainParts | false;
  validSyntax: boolean;
  disposableDomain: boolean;
  canReceive: MailBoxCanReceiveStatus;
  provider: MXHostType;
  type: EmailType;
};

export default MailValidatorResponse;
