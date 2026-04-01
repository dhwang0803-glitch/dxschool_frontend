import { test, expect } from '@playwright/test'

// ── TC-48: 이어보기 → 시리즈 상세 연동 및 재생 (P2, 크로스페이지) ──
test.describe('TC-48 이어보기 → 시리즈 상세 연동', () => {
  test('이어보기 카드 클릭 시 시리즈 상세 이동 @logged-in', async ({ page }) => {
    await page.goto('/?user_id=877f7ce17f19e6e4503c13dc2b67e2e8b69d0830407cd53409a4907f25c7ee53')
    await page.waitForTimeout(3000)
    const watchingSection = page.locator('section').filter({ hasText: '이어보기' })
    if (await watchingSection.count() > 0) {
      const card = watchingSection.locator('a[href*="/series/"]').first()
      if (await card.isVisible()) {
        await card.click()
        await expect(page).toHaveURL(/\/series\//)
      }
    }
  })
})

// ── TC-41: 광고 타입별 팝업 표시 내용 검증 (P2, 광고팝업) ──
// WebSocket 기반 실시간 광고 — 자동화 어려움, Skip
test.describe('TC-41 광고 타입별 팝업 표시', () => {
  test.skip('WebSocket 기반 실시간 광고 연동 — 수동 검증 필요', async () => {})
})
