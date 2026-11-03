import { expect, test } from "@playwright/test";

test("demo user can manage a project, task, bug, analytics, and session", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue in demo mode" }).click();
  await expect(page.getByRole("heading", { name: "Good morning, Edi" })).toBeVisible();

  await page.getByRole("button", { name: "Projects", exact: true }).click();
  await page.getByRole("button", { name: "New project" }).click();
  await page.locator('input[name="title"]').fill("E2E Launch Project");
  await page.locator('input[name="dueDate"]').fill("2026-12-01");
  await page.locator(".create-modal button[type='submit']").click();
  await expect(page.getByRole("heading", { name: "E2E Launch Project" })).toBeVisible();

  await page.getByRole("button", { name: "Tasks", exact: true }).click();
  await page.getByRole("button", { name: "New task" }).click();
  await page.locator('input[name="title"]').fill("E2E Move this task");
  await page.getByRole("button", { name: "Create task" }).click();
  const task = page.locator(".kanban-card").filter({ hasText: "E2E Move this task" });
  await expect(task).toBeVisible();
  await task.dragTo(page.locator(".kanban-column").nth(2));
  await expect(page.locator(".kanban-column").nth(2).locator(".kanban-card").filter({ hasText: "E2E Move this task" })).toHaveCount(1);

  await page.getByRole("button", { name: /Bug tracker/ }).click();
  await page.getByRole("button", { name: "Report a bug" }).click();
  await page.locator('input[name="title"]').fill("E2E resolve this bug");
  await page.getByRole("button", { name: "Report bug" }).click();
  const bugRow = page.locator(".bug-table-row").filter({ hasText: "E2E resolve this bug" });
  await bugRow.getByRole("button", { name: "Resolve" }).click();
  await expect(bugRow.locator(".bug-status-resolved")).toBeVisible();

  await page.getByRole("button", { name: "Analytics", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible();
  await expect(page.getByText("Tasks completed over time")).toBeVisible();

  await page.locator('button[aria-label="Sign out"]').click();
  await expect(page).toHaveURL(/\/login$/);
});

test("assistant validates inputs and returns demo-mode guidance", async ({ request }) => {
  const invalid = await request.post("/api/assistant", { data: { prompt: "" } });
  expect(invalid.status()).toBe(400);

  const response = await request.post("/api/assistant", {
    data: {
      prompt: "Summarize my current work",
      projects: [{ id: "p1", name: "Atlas", status: "In progress" }],
      tasks: [{ id: "t1", title: "Ship auth", status: "In progress", priority: "High", projectId: "p1" }],
      issues: [],
    },
  });
  expect(response.ok()).toBeTruthy();
  const result = await response.json();
  expect(result.mode).toBe("demo");
  expect(result.reply).toContain("Atlas");
});

test("forms validate required project names and GitHub data is protected", async ({ page, request }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Projects", exact: true }).click();
  await page.getByRole("button", { name: "New project" }).click();
  await page.locator(".create-modal button[type='submit']").click();
  await expect(page.getByText("A title is required.")).toBeVisible();

  const repositories = await request.get("/api/github/repos");
  expect(repositories.status()).toBe(401);
});

test("workspace navigation and content fit a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const menu = page.locator(".mobile-menu-button");
  await expect(menu).toBeVisible();
  await menu.click();
  await page.getByRole("button", { name: "Tasks", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Task board" })).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
});
