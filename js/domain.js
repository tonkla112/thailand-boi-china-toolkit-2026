/** Calendar calculations use Thailand's date, independent of the viewer's timezone. */
export function today(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function dayNumber(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) return null;
  const n = Date.parse(date + "T00:00:00Z");
  return Number.isFinite(n) && new Date(n).toISOString().slice(0, 10) === date
    ? n / 86400000
    : null;
}
export function daysRemaining(date, asOf = today()) {
  const a = dayNumber(date),
    b = dayNumber(asOf);
  return a === null || b === null ? null : a - b;
}
export function alertLevel(days) {
  return days === null
    ? "unknown"
    : days < 0
      ? "expired"
      : days <= 30
        ? "red"
        : days <= 60
          ? "amber"
          : "green";
}
export const expiryFields = [
  "visaExpiry",
  "stayExpiry",
  "wpExpiry",
  "passportExpiry",
];
export function renewals(state, asOf = today()) {
  return state.employees
    .flatMap((e) =>
      expiryFields
        .filter((k) => dayNumber(e[k]) !== null)
        .map((k) => {
          const id = e.id + ":" + k,
            d = daysRemaining(e[k], asOf);
          return {
            id,
            employeeId: e.id,
            item: k,
            expiry: e[k],
            days: d,
            alert: alertLevel(d),
            owner: e.owner,
            action: "notStarted",
            remarks: "",
            ...state.renewalActions[id],
          };
        }),
    )
    .sort((a, b) => a.days - b.days);
}
export function completion(state, employeeId) {
  const rows = state.documents
    .map(
      (d) =>
        state.employeeDocuments[employeeId + ":" + d.id]?.status ||
        "notStarted",
    )
    .filter((s) => s !== "notApplicable");
  const done = rows.filter((s) => s === "complete").length;
  return {
    done,
    total: rows.length,
    percent: rows.length ? Math.round((done / rows.length) * 100) : 100,
  };
}
export function budgetTotals(items) {
  const total = (k) => {
    const vals = items
      .map((b) => b[k])
      .filter((v) => typeof v === "number" && Number.isFinite(v));
    return vals.length ? vals.reduce((a, b) => a + b, 0) : null;
  };
  return {
    estimated: total("estimated"),
    actual: total("actual"),
    variance: items.every(
      (b) => typeof b.estimated === "number" && typeof b.actual === "number",
    )
      ? total("actual") - total("estimated")
      : null,
    pending: items.filter((b) => b.estimated === null || b.estimated === "")
      .length,
  };
}
export function available(position, employees) {
  return typeof position.approved === "number"
    ? position.approved -
        employees.filter(
          (e) => e.positionId === position.id && e.status !== "left",
        ).length
    : null;
}
export function offsetDate(days, base = today()) {
  return new Date((dayNumber(base) + days) * 86400000)
    .toISOString()
    .slice(0, 10);
}
