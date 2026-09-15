const { chromium } = require("playwright");
const fs = require("fs");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.CHROME_PATH ||
      (process.platform === "darwin"
        ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        : undefined),
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  const base = process.env.TEST_URL || "http://127.0.0.1:4173";
  await page.goto(base);
  await page.locator(".metric").first().waitFor();
  fs.mkdirSync("test-results", { recursive: true });
  await page.screenshot({ path: "test-results/dashboard.png", fullPage: true });
  const routes = [
    "employees",
    "documents",
    "positions",
    "batches",
    "budget",
    "renewals",
    "changes",
    "resources",
    "dashboard",
  ];
  for (const r of routes) {
    await page.locator(`nav a[href="#${r}"]`).click();
    await page.waitForTimeout(100);
    if (!(await page.locator("#content").innerText()))
      throw Error("Empty " + r);
  }
  for (const lang of ["zh", "th", "en"]) {
    await page.locator("#language").selectOption(lang);
    if ((await page.locator("html").getAttribute("lang")) !== lang)
      throw Error("Language not changed");
    for (const r of routes) {
      await page.locator(`nav a[href="#${r}"]`).click();
      await page.waitForTimeout(40);
    }
  }
  await page.locator('nav a[href="#employees"]').click();
  await page.locator("#employeeSearch").fill("Sample Employee 003");
  if ((await page.locator("#content tbody tr").count()) !== 1)
    throw Error("Search failed");
  await page.locator("[data-detail]").first().click();
  await page.locator("dialog[open]").waitFor();
  await page.locator("[data-close]").click();
  await page.locator("#clear").click();
  await page.locator('[data-filter="status"]').selectOption("processing");
  if ((await page.locator("#content tbody tr").count()) !== 3)
    throw Error(
      "Status filter: " + (await page.locator("#content tbody").innerText()),
    );
  await page.locator("#clear").click();
  await page.locator("#sort").selectOption("descending");
  if (
    !(await page.locator("#content tbody tr").first().innerText()).includes(
      "012",
    )
  )
    throw Error("Sort");
  await page.locator('[data-edit="employees"]').first().click();
  await page.locator('[name="name"]').fill("DEMO Test");
  await page.locator('[name="englishName"]').fill("Test sample");
  await page.locator('[name="visaExpiry"]').fill("2030-01-01");
  await page.locator('button[type="submit"]').click();
  await page.locator("#employeeSearch").fill("DEMO Test");
  if ((await page.locator("#content tbody tr").count()) !== 1)
    throw Error("Add employee");
  await page.reload();
  await page.locator("#employeeSearch").fill("DEMO Test");
  if ((await page.locator("#content tbody tr").count()) !== 1)
    throw Error("Persistence");
  await page.locator('nav a[href="#documents"]').click();
  const doc = page.locator("[data-doc]").first();
  const key = await doc.getAttribute("data-doc");
  await doc.selectOption("missing");
  await page.reload();
  if ((await page.locator(`[data-doc="${key}"]`).inputValue()) !== "missing")
    throw Error("Checklist persistence");
  await page.locator('nav a[href="#renewals"]').click();
  await page.locator("[data-renewal]").first().click();
  await page.locator('[name="action"]').selectOption("processing");
  await page.locator("#renewalForm button").last().click();
  await page.locator('[data-filter="action"]').selectOption("processing");
  if ((await page.locator("#content tbody tr").count()) !== 1)
    throw Error("Renewal action");
  // Check source planning records can be edited without inventing blank amounts.
  await page.locator('nav a[href="#positions"]').click();
  await page.locator('[data-edit="positions"]').first().click();
  await page.locator('[name="approved"]').fill("2");
  await page.locator('[name="approvalDate"]').fill("2026-09-01");
  await page.locator('#recordForm button[type="submit"]').click();
  await page.locator('nav a[href="#batches"]').click();
  await page.locator('[data-edit="batches"]').first().click();
  await page.locator('[name="plannedStart"]').fill("2026-10-15");
  await page.locator('[name="plannedEnd"]').fill("2026-10-01");
  await page.locator('#recordForm button[type="submit"]').click();
  if (!(await page.locator("#formError").innerText()))
    throw Error("Invalid date range accepted");
  await page.locator('[name="plannedEnd"]').fill("2026-11-01");
  await page.locator('[name="progress"]').fill("40");
  await page.locator('#recordForm button[type="submit"]').click();
  if (
    !(await page
      .locator("#content")
      .innerText()
      .then((x) => x.includes("40%")))
  )
    throw Error("Batch progress");
  await page.locator('nav a[href="#budget"]').click();
  await page.locator('[data-edit="budget"]').first().click();
  await page.locator('[name="quantity"]').fill("2");
  await page.locator('[name="unitCost"]').fill("100");
  await page.locator('[name="actual"]').fill("180");
  await page.locator('[name="vendor"]').fill("DEMO vendor");
  await page.locator('#recordForm button[type="submit"]').click();
  if (
    !(await page.locator("#content tbody tr").first().innerText()).includes(
      "200.00",
    )
  )
    throw Error("Budget multiplication");
  await page.locator('nav a[href="#changes"]').click();
  await page.locator('[data-edit="changes"]').first().click();
  await page.locator('[name="employeeId"]').selectOption("DEMO-001");
  await page.locator('[name="replacementId"]').selectOption("DEMO-001");
  await page.locator('#recordForm button[type="submit"]').click();
  if (!(await page.locator("#formError").innerText()))
    throw Error("Self replacement accepted");
  await page.locator('[name="replacementId"]').selectOption("DEMO-002");
  await page.locator('[name="positionId"]').selectOption("positions-1");
  await page.locator('[name="lastDate"]').fill("2026-10-01");
  await page.locator('[name="wpStatus"]').selectOption("processing");
  await page.locator('#recordForm button[type="submit"]').click();
  if (!(await page.locator(".change-card").count()))
    throw Error("Change workflow");
  await page.reload();
  if (!(await page.locator(".change-card").count()))
    throw Error("Change persistence");
  await page.locator('nav a[href="#employees"]').click();
  await page.locator("#employeeSearch").fill("no-such-record");
  if (!(await page.locator(".empty").count())) throw Error("Empty state");
  await page.locator("#clear").click();
  await page.locator("#sort").selectOption("ascending");
  await page.locator('[data-page="2"]').click();
  if (!(await page.locator("#content tbody").innerText()).includes("009"))
    throw Error("Pagination");
  await page.locator('nav a[href="#resources"]').click();
  await page.locator(".resource-card a").first().waitFor();
  if ((await page.locator(".resource-card a").count()) !== 8)
    throw Error("Resource count");
  for (const a of await page.locator(".resource-card a").all()) {
    const href = await a.getAttribute("href");
    if (!/^https:\/\//.test(href)) throw Error("Unsafe link");
    if (!(await a.getAttribute("rel")).includes("noopener"))
      throw Error("Unsafe external target");
  }
  await page.locator("#reset").click();
  await page.locator("#confirmReset").click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#menu").click();
  await page.locator('nav a[href="#dashboard"]').click();
  await page.waitForTimeout(4100);
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
  for (const lang of ["zh", "th", "en"]) {
    await page.locator("#language").selectOption(lang);
    for (const r of routes) {
      await page.locator("#menu").click();
      await page.locator(`nav a[href="#${r}"]`).click();
      if (
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        )
      )
        throw Error("Mobile overflow: " + lang + " " + r);
    }
  }
  if (
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  )
    throw Error("Mobile overflow");
  if (errors.length) throw Error(errors.join("\n"));
  console.log(
    "PASS: all routes in 3 languages; search, status filter, sort, details, create, persistence, checklist, renewal actions, reset, mobile; no console errors.",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
