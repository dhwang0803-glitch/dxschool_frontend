import { defineConfig } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'https://dx-frontend-121620013082.asia-northeast3.run.app'
const USER_ID = '877f7ce17f19e6e4503c13dc2b67e2e8b69d0830407cd53409a4907f25c7ee53'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: BASE_URL,
    headless: true,
    screenshot: 'only-on-failure',
    storageState: {
      cookies: [],
      origins: [{
        origin: BASE_URL,
        localStorage: [{ name: 'user_id', value: USER_ID }],
      }],
    },
  },
  projects: [
    { name: 'logged-in', use: {} },
    {
      name: 'logged-out',
      use: {
        storageState: { cookies: [], origins: [] },
      },
    },
  ],
  reporter: [['json', { outputFile: 'e2e/results.json' }], ['list']],
})
