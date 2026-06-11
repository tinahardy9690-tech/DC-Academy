import {
  bureauAddresses,
  demoClient,
  starterTemplates,
  templateCategories,
} from "./data";
import type {
  BureauAddress,
  ClientProfile,
  LetterTemplate,
  SavedLetter,
  TemplateCategory,
} from "./types";

const keys = {
  templates: "dc-nexgen-letter-templates-v1",
  letters: "dc-nexgen-saved-letters-v1",
};

function parseStored<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

const legacyCategoryMap: Record<string, TemplateCategory> = {
  "Credit Bureau": "Miscellaneous",
  "Fraud & Identity": "Fraud",
  FCRA: "Miscellaneous",
  "Metro 2": "Miscellaneous",
  Legal: "Miscellaneous",
  Custom: "Miscellaneous",
};

function normalizeTemplateCategory(category: string): TemplateCategory {
  if (templateCategories.includes(category as TemplateCategory)) {
    return category as TemplateCategory;
  }
  return legacyCategoryMap[category] ?? "Miscellaneous";
}

export const storageService = {
  getTemplates(): LetterTemplate[] {
    const storedTemplates = parseStored(keys.templates, starterTemplates);
    const templates = storedTemplates.map((template) => ({
      ...template,
      category: normalizeTemplateCategory(template.category),
    }));
    localStorage.setItem(keys.templates, JSON.stringify(templates));
    return templates;
  },
  setTemplates(templates: LetterTemplate[]) {
    localStorage.setItem(keys.templates, JSON.stringify(templates));
  },
  getBureauAddresses(): BureauAddress[] {
    return bureauAddresses;
  },
  getLetters(): SavedLetter[] {
    return parseStored(keys.letters, []);
  },
  setLetters(letters: SavedLetter[]) {
    localStorage.setItem(keys.letters, JSON.stringify(letters));
  },
  resetDemo() {
    localStorage.removeItem(keys.templates);
    localStorage.removeItem(keys.letters);
  },
};

const contactParamMap: Record<keyof ClientProfile, string[]> = {
  id: ["contactId", "contact_id", "id"],
  firstName: ["firstName", "first_name", "firstname"],
  lastName: ["lastName", "last_name", "lastname"],
  address: ["address", "address1", "street"],
  addressLine2: ["address2", "address_line_2"],
  city: ["city"],
  state: ["state"],
  zip: ["zip", "postalCode", "postal_code"],
  phone: ["phone"],
  email: ["email"],
};

export function getContactFromGhl(): ClientProfile {
  const params = new URLSearchParams(window.location.search);
  const profile = { ...demoClient };
  let hasLiveData = false;

  (Object.keys(contactParamMap) as (keyof ClientProfile)[]).forEach((field) => {
    const match = contactParamMap[field]
      .map((name) => params.get(name))
      .find(
        (value) =>
          value &&
          value.trim() !== "" &&
          !value.includes("{{") &&
          !value.includes("}}"),
      );
    if (match) {
      profile[field] = match;
      hasLiveData = true;
    }
  });

  return hasLiveData ? profile : demoClient;
}

export function listenForGhlContact(
  callback: (profile: ClientProfile) => void,
) {
  const onMessage = (event: MessageEvent) => {
    if (
      ["DC_ACADEMY_CONTACT", "DC_NEXGEN_CONTACT"].includes(event.data?.type) &&
      typeof event.data.contact === "object"
    ) {
      callback({ ...demoClient, ...event.data.contact });
    }
  };
  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}
