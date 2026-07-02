import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:3200",
    trace: "on-first-retry",
  },
  webServer: {
    command: "docker compose up --build app",
    reuseExistingServer: true,
    timeout: 120_000,
    url: "http://127.0.0.1:3200/login",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
