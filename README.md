# Sumita Pilates Studio — Static Website Prototype

A multi-page, data-driven Pilates studio website that works on GitHub Pages without a build system, database or paid hosting.

## Why this is not one giant `index.html`

The project separates **content**, **design** and **behaviour**:

- HTML pages contain page structure.
- `assets/css/styles.css` controls the full visual design.
- `assets/js/` contains reusable behaviour.
- `data/` contains the public business information owners may change.
- `docs/` explains deployment, private-workbook mapping and what is not live yet.

This is easier to maintain than putting HTML, CSS, JavaScript and all data into one file.

## Open it now

Double-click `index.html`. The project uses JavaScript data files instead of `fetch()`, so the public pages can also work when opened directly from a complete local folder.

## Main public pages

- `index.html` — home page
- `schedule.html` — 21-day class schedule, filters, capacity and prototype booking
- `passes.html` — class packs and memberships
- `instructors.html` — instructor profiles
- `about.html` — studio story, values and FAQ
- `contact.html` — email/phone/WhatsApp contact flow
- `member.html` — browser-only prototype member portal

## Owner editing without touching HTML

Open `tools/data-editor.html` to change:

1. Business details
2. Weekly schedule
3. Passes and prices

The editor downloads a replacement data file. Upload that file to the matching `data/` folder in GitHub.

For direct editing:

- Brand/contact/policies: `data/site-data.js`
- Weekly classes: `data/schedule-data.js`
- Memberships/pricing: `data/passes-data.js`
- Instructors: `data/instructors-data.js`
- Demo customer progress: `data/member-demo.js`

## Prototype login

- Email: `sumita@example.com`
- PIN: `1234`

This is not secure authentication. It exists only to demonstrate the future member experience.

## GitHub Pages deployment

See `docs/GITHUB_PAGES_DEPLOYMENT.md`.

The simplest structure is to upload the **contents of this folder** to the repository root and publish Pages from the `main` branch `/root`.

## Private workbook relationship

The operational workbook is an **internal/private business authority** and should live in private Google Drive or another access-controlled store. It should not be treated as a public website asset.

The static website does **not** read the complete workbook directly. Only approved public fields are copied/exported into safe website data files. See `docs/EXCEL_TO_WEBSITE_MAPPING.md`.

This separation is intentional: financial records, confidential health notes, shareholder analytics, staff information and private member data must never be published in the public website repository.

> Legacy note: an early prototype commit included the demo workbook under `source/`. Do not use that pattern for real operations. Future Paila production repositories should keep the internal workbook in private Google Drive and publish only approved exports.

## What already works

- Responsive desktop/mobile layout
- Mobile drawer navigation
- Recurring 21-day schedule generated from weekly templates
- Filters by location, class and instructor
- Capacity, low-spots and waitlist states
- Browser-local reservation prototype
- Calendar `.ics` download
- Browser-local account and pass prototype
- Member session balance and progress demonstration
- Contact email and WhatsApp links
- No-code owner data editor
- GitHub Pages compatibility

## What requires a real booking service or backend

- Secure accounts and passwords
- Shared, real-time capacity across visitors
- Online payments and invoices
- Automatic reminder and waitlist emails
- Staff/admin login
- Private-workbook-to-website automatic synchronisation
- Secure medical screening and consent
- Real cancellation/refund enforcement

Read `docs/WHAT_IS_DEMO_VS_LIVE.md` before using the site publicly.

## Paila rebuild handoff

This repository is a **reference implementation**, not the permanent Paila production authority. The Paila-side rebuild should use a Paila-owned repository and the private Paila Google Drive operational workspace for source/business authority. The receiving ChatGPT should reconcile existing Drive and GitHub state before copying or creating anything, and should avoid unnecessary duplicates.
