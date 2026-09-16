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
      if (!saved.sampleCleanupVersion) {
        this.removeSamples();
        this.save();
      }
    } else {
      this.state = this.seed();
      if (saved) this.warning = true;
    }
    return this.state;
  }
  seed() {
    const data = structuredClone(this.template);
    return {
      ...data,
      version: 1,
      employees: [],
      employeeDocuments: {},
      positions: [],
      batches: [],
      budget: [],
      sampleCleanupVersion: 1,
      renewalActions: {},
      changes: [],
      history: [],
    };
  }
  removeSamples() {
    const removed = new Set(
      this.state.employees
        .filter((e) => /^DEMO-\d+$/.test(e.id))
        .map((e) => e.id),
    );
    this.state.employees = this.state.employees.filter(
      (e) => !removed.has(e.id),
    );
    for (const key of ["employeeDocuments", "renewalActions"])
      this.state[key] = Object.fromEntries(
        Object.entries(this.state[key]).filter(
          ([id]) => !removed.has(id.split(":")[0]),
        ),
      );
    this.state.history = this.state.history.filter(
      (row) => !removed.has(row.employeeId),
    );
    this.state.changes = (this.state.changes || []).filter(
      (row) => !removed.has(row.employeeId),
    );
    for (const key of ["positions", "batches", "budget"]) {
      const samples = this.template[key] || [];
      this.state[key] = (this.state[key] || []).filter(
        (row) =>
          !samples.some(
            (sample) => JSON.stringify(sample) === JSON.stringify(row),
          ),
      );
    }
    this.state.sampleCleanupVersion = 1;
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
