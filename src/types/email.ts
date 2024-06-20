export enum EmailType {
  PERSONAL = "PERSONAL",
  BUSINESS = "BUSINESS",
  SUPPORT = "SUPPORT",
  UNKNOWN = "UNKNOWN",
  EDUCATION = "EDUCATION",
}

export type Email = {
  email: string;
  type: EmailType;
};
