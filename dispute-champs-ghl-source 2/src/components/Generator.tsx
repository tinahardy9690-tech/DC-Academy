import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  Check,
  ChevronDown,
  Download,
  FolderOpen,
  FileText,
  MapPin,
  Sparkles,
  UserRound,
} from "lucide-react";
import { templateCategories } from "../data";
import { mergeTemplate } from "../merge";
import type {
  BureauAddress,
  ClientProfile,
  LetterTemplate,
} from "../types";
import { Editor } from "./Editor";

interface GeneratorProps {
  templates: LetterTemplate[];
  addresses: BureauAddress[];
  client: ClientProfile;
}

export function Generator({
  templates,
  addresses,
  client,
}: GeneratorProps) {
  const activeTemplates = useMemo(
    () => templates.filter((template) => template.isActive),
    [templates],
  );
  const [category, setCategory] = useState(
    activeTemplates[0]?.category ?? templateCategories[0],
  );
  const categoryTemplates = useMemo(
    () =>
      activeTemplates.filter((template) => template.category === category),
    [activeTemplates, category],
  );
  const [templateId, setTemplateId] = useState(
    categoryTemplates[0]?.id ?? "",
  );
  const [addressId, setAddressId] = useState(addresses[0]?.id ?? "");
  const [content, setContent] = useState("");
  const [generated, setGenerated] = useState(false);
  const [notice, setNotice] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const selectedTemplate = categoryTemplates.find(
    (template) => template.id === templateId,
  );
  const selectedAddress = addresses.find(
    (address) => address.id === addressId,
  );

  useEffect(() => {
    if (
      activeTemplates.length > 0 &&
      !activeTemplates.some((template) => template.category === category)
    ) {
      setCategory(activeTemplates[0].category);
    }
  }, [activeTemplates, category]);

  useEffect(() => {
    if (!categoryTemplates.some((template) => template.id === templateId)) {
      setTemplateId(categoryTemplates[0]?.id ?? "");
    }
  }, [categoryTemplates, templateId]);

  useEffect(() => {
    if (!addressId && addresses[0]) {
      setAddressId(addresses[0].id);
    }
  }, [addressId, addresses]);

  function generateLetter() {
    if (!selectedTemplate || !selectedAddress) return;
    setContent(mergeTemplate(selectedTemplate.body, client, selectedAddress));
    setGenerated(true);
    setNotice("Letter generated and ready to edit.");
    window.setTimeout(() => setNotice(""), 2800);
  }

  function resetGeneratedLetter() {
    setContent("");
    setGenerated(false);
  }

  async function downloadPdf() {
    if (!printRef.current || !selectedTemplate) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "letter",
      });
      const pageWidth = 612;
      const pageHeight = 792;
      const margin = 42;
      const imageWidth = pageWidth - margin * 2;
      const imageHeight = (canvas.height * imageWidth) / canvas.width;
      const image = canvas.toDataURL("image/png");
      let heightLeft = imageHeight;
      let position = margin;

      pdf.addImage(image, "PNG", margin, position, imageWidth, imageHeight);
      heightLeft -= pageHeight - margin * 2;
      while (heightLeft > 0) {
        position = margin - (imageHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(image, "PNG", margin, position, imageWidth, imageHeight);
        heightLeft -= pageHeight - margin * 2;
      }
      const safeName = selectedTemplate.templateName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      pdf.save(`${safeName}-${client.lastName.toLowerCase()}.pdf`);
      setNotice("PDF downloaded.");
      window.setTimeout(() => setNotice(""), 2800);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <main className="content-area">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Letter workspace</span>
          <h1>Generate a dispute letter</h1>
          <p>Choose a proven template, merge the client details, then personalize.</p>
        </div>
        <div className="client-pill">
          <span className="client-avatar">
            {client.firstName.charAt(0)}
            {client.lastName.charAt(0)}
          </span>
          <span>
            <small>Creating for</small>
            <strong>
              {client.firstName} {client.lastName}
            </strong>
          </span>
          <Check className="client-check" />
        </div>
      </div>

      <section className="setup-card">
        <div className="setup-step">
          <span className="step-number">1</span>
          <div className="step-copy">
            <label htmlFor="category-select">Letter category</label>
            <span>Choose the account or dispute category first.</span>
          </div>
          <div className="select-wrap">
            <FolderOpen />
            <select
              id="category-select"
              value={category}
              onChange={(event) => {
                const nextCategory = event.target.value as typeof category;
                setCategory(nextCategory);
                const firstTemplate = activeTemplates.find(
                  (template) => template.category === nextCategory,
                );
                setTemplateId(firstTemplate?.id ?? "");
                resetGeneratedLetter();
              }}
            >
              {templateCategories.map((templateCategory) => (
                <option key={templateCategory} value={templateCategory}>
                  {templateCategory}
                </option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </div>

        <div className="setup-line" />

        <div className="setup-step">
          <span className="step-number">2</span>
          <div className="step-copy">
            <label htmlFor="template-select">Letter template</label>
            <span>Select a letter available in this category.</span>
          </div>
          <div className="select-wrap">
            <FileText />
            <select
              id="template-select"
              value={templateId}
              disabled={categoryTemplates.length === 0}
              onChange={(event) => {
                setTemplateId(event.target.value);
                resetGeneratedLetter();
              }}
            >
              {categoryTemplates.length === 0 && (
                <option value="">No letters in this category yet</option>
              )}
              {categoryTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.templateName}
                </option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </div>

        <div className="setup-line" />

        <div className="setup-step">
          <span className="step-number">3</span>
          <div className="step-copy">
            <label htmlFor="bureau-select">Bureau address</label>
            <span>Choose the bureau and correct department.</span>
          </div>
          <div className="select-wrap">
            <MapPin />
            <select
              id="bureau-select"
              value={addressId}
              onChange={(event) => {
                setAddressId(event.target.value);
                resetGeneratedLetter();
              }}
            >
              {addresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.bureau} · {address.department}
                </option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </div>

        <div className="setup-line" />

        <div className="setup-step generate-step">
          <span className="step-number">4</span>
          <div className="step-copy">
            <label>Build your letter</label>
            <span>Client and bureau information will merge automatically.</span>
          </div>
          <button
            className="button button-green generate-button"
            onClick={generateLetter}
            disabled={!selectedTemplate}
          >
            <Sparkles />
            Generate letter
          </button>
        </div>
      </section>

      {!generated ? (
        <section className="empty-editor">
          <div className="empty-icon">
            <FileText />
          </div>
          <h2>Your letter will appear here</h2>
          <p>
            Select a template and bureau above, then generate a professionally
            formatted letter ready for review.
          </p>
          <div className="profile-preview">
            <UserRound />
            <span>
              <small>Profile connected</small>
              {client.email}
            </span>
          </div>
        </section>
      ) : (
        <section className="editor-section">
          <div className="section-heading">
            <div>
              <span className="status-dot" />
              <span>Generated letter</span>
              <small>Edit your letter, then download the finished PDF</small>
            </div>
            <div className="document-meta">
              {selectedAddress?.bureau} · {selectedTemplate?.category}
            </div>
          </div>
          <Editor content={content} onChange={setContent} printRef={printRef} />
          <div className="editor-actions">
            <span className="privacy-note">
              Your letter is not stored. Download it before leaving this page.
            </span>
            <div>
              <button
                className="button button-outline"
                onClick={() => void downloadPdf()}
                disabled={isExporting}
              >
                <Download />
                {isExporting ? "Preparing..." : "Download PDF"}
              </button>
            </div>
          </div>
        </section>
      )}

      {notice && (
        <div className="toast" role="status">
          <Check />
          {notice}
        </div>
      )}
    </main>
  );
}
