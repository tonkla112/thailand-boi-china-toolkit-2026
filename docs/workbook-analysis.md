# Workbook analysis and design decisions

All nine sheets, meaningful cells, 1,006 formulas, two dropdown validations, and all conditional-format rules were inspected. The 1,000 renewal formulas normalize to two repeated patterns. Raw cell inspection is kept locally and excluded from deployment.

| Worksheet                  | Module    | Content              |
| -------------------------- | --------- | -------------------- |
| 仪表板*Dashboard*แดชบอร์ด  | Dashboard | 17 rows × 6 columns  |
| 员工台账*Master*ทะเบียน    | employees | 31 rows × 21 columns |
| 材料清单*Checklist*รายการ  | documents | 17 rows × 6 columns  |
| 职位规划*Positions*ตำแหน่ง | positions | 12 rows × 8 columns  |
| 办理计划*Plan*แผน          | batches   | 5 rows × 8 columns   |
| 费用预算*Budget*งบประมาณ   | budget    | 8 rows × 8 columns   |
| 续签预警*Renewal*ต่ออายุ   | renewals  | 501 rows × 8 columns |
| 离职换人*Changes*เปลี่ยน   | changes   | 1 rows × 11 columns  |
| 官方链接*Links*ลิงก์       | resources | 5 rows × 3 columns   |

## Relationships and rules

- Employee is the parent record. Employee documents use employee ID + document ID. Renewal rows derive from four master expiry fields; only actions and notes are stored separately. Positions and replacement employees are referenced by ID.
- Dashboard: COUNTA on employee name; status COUNTIF for Processing and WP issued; three COUNTIFS for dates from today through today + 30 inclusive. Web counts actual named records, excluding the 30 empty template slots.
- Renewal: expiry minus TODAY(); expired < 0; red 0–30; yellow 31–60; blue 61–90; normal >90. Master formatting instead uses amber 31–90 and does not mark expired dates. Per the explicit brief, web uses expired/red ≤30, amber 31–60, green >60. These are internal planning alerts, not statutory filing deadlines.
- Use Asia/Bangkok calendar dates and UTC day arithmetic to avoid timezone/DST errors. Missing dates remain unknown.
- All 21 Master fields retained. All 16 checklist items retained, including re-entry and dependant visa/stay. Seven employee statuses and four dependant options retained.
- Eleven recommended positions total 23 plus as-required project/training experts. Recommended numbers are not approved quotas. Approval count, date, owner and assignment links are additions; unknown approval remains null.
- Four batches retain headcount ranges, owners and original stages. No dates supplied; progress 0 is an editable planning baseline, not a BOI processing estimate.
- Seven budget categories have no numeric costs. Unknown budget/actual values remain null; never interpreted as free or zero. Payment date and vendor retained. Optional quantity, unit cost and description are additions.
- Offboarding has headers only. All eleven fields retained. Actions require HR confirmation; changing a workflow does not submit to any authority.

## Information architecture and UI plan

Nine connected navigation modules; employee detail consolidates master fields, document checklist, renewal actions and local history. Navy sidebar, warm neutral canvas, teal accents, clear red/amber expiry cues. Responsive cards and horizontally scrollable tables. Central trilingual dictionary plus workbook translations.

## Data architecture

Static ES modules + JSON. Repository adapter handles demo localStorage persistence. UI and calculations consume entities through this adapter so a future authenticated API can replace storage. No upload of personal documents. Public build uses explicit asset allowlist.

## Assumptions

Workbook is a planning template, not evidence of approved positions or actual employees. Public employees are explicitly synthetic DEMO records. User-generated text is preserved in its entered language; UI and workbook terminology switch centrally. Actual employee data must wait for a secure backend.
