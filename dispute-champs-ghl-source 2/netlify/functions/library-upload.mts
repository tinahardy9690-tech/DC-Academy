import { randomUUID } from "node:crypto";
import { getStore } from "@netlify/blobs";
import {
  getAdminSessionSecret,
  getBearerToken,
  verifyAdminToken,
} from "./_shared/auth.mts";

const fileStore = getStore("dispute-champs-library-files");
const maxFileSize = 5_000_000;

function isAuthorized(request: Request) {
  const password = process.env.ADMIN_PASSWORD ?? "";
  return Boolean(
    password &&
      verifyAdminToken(
        getBearerToken(request),
        getAdminSessionSecret(password),
      ),
  );
}

function safeFileName(fileName: string) {
  const cleaned = fileName
    .normalize("NFKD")
    .replace(/[^\w.\- ]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 180);
  return cleaned || "academy-resource";
}

function isValidStorageKey(key: string) {
  return key.startsWith("files/") && !key.includes("..") && key.length <= 500;
}

export default async (request: Request) => {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (request.method === "POST") {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > maxFileSize + 1_000_000) {
      return Response.json(
        { error: "This file is larger than the 5 MB upload limit." },
        { status: 413 },
      );
    }

    const formData = await request.formData().catch(() => null);
    const file = formData?.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return Response.json(
        { error: "Please choose a file to upload." },
        { status: 400 },
      );
    }
    if (file.size > maxFileSize) {
      return Response.json(
        {
          error:
            "This file is larger than 5 MB. Use the download-link option for large resources.",
        },
        { status: 413 },
      );
    }

    const fileName = safeFileName(file.name);
    const storageKey = `files/${randomUUID()}/${fileName}`;
    await fileStore.set(storageKey, file, {
      metadata: {
        fileName,
        originalFileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
        uploadedAt: new Date().toISOString(),
      },
      onlyIfNew: true,
    });

    return Response.json(
      {
        storageKey,
        fileName,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
      },
      { status: 201 },
    );
  }

  if (request.method === "DELETE") {
    const key = new URL(request.url).searchParams.get("key") ?? "";
    if (!isValidStorageKey(key)) {
      return Response.json({ error: "File not found." }, { status: 404 });
    }
    await fileStore.delete(key);
    return Response.json({ success: true });
  }

  return Response.json({ error: "Method not allowed." }, { status: 405 });
};
