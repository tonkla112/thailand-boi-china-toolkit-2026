import { offsetDate } from "./domain.js";
const KEY = "boi-toolkit-demo-v1";
export class Repository {
  async load() {
    const response = await fetch("data/workbook.json");
    if (!response.ok) throw new Error("Template unavailable");
    this.template = await response.json();
    let saved;
    try {
      saved = JSON.parse(localStorage.getItem(KEY));
    } catch {
      this.warning = true;
    }
    if (
      saved?.version === 1 &&
      Array.isArray(saved.employees) &&
      saved.positions &&
      saved.employeeDocuments &&
      saved.renewalActions &&
      saved.history
    ) {
      this.state = saved;
    } else {
      this.state = this.seed();
      if (saved) this.warning = true;
    }
    return this.state;
  }
  seed() {
    const data = structuredClone(this.template);
    const statuses = [
      "wpIssued",
      "processing",
      "approved",
      "renewing",
      "pending",
      "entered",
      "wpIssued",
      "processing",
      "wpIssued",
      "left",
      "processing",
      "pending",
    ];
    const employees = statuses.map((status, i) => {
      const p = data.positions[i % data.positions.length];
      return {
        id: "DEMO-" + String(i + 1).padStart(3, "0"),
        no: i + 1,
        name: "DEMO " + String(i + 1).padStart(3, "0"),
        englishName: "Sample Employee " + String(i + 1).padStart(3, "0"),
        passport: "DEMO-NOT-A-PASSPORT-" + (i + 1),
        nationality: { en: "Chinese", zh: "中国", th: "จีน" },
        department: p.department,
        position: p.title,
        positionId: "",
        location: {
          en: "Demo Thailand office",
          zh: "泰国演示办公室",
          th: "สำนักงานตัวอย่างประเทศไทย",
        },
        startDate: offsetDate(-120 + i * 5),
        positionApprovalDate: "",
        personnelApprovalDate: "",
        visaExpiry: i % 4 === 0 ? offsetDate(20 + i * 7) : "",
        stayExpiry:
          i % 3 === 0 ? offsetDate(-4 + i * 8) : offsetDate(110 + i * 5),
        wpExpiry:
          status === "wpIssued" || status === "renewing"
            ? offsetDate(15 + i * 16)
            : "",
        passportExpiry: offsetDate(300 + i * 35),
        reentry: "unknown",
        dependants: "none",
        owner: i % 2 ? "ownerProject" : "ownerHR",
        status,
        remarks: "",
      };
    });
    const employeeDocuments = {};
    for (const [i, e] of employees.entries())
      for (const [j, d] of data.documents.entries())
        employeeDocuments[e.id + ":" + d.id] = {
          status:
            j < 5 + (i % 8)
              ? "complete"
              : j === 14
                ? "notApplicable"
                : j % 3 === 0
                  ? "missing"
                  : "requested",
          remarks: "",
        };
    return {
      ...data,
      version: 1,
      employees,
      employeeDocuments,
      renewalActions: {},
      changes: [],
      history: [],
    };
  }
  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.state));
      return true;
    } catch {
      return false;
    }
  }
  record(employeeId, type) {
    this.state.history.unshift({
      employeeId,
      type,
      at: new Date().toISOString(),
    });
    this.state.history = this.state.history.slice(0, 500);
    return this.save();
  }
  reset() {
    this.state = this.seed();
    return this.save();
  }
}
