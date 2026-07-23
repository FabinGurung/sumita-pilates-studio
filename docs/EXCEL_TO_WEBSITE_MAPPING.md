# Excel-to-Website Mapping

The Excel workbook remains the internal source of operational truth. The public site receives only approved, non-confidential information.

| Excel sheet | Website destination | Public fields allowed | Fields that must stay private |
|---|---|---|---|
| `99_SETTINGS` | `data/site-data.js`, `data/passes-data.js` | Business name, public branch name, approved plan names, approved policy text | Owner name, targets, internal control values |
| `03_CLASS_SCHEDULE` | `data/schedule-data.js` | Class type, public location, room, start time, duration, level, approved capacity, instructor public ID | Internal notes, private operational comments |
| `09_STAFF` | `data/instructors-data.js` | Approved display name, role, photo/initials, verified qualifications, approved biography | Phone, email, salary/rate, emergency contact, employment notes |
| `02_MEMBERS` | Secure future member service only | A signed-in member may see their own name, plan and session balance | All other members, phone, email, health notes, emergency contacts |
| `04_ATTENDANCE` | Secure future member service only | The signed-in member's own booking/attendance history | Full attendance register and ratings linked to identities |
| `05_SALES_PAYMENTS` | Secure future payment/member service only | The signed-in member's own receipt and balance | Full revenue ledger, payment methods, other customers' balances |
| `06_EXPENSES` | No public website destination | None | Entire expense register |
| `07_LEADS_TRIALS` | Secure future CRM only | None without consent | Names, phones, lead value, status and follow-up notes |
| `08_CLIENT_PROGRESS` | Secure future member service only | Client-approved summary and non-diagnostic metrics for that member | Internal/confidential instructor notes and health data |
| `10_ASSETS_MAINT` | No public website destination | Optional general statement about equipment standards | Asset cost, supplier, service log and defects |
| `11_INVENTORY` | No public website destination | None | Full inventory and stock values |
| `13_OWNER_DASHBOARD` | Owner only | None | All financial and operational KPIs |
| `14_SHAREHOLDER_ANALYTICS` | Shareholders only | None | All shareholder analysis |

## Current manual workflow

1. Staff update Excel.
2. Manager reviews and approves public changes.
3. Owner edits/downloads the matching website data file.
4. The replacement file is uploaded to GitHub.
5. The live website is checked on desktop and mobile.

## Recommended next improvement without building a full app

Add one dedicated Excel sheet named `16_PUBLIC_WEBSITE_EXPORT` that contains only:

- public class schedule
- instructor public profile fields
- approved pass names/prices
- public studio details

Then create a controlled export procedure that converts that sheet into the website data files. Do not expose the complete workbook to the website.
