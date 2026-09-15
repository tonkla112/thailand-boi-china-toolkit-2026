import { Repository } from "./store.js";
import { t, local, setLanguage, language } from "./translations.js";
import {
  today,
  daysRemaining,
  alertLevel,
  renewals,
  completion,
  budgetTotals,
  available,
  expiryFields,
  dayNumber,
} from "./domain.js";
const repo = new Repository();
let state,
  route = "dashboard",
  filters = {},
  page = 1,
  selectedEmployee = "",
  sort = "ascending";
const routes = [
  "dashboard",
  "employees",
  "documents",
  "positions",
  "batches",
  "budget",
  "renewals",
  "changes",
  "resources",
];
const icons = ["▦", "♙", "☑", "▤", "◷", "▧", "◴", "⇄", "↗"];
const statuses = [
  "pending",
  "processing",
  "approved",
  "entered",
  "wpIssued",
  "renewing",
  "left",
];
const docStatuses = [
  "notStarted",
  "requested",
  "received",
  "underReview",
  "complete",
  "missing",
  "expired",
  "notApplicable",
];
const actionStatuses = ["notStarted", "processing", "complete"];
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const text = (v) => esc(local(v));
const label = (module, key) =>
  text(
    state.schema[module]?.[key] ||
      t(key === "approved" ? "approvedHeadcount" : key),
  );
const date = (v) =>
  v
    ? esc(
        new Intl.DateTimeFormat(
          language === "th"
            ? "th-TH-u-ca-gregory"
            : language === "zh"
              ? "zh-CN"
              : "en-GB",
          { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" },
        ).format(new Date(v + "T00:00:00Z")),
      )
    : text("unknown");
const money = (v) =>
  typeof v === "number"
    ? new Intl.NumberFormat(language, {
        style: "currency",
        currency: "THB",
        maximumFractionDigits: 2,
      }).format(v)
    : t("pendingBudget");
const badge = (v, cls = "") =>
  `<span class="badge ${esc(cls || { expired: "red", missing: "red", red: "red", amber: "amber", processing: "blue", renewing: "amber", complete: "green", wpIssued: "green", approved: "green" }[v] || "")}">${text(v)}</span>`;
const progress = (p) =>
  `<div class="progress" role="progressbar" aria-label="${t("documentProgress")}" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100"><i style="width:${p}%"></i></div>`;
const employee = (id) => state.employees.find((e) => e.id === id);
const employeeLink = (id) =>
  `<button class="text-button employee-link" data-detail="${esc(id)}">${esc(employee(id)?.name || t("unknown"))}</button>`;
const empty = () =>
  `<div class="empty"><span>⌕</span><h3>${t("empty")}</h3><p>${t("emptySub")}</p></div>`;
function options(items, value = "", all = false) {
  return (
    (all ? `<option value="">${t("all")}</option>` : "") +
    items
      .map((v) => {
        const [k, l] = Array.isArray(v) ? v : [v, local(v)];
        return `<option value="${esc(k)}" ${String(value) === String(k) ? "selected" : ""}>${esc(l)}</option>`;
      })
      .join("")
  );
}
function filterSelect(key, title, items) {
  return `<label class="filter-label">${text(title)}<select data-filter="${key}" aria-label="${text(title)}">${options(items, filters[key], true)}</select></label>`;
}
function table(headers, rows) {
  return rows.length
    ? `<div class="table-scroll"><table><thead><tr>${headers.map((h) => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`
    : empty();
}
function section(title, content, action = "") {
  return `<section class="panel"><div class="panel-head"><h2>${title}</h2>${action}</div>${content}</section>`;
}
function editButton(module, id) {
  return `<button class="button small" data-edit="${module}" data-id="${esc(id)}">${t("edit")}</button>`;
}
function metric(title, value, sub = "", tone = "") {
  return `<article class="metric ${tone}"><span>${title}</span><strong>${value}</strong><small>${sub}</small></article>`;
}
function navigate(next) {
  location.hash = next;
  if (route === next) render();
}
function shell() {
  const alerts = renewals(state).filter((r) => r.days <= 60).length;
  return `<aside id="sidebar"><a class="brand" href="#dashboard"><span class="brand-mark">T<span>+</span></span><div>THAILAND BOI<small>${t("workspace")}</small></div></a><div class="workspace-tag"><span class="live-dot"></span>${t("demo")}<span>2026</span></div><nav aria-label="${t("menu")}">${routes.map((r, i) => `<a href="#${r}" class="nav-item ${route === r ? "active" : ""}" ${route === r ? 'aria-current="page"' : ""}><span class="nav-icon" aria-hidden="true">${icons[i]}</span>${t(r)}${r === "renewals" && alerts ? `<b>${alerts}</b>` : ""}</a>`).join("")}</nav><div class="sidebar-bottom"><span class="avatar">HR</span><div>${t("ownerHR")}<small>${t("demoData")}</small></div></div></aside><div class="main-shell"><header><div class="header-left"><button id="menu" class="icon-button" aria-label="${t("menu")}" aria-expanded="false">☰</button><span class="breadcrumb">${t("workspace")} <span>/</span> <b>${t(route)}</b></span></div><div class="header-right"><select id="language" aria-label="${t("language")}">${options(
    [
      ["en", "EN · English"],
      ["zh", "中文"],
      ["th", "ไทย"],
    ],
    language,
  )}</select><button class="icon-button notification" data-nav="renewals" aria-label="${t("renewals")}">◴<i>${alerts}</i></button><span class="avatar small-avatar">HR</span></div></header><main id="main"><div class="page-heading"><div><div class="eyebrow">THAILAND · BOI · 2026</div><h1>${route === "dashboard" ? t("overview") : t(route)}</h1><p>${route === "dashboard" ? t("overviewSub") : route === "employees" ? t("appName") : route === "resources" ? t("reviewed") : t("sourceNote")}</p></div><div class="heading-action">${route === "employees" ? `<button class="button primary" data-edit="employees" data-id="">+ ${t("addEmployee")}</button>` : route === "changes" ? `<button class="button primary" data-edit="changes" data-id="">+ ${t("add")}</button>` : `<span class="today">${t("asOf")} ${date(today())}</span>`}</div></div><div class="demo-banner"><span class="demo-pill">${t("demo")}</span><span>${t("demoNote")}</span><button class="text-button" id="reset">${t("reset")} ↺</button></div><div id="content"></div><footer>${t("appName")}<span>${t("asOf")} ${date(today())} · Asia/Bangkok</span></footer></main></div>`;
}
function dashboard() {
  const r = renewals(state),
    within = (k) =>
      r.filter((x) => x.item === k && x.days >= 0 && x.days <= 30).length;
  const active = state.employees;
  const count = (s) => active.filter((e) => e.status === s).length;
  const allDone = active.map((e) => completion(state, e.id));
  const sum = allDone.reduce((a, p) => a + p.done, 0),
    total = allDone.reduce((a, p) => a + p.total, 0);
  return `<div class="metrics">${metric(t("totalEmployees"), active.length, t("demoData"))}${metric(t("inProgress"), count("processing"), t("processing"), "teal")}${metric(t("wpIssued"), count("wpIssued"), t("status"), "teal")}${metric(t("visa30"), within("visaExpiry"), t("red"))}${metric(t("stay30"), within("stayExpiry"), t("red"), "warning")}${metric(t("wp30"), within("wpExpiry"), t("red"), "warning")}</div><div class="dashboard-grid"><div>${section(t("actionRequired"), `<p class="panel-sub">${t("expirySub")}</p>${renewalTable(r.filter((x) => x.days <= 60).slice(0, 5), true)}`, `<button class="text-button" data-nav="renewals">${t("viewAll")} →</button>`)}</div><div class="readiness">${section(t("documentProgress"), `<div class="ring" style="--percent:${total ? (sum / total) * 100 : 0}"><div><strong>${total ? Math.round((sum / total) * 100) : 0}<small>%</small></strong><span>${t("complete")}</span></div></div><div class="readiness-foot"><b>${sum} / ${total}</b><span>${t("documents")}</span></div><button class="button full" data-nav="documents">${t("viewAll")} →</button>`)}</div></div><div class="two-columns">${section(t("statusChart"), `<div class="chart">${statuses.map((s) => `<div class="chart-row"><span>${text(s)}</span><div><i style="width:${active.length ? (count(s) / active.length) * 100 : 0}%"></i></div><b>${count(s)}</b></div>`).join("")}</div>`)}${section(
    t("departmentChart"),
    `<div class="chart">${[...new Set(active.map((e) => local(e.department)))]
      .map((dep) => {
        let n = active.filter((e) => local(e.department) === dep).length;
        return `<div class="chart-row"><span>${esc(dep)}</span><div><i style="width:${active.length ? (n / active.length) * 100 : 0}%"></i></div><b>${n}</b></div>`;
      })
      .join("")}</div>`,
  )}</div><div class="resource-callout"><span class="resource-icon">↗</span><div><b>${text(state.notices[0].name)}</b><p>${text(state.notices[0].text)}</p></div><button class="button" data-nav="resources">${t("resources")} →</button></div>`;
}
function renewalTable(rows, compact = false) {
  return table(
    [
      t("employee"),
      t("item"),
      t("expiry"),
      t("alert"),
      ...(compact
        ? []
        : [t("days"), t("owner"), t("action"), t("remarks"), t("actions")]),
    ],
    rows.map((r) => [
      employeeLink(r.employeeId),
      label("employees", r.item),
      date(r.expiry),
      badge(r.alert),
      ...(compact
        ? []
        : [
            String(r.days),
            text(r.owner),
            badge(r.action),
            text(r.remarks),
            `<button class="button small" data-renewal="${esc(r.id)}">${t("edit")}</button>`,
          ]),
    ]),
  );
}
function employeeFilters() {
  const vals = (k) =>
    [...new Set(state.employees.map((e) => local(e[k])))].sort();
  return `<div class="filters"><label class="search-box"><span>⌕</span><input id="employeeSearch" data-filter="search" value="${esc(filters.search || "")}" placeholder="${t("search")}" aria-label="${t("search")}"></label>${filterSelect("status", t("status"), statuses)}${filterSelect("department", t("department"), vals("department"))}${filterSelect("owner", t("owner"), vals("owner"))}${filterSelect("boi", t("boiStatus"), ["recorded", "unknown"])}${filterSelect("expiry", t("alert"), ["expired", "red", "amber", "green", "unknown"])}<label class="filter-label">${t("sort")}<select id="sort">${options(["ascending", "descending", "expirySort"], sort)}</select></label><button class="text-button" id="clear">${t("clearFilters")}</button></div>`;
}
function employeesPage() {
  let rows = state.employees.filter(
    (e) =>
      (!filters.search ||
        [
          e.name,
          e.englishName,
          e.passport,
          e.id,
          local(e.department),
          local(e.position),
        ]
          .join(" ")
          .toLowerCase()
          .includes(filters.search.toLowerCase())) &&
      (!filters.status || e.status === filters.status) &&
      (!filters.department || local(e.department) === filters.department) &&
      (!filters.owner || local(e.owner) === filters.owner) &&
      (!filters.boi ||
        !!e.personnelApprovalDate === (filters.boi === "recorded")) &&
      (!filters.expiry ||
        expiryFields.some(
          (k) => alertLevel(daysRemaining(e[k])) === filters.expiry,
        )),
  );
  const nearest = (e) =>
    Math.min(
      ...expiryFields.map((k) => daysRemaining(e[k])).filter((v) => v !== null),
      Infinity,
    );
  rows.sort((a, b) =>
    sort === "expirySort"
      ? nearest(a) - nearest(b)
      : a.name.localeCompare(b.name) * (sort === "descending" ? -1 : 1),
  );
  const pages = Math.max(1, Math.ceil(rows.length / 8));
  page = Math.min(page, pages);
  return section(
    `${t("employees")} <span class="count">${rows.length}</span>`,
    employeeFilters() +
      table(
        [
          t("employee"),
          t("department"),
          t("position"),
          t("status"),
          t("documentProgress"),
          t("owner"),
          t("actions"),
        ],
        rows.slice((page - 1) * 8, page * 8).map((e) => {
          const c = completion(state, e.id);
          return [
            `<div class="person"><span class="avatar">${esc(e.id.slice(-2))}</span><div>${employeeLink(e.id)}<small>${esc(e.id)}</small></div></div>`,
            text(e.department),
            text(e.position),
            badge(e.status),
            `<span class="progress-label">${c.done}/${c.total} · ${c.percent}%</span>${progress(c.percent)}`,
            text(e.owner),
            editButton("employees", e.id),
          ];
        }),
      ) +
      `<div class="pagination"><span>${rows.length} ${t("recordCount")}</span><div><button class="button small" data-page="${page - 1}" ${page === 1 ? "disabled" : ""}>${t("previous")}</button><span>${t("page")} ${page} / ${pages}</span><button class="button small" data-page="${page + 1}" ${page === pages ? "disabled" : ""}>${t("next")}</button></div></div>`,
  );
}
function checklist(id) {
  const e = employee(id);
  if (!e) return empty();
  const c = completion(state, id);
  return `<div class="checklist-header"><div><h2>${esc(e.name)}</h2><p>${t("documentProgress")}: <b>${c.done} / ${c.total} · ${c.percent}%</b></p></div>${progress(c.percent)}</div>${table(
    [
      label("documents", "category"),
      label("documents", "name"),
      t("status"),
      t("remarks"),
    ],
    state.documents.map((d) => {
      const v = state.employeeDocuments[id + ":" + d.id] || {};
      return [
        text(d.category),
        text(d.name),
        `<select data-doc="${esc(id + ":" + d.id)}" aria-label="${text(d.name)} ${t("status")}">${options(docStatuses, v.status || "notStarted")}</select>`,
        `<input data-doc-note="${esc(id + ":" + d.id)}" value="${esc(v.remarks || "")}" aria-label="${text(d.name)} ${t("remarks")}" maxlength="2000">`,
      ];
    }),
  )}`;
}
function documentsPage() {
  const rows = state.employees.filter(
    (e) =>
      !filters.missing ||
      state.documents.some((d) =>
        ["missing", "expired"].includes(
          state.employeeDocuments[e.id + ":" + d.id]?.status,
        ),
      ),
  );
  if (!rows.some((e) => e.id === selectedEmployee))
    selectedEmployee = rows[0]?.id || "";
  return `<p class="notice">${t("checklistNote")}</p><div class="document-layout"><section class="panel employee-picker"><div class="panel-head"><h2>${t("employees")}</h2></div><label class="checkbox"><input type="checkbox" id="missingOnly" ${filters.missing ? "checked" : ""}>${t("missingOnly")}</label>${
    rows
      .map((e) => {
        const c = completion(state, e.id);
        return `<button class="employee-pick ${selectedEmployee === e.id ? "selected" : ""}" data-select-employee="${e.id}"><span>${esc(e.name)}<small>${text(e.department)}</small></span><b>${c.percent}%</b></button>`;
      })
      .join("") || empty()
  }</section><section class="panel">${checklist(selectedEmployee)}</section></div>`;
}
function positionsPage() {
  return `<p class="notice">${t("sourceNote")}</p><div class="position-grid">${state.positions
    .map((p) => {
      const assigned = state.employees.filter(
        (e) => e.positionId === p.id && e.status !== "left",
      );
      return `<section class="panel position-card"><div class="position-top"><span class="eyebrow">${text(p.department)}</span>${editButton("positions", p.id)}</div><h2>${text(p.title)}</h2>${badge(p.status)}<p>${text(p.responsibilities)}</p><div class="capacity"><div><strong>${text(p.recommended)}</strong><small>${t("recommended")}</small></div><div><strong>${p.approved ?? "—"}</strong><small>${t("approvedHeadcount")}</small></div><div><strong>${assigned.length}</strong><small>${t("assigned")}</small></div><div><strong>${available(p, state.employees) ?? "—"}</strong><small>${t("available")}</small></div></div><details><summary>${t("viewAll")}</summary><dl><dt>${label("positions", "requirements")}</dt><dd>${text(p.requirements)}</dd><dt>${t("approvalDate")}</dt><dd>${date(p.approvalDate)}</dd><dt>${t("owner")}</dt><dd>${text(p.owner)}</dd><dt>${t("remarks")}</dt><dd>${text(p.remarks)}</dd><dt>${t("assigned")}</dt><dd>${assigned.map((e) => employeeLink(e.id)).join(", ") || text("none")}</dd></dl></details></section>`;
    })
    .join("")}</div>`;
}
function batchesPage() {
  return `<p class="notice">${t("planNote")}</p><div class="batch-list">${state.batches.map((b, i) => `<section class="panel batch-card"><div class="batch-number">0${i + 1}</div><div class="batch-body"><div class="panel-head"><div><span class="eyebrow">${text(b.title)}</span><h2>${text(b.category)}</h2></div>${editButton("batches", b.id)}</div><div class="batch-meta"><span>${t("recommended")}: <b>${text(b.recommended)}</b></span><span>${t("owner")}: <b>${text(b.owner)}</b></span>${badge(b.stage)}</div><div class="batch-dates"><span>${label("batches", "plannedStart")}: ${date(b.plannedStart)}</span><span>→</span><span>${label("batches", "plannedEnd")}: ${date(b.plannedEnd)}</span></div>${progress(Number(b.progress) || 0)}<p class="progress-label">${b.progress || 0}% · ${t("progress")}</p><details><summary>${t("viewAll")}</summary><p>${t("actualStart")}: ${date(b.actualStart)} · ${t("actualEnd")}: ${date(b.actualEnd)}</p><p>${t("remarks")}: ${text(b.remarks)}</p></details></div></section>`).join("")}</div>`;
}
function budgetPage() {
  const b = budgetTotals(state.budget);
  return `<div class="metrics four">${metric(t("estimatedTotal"), money(b.estimated), t("partial"))}${metric(t("actualTotal"), money(b.actual), t("partial"))}${metric(t("variance"), b.variance === null ? "—" : money(b.variance), t("partial"))}${metric(t("pendingItems"), b.pending, t("pendingBudget"))}</div><p class="notice">${t("budgetNote")}</p>${section(
    t("budget"),
    table(
      [
        label("budget", "category"),
        t("employee"),
        label("budget", "estimated"),
        label("budget", "actual"),
        label("budget", "paymentDate"),
        label("budget", "vendor"),
        t("status"),
        t("actions"),
      ],
      state.budget.map((b) => [
        text(b.category),
        b.employeeId ? employeeLink(b.employeeId) : text("none"),
        money(b.estimated),
        typeof b.actual === "number" ? money(b.actual) : text("unknown"),
        date(b.paymentDate),
        text(b.vendor),
        badge(b.status),
        editButton("budget", b.id),
      ]),
    ),
  )}`;
}
function renewalsPage() {
  let rows = renewals(state).filter(
    (r) =>
      (!filters.employeeId || r.employeeId === filters.employeeId) &&
      (!filters.item || r.item === filters.item) &&
      (!filters.alert || r.alert === filters.alert) &&
      (!filters.owner || local(r.owner) === filters.owner) &&
      (!filters.action || r.action === filters.action),
  );
  return `<div class="metrics four">${["expired", "red", "amber", "green"].map((a) => metric(t(a), renewals(state).filter((r) => r.alert === a).length, t("renewals"), a === "red" || a === "expired" ? "warning" : "")).join("")}</div>${section(
    t("allDates"),
    `<div class="filters">${filterSelect(
      "employeeId",
      t("employee"),
      state.employees.map((e) => [e.id, e.name]),
    )}${filterSelect(
      "item",
      t("item"),
      expiryFields.map((k) => [k, local(state.schema.employees[k])]),
    )}${filterSelect("alert", t("alert"), ["expired", "red", "amber", "green"])}${filterSelect("owner", t("owner"), [...new Set(state.employees.map((e) => local(e.owner)))])}${filterSelect("action", t("action"), actionStatuses)}<button class="text-button" id="clear">${t("clearFilters")}</button></div>${renewalTable(rows)}`,
  )}`;
}
function changesPage() {
  return `<p class="notice">${t("changesNote")}</p>${
    state.changes.length
      ? state.changes
          .map(
            (c) =>
              `<section class="panel change-card"><div class="panel-head"><h2>${employeeLink(c.employeeId)} → ${c.replacementId ? employeeLink(c.replacementId) : text("unknown")}</h2>${editButton("changes", c.id)}</div><div class="change-steps">${[
                ["outgoing", date(c.lastDate)],
                ["wpStatus", text(c.wpStatus)],
                ["stayStatus", text(c.stayStatus)],
                ["positionStatus", text(c.positionStatus)],
                ["application", text(c.application)],
              ]
                .map(
                  ([k, v], i) =>
                    `<div><span class="step-dot">${i + 1}</span><small>${label("changes", k)}</small><b>${v}</b></div>`,
                )
                .join(
                  "",
                )}</div><dl class="inline-details"><dt>${t("position")}</dt><dd>${text(state.positions.find((p) => p.id === c.positionId)?.title)}</dd><dt>${label("changes", "departure")}</dt><dd>${text(c.departure)}</dd><dt>${t("owner")}</dt><dd>${text(c.owner)}</dd><dt>${t("remarks")}</dt><dd>${text(c.remarks)}</dd></dl></section>`,
          )
          .join("")
      : section(t("changes"), empty())
  }`;
}
function resourcesPage() {
  return `<div class="resource-callout"><span class="resource-icon">ⓘ</span><div><h2>${t("guidance")}</h2><p>${t("guidanceText")}</p></div></div><div class="notice">${text(state.notices[0].name)} — ${text(state.notices[0].text)}</div><div class="resource-grid">${state.resources.map((r) => `<article class="panel resource-card"><div class="resource-card-top"><span class="resource-icon">↗</span>${badge(r.provenance === "research" ? "research" : "workbook")}</div><h2>${text(r.name)}</h2><p>${text(r.purpose)}</p><small>${esc(r.authority)} · ${t("official")}</small><a class="button" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${t("openResource")} ↗</a></article>`).join("")}</div>`;
}
function renderContent() {
  document.querySelector("#content").innerHTML = {
    dashboard,
    employees: employeesPage,
    documents: documentsPage,
    positions: positionsPage,
    batches: batchesPage,
    budget: budgetPage,
    renewals: renewalsPage,
    changes: changesPage,
    resources: resourcesPage,
  }[route]();
}
function render() {
  document.title = t(route) + " · " + t("appName");
  document.querySelector("#app").innerHTML = shell();
  renderContent();
}
function toast(message) {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.classList.add("visible");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("visible"), 4000);
}
function persist(employeeId, type = "updated") {
  toast(t(repo.record(employeeId, type) ? "saved" : "saveFailed"));
}
const dialog = document.querySelector("#dialog");
let dialogContext = null;
function showDialog(title, body) {
  dialog.innerHTML = `<div class="dialog-head"><h2>${esc(title)}</h2><button class="icon-button" data-close aria-label="${t("close")}">×</button></div>${body}`;
  if (!dialog.open) dialog.showModal();
}
function showDetail(id) {
  const e = employee(id);
  if (!e) return;
  dialogContext = { type: "detail", id };
  const groups = {
    personal: [
      "no",
      "name",
      "englishName",
      "passport",
      "nationality",
      "passportExpiry",
      "dependants",
    ],
    employment: [
      "department",
      "position",
      "positionId",
      "location",
      "startDate",
      "positionApprovalDate",
      "personnelApprovalDate",
      "owner",
      "status",
    ],
    permissions: ["visaExpiry", "stayExpiry", "wpExpiry", "reentry", "remarks"],
  };
  showDialog(
    e.name,
    `<div class="detail-top"><span class="avatar">${esc(e.id.slice(-2))}</span><div><b>${esc(e.englishName)}</b><p>${esc(e.id)} · ${t("demoData")}</p></div>${editButton("employees", id)}</div><div class="detail-sections">${Object.entries(
      groups,
    )
      .map(
        ([g, keys]) =>
          `<section><h3>${t(g)}</h3><dl>${keys.map((k) => `<dt>${label("employees", k)}</dt><dd>${k === "positionId" ? text(state.positions.find((p) => p.id === e[k])?.title) : k.endsWith("Date") || k.endsWith("Expiry") ? date(e[k]) : k === "status" ? badge(e[k]) : text(e[k])}</dd>`).join("")}</dl></section>`,
      )
      .join(
        "",
      )}</div><details open><summary>${t("documents")}</summary><div class="detail-checklist">${checklist(id)}</div></details><details><summary>${t("renewals")}</summary>${renewalTable(renewals(state).filter((r) => r.employeeId === id))}</details><details><summary>${t("history")}</summary><p class="muted">${t("localHistoryNote")}</p>${
      state.history
        .filter((h) => h.employeeId === id)
        .map(
          (h) =>
            `<p>${esc(new Date(h.at).toLocaleString(language))} · ${text(h.type)}</p>`,
        )
        .join("") || `<p>${t("noHistory")}</p>`
    }</details>`,
  );
}
const extras = {
  positions: ["approved", "approvalDate", "owner"],
  batches: ["actualStart", "actualEnd", "progress"],
  budget: ["description", "quantity", "unitCost"],
};
function formField(module, key, value) {
  let choices = null,
    type = "text";
  const title = label(module, key);
  if (key === "status")
    choices =
      module === "employees"
        ? statuses
        : module === "budget"
          ? ["pendingBudget", "budgeted", "paid"]
          : ["pending", "processing", "approved"];
  if (["employeeId", "replacementId"].includes(key))
    choices = [["", t("none")], ...state.employees.map((e) => [e.id, e.name])];
  if (key === "positionId")
    choices = [
      ["", t("unknown")],
      ...state.positions.map((p) => [p.id, local(p.title)]),
    ];
  if (key === "dependants") choices = ["none", "spouse", "children", "family"];
  if (key === "reentry") choices = ["unknown", "none", "single", "multiple"];
  if (key === "stage")
    choices = ["planning", "pending", "processing", "approved", "complete"];
  if (
    [
      "wpStatus",
      "stayStatus",
      "positionStatus",
      "application",
      "action",
    ].includes(key)
  )
    choices = ["notStarted", "processing", "complete", "notApplicable"];
  if (
    [
      "no",
      "approved",
      "estimated",
      "actual",
      "quantity",
      "unitCost",
      "progress",
    ].includes(key)
  )
    type = "number";
  if (/Date$|Expiry$|Start$|End$/.test(key)) type = "date";
  const actual = typeof value === "object" ? local(value) : (value ?? "");
  if (
    choices &&
    actual &&
    !choices.some((c) => (Array.isArray(c) ? c[0] : c) === actual)
  )
    choices.unshift([actual, local(value)]);
  const required =
    key === "name" || (module === "changes" && key === "employeeId");
  let input = choices
    ? `<select name="${key}" ${required ? "required" : ""}>${options(choices, actual)}</select>`
    : key === "remarks" || key === "responsibilities" || key === "requirements"
      ? `<textarea name="${key}" rows="3" maxlength="4000">${esc(actual)}</textarea>`
      : `<input name="${key}" type="${type}" value="${esc(actual)}" ${required ? "required" : ""} ${type === "number" ? `min="0" step="${["estimated", "actual", "unitCost"].includes(key) ? "0.01" : "1"}" ${key === "progress" ? 'max="100"' : ""}` : 'maxlength="250"'}>`;
  return `<label class="form-field">${title}${required ? " *" : ""}${input}</label>`;
}
function editRecord(module, id) {
  const item = id ? state[module].find((e) => e.id === id) : {};
  if (!item) return;
  dialogContext = { type: "edit", module, id };
  let keys = Object.keys(state.schema[module] || {}).concat(
    extras[module] || [],
  );
  if (module === "employees") keys = keys.filter((k) => k !== "no");
  showDialog(
    t("edit") + " · " + t(module),
    `<form id="recordForm" data-module="${module}" data-id="${esc(id)}"><p class="notice">${t("demoNote")}</p><div class="form-grid">${keys.map((k) => formField(module, k, item[k])).join("")}</div><p id="formError" role="alert"></p><div class="form-actions"><button type="button" class="button" data-close>${t("cancel")}</button><button class="button primary" type="submit">${t("save")}</button></div></form>`,
  );
}
function editRenewal(id) {
  const item = renewals(state).find((r) => r.id === id);
  if (!item) return;
  dialogContext = { type: "renewal", id };
  showDialog(
    t("renewals") + " · " + employee(item.employeeId).name,
    `<form id="renewalForm" data-id="${esc(id)}"><p>${label("employees", item.item)} · ${date(item.expiry)} ${badge(item.alert)}</p><div class="form-grid">${formField("renewals", "action", item.action)}${formField("renewals", "remarks", item.remarks)}</div><div class="form-actions"><button class="button" type="button" data-close>${t("cancel")}</button><button class="button primary">${t("save")}</button></div></form>`,
  );
}
function validateRecord(module, item) {
  for (const [key, val] of Object.entries(item)) {
    if (/Date$|Expiry$|Start$|End$/.test(key) && val && dayNumber(val) === null)
      return "invalid";
  }
  for (const [start, end] of [
    ["plannedStart", "plannedEnd"],
    ["actualStart", "actualEnd"],
  ])
    if (item[start] && item[end] && item[start] > item[end]) return "invalid";
  if (module === "changes" && item.employeeId === item.replacementId)
    return "invalid";
  if (
    module === "positions" &&
    typeof item.approved === "number" &&
    available(item, state.employees) < 0
  )
    return "capacity";
  if (module === "employees" && item.positionId && item.status !== "left") {
    const p = state.positions.find((p) => p.id === item.positionId);
    const peers = state.employees.filter((e) => e.id !== item.id);
    if (
      p &&
      typeof p.approved === "number" &&
      available(p, [...peers, item]) < 0
    )
      return "capacity";
  }
  return "";
}
document.addEventListener("submit", (event) => {
  if (event.target.id === "recordForm") {
    event.preventDefault();
    const form = event.target,
      module = form.dataset.module,
      id = form.dataset.id;
    const old = state[module].find((e) => e.id === id) || {};
    const item = { ...old, id: id || "LOCAL-" + crypto.randomUUID() };
    for (const [k, v] of new FormData(form)) {
      if (typeof old[k] === "object" && v === local(old[k])) continue;
      item[k] =
        form.elements.namedItem(k).type === "number"
          ? v === ""
            ? null
            : Number(v)
          : v.trim();
    }
    if (module === "employees") {
      item.no =
        old.no || Math.max(0, ...state.employees.map((e) => e.no || 0)) + 1;
      item.status ||= "pending";
    }
    if (
      module === "budget" &&
      item.quantity !== null &&
      item.quantity !== undefined &&
      item.unitCost !== null &&
      item.unitCost !== undefined
    )
      item.estimated = Math.round(item.quantity * item.unitCost * 100) / 100;
    const error = validateRecord(module, item);
    if (error) {
      document.querySelector("#formError").textContent = t(error);
      return;
    }
    const index = state[module].findIndex((e) => e.id === id);
    if (index >= 0) state[module][index] = item;
    else state[module].push(item);
    persist(
      module === "employees" ? item.id : item.employeeId,
      module === "changes" ? "changeUpdated" : "updated",
    );
    dialog.close();
    render();
  } else if (event.target.id === "renewalForm") {
    event.preventDefault();
    const id = event.target.dataset.id;
    state.renewalActions[id] = Object.fromEntries(new FormData(event.target));
    persist(
      renewals(state).find((r) => r.id === id).employeeId,
      "renewalUpdated",
    );
    dialog.close();
    render();
  }
});
document.addEventListener("click", (event) => {
  const el = event.target.closest("button");
  if (!el) return;
  if (el.hasAttribute("data-close")) dialog.close();
  if (el.dataset.nav) navigate(el.dataset.nav);
  if (el.dataset.detail) showDetail(el.dataset.detail);
  if (el.dataset.edit) editRecord(el.dataset.edit, el.dataset.id);
  if (el.dataset.renewal) editRenewal(el.dataset.renewal);
  if (el.dataset.selectEmployee) {
    selectedEmployee = el.dataset.selectEmployee;
    renderContent();
  }
  if (el.dataset.page) {
    page = Number(el.dataset.page);
    renderContent();
  }
  if (el.id === "clear") {
    filters = {};
    page = 1;
    renderContent();
  }
  if (el.id === "menu") {
    const open = document.querySelector("#sidebar").classList.toggle("open");
    el.setAttribute("aria-expanded", String(open));
  }
  if (el.id === "reset") {
    dialogContext = { type: "reset" };
    showDialog(
      t("reset"),
      `<p>${t("resetConfirm")}</p><div class="form-actions"><button class="button" data-close>${t("cancel")}</button><button class="button danger" id="confirmReset">${t("reset")}</button></div>`,
    );
  }
  if (el.id === "confirmReset") {
    const ok = repo.reset();
    state = repo.state;
    dialog.close();
    render();
    toast(t(ok ? "saved" : "saveFailed"));
  }
});
document.addEventListener("input", (event) => {
  const el = event.target;
  if (el.dataset.filter === "search") {
    filters.search = el.value;
    page = 1;
    const at = el.selectionStart;
    renderContent();
    const replacement = document.querySelector("#employeeSearch");
    replacement.focus();
    replacement.setSelectionRange(at, at);
  }
});
document.addEventListener("change", (event) => {
  const el = event.target;
  if (el.id === "language") {
    setLanguage(el.value);
    filters = {};
    render();
  }
  if (el.dataset.filter && el.dataset.filter !== "search") {
    filters[el.dataset.filter] = el.value;
    page = 1;
    renderContent();
  }
  if (el.id === "sort") {
    sort = el.value;
    renderContent();
  }
  if (el.id === "missingOnly") {
    filters.missing = el.checked;
    renderContent();
  }
  if (el.dataset.doc || el.dataset.docNote) {
    const key = el.dataset.doc || el.dataset.docNote;
    state.employeeDocuments[key] = {
      ...(state.employeeDocuments[key] || {
        status: "notStarted",
        remarks: "",
      }),
      [el.dataset.doc ? "status" : "remarks"]: el.value,
    };
    persist(key.split(":")[0], "documentUpdated");
    if (dialog.open && dialogContext?.type === "detail")
      showDetail(dialogContext.id);
    renderContent();
  }
});
window.addEventListener("hashchange", () => {
  route = routes.includes(location.hash.slice(1))
    ? location.hash.slice(1)
    : "dashboard";
  filters = {};
  page = 1;
  dialog.close();
  render();
});
try {
  state = await repo.load();
  let lang;
  try {
    lang = localStorage.getItem("boi-language");
  } catch {}
  setLanguage(lang || "en");
  route = routes.includes(location.hash.slice(1))
    ? location.hash.slice(1)
    : "dashboard";
  render();
  if (repo.warning) toast(t("storageWarning"));
  let lastDay = today();
  setInterval(() => {
    if (today() !== lastDay) {
      lastDay = today();
      render();
    }
  }, 60000);
} catch (error) {
  document.querySelector("#app").innerHTML =
    `<div class="empty"><h1>${t("loadFailed")}</h1></div>`;
  console.error(error);
}
