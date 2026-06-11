import { getStore } from "@netlify/blobs";
import { starterTemplates, templateCategories } from "../../src/data.ts";
import type { LetterTemplate } from "../../src/types.ts";
import {
  getBearerToken,
  verifyAdminToken,
} from "./_shared/auth.mts";

const store = getStore("dispute-champs-academy");
const templateKey = "letter-templates";

async function getTemplates() {
  const templates = (await store.get(templateKey, {
    type: "json",
  })) as LetterTemplate[] | null;
  if (Array.isArray(templates)) return templates;
  await store.setJSON(templateKey, starterTemplates);
  return starterTemplates;
}

function isValidTemplate(value: unknown): value is LetterTemplate {
  if (!value || typeof value !== "object") return false;
  const template = value as Partial<LetterTemplate>;
  return (
    typeof template.id === "string" &&
    template.id.length > 0 &&
    template.id.length <= 100 &&
    typeof template.templateName === "string" &&
    template.templateName.length > 0 &&
    template.templateName.length <= 200 &&
    typeof template.category === "string" &&
    templateCategories.some((category) => category === template.category) &&
    typeof template.description === "string" &&
    template.description.length <= 1000 &&
    typeof template.body === "string" &&
    template.body.length > 0 &&
    template.body.length <= 250_000 &&
    typeof template.isActive === "boolean" &&
    typeof template.createdAt === "string" &&
    typeof template.updatedAt === "string"
  );
}

export default async (request: Request) => {
  if (request.method === "GET") {
    const templates = await getTemplates();
    const secret = process.env.ADMIN_SESSION_SECRET ?? "";
    const token = getBearerToken(request);
    const isAdmin = secret && verifyAdminToken(token, secret);
    if (token && !isAdmin) {
      return Response.json(
        { error: "Administrator session expired." },
        { status: 401 },
      );
    }
    return Response.json({
      templates: isAdmin
        ? templates
        : templates.filter((template) => template.isActive),
    });
  }

  if (request.method === "PUT") {
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (
      !secret ||
      !verifyAdminToken(getBearerToken(request), secret)
    ) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as {
      templates?: unknown[];
    } | null;
    if (
      !Array.isArray(body?.templates) ||
      body.templates.length > 1000 ||
      !body.templates.every(isValidTemplate)
    ) {
      return Response.json(
        { error: "One or more templates are invalid." },
        { status: 400 },
      );
    }

    await store.setJSON(templateKey, body.templates);
    return Response.json({ success: true });
  }

  return Response.json({ error: "Method not allowed." }, { status: 405 });
};
