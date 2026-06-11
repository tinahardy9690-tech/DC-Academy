export type TemplateCategory =
  | "Credit Bureau"
  | "Fraud & Identity"
  | "FCRA"
  | "Metro 2"
  | "Legal"
  | "Custom";

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

export interface SavedLetter {
  id: string;
  clientId: string;
  templateId: string;
  templateName: string;
  bureauAddressId: string;
  bureauName: string;
  content: string;
  pdfUrl: string | null;
  createdAt: string;
}

export type ViewName = "generator" | "templates" | "saved";
