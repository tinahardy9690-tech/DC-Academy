import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  Download,
  Edit3,
  ExternalLink,
  FilePlus2,
  KeyRound,
  LibraryBig,
  LogOut,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import academyLogo from "../assets/dispute-champs-academy-logo.png";
import { libraryService } from "../libraryServices";
import {
  libraryCategories,
  libraryResourceTypes,
} from "../libraryTypes";
import type {
  LibraryCategory,
  LibraryResource,
  LibraryResourceInput,
  LibraryResourceType,
} from "../libraryTypes";
import { adminService } from "../services";
import "../library.css";

type SourceChoice = "upload" | "external";

const emptyForm: LibraryResourceInput = {
  title: "",
  description: "",
  category: "Education",
  resourceType: "E-book",
  tags: [],
  fileName: "",
  fileSize: 0,
  mimeType: "",
  externalUrl: "",
  coverImageUrl: "",
  isFeatured: false,
  isActive: true,
};

function formatFileSize(bytes: number) {
  if (!bytes) return "Link";
  if (bytes < 1_000_000) return `${Math.max(1, Math.round(bytes / 1000))} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

function ResourceForm({
  resource,
  busy,
  onClose,
  onSave,
}: {
  resource: LibraryResource | null;
  busy: boolean;
  onClose: () => void;
  onSave: (
    input: LibraryResourceInput,
    file: File | null,
    source: SourceChoice,
  ) => Promise<void>;
}) {
  const [form, setForm] = useState<LibraryResourceInput>(() =>
    resource ? { ...resource } : { ...emptyForm },
  );
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState<SourceChoice>(
    resource?.externalUrl ? "external" : "upload",
  );
  const [tags, setTags] = useState(resource?.tags.join(", ") ?? "");

  function setField<K extends keyof LibraryResourceInput>(
    field: K,
    value: LibraryResourceInput[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  const hasExistingUpload = source === "upload" && Boolean(form.storageKey);
  const canSave =
    form.title.trim() &&
    form.description.trim() &&
    (source === "external"
      ? Boolean(form.externalUrl?.trim())
      : Boolean(file || hasExistingUpload));

  return (
    <div className="library-admin-modal-backdrop">
      <section
        className="library-admin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="resource-form-title"
      >
        <header>
          <div>
            <span>{resource ? "Update Resource" : "New Library Resource"}</span>
            <h2 id="resource-form-title">
              {resource ? resource.title : "Add a student download"}
            </h2>
          </div>
          <button onClick={onClose} disabled={busy} aria-label="Close">
            <X />
          </button>
        </header>

        <div className="library-admin-form">
          <label className="form-wide">
            Resource title
            <input
              value={form.title}
              onChange={(event) => setField("title", event.target.value)}
              placeholder="Example: Collection Account Review Checklist"
            />
          </label>
          <label className="form-wide">
            Short description
            <textarea
              value={form.description}
              onChange={(event) => setField("description", event.target.value)}
              placeholder="Tell students what this resource helps them learn or complete."
              rows={4}
            />
          </label>
          <label>
            Category
            <select
              value={form.category}
              onChange={(event) =>
                setField("category", event.target.value as LibraryCategory)
              }
            >
              {libraryCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label>
            Resource type
            <select
              value={form.resourceType}
              onChange={(event) =>
                setField(
                  "resourceType",
                  event.target.value as LibraryResourceType,
                )
              }
            >
              {libraryResourceTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="form-wide">
            Search tags
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="collections, validation, checklist"
            />
            <small>Separate tags with commas.</small>
          </label>
          <label className="form-wide">
            Optional cover image link
            <input
              value={form.coverImageUrl ?? ""}
              onChange={(event) =>
                setField("coverImageUrl", event.target.value)
              }
              placeholder="https://..."
            />
          </label>

          <fieldset className="form-wide source-choice">
            <legend>How should students receive this resource?</legend>
            <button
              type="button"
              className={source === "upload" ? "active" : ""}
              onClick={() => setSource("upload")}
            >
              <UploadCloud />
              <span>
                <strong>Upload a file</strong>
                PDF, Word, spreadsheet, ZIP, image, or e-book
              </span>
            </button>
            <button
              type="button"
              className={source === "external" ? "active" : ""}
              onClick={() => setSource("external")}
            >
              <ExternalLink />
              <span>
                <strong>Use a download link</strong>
                Best for very large files or videos
              </span>
            </button>
          </fieldset>

          {source === "upload" ? (
            <label className="form-wide file-drop">
              <UploadCloud />
              <span>
                <strong>
                  {file
                    ? file.name
                    : hasExistingUpload
                      ? form.fileName
                      : "Choose a file from your computer"}
                </strong>
                {file
                  ? formatFileSize(file.size)
                  : hasExistingUpload
                    ? "Keep this file or choose a replacement"
                    : "Maximum file size: 5 MB"}
              </span>
              <input
                type="file"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
          ) : (
            <label className="form-wide">
              Download link
              <input
                type="url"
                value={form.externalUrl ?? ""}
                onChange={(event) =>
                  setField("externalUrl", event.target.value)
                }
                placeholder="https://..."
              />
              <small>
                Paste the direct link students should open or download.
              </small>
            </label>
          )}

          <div className="form-wide publish-options">
            <label>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setField("isActive", event.target.checked)
                }
              />
              <span>
                <strong>Published</strong>
                Students can see and download it
              </span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) =>
                  setField("isFeatured", event.target.checked)
                }
              />
              <span>
                <strong>Featured</strong>
                Show it near the top of the library
              </span>
            </label>
          </div>
        </div>

        <footer>
          <button className="admin-secondary-button" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            className="admin-primary-button"
            disabled={busy || !canSave}
            onClick={() =>
              void onSave(
                {
                  ...form,
                  tags: tags
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                  externalUrl:
                    source === "external" ? form.externalUrl?.trim() : "",
                  storageKey:
                    source === "upload" ? form.storageKey : undefined,
                },
                file,
                source,
              )
            }
          >
            {busy ? (
              "Publishing..."
            ) : (
              <>
                <Check />
                {resource ? "Save Changes" : "Publish Resource"}
              </>
            )}
          </button>
        </footer>
      </section>
    </div>
  );
}

export function LibraryAdmin() {
  const [token, setToken] = useState(() => {
    const isLocalPreview =
      ["localhost", "127.0.0.1"].includes(window.location.hostname) &&
      new URLSearchParams(window.location.search).get("preview") === "1";
    return adminService.getSession() || (isLocalPreview ? "local-preview" : "");
  });
  const [password, setPassword] = useState("");
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<LibraryCategory | "All">("All");
  const [editing, setEditing] = useState<LibraryResource | null | undefined>();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadResources(activeToken = token) {
    const items = await libraryService.getResources(activeToken);
    setResources(items);
  }

  useEffect(() => {
    if (!token) return;
    let active = true;
    setBusy(true);
    void libraryService
      .getResources(token)
      .then((items) => {
        if (active) setResources(items);
      })
      .catch(() => {
        if (active) {
          adminService.logout();
          setToken("");
          setError("Your administrator session expired. Please sign in again.");
        }
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const filteredResources = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return resources.filter(
      (resource) =>
        (category === "All" || resource.category === category) &&
        (!normalizedQuery ||
          [
            resource.title,
            resource.description,
            resource.category,
            ...resource.tags,
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery)),
    );
  }, [category, query, resources]);

  const publishedCount = resources.filter((item) => item.isActive).length;
  const featuredCount = resources.filter((item) => item.isFeatured).length;
  const usedCategories = new Set(resources.map((item) => item.category)).size;

  async function login() {
    if (!password.trim()) return;
    setBusy(true);
    setError("");
    try {
      const nextToken = await adminService.login(password);
      setToken(nextToken);
      setPassword("");
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Administrator login failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveResource(
    input: LibraryResourceInput,
    file: File | null,
    source: SourceChoice,
  ) {
    setBusy(true);
    setError("");
    setStatus("Preparing your resource...");
    let newUploadKey = "";
    try {
      let nextInput = { ...input };
      const oldStorageKey = editing?.storageKey;
      if (source === "upload" && file) {
        setStatus("Uploading the file...");
        const upload = await libraryService.uploadFile(file, token);
        newUploadKey = upload.storageKey;
        nextInput = {
          ...nextInput,
          ...upload,
          externalUrl: "",
        };
      } else if (source === "external") {
        nextInput = {
          ...nextInput,
          storageKey: undefined,
          fileName: nextInput.fileName || "Online resource",
          fileSize: 0,
          mimeType: "text/html",
        };
      }

      setStatus("Publishing to the student library...");
      await libraryService.saveResource(nextInput, token);
      if (
        oldStorageKey &&
        (source === "external" || (newUploadKey && oldStorageKey !== newUploadKey))
      ) {
        await libraryService.deleteUpload(oldStorageKey, token).catch(() => {});
      }
      await loadResources();
      setEditing(undefined);
      setStatus("Resource published successfully.");
    } catch (saveError) {
      if (newUploadKey) {
        await libraryService.deleteUpload(newUploadKey, token).catch(() => {});
      }
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The resource could not be published.",
      );
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  async function deleteResource(resource: LibraryResource) {
    if (
      !window.confirm(
        `Delete "${resource.title}" from the library? This cannot be undone.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError("");
    setStatus("Removing the resource...");
    try {
      await libraryService.deleteResource(resource.id, token);
      setResources((items) => items.filter((item) => item.id !== resource.id));
      setStatus("Resource removed.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "The resource could not be removed.",
      );
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  async function togglePublished(resource: LibraryResource) {
    setBusy(true);
    setError("");
    try {
      const updated = await libraryService.saveResource(
        { ...resource, isActive: !resource.isActive },
        token,
      );
      setResources((items) =>
        items.map((item) => (item.id === updated.id ? updated : item)),
      );
      setStatus(
        updated.isActive
          ? "Resource published to students."
          : "Resource hidden from students.",
      );
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "The publishing status could not be changed.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <main className="library-admin-login">
        <section>
          <img src={academyLogo} alt="Dispute Champs Academy" />
          <span className="library-admin-key">
            <KeyRound />
          </span>
          <span className="library-admin-kicker">Protected Area</span>
          <h1>Library Administration</h1>
          <p>
            Sign in to add and manage the downloads available to Academy
            students.
          </p>
          <label>
            Administrator password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void login();
              }}
              autoComplete="current-password"
            />
          </label>
          <button
            onClick={() => void login()}
            disabled={busy || !password.trim()}
          >
            <ShieldCheck />
            {busy ? "Checking..." : "Open Library Administration"}
          </button>
          {error && <div className="library-admin-message error">{error}</div>}
          <a href="/library">Return to Student Library</a>
        </section>
      </main>
    );
  }

  return (
    <div className="library-admin-page">
      <header className="library-admin-bar">
        <div>
          <img src={academyLogo} alt="Dispute Champs Academy" />
          <span>
            <small>Protected Administrator Area</small>
            <strong>Download Library</strong>
          </span>
        </div>
        <nav>
          <a href="/library" target="_blank">
            <ExternalLink />
            View Student Library
          </a>
          <a href="/admin">Letter Templates</a>
          <button
            onClick={() => {
              adminService.logout();
              setToken("");
            }}
          >
            <LogOut />
            Log Out
          </button>
        </nav>
      </header>

      <main className="library-admin-content">
        <section className="library-admin-heading">
          <div>
            <span>
              <Sparkles />
              Academy Resource Manager
            </span>
            <h1>Build Your Student Library</h1>
            <p>
              Add e-books, templates, guides, worksheets, videos, and reference
              materials without a small fixed resource limit.
            </p>
          </div>
          <button onClick={() => setEditing(null)}>
            <FilePlus2 />
            Add New Resource
          </button>
        </section>

        {(status || error) && (
          <div
            className={`library-admin-message ${error ? "error" : "success"}`}
          >
            {error || status}
          </div>
        )}

        <section className="library-admin-stats">
          <article>
            <span className="stat-icon blue">
              <LibraryBig />
            </span>
            <span>
              <small>Total Resources</small>
              <strong>{resources.length}</strong>
            </span>
          </article>
          <article>
            <span className="stat-icon green">
              <Check />
            </span>
            <span>
              <small>Published</small>
              <strong>{publishedCount}</strong>
            </span>
          </article>
          <article>
            <span className="stat-icon orange">
              <Sparkles />
            </span>
            <span>
              <small>Featured</small>
              <strong>{featuredCount}</strong>
            </span>
          </article>
          <article>
            <span className="stat-icon aqua">
              <BookOpen />
            </span>
            <span>
              <small>Categories Used</small>
              <strong>{usedCategories}</strong>
            </span>
          </article>
        </section>

        <section className="library-admin-panel">
          <header>
            <div>
              <span>Resource Catalog</span>
              <h2>Manage student downloads</h2>
            </div>
            <div className="library-admin-filters">
              <label>
                <Search />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search resources..."
                />
              </label>
              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as LibraryCategory | "All")
                }
              >
                <option value="All">All Categories</option>
                {libraryCategories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </header>

          {busy && !resources.length ? (
            <div className="library-admin-empty">Loading your resources...</div>
          ) : filteredResources.length ? (
            <div className="library-admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Resource</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>File</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {filteredResources.map((resource) => (
                    <tr key={resource.id}>
                      <td>
                        <span className="admin-resource-title">
                          <strong>{resource.title}</strong>
                          <small>{resource.description}</small>
                        </span>
                      </td>
                      <td>
                        <span className="admin-category-pill">
                          {resource.category}
                        </span>
                      </td>
                      <td>{resource.resourceType}</td>
                      <td>
                        <button
                          className={`admin-status-toggle ${
                            resource.isActive ? "published" : ""
                          }`}
                          onClick={() => void togglePublished(resource)}
                          disabled={busy}
                        >
                          <i />
                          {resource.isActive ? "Published" : "Hidden"}
                        </button>
                      </td>
                      <td>
                        <a
                          className="admin-file-link"
                          href={libraryService.getDownloadUrl(resource)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Download />
                          {resource.fileName || "Open link"}
                        </a>
                      </td>
                      <td>
                        <span className="admin-row-actions">
                          <button
                            onClick={() => setEditing(resource)}
                            aria-label={`Edit ${resource.title}`}
                          >
                            <Edit3 />
                          </button>
                          <button
                            className="delete"
                            onClick={() => void deleteResource(resource)}
                            aria-label={`Delete ${resource.title}`}
                          >
                            <Trash2 />
                          </button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="library-admin-empty">
              <LibraryBig />
              <h3>
                {resources.length
                  ? "No resources match these filters"
                  : "Your library is ready for its first resource"}
              </h3>
              <p>
                {resources.length
                  ? "Clear your search or choose another category."
                  : "Add an e-book, template, guide, or other student download."}
              </p>
              {!resources.length && (
                <button onClick={() => setEditing(null)}>
                  <FilePlus2 />
                  Add First Resource
                </button>
              )}
            </div>
          )}
        </section>
      </main>

      {editing !== undefined && (
        <ResourceForm
          resource={editing}
          busy={busy}
          onClose={() => setEditing(undefined)}
          onSave={saveResource}
        />
      )}
    </div>
  );
}
