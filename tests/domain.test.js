import test from "node:test";
import assert from "node:assert/strict";
import {
  daysRemaining,
  alertLevel,
  today,
  renewals,
  completion,
  budgetTotals,
  available,
} from "../js/domain.js";
test("expiry boundaries and missing/invalid dates", () => {
  for (const [date, days, alert] of [
    ["2026-09-14", -1, "expired"],
    ["2026-09-15", 0, "red"],
    ["2026-10-15", 30, "red"],
    ["2026-10-16", 31, "amber"],
    ["2026-11-14", 60, "amber"],
    ["2026-11-15", 61, "green"],
    ["", null, "unknown"],
    ["2026-02-30", null, "unknown"],
  ]) {
    assert.equal(daysRemaining(date, "2026-09-15"), days);
    assert.equal(alertLevel(days), alert);
  }
});
test("Bangkok date crosses UTC midnight correctly", () =>
  assert.equal(today(new Date("2026-09-14T18:00:00Z")), "2026-09-15"));
test("leap day and month transitions", () => {
  assert.equal(daysRemaining("2028-03-01", "2028-02-28"), 2);
  assert.equal(daysRemaining("2027-01-01", "2026-12-31"), 1);
});
test("master dates derive renewals without duplicate entry", () => {
  const s = {
    employees: [
      {
        id: "a",
        owner: "HR",
        visaExpiry: "2026-10-15",
        wpExpiry: "",
        stayExpiry: "2026-09-14",
      },
    ],
    renewalActions: { "a:visaExpiry": { action: "processing" } },
  };
  const r = renewals(s, "2026-09-15");
  assert.equal(r.length, 2);
  assert.equal(r[0].alert, "expired");
  assert.equal(r[1].action, "processing");
  s.employees[0].visaExpiry = "2026-12-15";
  assert.equal(renewals(s, "2026-09-15")[1].alert, "green");
});
test("checklist excludes not applicable and counts only complete", () => {
  assert.deepEqual(
    completion(
      {
        documents: [{ id: "1" }, { id: "2" }, { id: "3" }],
        employeeDocuments: {
          "e:1": { status: "complete" },
          "e:2": { status: "notApplicable" },
        },
      },
      "e",
    ),
    { done: 1, total: 2, percent: 50 },
  );
});
test("unknown budgets and partial costs never masquerade as zero", () => {
  assert.deepEqual(budgetTotals([{ estimated: null, actual: null }]), {
    estimated: null,
    actual: null,
    variance: null,
    pending: 1,
  });
  assert.equal(
    budgetTotals([
      { estimated: 100, actual: 120 },
      { estimated: null, actual: null },
    ]).variance,
    null,
  );
  assert.equal(budgetTotals([{ estimated: 100, actual: 120 }]).variance, 20);
});
test("approved capacity stays unknown without evidence; left excluded", () => {
  assert.equal(available({ id: "p", approved: null }, []), null);
  assert.equal(
    available({ id: "p", approved: 2 }, [
      { positionId: "p", status: "left" },
      { positionId: "p", status: "processing" },
    ]),
    1,
  );
});
