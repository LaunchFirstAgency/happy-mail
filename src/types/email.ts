export enum EmailType {
  PERSONAL = "PERSONAL",
  BUSINESS = "BUSINESS",
  SUPPORT = "SUPPORT",
  UNKNOWN = "UNKNOWN",
  EDUCATION = "EDUCATION",
}

export default class Email {
  email: string;
  type: EmailType;
}
