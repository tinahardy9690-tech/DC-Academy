import type {
  BureauAddress,
  ClientProfile,
  LetterTemplate,
} from "./types";

const seededAt = "2026-06-01T12:00:00.000Z";

export const demoClient: ClientProfile = {
  id: "demo-contact",
  firstName: "Jordan",
  lastName: "Williams",
  address: "1842 Magnolia Avenue",
  city: "Atlanta",
  state: "GA",
  zip: "30318",
  phone: "(404) 555-0148",
  email: "jordan.williams@example.com",
};

export const bureauAddresses: BureauAddress[] = [
  ["Experian", "Regular Dispute Address", "P.O. Box 4500", "", "Allen", "TX", "75013"],
  ["Experian", "Legal Department", "P.O. Box 4500", "Attn: Legal Department", "Allen", "TX", "75013"],
  ["Experian", "Fraud Department", "P.O. Box 9554", "", "Allen", "TX", "75013"],
  ["TransUnion", "Regular Dispute Address", "P.O. Box 2000", "", "Chester", "PA", "19016-2000"],
  ["TransUnion", "Legal Department", "P.O. Box 2000", "Attn: Legal Department", "Chester", "PA", "19016-2000"],
  ["TransUnion", "Fraud Department", "P.O. Box 2000", "Attn: Fraud Victim Assistance", "Chester", "PA", "19016-2000"],
  ["Equifax", "Regular Dispute Address", "P.O. Box 740256", "", "Atlanta", "GA", "30374-0256"],
  ["Equifax", "Legal Department", "P.O. Box 740256", "Attn: Legal Department", "Atlanta", "GA", "30374-0256"],
  ["Equifax", "Fraud Department", "P.O. Box 740256", "Attn: Fraud Department", "Atlanta", "GA", "30374-0256"],
].map((row, index) => ({
  id: `bureau-${index + 1}`,
  bureau: row[0] as BureauAddress["bureau"],
  department: row[1],
  addressLine1: row[2],
  addressLine2: row[3] || undefined,
  city: row[4],
  state: row[5],
  zip: row[6],
  isActive: true,
}));

export const starterTemplates: LetterTemplate[] = [
  {
    id: "template-initial-dispute",
    templateName: "Initial Bureau Dispute",
    category: "Miscellaneous",
    description:
      "First-round request to investigate inaccurate or unverifiable credit information.",
    isActive: true,
    createdAt: seededAt,
    updatedAt: seededAt,
    body: `<p>{{CLIENT_NAME}}<br>{{CLIENT_ADDRESS}}<br>{{CLIENT_CITY}}, {{CLIENT_STATE}} {{CLIENT_ZIP}}</p><p>{{CURRENT_DATE}}</p><p>{{BUREAU_NAME}}<br>{{BUREAU_DEPARTMENT}}<br>{{BUREAU_ADDRESS}}</p><p><strong>Re: Request for investigation of inaccurate credit information</strong></p><p>To Whom It May Concern:</p><p>I am writing to dispute inaccurate information appearing in my consumer credit file. After carefully reviewing my report, I identified information that I believe is incomplete, inaccurate, or cannot be verified.</p><p>Please conduct a reasonable reinvestigation of the disputed information in accordance with the Fair Credit Reporting Act. Please provide the method of verification used and send me an updated copy of my credit report after your investigation is complete.</p><p>The disputed items and supporting documentation are included with this letter.</p><p>Sincerely,</p><p>{{CLIENT_NAME}}</p>`,
  },
  {
    id: "template-identity-theft",
    templateName: "Identity Theft Block Request",
    category: "Fraud",
    description:
      "Requests a block of information caused by identity theft with supporting documents.",
    isActive: true,
    createdAt: seededAt,
    updatedAt: seededAt,
    body: `<p>{{CLIENT_NAME}}<br>{{CLIENT_ADDRESS}}<br>{{CLIENT_CITY}}, {{CLIENT_STATE}} {{CLIENT_ZIP}}</p><p>{{CURRENT_DATE}}</p><p>{{BUREAU_NAME}}<br>{{BUREAU_DEPARTMENT}}<br>{{BUREAU_ADDRESS}}</p><p><strong>Re: Identity theft information block request</strong></p><p>To Whom It May Concern:</p><p>I am a victim of identity theft. The items identified in my enclosed documentation do not relate to any transaction that I made or authorized.</p><p>Please block the reporting of this information, notify the relevant furnishers, and send written confirmation of the action taken. I have enclosed proof of identity, an identity theft report, and a copy of my credit report identifying the affected items.</p><p>Sincerely,</p><p>{{CLIENT_NAME}}<br>{{CLIENT_PHONE}}<br>{{CLIENT_EMAIL}}</p>`,
  },
  {
    id: "template-method-verification",
    templateName: "Method of Verification Follow-Up",
    category: "Miscellaneous",
    description:
      "Requests the procedure used to determine the accuracy of a disputed item.",
    isActive: true,
    createdAt: seededAt,
    updatedAt: seededAt,
    body: `<p>{{CLIENT_NAME}}<br>{{CLIENT_ADDRESS}}<br>{{CLIENT_CITY}}, {{CLIENT_STATE}} {{CLIENT_ZIP}}</p><p>{{CURRENT_DATE}}</p><p>{{BUREAU_NAME}}<br>{{BUREAU_DEPARTMENT}}<br>{{BUREAU_ADDRESS}}</p><p><strong>Re: Request for description of reinvestigation procedure</strong></p><p>To Whom It May Concern:</p><p>I recently received the results of your reinvestigation. I am requesting a description of the procedure used to determine the accuracy and completeness of the disputed information, including the business name, address, and telephone number of each furnisher contacted.</p><p>Please provide this information within the time allowed by applicable law.</p><p>Sincerely,</p><p>{{CLIENT_NAME}}</p>`,
  },
  {
    id: "template-intent-sue",
    templateName: "Intent to Sue Notice",
    category: "Miscellaneous",
    description: "Formal notice template reserved for administrator review.",
    isActive: false,
    createdAt: seededAt,
    updatedAt: seededAt,
    body: `<p>{{CLIENT_NAME}}<br>{{CLIENT_ADDRESS}}<br>{{CLIENT_CITY}}, {{CLIENT_STATE}} {{CLIENT_ZIP}}</p><p>{{CURRENT_DATE}}</p><p>{{BUREAU_NAME}}<br>{{BUREAU_ADDRESS}}</p><p><strong>Re: Notice of unresolved dispute</strong></p><p>To Whom It May Concern:</p><p>This letter concerns inaccurate information that remains unresolved following prior disputes. Please review the enclosed record and provide a complete written response.</p><p>Sincerely,</p><p>{{CLIENT_NAME}}</p>`,
  },
];

export const templateCategories = [
  "Collection",
  "Charge-Off Account",
  "Inquiry",
  "Personal Information",
  "Bankruptcy",
  "Late Payments",
  "Fraud",
  "Miscellaneous",
] as const;
