# Dispute Champs Academy Letter Studio

A responsive credit-dispute letter generator built to run inside GoHighLevel
(GHL) websites, funnels, membership areas, custom pages, or custom menu links.
Supabase is not required.

## Included

- Template and credit-bureau selection
- Automatic client/contact merge fields
- TipTap rich-text editor
- PDF download with US Letter sizing
- Browser-based saved-letter history
- Administrator template creation, editing, deletion, and activation
- Nine preloaded Experian, TransUnion, and Equifax department addresses
- GHL URL-parameter and `postMessage` contact bridges
- Mobile and iframe-friendly layout

## Run locally

```bash
npm install
npm run dev
```

Open the address shown by Vite. The app uses a sample client when no GHL
contact information is present.

## Build

```bash
npm run typecheck
npm run build
```

The deployable static files are created in:

```text
outputs/ghl-letter-studio/
```

## Automatic Netlify deployment

The included `netlify.toml` configures Netlify automatically:

- Build command: `npm run build`
- Publish directory: `outputs/ghl-letter-studio`
- Node.js version: 22

When the application is stored in a subfolder of a GitHub repository, select
that subfolder as Netlify's Base directory when linking the repository.

Upload that entire folder to Netlify, Cloudflare Pages, Vercel, Amazon S3, or
another static host. Set the publish directory to
`outputs/ghl-letter-studio`.

## Add to GoHighLevel

## Deploy with Vercel

Import the source folder from a GitHub, GitLab, or Bitbucket repository. The
included `vercel.json` configures the Vite build automatically:

- Framework: Vite
- Build command: `npm run build`
- Output directory: `outputs/ghl-letter-studio`
- Environment variables: none

Your application will normally be available at the root of the Vercel URL:

```text
https://YOUR-PROJECT.vercel.app/
```

Do not add `/letter-studio/` unless you have separately configured that path.

### Option 1: Custom menu link

1. Host the build folder at a public HTTPS URL.
2. In GHL, open the location settings and create a Custom Menu Link.
3. Use your hosted application URL.
4. Enable the option to open it inside GHL when available.

### Option 2: Website, funnel, or membership page

Add a Custom HTML element:

```html
<iframe
  src="https://YOUR-PROJECT.vercel.app/"
  title="Dispute Champs Letter Studio"
  style="width:100%;min-height:1100px;border:0;border-radius:12px"
  allow="clipboard-read; clipboard-write"
></iframe>
```

## Merge GHL contact data

Pass contact values in the iframe or menu URL:

```text
https://YOUR-PROJECT.vercel.app/?contactId={{contact.id}}&firstName={{contact.first_name}}&lastName={{contact.last_name}}&address={{contact.address1}}&city={{contact.city}}&state={{contact.state}}&zip={{contact.postal_code}}&phone={{contact.phone}}&email={{contact.email}}
```

GHL merge-value names can vary by page type. Use the contact-value picker in
the GHL editor instead of typing the values manually when possible.

An enclosing application can also send a profile:

```js
document.querySelector("iframe").contentWindow.postMessage(
  {
    type: "DC_ACADEMY_CONTACT",
    contact: {
      id: "contact-id",
      firstName: "Jordan",
      lastName: "Williams",
      address: "1842 Magnolia Avenue",
      city: "Atlanta",
      state: "GA",
      zip: "30318",
      phone: "(404) 555-0148",
      email: "jordan@example.com"
    }
  },
  "https://YOUR-HOST"
);
```

## Storage behavior

This build deliberately requires no database. Templates and saved letters are
stored in the current browser with `localStorage`.

That means:

- Data remains after refresh on the same browser.
- Data does not automatically follow a user to another device.
- Clearing browser data removes locally saved templates and letters.

For shared, permanent records, connect the functions in `src/services.ts` to
GHL custom objects, a GHL workflow/webhook, or any external API. The optional
SQL model in `schema/optional-backend.sql` matches the current app types.

## Test checklist

1. Open the app without query parameters and confirm the demo client appears.
2. Select each template and bureau department.
3. Generate a letter and verify all `{{MERGE_FIELDS}}` are replaced.
4. Test bold, italic, underline, lists, alignment, undo, redo, copy, and paste.
5. Download the PDF and verify client, date, bureau, and margins.
6. Save a letter and verify it appears under Saved letters.
7. Create, edit, deactivate, reactivate, and delete a template.
8. Reload and confirm browser-stored changes remain.
9. Test a URL populated with GHL contact query parameters.
10. Test at mobile width and inside the final GHL iframe.

## Compliance note

The starter text is general-purpose sample content, not legal advice.
Administrators should have all production templates and bureau addresses
reviewed before use. Bureau mailing addresses can change.
