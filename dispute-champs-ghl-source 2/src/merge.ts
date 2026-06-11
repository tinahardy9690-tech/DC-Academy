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

export function mergeTemplate(
  body: string,
  client: ClientProfile,
  bureau: BureauAddress,
) {
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
    body,
  );
}
