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

## Federated repository boundary — A7 is an index, not this product's template owner

**This repository owns** its domain-specific source, templates, workflows, documentation, tests and release history: studio website implementation, schedule/member flows, owner edit tools, templates and business content subject to private workbook authority. The catalogue at [A7](https://github.com/FabinGurung/JP_A7_System_Registry_and_Knowledge_Graph) is only the **federated service directory / metadata index** of where repositories, websites, version pointers, statuses and cross-module relationships are found. A7 is **not** a parent codebase, shared template writer, or administrator of this module's content.

**Agent and automation rule:** Never create, update, synchronize or “repair” A7 code, policy, templates, catalogue records, READMEs, website or history as a side effect of work in this repository. An A7 modification requires a **separate task explicitly authorized by the user for A7**, with its own versioning and review. If an A7 listing appears stale, leave A7 unchanged and note a pending pointer correction **locally**. Resolve this repository's own live sources and approvals; do not duplicate its canonical domain files into A7. The CAD/AAD design-and-drawing template is owned by [CAD/AAD](https://github.com/FabinGurung/JP_Computer-Aided-Drawings/tree/main/governance/aad), never by A7. Existing independent domain and private-provider authorities still apply.

