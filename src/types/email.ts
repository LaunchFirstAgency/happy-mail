export enum EmailType {
  PERSONAL = "PERSONAL",
  BUSINESS = "BUSINESS",
  GOVERNMENT = "GOVERNMENT",
  EDUCATION = "EDUCATION",
  SUPPORT = "SUPPORT",
  UNKNOWN = "UNKNOWN",
}

export type Email = {
  email: string;
  type: EmailType;
};
