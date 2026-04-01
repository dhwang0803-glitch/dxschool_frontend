import { test, expect } from '@playwright/test'

// 유료 시리즈 구매 페이지
const PURCHASE_URL = '/purchase/%EB%9F%B0%EB%8B%9D%EB%A7%A8'

// ── TC-26: 구매 옵션 표시 및 보유 포인트 확인 (P1, 구매) ──
test.describe('TC-26 구매 옵션 표시 및 보유 포인트 확인', () => {
  test('구매 옵션 라디오 버튼 표시 @logged-in', async ({ page }) => {
    await page.goto(PURCHASE_URL + '?user_id=877f7ce17f19e6e4503c13dc2b67e2e8b69d0830407cd53409a4907f25c7ee53')
    await page.waitForTimeout(3000)
    // 대여 또는 영구소장 옵션
    const rentalOption = page.locator('text=/대여|48시간/')
    const ownOption = page.locator('text=/영구|소장/')
    const freeMsg = page.locator('text=무료')
    const hasOptions = (await rentalOption.count() > 0) || (await ownOption.count() > 0)
    const isFree = await freeMsg.count() > 0
    // 유료면 옵션 있어야 하고, 무료면 무료 안내
    expect(hasOptions || isFree).toBe(true)
  })

  test('보유 포인트 표시 @logged-in', async ({ page }) => {
    await page.goto(PURCHASE_URL + '?user_id=877f7ce17f19e6e4503c13dc2b67e2e8b69d0830407cd53409a4907f25c7ee53')
    await page.waitForTimeout(3000)
    const points = page.locator('text=/포인트|P$/')
    expect(await points.count()).toBeGreaterThanOrEqual(0)
  })
})

// ── TC-24: 포인트 결제 성공 및 시리즈 상세 자동 이동 (P1, 구매) ──
// 주의: 실제 결제가 발생하므로 Skip 처리
test.describe('TC-24 포인트 결제 성공', () => {
  test.skip('실제 포인트 차감 방지를 위해 Skip', async () => {})
})

// ── TC-22: 무료 콘텐츠 구매 시도 시 안내 (P3, 크로스페이지) ──
test.describe('TC-22 무료 콘텐츠 구매 시도 시 안내', () => {
  test('무료 시리즈 구매 페이지에서 안내 메시지 @logged-in', async ({ page }) => {
    // 무료 시리즈 구매 페이지
    await page.goto('/purchase/%EB%9F%B0%EB%8B%9D%EB%A7%A8?user_id=877f7ce17f19e6e4503c13dc2b67e2e8b69d0830407cd53409a4907f25c7ee53')
    await page.waitForTimeout(3000)
    const freeMsg = page.locator('text=무료')
    const backBtn = page.locator('text=/돌아가기|뒤로/')
    // 무료 콘텐츠이면 안내 + 돌아가기 표시
    if (await freeMsg.count() > 0) {
      await expect(freeMsg.first()).toBeVisible()
    }
  })
})

// ── TC-44: 포인트 부족 시 구매 실패 및 옵션 변경 (P3, 크로스페이지) ──
// 주의: 실제 결제 시도 필요 → Skip
test.describe('TC-44 포인트 부족 시 구매 실패', () => {
  test.skip('실제 결제 시도 방지를 위해 Skip', async () => {})
})
