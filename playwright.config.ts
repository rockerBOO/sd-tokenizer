import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  projects: [
    /* Test against desktop browsers */
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    /* Test against mobile viewports. */
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
    /* Test against branded browsers. */
    {
      name: "Google Chrome",
      use: { ...devices["Desktop Chrome"], channel: "chrome" }, // or 'chrome-beta'
    },
    {
      name: "Microsoft Edge",
      use: { ...devices["Desktop Edge"], channel: "msedge" }, // or 'msedge-dev'
    },
  ],
  // Run your local dev server before starting the tests
  webServer: {
    command: "yarn run dev",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "pipe",
  },
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:5173",
  },
});
