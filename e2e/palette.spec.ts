import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const { teamId } = JSON.parse(readFileSync("e2e/.auth/env.json", "utf8")) as {
  teamId: string;
};
const board = `/demo/teams/${teamId}/board`;

test("Cmd+K abre y Esc cierra", async ({ page }) => {
  await page.goto(board);
  await expect(page.getByText("Configurar migraciones propias")).toBeVisible();
  await expect(page.getByTestId("hotkeys-ready")).toBeAttached();
  await page.keyboard.press("ControlOrMeta+k");
  await expect(
    page.getByRole("dialog", { name: "Paleta de comandos" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Paleta de comandos" }),
  ).toBeHidden();
});

test("paleta busca incidencias", async ({ page }) => {
  await page.goto(board);
  await expect(page.getByText("Configurar migraciones propias")).toBeVisible();
  await expect(page.getByTestId("hotkeys-ready")).toBeAttached();
  await page.keyboard.press("ControlOrMeta+k");
  await expect(
    page.getByRole("dialog", { name: "Paleta de comandos" }),
  ).toBeVisible();
  await page.getByPlaceholder("Buscar incidencias o ir a…").fill("migraciones");
  const dialog = page.getByRole("dialog", { name: "Paleta de comandos" });
  await expect(dialog.getByText("CUR-1", { exact: true })).toBeVisible({
    timeout: 10000,
  });
});

test("? abre ayuda de atajos", async ({ page }) => {
  await page.goto(board);
  await expect(page.getByText("Configurar migraciones propias")).toBeVisible();
  await expect(page.getByTestId("hotkeys-ready")).toBeAttached();
  await page.keyboard.press("?");
  await expect(
    page.getByRole("dialog", { name: "Atajos de teclado" }),
  ).toBeVisible();
});
