# Implementation report

## A. Excel analysis

All nine worksheets were inspected before application code: Dashboard metrics; Employee Master with 21 fields and 30 empty template slots; Checklist with 16 types; Positions with 11 recommended roles; Plan with four batches; Budget with seven unpriced categories; Renewal with 500 pairs of formulas; Changes with 11 headers and no records; Links with four BOI URLs. All 1,006 formulas, both dropdown validations, meaningful cells and conditional formats were inspected. See [workbook analysis](workbook-analysis.md).

Master records drive dashboards and renewals. Employee IDs connect documents and changes; position IDs connect assignments. The source's inconsistent 60/90-day color bands are explicitly documented; the requested red ≤30 / amber 31–60 / green >60 rules are used. Missing dates and amounts remain unknown.

## B. Research

All four workbook resource URLs were reachable on 15 September 2026. BOI's position/placement distinctions, Por.8/2568 and 2026 Single Window notices were reviewed alongside DOE, Immigration and Chengdu consular guidance. Legacy e-Expert deadlines, office details and upload limits were not adopted as current rules. The employee checklist may need company, qualification, family or income evidence depending on the specific application. See [research and official links](research.md).

## C. Architecture

Nine connected modules; static HTML/CSS/ES modules and structured JSON. A repository adapter owns demo persistence; pure domain functions own calculations. Employee detail consolidates all source fields, documents, renewal actions and local history. Language strings are central and translated workbook values are preserved.

## D. Improvements

Searchable employee records, filters and pagination replace blank template rows. Document completion and expiry alerts derive from employee relationships. Capacity distinguishes recommended, approved, assigned and available. Budget totals distinguish unknown amounts from zero. Edits persist locally; responsive navigation and three-language UI support HR users.

## E. Assumptions

Source headcounts are recommendations, not approval evidence. Demo employee states are illustrative and do not establish legal approval. Dates are seeded relative to initial demo load and subsequently age normally. HR progress is internal and not a promised processing time. Not Applicable documents are excluded from completion; Left employees remain visible for unresolved actions. No automatic government submissions or cancellations occur.

## F. Privacy

No real employee identities were imported. DEMO labels and deliberately invalid passport placeholders identify synthetic data. Workbook and raw inspection are excluded from Git and from the public build. GitHub Pages/localStorage are not appropriate for confidential production HR data. Browser history is not a secure audit trail.

## G. Testing

Local checks passed:

- Seven domain tests: expiry boundaries, invalid/missing dates, Bangkok midnight, leap dates, master-derived renewals, completion, partial budgets, capacity.
- Browser: nine routes × three languages on desktop and mobile; no page/console errors.
- Employee search, status filtering, sorting, detail, creation, persistence, empty state and pagination.
- Checklist changes persisted; renewal actions saved and filtered.
- Position approval edits; processing progress; invalid planned-date range rejection.
- Quantity × unit-cost calculation and actual costs.
- Self-replacement rejection and saved offboarding/replacement relationship.
- Eight government resource links, HTTPS URLs and safe external targets.
- Reset confirmation and 390px responsive layouts.
- Visual inspection of desktop and mobile screenshots.

Public build uses an explicit asset allowlist and does not include the source workbook, raw inspection, tests, development dependencies or private files. Official-source reachability was checked through research; live government portals may change, require authentication or have maintenance windows.

## H. GitHub

Repository: `tonkla112/thailand-boi-china-toolkit-2026`  
Branch: `main`  
[Repository](https://github.com/tonkla112/thailand-boi-china-toolkit-2026)

Key files: `index.html`, `js/app.js`, `js/domain.js`, `js/store.js`, `js/translations.js`, `data/workbook.json`, `css/styles.css`, `README.md` and `.github/workflows/pages.yml`.

## I. Deployment

[GitHub Pages application](https://tonkla112.github.io/thailand-boi-china-toolkit-2026/)

Deployment succeeded on 15 September 2026. The complete browser workflow suite passed against the actual HTTPS GitHub Pages URL: all nine modules in English, Chinese and Thai; desktop and 390px mobile layouts; employee, checklist, renewal, position, batch, budget and replacement workflows; local persistence, reset and validation. No JavaScript page or console errors were observed. CSS, JSON, scripts, charts and resource links loaded correctly.

[Successful deployment run](https://github.com/tonkla112/thailand-boi-china-toolkit-2026/actions/runs/34921868609) · tested application commit `8345f92`. The first attempt began before Pages was enabled; rerunning after configuration succeeded. The public app was opened for review. Subsequent documentation-only updates do not change the tested application assets.

## J. Phase 2

Authenticated backend; organization and role-based access; private document uploads; server-side validation; durable audit history and backups; controlled email reminders; validated Excel import/export; employee-to-batch reporting; versioned authority-specific requirements and professional terminology review.
