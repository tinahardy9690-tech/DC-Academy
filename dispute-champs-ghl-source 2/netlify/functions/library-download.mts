import { getStore } from "@netlify/blobs";
import type { LibraryResource } from "../../src/libraryTypes.ts";

const resourceStore = getStore("dispute-champs-library");
const fileStore = getStore("dispute-champs-library-files");

function safeDownloadName(fileName: string) {
  return fileName
    .replace(/[^\w.\- ]+/g, "")
    .replace(/[\r\n"]/g, "")
    .slice(0, 180) || "academy-resource";
}

export default async (request: Request) => {
  if (request.method !== "GET") {
    return Response.json({ error: "Method not allowed." }, { status: 405 });
  }

  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!id || id.length > 100) {
    return Response.json({ error: "Resource not found." }, { status: 404 });
  }

  const resource = (await resourceStore.get(`resources/${id}`, {
    type: "json",
    consistency: "strong",
  })) as LibraryResource | null;
  if (!resource?.isActive) {
    return Response.json({ error: "Resource not found." }, { status: 404 });
  }

  if (resource.externalUrl) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: resource.externalUrl,
        "Cache-Control": "no-store",
      },
    });
  }

  if (!resource.storageKey) {
    return Response.json(
      { error: "The resource file is not available." },
      { status: 404 },
    );
  }

  const storedFile = await fileStore.getWithMetadata(resource.storageKey, {
    type: "arrayBuffer",
    consistency: "strong",
  });
  if (!storedFile) {
    return Response.json(
      { error: "The resource file is not available." },
      { status: 404 },
    );
  }

  const metadata = storedFile.metadata as {
    fileName?: string;
    mimeType?: string;
  };
  const fileName = safeDownloadName(
    metadata.fileName || resource.fileName || "academy-resource",
  );
  const contentType =
    metadata.mimeType || resource.mimeType || "application/octet-stream";

  return new Response(storedFile.data, {
    headers: {
      "Cache-Control": "private, max-age=300",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
    },
  });
};
