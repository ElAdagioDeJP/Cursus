import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const { teamId } = JSON.parse(readFileSync("e2e/.auth/env.json", "utf8")) as {
  teamId: string;
};
const board = `/demo/teams/${teamId}/board`;

test("tablero muestra issues semilla", async ({ page }) => {
  await page.goto(board);
  await expect(
    page.getByRole("heading", { name: /CUR Cursus|Cursus/ }),
  ).toBeVisible();
  await expect(page.getByText("Configurar migraciones propias")).toBeVisible();
});

test("filtro por estado en URL", async ({ page }) => {
  await page.goto(`${board}?status=todo`);
  await expect(page.getByText("Tablero con drag and drop")).toBeVisible();
  await expect(page.getByText("Configurar migraciones propias")).toBeHidden();
});

test("crear incidencia desde el tablero", async ({ page }) => {
  const title = `E2E crear ${Date.now()}`;
  await page.goto(board);
  await page.getByRole("button", { name: /Nueva incidencia/ }).click();
  await page.getByLabel("Título").fill(title);
  await page.getByRole("button", { name: "Crear", exact: true }).click();
  await expect(page.getByRole("link", { name: title }).first()).toBeVisible();
});

test("drag mueve incidencia y persiste tras recarga", async ({ page }) => {
  await page.goto(board);
  await expect(page.getByTestId("hotkeys-ready")).toBeAttached();
  const card = page.getByText("Servidor MCP cursus_");
  await expect(card).toBeVisible();
  const target = page
    .getByRole("region", { name: /En curso/ })
    .or(page.getByLabel(/En curso/));
  const cardBox = await card.boundingBox();
  const targetBox = await target.first().boundingBox();
  if (!cardBox || !targetBox) throw new Error("sin cajas para drag");
  await page.mouse.move(
    cardBox.x + cardBox.width / 2,
    cardBox.y + cardBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2,
    { steps: 25 },
  );
  await page.mouse.up();
  await page.goto(board);
  const inProgress = page.getByLabel(/En curso \(\d+\)/);
  await expect(inProgress.getByText("Servidor MCP cursus_")).toBeVisible({
    timeout: 15000,
  });
});
