# Thailand BOI China Employee Management Toolkit 2026

**泰国 BOI 中国员工管理工具包 2026**  
**ระบบบริหารพนักงานจีนภายใต้ BOI ประเทศไทย 2026**

A responsive, trilingual HR workspace built from the Rev01 Excel toolkit. It connects employee records, document readiness, BOI position planning, processing batches, costs, expiry alerts and employee changes.

## Public demonstration

This is a **static demonstration with synthetic employees**. GitHub Pages is not a secure employee database. Do not enter or publish real names, passport numbers, immigration records, documents or other confidential personnel data. The source workbook is excluded from version control and from the deployment build.

Edits are stored in this browser's localStorage. They do not synchronize across people, devices or browsers, and can disappear when browser storage is cleared. There is no login, access control, encrypted database, backup, authority submission or trustworthy audit log. The local activity history is a convenience only. Reset demo replaces local changes after confirmation.

## Modules and workbook mapping

| Workbook worksheet         | Web module         | Behavior                                                                                                 |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------- |
| 仪表板*Dashboard*แดชบอร์ด  | Dashboard          | Six source KPIs, expiry actions, document readiness and workforce charts                                 |
| 员工台账*Master*ทะเบียน    | Employees          | All 21 fields; search, filters, sorting, pagination and consolidated detail                              |
| 材料清单*Checklist*รายการ  | Document Checklist | All 16 document types linked to employee IDs; statuses, notes and progress                               |
| 职位规划*Positions*ตำแหน่ง | BOI Positions      | All 11 planned positions, responsibilities, qualifications, recommended and approved capacity            |
| 办理计划*Plan*แผน          | Processing Plan    | Four batches, headcount ranges, stages, owners, dates, progress and notes                                |
| 费用预算*Budget*งบประมาณ   | Budget             | Seven unpriced categories; estimates, actuals, payment dates, vendors and optional unit-cost calculation |
| 续签预警*Renewal*ต่ออายุ   | Renewal & Expiry   | Automatic alerts from master dates; employee/type/owner/action filters and action notes                  |
| 离职换人*Changes*เปลี่ยน   | Employee Changes   | Outgoing employee, separate authority actions, position and replacement links                            |
| 官方链接*Links*ลิงก์       | Official Resources | Original four references plus researched government resources                                            |

## Architecture and files

- `index.html`, `css/styles.css`: accessible responsive shell, styles and mobile navigation.
- `js/app.js`: views, forms, event handling and validation.
- `js/domain.js`: pure date, expiry, checklist, budget and capacity calculations.
- `js/store.js`: repository adapter and explicitly synthetic sample generation.
- `js/translations.js`: English, Simplified Chinese and Thai UI text.
- `data/workbook.json`: workbook field labels, translated template content, planning rows and reviewed resources.
- `docs/workbook-analysis.md`: source analysis, relationships, formula differences and design decisions.
- `docs/research.md`: official sources, dated findings and limitations.
- `docs/implementation-report.md`: delivery and test summary.
- `tools/extract_workbook.py`: reproducible template extraction, deliberately excludes employee rows.
- `tools/add_resources.py`: augments template resources after extraction.
- `tools/build.js`: copies only public application assets into `dist/`.
- `tests/`: domain boundary tests and browser workflow tests.

The app has no production JavaScript dependencies and no external fonts or tracking scripts. Static ES modules use relative asset paths and hash navigation for GitHub Pages project hosting.

### Data relationships

Employees reference a BOI position by ID. Position capacity counts active assignments, excluding employees marked Left; unknown approved counts stay unknown. Employee documents use `employeeId:documentId`. Renewals are derived from employee dates; only action status/remarks are stored under `employeeId:expiryField`. Changes reference outgoing and replacement employees and a position. Budget items can reference an employee. Batch records retain source recommendations independently; no fictional employee-to-batch allocation is inferred.

### Update data

For synthetic demonstrations, use **Add employee** and **Edit**, the checklist status menus, and renewal action forms. Position, batch, budget and change forms preserve source fields. Quantity × unit cost recalculates estimated budget when both are supplied; clear either to use a manually entered estimate. Costs are THB. Blank amounts remain unknown, while zero is an explicitly entered amount. Variance is shown only when every estimate and actual amount is known. A pending-budget count and partial-total warning prevent incomplete totals being mistaken for a full budget.

The original workbook has no named employees, approved quotas or cost figures. Demo employees use unmistakable DEMO identifiers and invalid placeholder passport strings. Sample dates are generated relative to the Bangkok date when the demo is first loaded/reset; they remain fixed while stored so alerts naturally age. Employee statuses in sample data demonstrate UI states, not evidence of government approval. No approved position headcounts are fabricated.

For future real data, implement an authenticated repository API first. Do not put private records in `data/`, source control or localStorage.

### Update translations

Edit the central English/Chinese/Thai entries in `js/translations.js`. Workbook terminology is stored as `{en, zh, th}` objects in `data/workbook.json`. User-entered free text remains in its entered language. The selector translates navigation, forms, headers, statuses, alerts and instructions. Gregorian dates are used in all languages; calculations use Asia/Bangkok.

### Expiry and completion calculations

`Days remaining = expiry calendar date − current Bangkok calendar date`. Arithmetic uses UTC day numbers to avoid daylight-saving drift. Missing/invalid dates produce unknown, not expired. The date refreshes on navigation and at the next minute after Bangkok midnight.

- Expired: fewer than 0 days.
- Red: 0–30 days inclusive.
- Amber: 31–60 days inclusive.
- Green: more than 60 days.

The workbook renewal formula also had a blue 61–90-day band, while Master highlighted amber through 90 days. The web app follows the user's explicit >60 green requirement. These are internal HR alerts, not legal filing deadlines. The three dashboard 30-day expiry KPIs include today and exclude already-expired dates, matching the workbook.

Document completion counts only Complete; Not Applicable is excluded from the denominator. If all documents are not applicable, completion is 100%. Received and Under Review do not count as complete. Left employees remain visible for unresolved offboarding and expiry tracking.

## Local use and testing

Requires Node.js 20+ for development; any static server can serve the production app.

```sh
npm ci
npm test
npm run build
python3 -m http.server 4173 --directory dist
```

Open `http://localhost:4173`. Opening `index.html` directly via `file://` will not load JSON reliably.

Browser testing uses Playwright. Install its browser with `npx playwright install chromium`, or set `CHROME_PATH` to an installed Chrome executable. Run `npm run test:browser` with a local server running. `TEST_URL` can point to a deployed project URL. Tests only modify their isolated browser's demonstration storage.

## GitHub Pages

The Pages workflow tests and builds the app, then uploads only `dist/`. Enable GitHub Pages with **GitHub Actions** as the source. Push to `main` or run the workflow manually. After publishing, test the actual URL, including all three languages, forms and mobile layout.

## Regulatory research and assumptions

[Research notes](docs/research.md) separate workbook structure, official-source findings and new product recommendations. BOI procedures depend on the promotion certificate, position/personnel category, application, location and authority. Current 2026 notices take precedence over legacy e-Expert documents. Checklist completeness does not determine legal eligibility. No BOI approval, cost, processing duration or automatic cancellation is invented.

## Recommended Phase 2

1. Authenticated backend (e.g. Supabase/PostgreSQL) with organization isolation and role-based permissions.
2. Private encrypted document storage with access policies, retention rules and malware scanning.
3. Server-side validation, durable audit history, backups and approval workflows.
4. Scheduled renewal reminders with controlled recipients and escalation ownership.
5. Reviewed Excel import/export, batch-to-employee reporting and authority-specific checklist versions.
6. HR/legal review of Chinese and Thai terminology before live operational use.
