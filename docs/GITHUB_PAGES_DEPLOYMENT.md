# GitHub Pages Deployment — Easiest Method

## 1. Create the repository

Create a new GitHub repository, for example:

`sumita-pilates-studio`

Use a private repository while the site still contains placeholders. GitHub Pages availability for private repositories depends on the GitHub plan; otherwise use a temporary public repository only after removing private material.

## 2. Upload the website files

Upload the **contents** of the `sumita_pilates_website` folder to the repository root.

The repository root should directly contain:

- `index.html`
- `schedule.html`
- `passes.html`
- `instructors.html`
- `about.html`
- `contact.html`
- `member.html`
- `assets/`
- `data/`
- `docs/`
- `.nojekyll`

Do not upload only the outer folder, or the Pages URL may require an extra path.

## 3. Turn on GitHub Pages

1. Open the repository.
2. Open **Settings**.
3. Open **Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch **main**.
6. Select folder **/(root)**.
7. Save.

GitHub will provide the published URL after deployment.

## 4. Safe upload order for edits

When replacing website data:

1. Upload the replacement file in `data/` first.
2. Check that the filename did not change.
3. Open the live website in a private/incognito tab.
4. Replace HTML/CSS/JavaScript only when required.

## 5. Change the brand information

Open:

`tools/data-editor.html`

Change the details, download `site-data.js`, and replace:

`data/site-data.js`

## 6. Change the weekly schedule

Use the data editor, download `schedule-data.js`, and replace:

`data/schedule-data.js`

The public website will generate the next 21 calendar days automatically from the weekly template.

## 7. Important security rule

Never upload private Excel exports containing:

- member phone numbers or emails
- health/safety notes
- emergency contacts
- payment records
- owner dashboards
- shareholder analytics
- staff salary/rate information

Only upload a deliberately prepared public subset.
