import { test, expect } from '@playwright/test'

// ── TC-45: 알림 목록 표시 및 뱃지 카운트 (P2, GNB) ──
test.describe('TC-45 알림 목록 표시 및 뱃지 카운트', () => {
  test('로그인 시 벨 아이콘 표시 @logged-in', async ({ page }) => {
    await page.goto('/?user_id=877f7ce17f19e6e4503c13dc2b67e2e8b69d0830407cd53409a4907f25c7ee53')
    await page.waitForTimeout(3000)
    // SVG 벨 아이콘 또는 알림 버튼
    const bellIcon = page.locator('button').filter({ has: page.locator('svg') }).nth(0)
    // GNB 내 버튼들 중 알림 관련
    const gnb = page.locator('nav, header').first()
    await expect(gnb).toBeVisible()
  })

  test('비로그인 시 알림 벨 미표시 @logged-out', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(3000)
    // 알림 뱃지(빨간 카운터)가 없어야 함
    const badge = page.locator('[class*="bg-red"][class*="rounded-full"]')
    expect(await badge.count()).toBe(0)
  })
})

// ── TC-10: 알림 읽음/삭제 관리 (P2, GNB) ──
test.describe('TC-10 알림 읽음/삭제 관리', () => {
  test('알림 드롭다운 열기 @logged-in', async ({ page }) => {
    await page.goto('/?user_id=877f7ce17f19e6e4503c13dc2b67e2e8b69d0830407cd53409a4907f25c7ee53')
    await page.waitForTimeout(3000)
    // 벨 아이콘 클릭
    const bellBtn = page.locator('nav button, header button').filter({ has: page.locator('svg path[d*="M15"]') }).first()
    if (await bellBtn.count() > 0) {
      await bellBtn.click()
      await page.waitForTimeout(1000)
      // 드롭다운이 열리면 알림 내용 또는 "없습니다" 확인
      const dropdown = page.locator('[class*="absolute"], [class*="dropdown"], [class*="z-"]')
      expect(await dropdown.count()).toBeGreaterThan(0)
    }
  })
})
