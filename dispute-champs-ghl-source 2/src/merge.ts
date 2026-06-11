import type { BureauAddress, ClientProfile } from "./types";

export const mergeFields = [
  "{{CLIENT_FIRST_NAME}}",
  "{{CLIENT_LAST_NAME}}",
  "{{CLIENT_NAME}}",
  "{{CLIENT_ADDRESS}}",
  "{{CLIENT_CITY}}",
  "{{CLIENT_STATE}}",
  "{{CLIENT_ZIP}}",
  "{{CLIENT_PHONE}}",
  "{{CLIENT_EMAIL}}",
  "{{CURRENT_DATE}}",
  "{{BUREAU_NAME}}",
  "{{BUREAU_DEPARTMENT}}",
  "{{BUREAU_ADDRESS}}",
] as const;

const supportedHtmlTag =
  /<\/?(?:p|div|br|h[1-6]|ul|ol|li|blockquote|table|thead|tbody|tr|th|td|span|strong|b|em|i|u|s|mark|a)\b[^>]*>/i;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function preservePlainTextSpacing(line: string) {
  return escapeHtml(line)
    .replaceAll("\t", "&nbsp;&nbsp;&nbsp;&nbsp;")
    .replace(/^ +/, (spaces) => "&nbsp;".repeat(spaces.length))
    .replace(/ {2,}/g, (spaces) => "&nbsp;".repeat(spaces.length));
}

export function normalizeTemplateBody(body: string) {
  const normalized = body
    .replace(/\r\n?/g, "\n")
    .replace(/^\n+|\n+$/g, "");

  if (!normalized || supportedHtmlTag.test(normalized)) {
    return normalized;
  }

  return normalized
    .split(/\n[ \t]*\n+/)
    .map(
      (paragraph) =>
        `<p>${paragraph
          .split("\n")
          .map(preservePlainTextSpacing)
          .join("<br>")}</p>`,
    )
    .join("");
}

export function mergeTemplate(
  body: string,
  client: ClientProfile,
  bureau: BureauAddress,
) {
  const formattedBody = normalizeTemplateBody(body);
  const bureauAddress = [
    bureau.addressLine1,
    bureau.addressLine2,
    `${bureau.city}, ${bureau.state} ${bureau.zip}`,
  ]
    .filter(Boolean)
    .join("<br>");

  const values: Record<(typeof mergeFields)[number], string> = {
    "{{CLIENT_FIRST_NAME}}": client.firstName,
    "{{CLIENT_LAST_NAME}}": client.lastName,
    "{{CLIENT_NAME}}": `${client.firstName} ${client.lastName}`,
    "{{CLIENT_ADDRESS}}": [client.address, client.addressLine2]
      .filter(Boolean)
      .join("<br>"),
    "{{CLIENT_CITY}}": client.city,
    "{{CLIENT_STATE}}": client.state,
    "{{CLIENT_ZIP}}": client.zip,
    "{{CLIENT_PHONE}}": client.phone,
    "{{CLIENT_EMAIL}}": client.email,
    "{{CURRENT_DATE}}": new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date()),
    "{{BUREAU_NAME}}": bureau.bureau,
    "{{BUREAU_DEPARTMENT}}": bureau.department,
    "{{BUREAU_ADDRESS}}": bureauAddress,
  };

  return mergeFields.reduce(
    (result, field) => result.replaceAll(field, values[field]),
    formattedBody,
  );
}
