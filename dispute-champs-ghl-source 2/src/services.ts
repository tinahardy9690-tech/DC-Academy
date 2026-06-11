import {
  bureauAddresses,
  demoClient,
  starterTemplates,
  templateCategories,
} from "./data";
import type {
  ClientProfile,
  LetterTemplate,
  TemplateCategory,
} from "./types";

const templateStorageKey = "dc-nexgen-letter-templates-v1";
const adminSessionKey = "dc-academy-admin-session";

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

function normalizeTemplates(templates: LetterTemplate[]): LetterTemplate[] {
  return templates.map((template) => ({
    ...template,
    category: normalizeTemplateCategory(template.category),
  }));
}

async function readJson<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  const result = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | null;
  if (!response.ok) {
    throw new Error(result?.error || fallbackMessage);
  }
  return result as T;
}

export const templateService = {
  async getTemplates(adminToken = ""): Promise<LetterTemplate[]> {
    try {
      const response = await fetch("/.netlify/functions/templates", {
        headers: adminToken
          ? { Authorization: `Bearer ${adminToken}` }
          : undefined,
      });
      const result = await readJson<{ templates: LetterTemplate[] }>(
        response,
        "Unable to load shared templates.",
      );
      return normalizeTemplates(result.templates);
    } catch (error) {
      if (adminToken) throw error;
      return starterTemplates;
    }
  },

  async saveTemplates(
    templates: LetterTemplate[],
    adminToken: string,
  ): Promise<void> {
    const response = await fetch("/.netlify/functions/templates", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ templates }),
    });
    await readJson<{ success: boolean }>(
      response,
      "Unable to publish templates.",
    );
  },
};

export const adminService = {
  getSession() {
    return sessionStorage.getItem(adminSessionKey) ?? "";
  },

  async login(password: string) {
    const response = await fetch("/.netlify/functions/admin-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const result = await readJson<{ token: string }>(
      response,
      "Incorrect administrator password.",
    );
    sessionStorage.setItem(adminSessionKey, result.token);
    return result.token;
  },

  logout() {
    sessionStorage.removeItem(adminSessionKey);
  },
};

export const localTemplateMigration = {
  merge(sharedTemplates: LetterTemplate[]) {
    const stored = localStorage.getItem(templateStorageKey);
    if (!stored) return { templates: sharedTemplates, changed: false };

    const localTemplates = normalizeTemplates(
      parseStored<LetterTemplate[]>(templateStorageKey, []),
    );
    const merged = new Map(
      sharedTemplates.map((template) => [template.id, template]),
    );
    let changed = false;

    localTemplates.forEach((localTemplate) => {
      const sharedTemplate = merged.get(localTemplate.id);
      if (
        !sharedTemplate ||
        new Date(localTemplate.updatedAt).getTime() >
          new Date(sharedTemplate.updatedAt).getTime()
      ) {
        merged.set(localTemplate.id, localTemplate);
        changed = true;
      }
    });

    return { templates: Array.from(merged.values()), changed };
  },

  clear() {
    localStorage.removeItem(templateStorageKey);
  },
};

export const storageService = {
  getBureauAddresses() {
    return bureauAddresses;
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
