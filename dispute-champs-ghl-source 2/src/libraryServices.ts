import { libraryPreviewResources } from "./libraryData";
import type {
  LibraryResource,
  LibraryResourceInput,
  LibraryUploadResult,
} from "./libraryTypes";

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

function isLocalPreview() {
  return ["localhost", "127.0.0.1"].includes(window.location.hostname);
}

export const libraryService = {
  async getResources(adminToken = ""): Promise<LibraryResource[]> {
    try {
      const response = await fetch("/.netlify/functions/library", {
        headers: adminToken
          ? { Authorization: `Bearer ${adminToken}` }
          : undefined,
      });
      const result = await readJson<{ resources: LibraryResource[] }>(
        response,
        "Unable to load the library.",
      );
      return result.resources;
    } catch (error) {
      if (!isLocalPreview()) throw error;
      return libraryPreviewResources;
    }
  },

  async saveResource(
    resource: LibraryResourceInput,
    adminToken: string,
  ): Promise<LibraryResource> {
    const response = await fetch("/.netlify/functions/library", {
      method: resource.id ? "PUT" : "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resource),
    });
    const result = await readJson<{ resource: LibraryResource }>(
      response,
      "Unable to save this resource.",
    );
    return result.resource;
  },

  async deleteResource(id: string, adminToken: string): Promise<void> {
    const response = await fetch(
      `/.netlify/functions/library?id=${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );
    await readJson<{ success: boolean }>(
      response,
      "Unable to delete this resource.",
    );
  },

  async uploadFile(
    file: File,
    adminToken: string,
  ): Promise<LibraryUploadResult> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/.netlify/functions/library-upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: formData,
    });
    return readJson<LibraryUploadResult>(
      response,
      "Unable to upload this file.",
    );
  },

  async deleteUpload(storageKey: string, adminToken: string): Promise<void> {
    const response = await fetch(
      `/.netlify/functions/library-upload?key=${encodeURIComponent(storageKey)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );
    await readJson<{ success: boolean }>(
      response,
      "Unable to remove the uploaded file.",
    );
  },

  getDownloadUrl(resource: LibraryResource) {
    if (resource.externalUrl) return resource.externalUrl;
    return `/.netlify/functions/library-download?id=${encodeURIComponent(resource.id)}`;
  },
};
