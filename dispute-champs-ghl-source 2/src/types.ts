export type TemplateCategory =
  | "Collection"
  | "Charge-Off Account"
  | "Inquiry"
  | "Personal Information"
  | "Bankruptcy"
  | "Late Payments"
  | "Fraud"
  | "Consumer Reporting Agencies"
  | "Check Systems and Early Warnings"
  | "Compliance Officers"
  | "Risk Officers and Registered Agents"
  | "Miscellaneous";

export interface LetterTemplate {
  id: string;
  templateName: string;
  category: TemplateCategory;
  description: string;
  body: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BureauAddress {
  id: string;
  bureau: "Experian" | "TransUnion" | "Equifax";
  department: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zip: string;
  isActive: boolean;
}

export interface ClientProfile {
  id: string;
  firstName: string;
  lastName: string;
  address: string;
  addressLine2?: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
}
