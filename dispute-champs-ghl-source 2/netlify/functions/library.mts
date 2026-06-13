import { randomUUID } from "node:crypto";
import { getStore } from "@netlify/blobs";
import {
  libraryCategories,
  libraryResourceTypes,
} from "../../src/libraryTypes.ts";
import type {
  LibraryResource,
  LibraryResourceInput,
} from "../../src/libraryTypes.ts";
import { inferLibraryCategory } from "../../src/libraryCategoryRules.ts";
import {
  getAdminSessionSecret,
  getBearerToken,
  verifyAdminToken,
} from "./_shared/auth.mts";

const resourceStore = getStore("dispute-champs-library");
const fileStore = getStore("dispute-champs-library-files");
const resourcePrefix = "resources/";

function resourceKey(id: string) {
  return `${resourcePrefix}${id}`;
}

async function correctImportedCategory(resource: LibraryResource) {
  if (resource.category !== "Miscellaneous") return resource;
  const category = inferLibraryCategory(resource.title, resource.fileName);
  if (!category) return resource;

  const correctedResource: LibraryResource = {
    ...resource,
    category,
    updatedAt: new Date().toISOString(),
  };
  try {
    await resourceStore.setJSON(
      resourceKey(correctedResource.id),
      correctedResource,
    );
    return correctedResource;
  } catch {
    return resource;
  }
}

function isAdminRequest(request: Request) {
  const password = process.env.ADMIN_PASSWORD ?? "";
  return Boolean(
    password &&
      verifyAdminToken(
        getBearerToken(request),
        getAdminSessionSecret(password),
      ),
  );
}

async function requireAdmin(request: Request) {
  if (!isAdminRequest(request)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  return null;
}

async function getAllResources() {
  const resources: LibraryResource[] = [];
  for await (const page of resourceStore.list({
    prefix: resourcePrefix,
    paginate: true,
  })) {
    const pageResources = await Promise.all(
      page.blobs.map(async ({ key }) => {
        const resource = (await resourceStore.get(key, {
          type: "json",
          consistency: "strong",
        })) as LibraryResource | null;
        return resource ? correctImportedCategory(resource) : null;
      }),
    );
    resources.push(
      ...pageResources.filter(
        (resource): resource is LibraryResource => Boolean(resource),
      ),
    );
  }
  return resources.sort(
    (a, b) =>
      Number(b.isFeatured) - Number(a.isFeatured) ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

async function getResource(id: string) {
  return (await resourceStore.get(resourceKey(id), {
    type: "json",
    consistency: "strong",
  })) as LibraryResource | null;
}

function isHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidInput(value: unknown): value is LibraryResourceInput {
  if (!value || typeof value !== "object") return false;
  const resource = value as Partial<LibraryResourceInput>;
  const hasUpload =
    typeof resource.storageKey === "string" &&
    resource.storageKey.startsWith("files/") &&
    resource.storageKey.length <= 500;
  const hasExternal =
    typeof resource.externalUrl === "string" &&
    resource.externalUrl.length <= 2000 &&
    isHttpsUrl(resource.externalUrl);
  return (
    (resource.id === undefined ||
      (typeof resource.id === "string" &&
        resource.id.length > 0 &&
        resource.id.length <= 100)) &&
    typeof resource.title === "string" &&
    resource.title.trim().length > 0 &&
    resource.title.length <= 240 &&
    typeof resource.description === "string" &&
    resource.description.trim().length > 0 &&
    resource.description.length <= 2000 &&
    typeof resource.category === "string" &&
    libraryCategories.includes(resource.category) &&
    typeof resource.resourceType === "string" &&
    libraryResourceTypes.includes(resource.resourceType) &&
    Array.isArray(resource.tags) &&
    resource.tags.length <= 30 &&
    resource.tags.every(
      (tag) => typeof tag === "string" && tag.length > 0 && tag.length <= 80,
    ) &&
    typeof resource.fileName === "string" &&
    resource.fileName.length <= 300 &&
    typeof resource.fileSize === "number" &&
    resource.fileSize >= 0 &&
    resource.fileSize <= 25_000_000 &&
    typeof resource.mimeType === "string" &&
    resource.mimeType.length <= 200 &&
    (resource.coverImageUrl === undefined ||
      resource.coverImageUrl === "" ||
      (typeof resource.coverImageUrl === "string" &&
        resource.coverImageUrl.length <= 2000 &&
        isHttpsUrl(resource.coverImageUrl))) &&
    typeof resource.isFeatured === "boolean" &&
    typeof resource.isActive === "boolean" &&
    ((hasUpload && !hasExternal) || (hasExternal && !hasUpload))
  );
}

function cleanInput(input: LibraryResourceInput) {
  const category =
    input.category === "Miscellaneous"
      ? inferLibraryCategory(input.title, input.fileName) ?? input.category
      : input.category;
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    category,
    resourceType: input.resourceType,
    tags: Array.from(
      new Set(input.tags.map((tag) => tag.trim()).filter(Boolean)),
    ),
    fileName: input.fileName.trim(),
    fileSize: input.fileSize,
    mimeType: input.mimeType.trim(),
    storageKey: input.storageKey || undefined,
    externalUrl: input.externalUrl || undefined,
    coverImageUrl: input.coverImageUrl?.trim() || undefined,
    isFeatured: input.isFeatured,
    isActive: input.isActive,
  };
}

export default async (request: Request) => {
  if (request.method === "GET") {
    const suppliedToken = getBearerToken(request);
    const isAdmin = isAdminRequest(request);
    if (suppliedToken && !isAdmin) {
      return Response.json(
        { error: "Administrator session expired." },
        { status: 401 },
      );
    }
    const resources = await getAllResources();
    return Response.json(
      {
        resources: isAdmin
          ? resources
          : resources.filter((resource) => resource.isActive),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  if (request.method === "POST") {
    const input = (await request.json().catch(() => null)) as unknown;
    if (!isValidInput(input)) {
      return Response.json(
        { error: "Please complete all required resource details." },
        { status: 400 },
      );
    }
    const timestamp = new Date().toISOString();
    const resource: LibraryResource = {
      id: randomUUID(),
      ...cleanInput(input),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await resourceStore.setJSON(resourceKey(resource.id), resource, {
      onlyIfNew: true,
    });
    return Response.json({ resource }, { status: 201 });
  }

  if (request.method === "PUT") {
    const input = (await request.json().catch(() => null)) as unknown;
    if (!isValidInput(input) || !input.id) {
      return Response.json(
        { error: "This resource could not be updated." },
        { status: 400 },
      );
    }
    const existing = await getResource(input.id);
    if (!existing) {
      return Response.json({ error: "Resource not found." }, { status: 404 });
    }
    const resource: LibraryResource = {
      id: existing.id,
      ...cleanInput(input),
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    await resourceStore.setJSON(resourceKey(resource.id), resource);
    return Response.json({ resource });
  }

  if (request.method === "DELETE") {
    const id = new URL(request.url).searchParams.get("id") ?? "";
    if (!id || id.length > 100) {
      return Response.json({ error: "Resource not found." }, { status: 404 });
    }
    const resource = await getResource(id);
    if (!resource) {
      return Response.json({ error: "Resource not found." }, { status: 404 });
    }
    await resourceStore.delete(resourceKey(id));
    if (resource.storageKey) {
      await fileStore.delete(resource.storageKey).catch(() => {});
    }
    return Response.json({ success: true });
  }

  return Response.json({ error: "Method not allowed." }, { status: 405 });
};
