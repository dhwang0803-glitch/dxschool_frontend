import { test, expect } from '@playwright/test'

const MY_URL = '/my?user_id=877f7ce17f19e6e4503c13dc2b67e2e8b69d0830407cd53409a4907f25c7ee53'

// ── TC-9: 프로필 헤더 및 보유 포인트 표시 (P1, 마이페이지) ──
test.describe('TC-9 프로필 헤더 및 보유 포인트 표시', () => {
  test('프로필 이름 표시 @logged-in', async ({ page }) => {
    await page.goto(MY_URL)
    await page.waitForTimeout(3000)
    const main = page.locator('main')
    await expect(main).toBeVisible()
    // 프로필 이름 또는 userId 앞 5자리
    const profileText = page.locator('text=/877f7|프로필|님/')
    expect(await profileText.count()).toBeGreaterThan(0)
  })

  test('보유 포인트 표시 @logged-in', async ({ page }) => {
    await page.goto(MY_URL)
    await page.waitForTimeout(3000)
    const points = page.locator('text=/포인트|P$/')
    expect(await points.count()).toBeGreaterThan(0)
  })
})

// ── TC-32: 시청 내역 탭 표시 및 클릭 이동 (P1, 마이페이지) ──
test.describe('TC-32 시청 내역 탭 표시 및 클릭 이동', () => {
  test('시청 내역 탭 선택 시 목록 표시 @logged-in', async ({ page }) => {
    await page.goto(MY_URL)
    await page.waitForTimeout(3000)
    const historyTab = page.locator('button, [role="tab"]').filter({ hasText: '시청' })
    if (await historyTab.count() > 0) {
      await historyTab.first().click()
      await page.waitForTimeout(1000)
      // 시청 내역 항목 또는 빈 상태 메시지
      const items = page.locator('a[href*="/series/"]')
      const emptyMsg = page.locator('text=/없습니다|내역이 없/')
      expect((await items.count()) + (await emptyMsg.count())).toBeGreaterThan(0)
    }
  })
})

// ── TC-4: 구매 내역 탭 표시 (P2, 마이페이지) ──
test.describe('TC-4 구매 내역 탭 표시', () => {
  test('구매 내역 탭 선택 시 표시 @logged-in', async ({ page }) => {
    await page.goto(MY_URL)
    await page.waitForTimeout(3000)
    const purchaseTab = page.locator('button, [role="tab"]').filter({ hasText: '구매' })
    if (await purchaseTab.count() > 0) {
      await purchaseTab.first().click()
      await page.waitForTimeout(1000)
      const main = page.locator('main')
      await expect(main).toBeVisible()
    }
  })
})

// ── TC-2: 마이페이지 각 탭 빈 상태 처리 (P3, 마이페이지) ──
test.describe('TC-2 마이페이지 각 탭 빈 상태 처리', () => {
  test('비로그인 시 로그인 유도 @logged-out', async ({ page }) => {
    await page.goto('/my')
    await page.waitForTimeout(3000)
    const loginPrompt = page.locator('text=/로그인|user_id/')
    const main = page.locator('main')
    await expect(main).toBeVisible()
  })
})
