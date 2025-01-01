import { test, expect } from "@playwright/test";

test("has title", async ({ page }) => {
  await page.goto("/");

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/diffusion tokenizer/i);
});

test("loads models", async ({ page }) => {
  await page.goto("/");

  // See that expected models load.
  page.getByRole("button", { name: "SD1" });
  page.getByRole("button", { name: "SD2" });
  page.getByRole("button", { name: "SD3" });
  page.getByRole("button", { name: "Flux" });
  page.getByRole("button", { name: "Pixart" });
});
