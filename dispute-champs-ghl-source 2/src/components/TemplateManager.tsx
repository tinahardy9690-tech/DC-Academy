import { useMemo, useRef, useState } from "react";
import {
  Check,
  Copy,
  FilePlus2,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
const textFileExtensions = [
  ".txt",
  ".text",
  ".html",
  ".htm",
  ".md",
  ".rtf",
];

type ImportedFile = File & { importPath?: string };
type FileSystemEntry = {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
};
type FileSystemFileEntry = FileSystemEntry & {
  file: (successCallback: (file: File) => void) => void;
};
type FileSystemDirectoryEntry = FileSystemEntry & {
  createReader: () => {
    readEntries: (successCallback: (entries: FileSystemEntry[]) => void) => void;
  };
};
type DataTransferItemWithEntry = DataTransferItem & {
  webkitGetAsEntry?: () => FileSystemEntry | null;
};

function getImportPath(file: ImportedFile) {
  return file.importPath || file.webkitRelativePath || file.name;
}

function readFileEntry(entry: FileSystemFileEntry, path: string) {
  return new Promise<File>((resolve) => {
    entry.file((file) => {
      (file as ImportedFile).importPath = `${path}${file.name}`;
      resolve(file);
    });
  });
}

function readDirectoryEntries(
  reader: ReturnType<FileSystemDirectoryEntry["createReader"]>,
) {
  return new Promise<FileSystemEntry[]>((resolve) => {
    reader.readEntries(resolve);
  });
}

async function readEntryFiles(entry: FileSystemEntry, path = ""): Promise<File[]> {
  if (entry.isFile) {
    return [await readFileEntry(entry as FileSystemFileEntry, path)];
  }
  if (!entry.isDirectory) return [];

  const reader = (entry as FileSystemDirectoryEntry).createReader();
  const files: File[] = [];
  let entries = await readDirectoryEntries(reader);

  while (entries.length) {
    const nestedFiles = await Promise.all(
      entries.map((nestedEntry) =>
        readEntryFiles(nestedEntry, `${path}${entry.name}/`),
      ),
    );
    files.push(...nestedFiles.flat());
    entries = await readDirectoryEntries(reader);
  }

  return files;
}

async function getDroppedFiles(dataTransfer: DataTransfer) {
  const entries = Array.from(dataTransfer.items)
    .map((item) => (item as DataTransferItemWithEntry).webkitGetAsEntry?.())
    .filter((entry): entry is FileSystemEntry => Boolean(entry));

  if (!entries.length) return Array.from(dataTransfer.files);

  const files = await Promise.all(entries.map((entry) => readEntryFiles(entry)));
  return files.flat();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatTemplateBody(content: string) {
  const trimmed = content.trim();
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return trimmed;
  return trimmed
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function formatTemplateName(file: File) {
  return file.name
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function inferTemplateCategory(file: File): TemplateCategory {
  const source = `${getImportPath(file)} ${file.name}`.toLowerCase();
  if (
    source.includes("consumer reporting") ||
    source.includes("credit reporting agenc") ||
    source.includes("cra") ||
    source.includes("experian") ||
    source.includes("equifax") ||
    source.includes("transunion") ||
    source.includes("trans union")
  ) {
    return "Consumer Reporting Agencies";
  }
  if (
    source.includes("check system") ||
    source.includes("chexsystem") ||
    source.includes("chex system") ||
    source.includes("early warning") ||
    source.includes("ews")
  ) {
    return "Check Systems and Early Warnings";
  }
  if (source.includes("compliance officer") || source.includes("compliance")) {
    return "Compliance Officers";
  }
  if (
    source.includes("risk officer") ||
    source.includes("registered agent") ||
    source.includes("risk") ||
    source.includes("agent")
  ) {
    return "Risk Officers and Registered Agents";
  }
  if (source.includes("collection")) return "Collection";
  if (source.includes("charge off") || source.includes("charge-off")) {
    return "Charge-Off Account";
  }
  if (source.includes("inquiry") || source.includes("inquiries")) {
    return "Inquiry";
  }
  if (source.includes("personal information") || source.includes("personal info")) {
    return "Personal Information";
  }
  if (source.includes("bankruptcy")) return "Bankruptcy";
  if (source.includes("late payment") || source.includes("payment history")) {
    return "Late Payments";
  }
  if (source.includes("fraud") || source.includes("identity theft")) {
    return "Fraud";
  }
  return "Miscellaneous";
}

function canImportFile(file: File) {
  const name = file.name.toLowerCase();
  return textFileExtensions.some((extension) => name.endsWith(extension));
}
import { mergeFields } from "../merge";
import { templateCategories } from "../data";
import type { LetterTemplate, TemplateCategory } from "../types";

interface TemplateManagerProps {
  templates: LetterTemplate[];
  onChange: (templates: LetterTemplate[]) => void;
}

const blankTemplate = {
  templateName: "",
  category: "Collection" as TemplateCategory,
  description: "",
  body: "<p>{{CLIENT_NAME}}<br>{{CLIENT_ADDRESS}}<br>{{CLIENT_CITY}}, {{CLIENT_STATE}} {{CLIENT_ZIP}}</p><p>{{CURRENT_DATE}}</p><p>{{BUREAU_NAME}}<br>{{BUREAU_ADDRESS}}</p><p>To Whom It May Concern:</p><p>Write your letter here.</p><p>Sincerely,</p><p>{{CLIENT_NAME}}</p>",
  isActive: true,
};

export function TemplateManager({
  templates,
  onChange,
}: TemplateManagerProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    TemplateCategory | "All Categories"
  >("All Categories");
  const [editing, setEditing] = useState<LetterTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(blankTemplate);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return templates.filter(
      (template) =>
        (categoryFilter === "All Categories" ||
          template.category === categoryFilter) &&
        (template.templateName.toLowerCase().includes(query) ||
          template.category.toLowerCase().includes(query)),
    );
  }, [categoryFilter, search, templates]);

  function openNew() {
    setEditing(null);
    setDraft(blankTemplate);
    setShowForm(true);
  }

  function openEdit(template: LetterTemplate) {
    setEditing(template);
    setDraft({
      templateName: template.templateName,
      category: template.category,
      description: template.description,
      body: template.body,
      isActive: template.isActive,
    });
    setShowForm(true);
  }

  function saveTemplate() {
    if (!draft.templateName.trim() || !draft.body.trim()) return;
    const now = new Date().toISOString();
    if (editing) {
      onChange(
        templates.map((template) =>
          template.id === editing.id
            ? { ...template, ...draft, updatedAt: now }
            : template,
        ),
      );
    } else {
      onChange([
        {
          ...draft,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        },
        ...templates,
      ]);
    }
    setShowForm(false);
  }

  function insertField(field: string) {
    setDraft((current) => ({ ...current, body: `${current.body}${field}` }));
  }
  async function importTemplateFiles(fileList: FileList | File[]) {
  const files = Array.from(fileList).filter(canImportFile);
  if (!files.length) {
    window.alert("No supported letter files were found in that folder.");
    return;
  }

  const now = new Date().toISOString();
  const importedTemplates = await Promise.all(
    files.map(async (file) => ({
      id: crypto.randomUUID(),
      templateName: formatTemplateName(file),
      category: inferTemplateCategory(file),
      description: `Imported from ${getImportPath(file)}.`,
      body: formatTemplateBody(await file.text()),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })),
  );

  onChange([...templates, ...importedTemplates]);
}

  return (
    <main className="content-area">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Administrator tools</span>
          <h1>Letter Templates</h1>
          <p>Create and manage the letters available to your students.</p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
  <button
    className="button button-blue"
    onClick={() => folderInputRef.current?.click()}
    onDragOver={(event) => event.preventDefault()}
    onDrop={(event) => {
      event.preventDefault();
      void getDroppedFiles(event.dataTransfer).then(importTemplateFiles);
    }}
  >
    <UploadCloud />
    Import Folder
  </button>
  <input
    ref={(node) => {
      folderInputRef.current = node;
      node?.setAttribute("webkitdirectory", "");
      node?.setAttribute("directory", "");
    }}
    type="file"
    multiple
    hidden
    onChange={(event) => {
      if (event.target.files?.length) {
        void importTemplateFiles(event.target.files);
      }
      event.target.value = "";
    }}
  />
  <button className="button button-blue" onClick={openNew}>
    <Plus />
    New Template
  </button>
</div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-icon blue">
            <FileText />
          </span>
          <span>
            <strong>{templates.length}</strong>
            Total templates
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-icon green">
            <Check />
          </span>
          <span>
            <strong>{templates.filter((template) => template.isActive).length}</strong>
            Active templates
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-icon violet">
            <Copy />
          </span>
          <span>
            <strong>{templateCategories.length}</strong>
            Categories
          </span>
        </div>
      </div>

      <section className="library-card">
        <div className="library-toolbar">
          <div>
            <h2>Template Library</h2>
            <p>Activate, edit, or remove your reusable letter content.</p>
          </div>
          <div
            className="library-filters"
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <label
              className="search-box"
              style={{ width: "190px", paddingRight: "8px" }}
            >
              <select
                aria-label="Category"
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(
                    event.target.value as
                      | TemplateCategory
                      | "All Categories",
                  )
                }
                style={{
                  width: "100%",
                  height: "100%",
                  color: "#435168",
                  background: "transparent",
                  border: 0,
                  outline: 0,
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                <option>All Categories</option>
                {templateCategories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <label className="search-box">
              <Search />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search templates..."
              />
            </label>
          </div>
        </div>

        <div className="template-list">
          {filtered.map((template) => (
            <article className="template-row" key={template.id}>
              <span className={`template-file ${template.isActive ? "" : "inactive"}`}>
                <FileText />
              </span>
              <div className="template-main">
                <div className="template-title-line">
                  <h3>{template.templateName}</h3>
                  <span className="category-chip">{template.category}</span>
                  {!template.isActive && <span className="inactive-chip">Inactive</span>}
                </div>
                <p>{template.description || "No description added."}</p>
                <small>
                  Updated{" "}
                  {new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }).format(new Date(template.updatedAt))}
                </small>
              </div>
              <div className="template-actions">
                <label className="switch" title="Activate template">
                  <input
                    type="checkbox"
                    checked={template.isActive}
                    onChange={() =>
                      onChange(
                        templates.map((item) =>
                          item.id === template.id
                            ? {
                                ...item,
                                isActive: !item.isActive,
                                updatedAt: new Date().toISOString(),
                              }
                            : item,
                        ),
                      )
                    }
                  />
                  <span />
                </label>
                <button className="icon-button" onClick={() => openEdit(template)}>
                  <Pencil />
                </button>
                <button
                  className="icon-button danger"
                  onClick={() => {
                    if (window.confirm(`Delete "${template.templateName}"?`)) {
                      onChange(templates.filter((item) => item.id !== template.id));
                    }
                  }}
                >
                  <Trash2 />
                </button>
              </div>
            </article>
          ))}
          {filtered.length === 0 && (
            <div className="no-results">No templates match that search.</div>
          )}
        </div>
      </section>

      {showForm && (
        <div className="modal-backdrop" role="presentation">
          <div className="template-modal" role="dialog" aria-modal="true">
            <div className="modal-heading">
              <div>
                <span className="modal-icon">
                  <FilePlus2 />
                </span>
                <span>
                  <h2>{editing ? "Edit Template" : "New Letter Template"}</h2>
                  <p>Use merge fields to personalize every generated letter.</p>
                </span>
              </div>
              <button className="icon-button" onClick={() => setShowForm(false)}>
                <X />
              </button>
            </div>
            <div className="form-grid">
              <label>
                Template name
                <input
                  value={draft.templateName}
                  onChange={(event) =>
                    setDraft({ ...draft, templateName: event.target.value })
                  }
                  placeholder="Example: Initial dispute"
                />
              </label>
              <label>
                Letter category
                <select
                  required
                  value={draft.category}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      category: event.target.value as TemplateCategory,
                    })
                  }
                >
                  {templateCategories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
                <small>
                  Students will find this letter under the selected category.
                </small>
              </label>
              <label className="full-field">
                Description
                <input
                  value={draft.description}
                  onChange={(event) =>
                    setDraft({ ...draft, description: event.target.value })
                  }
                  placeholder="Tell students when to use this template"
                />
              </label>
              <label className="full-field">
                Template body
                <textarea
                  value={draft.body}
                  onChange={(event) =>
                    setDraft({ ...draft, body: event.target.value })
                  }
                  rows={12}
                />
              </label>
              <div className="full-field merge-field-panel">
                <span>Insert merge field</span>
                <div>
                  {mergeFields.map((field) => (
                    <button key={field} onClick={() => insertField(field)}>
                      {field}
                    </button>
                  ))}
                </div>
              </div>
              <label className="active-checkbox full-field">
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={(event) =>
                    setDraft({ ...draft, isActive: event.target.checked })
                  }
                />
                Make this template available in the generator
              </label>
            </div>
            <div className="modal-actions">
              <button className="button button-plain" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button className="button button-green" onClick={saveTemplate}>
                <Check />
                Save template
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
