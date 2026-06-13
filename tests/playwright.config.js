import { defineConfig } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost";
const API_URL  = process.env.API_URL  || "http://localhost/api/todos";

export default defineConfig({
  timeout: 30000,
  retries: 1,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["junit", { outputFile: "junit.xml" }],
  ],
  use: {
    baseURL: BASE_URL,
    headless: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "e2e",
      testDir: "./e2e",
    },
    {
      name: "api",
      testDir: "./api",
    },
  ],
});

export { API_URL };