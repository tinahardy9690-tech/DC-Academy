# Dispute Champs Academy Letter Generator

A responsive course tool for generating and downloading dispute letters inside
GoHighLevel (GHL).

## Student experience

- GHL controls course access and student login.
- Students see only the Letter Generator.
- Students can choose an active shared template and bureau address.
- GHL contact values can merge into the letter.
- Students can edit the letter with the advanced rich text editor.
- Finished letters download as PDFs.
- Letters are not saved in the application or browser.
- Students cannot access the template administration tools.

## Administrator experience

Open:

```text
https://YOUR-NETLIFY-SITE.netlify.app/admin
```

The password-protected administrator area can create, edit, categorize,
activate, deactivate, and delete templates. Published changes are stored in
Netlify Blobs and become available to every student.

If an older version stored templates in the administrator's browser, the first
successful administrator login migrates those templates into the shared
library.

## Required Netlify settings

This version must be deployed from the connected GitHub repository so Netlify
can publish both the website and its secure functions.

Build settings:

- Base directory: the application folder in the repository
- Build command: `npm run build`
- Publish directory: `outputs/ghl-letter-studio`
- Functions directory: `netlify/functions`
- Node.js version: 22

Add these Netlify environment variables:

```text
ADMIN_PASSWORD=your private administrator password
ADMIN_SESSION_SECRET=a long random secret
```

Set both variables for Production. Redeploy the site after adding or changing
them.

## Run locally

```bash
npm install
npm run dev
```

The local Vite server displays the student interface. Netlify Functions and
shared Netlify Blob storage are available in Netlify deployments.

## Verify the build

```bash
npm run typecheck
npm run build
```

## Add to GoHighLevel

Add this to a GHL Custom HTML element:

```html
<iframe
  src="https://boisterous-bubblegum-82ed03.netlify.app/?contactId={{contact.id}}&firstName={{contact.first_name}}&lastName={{contact.last_name}}&address={{contact.address1}}&city={{contact.city}}&state={{contact.state}}&zip={{contact.postal_code}}&phone={{contact.phone}}&email={{contact.email}}"
  title="Dispute Champs Academy Letter Generator"
  style="width:100%;min-height:1100px;border:0;border-radius:12px"
  allow="clipboard-read; clipboard-write"
  loading="lazy"
></iframe>
```

Use GHL's merge-value picker if your contact field names differ.

## Security notes

- Never place the administrator password in GHL, frontend code, GitHub, or a
  template.
- The administrator password is checked only inside a Netlify Function.
- Administrator sessions expire after eight hours.
- Only active templates are returned to students.
- GHL protects the course page, but the raw Netlify generator URL remains a
  public web address.

## Compliance note

Starter text is general sample content, not legal advice. Review all production
templates and bureau addresses before use.
