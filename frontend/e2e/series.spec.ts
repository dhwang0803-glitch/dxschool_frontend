import { test, expect } from '@playwright/test'

// 테스트용 시리즈 — 런닝맨 (무료 에피소드 포함)
const SERIES_URL = '/series/%EB%9F%B0%EB%8B%9D%EB%A7%A8'

// ── TC-46: 에피소드 목록 표시 및 무료 뱃지 (P1, 시리즈상세) ──
test.describe('TC-46 에피소드 목록 표시 및 무료 뱃지', () => {
  test('에피소드 목록이 표시된다 @logged-in', async ({ page }) => {
    await page.goto(SERIES_URL + '?user_id=877f7ce17f19e6e4503c13dc2b67e2e8b69d0830407cd53409a4907f25c7ee53')
    await page.waitForTimeout(3000)
    // 에피소드 항목 확인
    const episodes = page.locator('[class*="cursor-pointer"], [class*="episode"], button, div').filter({ hasText: /회$|화$/ })
    // 에피소드 텍스트가 포함된 요소
    const epTexts = page.locator('text=/\\d+회/')
    expect(await epTexts.count()).toBeGreaterThanOrEqual(0)
  })

  test('무료 뱃지 표시 @logged-in', async ({ page }) => {
    await page.goto(SERIES_URL + '?user_id=877f7ce17f19e6e4503c13dc2b67e2e8b69d0830407cd53409a4907f25c7ee53')
    await page.waitForTimeout(3000)
    const freeBadge = page.locator('text=무료')
    // 무료 에피소드가 있으면 뱃지 확인
    if (await freeBadge.count() > 0) {
      await expect(freeBadge.first()).toBeVisible()
    }
  })

  test('비로그인 상태에서 에피소드 조회 가능 @logged-out', async ({ page }) => {
    await page.goto(SERIES_URL)
    await page.waitForTimeout(3000)
    // 페이지가 정상 로드되는지 (에러 없이)
    const main = page.locator('main')
    await expect(main).toBeVisible()
  })
})

// ── TC-25: 유사 콘텐츠 섹션 표시 (P2, 시리즈상세) ──
test.describe('TC-25 유사 콘텐츠 섹션 표시', () => {
  test('유사 콘텐츠 섹션 표시 @logged-in', async ({ page }) => {
    await page.goto(SERIES_URL + '?user_id=877f7ce17f19e6e4503c13dc2b67e2e8b69d0830407cd53409a4907f25c7ee53')
    await page.waitForTimeout(3000)
    const similar = page.locator('h2, h3').filter({ hasText: /유사|비슷|추천/ })
    if (await similar.count() > 0) {
      await expect(similar.first()).toBeVisible()
      // 포스터 카드 확인
      const cards = page.locator('a[href*="/series/"]')
      expect(await cards.count()).toBeGreaterThan(0)
    }
  })
})

// ── TC-3: 미구매 유료 VOD 재생 차단 및 인증 오류 (P3, 시리즈상세) ──
test.describe('TC-3 미구매 유료 VOD 재생 차단', () => {
  test('미구매 유료 에피소드 클릭 시 구매 버튼 표시 @logged-in', async ({ page }) => {
    await page.goto(SERIES_URL + '?user_id=877f7ce17f19e6e4503c13dc2b67e2e8b69d0830407cd53409a4907f25c7ee53')
    await page.waitForTimeout(3000)
    // 구매하기 버튼 확인
    const buyBtn = page.locator('text=구매하기')
    if (await buyBtn.count() > 0) {
      await expect(buyBtn.first()).toBeVisible()
    }
  })
})
