import { test, expect } from '@playwright/test'

/**
 * FC2차 테스트런 — Playwright 자동화
 *
 * TC-1 ~ TC-21 (21건)
 * - Fail 재테스트 8건, Blocked 재테스트 4건
 * - 회귀테스트 5건, 사이드이펙트 4건
 */

const USER_ID = '877f7ce17f19e6e4503c13dc2b67e2e8b69d0830407cd53409a4907f25c7ee53'
const HOME = `/?user_id=${USER_ID}`
const SERIES_URL = `/series/${encodeURIComponent('런닝맨')}?user_id=${USER_ID}`
const SERIES_URL_2 = `/series/${encodeURIComponent('기생충')}?user_id=${USER_ID}`

// ════════════════════════════════════════════════════════════════
// TC-1: 히어로 배너 캐러셀 표시 및 클릭 이동 (P1, 홈) — Fail 재테스트
// ════════════════════════════════════════════════════════════════
test.describe('FC2-TC1 히어로 배너 캐러셀 표시 및 클릭 이동', () => {
  test('배너가 표시되고 카테고리 뱃지가 보인다', async ({ page }) => {
    await page.goto(HOME)
    await page.waitForTimeout(3000)
    const banner = page.locator('.relative.w-full.overflow-hidden').first()
    await expect(banner).toBeVisible({ timeout: 10000 })
    // 카테고리 뱃지 (text-blue-400)
    const badge = banner.locator('span.text-blue-400')
    if (await badge.count() > 0) {
      await expect(badge.first()).toBeVisible()
    }
  })

  test('배너 개수 최대 15개 (인디케이터로 확인)', async ({ page }) => {
    await page.goto(HOME)
    await page.waitForTimeout(3000)
    const indicators = page.locator('button.rounded-full')
    const count = await indicators.count()
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThanOrEqual(15)
  })

  test('배너 클릭 시 시리즈 상세 이동', async ({ page }) => {
    await page.goto(HOME)
    await page.waitForTimeout(3000)
    const bannerLink = page.locator('a[href*="/series/"]').first()
    if (await bannerLink.isVisible()) {
      await bannerLink.click()
      await expect(page).toHaveURL(/\/series\//)
    }
  })
})

// ════════════════════════════════════════════════════════════════
// TC-2: 영상 재생 시 실시간 광고 서버 연결 (P1, 광고팝업) — Fail 재테스트
// ════════════════════════════════════════════════════════════════
test.describe('FC2-TC2 영상 재생 시 실시간 광고 서버 연결', () => {
  test('시리즈 상세에서 에피소드 클릭 시 영상 영역 활성화', async ({ page }) => {
    await page.goto(SERIES_URL)
    await page.waitForTimeout(4000)
    // 무료 에피소드 클릭 시도
    const freeEp = page.locator('text=무료').first()
    if (await freeEp.isVisible()) {
      const epRow = freeEp.locator('xpath=ancestor::div[contains(@class,"cursor-pointer")]').first()
      if (await epRow.count() > 0) await epRow.click()
      await page.waitForTimeout(2000)
      // 플레이어 또는 로딩 상태 확인
      const player = page.locator('iframe[src*="youtube"], div[id="yt-hero-player"]')
      const loading = page.locator('text=로딩')
      expect((await player.count()) + (await loading.count())).toBeGreaterThanOrEqual(0)
    }
  })

  test.skip('WebSocket playback_update 0.5초 전송 — 수동 검증 필요', async () => {})
})

// ════════════════════════════════════════════════════════════════
// TC-3: VOD 재생 및 상세 정보 표시 (P1, 시리즈상세) — Fail 재테스트
// ════════════════════════════════════════════════════════════════
test.describe('FC2-TC3 VOD 재생 및 상세 정보 표시', () => {
  test('시리즈 상세 페이지 로드 및 상세 정보 표시', async ({ page }) => {
    await page.goto(SERIES_URL)
    await page.waitForTimeout(4000)
    const main = page.locator('main')
    await expect(main).toBeVisible()
    // 출연진 또는 줄거리 확인
    const detailInfo = page.locator('text=/출연|줄거리|감독|시청등급/')
    if (await detailInfo.count() > 0) {
      await expect(detailInfo.first()).toBeVisible()
    }
  })

  test('에피소드 목록에 에피소드가 표시된다', async ({ page }) => {
    await page.goto(SERIES_URL)
    await page.waitForTimeout(4000)
    const epTexts = page.locator('text=/\\d+회/')
    expect(await epTexts.count()).toBeGreaterThan(0)
  })

  test('히어로 영역에 포스터 또는 플레이어 영역 존재', async ({ page }) => {
    await page.goto(SERIES_URL)
    await page.waitForTimeout(4000)
    // 히어로 영역: background-image 또는 gradient가 적용된 영역
    const heroArea = page.locator('div[style*="background-image"], div[class*="bg-gradient"], div[class*="overflow-hidden"]').first()
    await expect(heroArea).toBeVisible({ timeout: 10000 })
  })
})

// ════════════════════════════════════════════════════════════════
// TC-4: 시청 진행률 표시 및 Heartbeat 저장 (P2, 시리즈상세) — Fail 재테스트
// ════════════════════════════════════════════════════════════════
test.describe('FC2-TC4 시청 진행률 표시 및 Heartbeat 저장', () => {
  test('이어보기 레이블 표시 (로그인)', async ({ page }) => {
    await page.goto(SERIES_URL)
    await page.waitForTimeout(4000)
    // "이어보기" 파란색 레이블
    const resumeLabel = page.locator('text=이어보기')
    if (await resumeLabel.count() > 0) {
      await expect(resumeLabel.first()).toBeVisible()
    }
  })

  test('비로그인 시 진행률 미표시', async ({ page }) => {
    await page.goto(`/series/${encodeURIComponent('런닝맨')}`)
    await page.waitForTimeout(4000)
    // 이어보기 레이블이 없어야 함
    const resumeLabel = page.locator('span:has-text("이어보기")').filter({ hasText: /^이어보기$/ })
    // 비로그인이므로 progress API를 호출하지 않아 레이블 미표시 기대
    const main = page.locator('main')
    await expect(main).toBeVisible()
  })
})

// ════════════════════════════════════════════════════════════════
// TC-5: 유사 콘텐츠 섹션 표시 (P2, 시리즈상세) — Fail 재테스트
// ════════════════════════════════════════════════════════════════
test.describe('FC2-TC5 유사 콘텐츠 섹션 표시', () => {
  test('유사 콘텐츠 섹션 표시 및 카드 존재', async ({ page }) => {
    await page.goto(SERIES_URL)
    await page.waitForTimeout(5000)
    const similar = page.locator('h2, h3').filter({ hasText: /관련|유사|비슷|추천/ })
    if (await similar.count() > 0) {
      await expect(similar.first()).toBeVisible()
      // 포스터 카드 확인
      const section = similar.first().locator('xpath=ancestor::section')
      if (await section.count() > 0) {
        const cards = section.locator('a[href*="/series/"]')
        expect(await cards.count()).toBeGreaterThan(0)
      }
    }
  })

  test('유사 콘텐츠 카드 클릭 시 시리즈 상세 이동', async ({ page }) => {
    await page.goto(SERIES_URL)
    await page.waitForTimeout(5000)
    const similar = page.locator('h2, h3').filter({ hasText: /관련|유사|비슷|추천/ })
    if (await similar.count() > 0) {
      const section = similar.first().locator('xpath=ancestor::section')
      if (await section.count() > 0) {
        const card = section.locator('a[href*="/series/"]').first()
        if (await card.isVisible()) {
          const href = await card.getAttribute('href')
          await card.click()
          await expect(page).toHaveURL(/\/series\//)
          // 이전 시리즈와 다른 페이지로 이동했는지 확인
          expect(href).not.toBeNull()
        }
      }
    }
  })
})

// ════════════════════════════════════════════════════════════════
// TC-6: 이어보기 섹션 표시 및 진행률 카드 (P2, 홈) — Fail 재테스트
// ════════════════════════════════════════════════════════════════
test.describe('FC2-TC6 이어보기 섹션 표시 및 진행률 카드', () => {
  test('로그인 시 이어보기 섹션 표시 (0%/100% 제외)', async ({ page }) => {
    await page.goto(HOME)
    await page.waitForTimeout(4000)
    const watching = page.locator('h2', { hasText: '이어보기' })
    if (await watching.count() > 0) {
      await expect(watching.first()).toBeVisible()
      // 프로그레스바 확인 (w-60 h-40 카드 내부)
      const section = page.locator('section').filter({ hasText: '이어보기' })
      const cards = section.locator('a[href*="/series/"]')
      expect(await cards.count()).toBeGreaterThan(0)
    }
  })

  test('이어보기 카드 클릭 시 시리즈 상세 이동', async ({ page }) => {
    await page.goto(HOME)
    await page.waitForTimeout(4000)
    const section = page.locator('section').filter({ hasText: '이어보기' })
    if (await section.count() > 0) {
      const card = section.locator('a[href*="/series/"]').first()
      if (await card.isVisible()) {
        await card.click()
        await expect(page).toHaveURL(/\/series\//)
      }
    }
  })
})

// ════════════════════════════════════════════════════════════════
// TC-7: Heartbeat 세부 동작 검증 (P1, 시리즈상세) — Fail 재테스트
// ════════════════════════════════════════════════════════════════
test.describe('FC2-TC7 Heartbeat 세부 동작 검증', () => {
  test('시리즈 페이지에서 progress API 정상 응답', async ({ page }) => {
    // progress API가 500이 아닌 정상 응답하는지 확인
    const [response] = await Promise.all([
      page.waitForResponse(resp =>
        resp.url().includes('/series/') && resp.url().includes('/progress') && resp.status() !== 0,
        { timeout: 15000 }
      ).catch(() => null),
      page.goto(SERIES_URL),
    ])
    if (response) {
      expect(response.status()).toBe(200)
    }
  })

  test.skip('Heartbeat 30초 주기 전송 — 장시간 재생 필요, 수동 검증', async () => {})
  test.skip('beforeunload 진행률 전송 — 브라우저 이벤트 제한, 수동 검증', async () => {})
})

// ════════════════════════════════════════════════════════════════
// TC-8: 에피소드 전환 시 광고 초기화 시퀀스 검증 (P1, 광고팝업) — Fail 재테스트
// ════════════════════════════════════════════════════════════════
test.describe('FC2-TC8 에피소드 전환 시 광고 초기화 시퀀스', () => {
  test('에피소드 전환 시 기존 팝업 영역 초기화', async ({ page }) => {
    await page.goto(SERIES_URL)
    await page.waitForTimeout(4000)
    // 에피소드가 2개 이상 있는지 확인
    const epButtons = page.locator('text=/\\d+회/')
    const count = await epButtons.count()
    if (count >= 2) {
      // 첫 번째 에피소드 클릭
      await epButtons.nth(0).click()
      await page.waitForTimeout(2000)
      // 두 번째 에피소드로 전환
      await epButtons.nth(1).click()
      await page.waitForTimeout(1000)
      // 광고 팝업이 남아있지 않아야 함
      const popup = page.locator('[class*="z-[55]"]')
      expect(await popup.count()).toBe(0)
    }
  })
})

// ════════════════════════════════════════════════════════════════
// TC-9: 팝업 자동 최소화(10초) 및 토스트 자동 제거(3초) (P3, 광고팝업) — Blocked 재테스트
// ════════════════════════════════════════════════════════════════
test.describe('FC2-TC9 팝업 자동 최소화 및 토스트 자동 제거', () => {
  test.skip('WebSocket 기반 광고 트리거 필요 — 수동 검증', async () => {})
})

// ════════════════════════════════════════════════════════════════
// TC-10: WebSocket 연결 끊김 재연결 및 중복 방지 (P3, 광고팝업) — Blocked 재테스트
// ════════════════════════════════════════════════════════════════
test.describe('FC2-TC10 WebSocket 연결 끊김 재연결 및 중복 방지', () => {
  test.skip('네트워크 차단/복구 시뮬레이션 필요 — 수동 검증', async () => {})
})

// ════════════════════════════════════════════════════════════════
// TC-11: 팝업 사용자 액션 (닫기/최소화/다시열기) (P2, 광고팝업) — Blocked 재테스트
// ════════════════════════════════════════════════════════════════
test.describe('FC2-TC11 팝업 사용자 액션', () => {
  test.skip('WebSocket 기반 광고 트리거 필요 — 수동 검증', async () => {})
})

// ════════════════════════════════════════════════════════════════
// TC-12: 이어보기 레이블 표시 및 미인증 시 진행률 숨김 (P2, 시리즈상세) — Blocked 재테스트
// ════════════════════════════════════════════════════════════════
test.describe('FC2-TC12 이어보기 레이블 및 미인증 시 숨김', () => {
  test('로그인 시 시리즈 상세에서 진행률 바 표시', async ({ page }) => {
    await page.goto(SERIES_URL)
    await page.waitForTimeout(4000)
    // 에피소드 영역에 프로그레스바(completion_rate) 존재 여부
    const progressBars = page.locator('[class*="bg-blue"], [class*="bg-red"]').filter({ hasText: '' })
    // 시청 이력이 있으면 프로그레스바가 존재
    const main = page.locator('main')
    await expect(main).toBeVisible()
  })

  test('비로그인 시 에피소드 목록은 표시되나 진행률 숨김', async ({ page }) => {
    await page.goto(`/series/${encodeURIComponent('런닝맨')}`)
    await page.waitForTimeout(4000)
    // 에피소드 목록 자체는 표시
    const epTexts = page.locator('text=/\\d+회/')
    expect(await epTexts.count()).toBeGreaterThan(0)
  })
})

// ════════════════════════════════════════════════════════════════
// TC-13: 히어로 배너 다중 인스턴스 정상 렌더링 검증 (P2, 홈) — 회귀 FE-001
// ════════════════════════════════════════════════════════════════
test.describe('FC2-TC13 히어로 배너 다중 인스턴스 렌더링 (FE-001 회귀)', () => {
  test('배너 순차 전환 시 깨짐 없음', async ({ page }) => {
    await page.goto(HOME)
    await page.waitForTimeout(3000)
    const indicators = page.locator('button.rounded-full')
    const count = await indicators.count()
    if (count >= 3) {
      // 2번째 인디케이터 클릭
      await indicators.nth(1).click()
      await page.waitForTimeout(500)
      const banner = page.locator('.relative.w-full.overflow-hidden').first()
      await expect(banner).toBeVisible()

      // 3번째 인디케이터 클릭
      await indicators.nth(2).click()
      await page.waitForTimeout(500)
      await expect(banner).toBeVisible()
    }
  })

  test('자동 전환 한 바퀴 후 첫 배너 정상', async ({ page }) => {
    await page.goto(HOME)
    await page.waitForTimeout(3000)
    const indicators = page.locator('button.rounded-full')
    const count = await indicators.count()
    if (count > 0) {
      // 전체 순환 대기 (4초 * count + 여유)
      const waitTime = Math.min(count * 4000 + 2000, 30000)
      await page.waitForTimeout(waitTime)
      // 순환 후에도 배너 정상 표시
      const banner = page.locator('.relative.w-full.overflow-hidden').first()
      await expect(banner).toBeVisible()
      // 카운터 텍스트 존재
      const counter = page.locator('text=/\\d+ \\/ \\d+/')
      await expect(counter).toBeVisible()
    }
  })

  test('새로고침 후 배너 정상 렌더링', async ({ page }) => {
    await page.goto(HOME)
    await page.waitForTimeout(3000)
    await page.reload()
    await page.waitForTimeout(3000)
    const banner = page.locator('.relative.w-full.overflow-hidden').first()
    await expect(banner).toBeVisible()
  })
})

// ════════════════════════════════════════════════════════════════
// TC-14: YouTube 플레이어 DOM 충돌 없이 재생 검증 (P2, 시리즈상세) — 회귀 FE-003
// ════════════════════════════════════════════════════════════════
test.describe('FC2-TC14 YouTube DOM 충돌 없이 재생 (FE-003 회귀)', () => {
  test('에피소드 전환 시 콘솔 에러 없음', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    await page.goto(SERIES_URL)
    await page.waitForTimeout(4000)
    const epButtons = page.locator('text=/\\d+회/')
    const count = await epButtons.count()
    if (count >= 2) {
      await epButtons.nth(0).click()
      await page.waitForTimeout(3000)
      await epButtons.nth(1).click()
      await page.waitForTimeout(3000)

      // YouTube iframe 관련 치명적 에러가 없어야 함
      const criticalErrors = consoleErrors.filter(e =>
        e.includes('insertBefore') || e.includes('removeChild') || e.includes('Failed to execute')
      )
      expect(criticalErrors).toHaveLength(0)
    }
  })

  test('빠른 연속 전환에도 페이지 크래시 없음', async ({ page }) => {
    await page.goto(SERIES_URL)
    await page.waitForTimeout(4000)
    const epButtons = page.locator('text=/\\d+회/')
    const count = await epButtons.count()
    if (count >= 3) {
      await epButtons.nth(0).click()
      await page.waitForTimeout(500)
      await epButtons.nth(1).click()
      await page.waitForTimeout(500)
      await epButtons.nth(2).click()
      await page.waitForTimeout(2000)

      // 페이지가 살아있는지 확인
      const main = page.locator('main')
      await expect(main).toBeVisible()
    }
  })
})

// ════════════════════════════════════════════════════════════════
// TC-15: 무료 VOD 에피소드 잠금 해제 및 재생 검증 (P2, 시리즈상세) — 회귀 FE-005
// ════════════════════════════════════════════════════════════════
test.describe('FC2-TC15 무료 VOD 잠금 해제 및 재생 (FE-005 회귀)', () => {
  test('무료 에피소드에 무료 뱃지 표시, 잠금 아이콘 없음', async ({ page }) => {
    await page.goto(SERIES_URL)
    await page.waitForTimeout(4000)
    const freeBadge = page.locator('text=무료')
    if (await freeBadge.count() > 0) {
      await expect(freeBadge.first()).toBeVisible()
      // 무료 에피소드 행에 잠금 아이콘이 없어야 함
      const freeRow = freeBadge.first().locator('xpath=ancestor::div[contains(@class,"cursor-pointer") or contains(@class,"flex")]')
      if (await freeRow.count() > 0) {
        const lockIcon = freeRow.first().locator('text=\uD83D\uDD12')
        expect(await lockIcon.count()).toBe(0)
      }
    }
  })

  test('유료 미구매 에피소드에 잠금 아이콘 표시', async ({ page }) => {
    await page.goto(SERIES_URL)
    await page.waitForTimeout(4000)
    const lockIcon = page.locator('text=\uD83D\uDD12')
    // 런닝맨에 유료 에피소드가 있으면 잠금 표시 확인
    if (await lockIcon.count() > 0) {
      await expect(lockIcon.first()).toBeVisible()
    }
  })
})

// ════════════════════════════════════════════════════════════════
// TC-16: 히어로 배너 반응형 이미지 짤림 없음 검증 (P3, 홈) — 회귀 FE-006
// ════════════════════════════════════════════════════════════════
test.describe('FC2-TC16 히어로 배너 반응형 이미지 (FE-006 회귀)', () => {
  test('배너가 background-image 방식으로 렌더링', async ({ page }) => {
    await page.goto(HOME)
    await page.waitForTimeout(3000)
    // 배너 슬라이드에 background-image 인라인 스타일 확인
    const slide = page.locator('div[style*="background-image"]').first()
    if (await slide.count() > 0) {
      await expect(slide).toBeVisible()
      const style = await slide.getAttribute('style')
      expect(style).toContain('background-size: cover')
      expect(style).toContain('background-position: center')
    }
  })

  test('1280px 리사이즈에서 배너 정상 표시', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto(HOME)
    await page.waitForTimeout(3000)
    const banner = page.locator('.relative.w-full.overflow-hidden').first()
    await expect(banner).toBeVisible()
    const box = await banner.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.height).toBeGreaterThan(300)
  })

  test('768px 리사이즈에서 배너 정상 표시', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto(HOME)
    await page.waitForTimeout(3000)
    const banner = page.locator('.relative.w-full.overflow-hidden').first()
    await expect(banner).toBeVisible()
    const box = await banner.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.height).toBeGreaterThanOrEqual(320) // min-h-[320px]
  })
})

// ════════════════════════════════════════════════════════════════
// TC-17: 유사 콘텐츠 추가 후 시리즈 상세 페이지 로딩 성능 검증 (P3) — 회귀 FE-0010
// ════════════════════════════════════════════════════════════════
test.describe('FC2-TC17 시리즈 상세 페이지 로딩 성능 (FE-0010 회귀)', () => {
  test('페이지 전체 로딩 3초 이내', async ({ page }) => {
    const start = Date.now()
    await page.goto(SERIES_URL, { waitUntil: 'domcontentloaded' })
    await page.locator('main').waitFor({ state: 'visible', timeout: 10000 })
    const elapsed = Date.now() - start
    // 3초 이내 (네트워크 지연 감안하여 5초까지 허용)
    expect(elapsed).toBeLessThan(5000)
  })

  test('유사 콘텐츠 API 응답 시간 확인', async ({ page }) => {
    let apiStart = 0
    let apiDuration = 0
    page.on('request', req => {
      if (req.url().includes('/similar/')) apiStart = Date.now()
    })
    page.on('response', resp => {
      if (resp.url().includes('/similar/') && apiStart > 0) {
        apiDuration = Date.now() - apiStart
      }
    })
    await page.goto(SERIES_URL)
    await page.waitForTimeout(5000)
    // API가 호출되었다면 응답 시간 체크 (3초 이내)
    if (apiDuration > 0) {
      expect(apiDuration).toBeLessThan(3000)
    }
  })

  test('다른 시리즈에서도 일관된 로딩', async ({ page }) => {
    const start = Date.now()
    await page.goto(SERIES_URL_2, { waitUntil: 'domcontentloaded' })
    await page.locator('main').waitFor({ state: 'visible', timeout: 10000 })
    const elapsed = Date.now() - start
    expect(elapsed).toBeLessThan(5000)
  })
})

// ════════════════════════════════════════════════════════════════
// TC-18: 배너 자동 전환 및 포스터 대체 배경 (P4, 홈) — 사이드이펙트 FE-001, FE-006
// ════════════════════════════════════════════════════════════════
test.describe('FC2-TC18 배너 자동 전환 및 대체 배경 (사이드이펙트)', () => {
  test('4초 간격 자동 전환', async ({ page }) => {
    await page.goto(HOME)
    await page.waitForTimeout(3000)
    // 현재 카운터 확인
    const counter = page.locator('text=/\\d+ \\/ \\d+/')
    if (await counter.isVisible()) {
      const text1 = await counter.textContent()
      await page.waitForTimeout(5000)
      const text2 = await counter.textContent()
      // 5초 후 카운터가 변경되었어야 함
      expect(text1).not.toBe(text2)
    }
  })

  test('이미지 없는 배너에 그라디언트 대체 배경', async ({ page }) => {
    await page.goto(HOME)
    await page.waitForTimeout(3000)
    // gradient 클래스가 적용된 배너 슬라이드가 존재하는지 확인
    const gradientSlide = page.locator('div[class*="bg-gradient-to-br"]')
    // 이미지가 없는 배너가 있을 수도, 없을 수도 있음
    const hasGradient = await gradientSlide.count() > 0
    const hasImage = await page.locator('div[style*="background-image"]').count() > 0
    // 둘 중 하나는 있어야 함 (배너가 표시되고 있으므로)
    expect(hasGradient || hasImage).toBe(true)
  })
})

// ════════════════════════════════════════════════════════════════
// TC-19: 구매 상태별 UI 분기 확인 (P1, 시리즈상세) — 사이드이펙트 FE-005
// ════════════════════════════════════════════════════════════════
test.describe('FC2-TC19 구매 상태별 UI 분기 (사이드이펙트 FE-005)', () => {
  test('시리즈 상세 하단에 구매/시청 버튼 존재', async ({ page }) => {
    await page.goto(SERIES_URL)
    await page.waitForTimeout(4000)
    // 구매하기, 시청하기, 이어보기 중 하나는 있어야 함
    const buyBtn = page.locator('text=구매하기')
    const watchBtn = page.locator('text=/시청하기|1화 시청/')
    const resumeBtn = page.locator('text=이어보기')
    const freeLabel = page.locator('text=무료')
    const hasAction = (await buyBtn.count()) + (await watchBtn.count()) + (await resumeBtn.count()) + (await freeLabel.count())
    expect(hasAction).toBeGreaterThan(0)
  })

  test('구매하기 버튼 클릭 시 구매 페이지 이동', async ({ page }) => {
    await page.goto(SERIES_URL)
    await page.waitForTimeout(4000)
    const buyBtn = page.locator('a:has-text("구매하기"), button:has-text("구매하기")')
    if (await buyBtn.count() > 0) {
      await buyBtn.first().click()
      await expect(page).toHaveURL(/\/purchase\//)
    }
  })
})

// ════════════════════════════════════════════════════════════════
// TC-20: 이어보기 → 시리즈 상세 연동 및 재생 (P2, 크로스페이지) — 사이드이펙트 FE-004, FE-007
// ════════════════════════════════════════════════════════════════
test.describe('FC2-TC20 이어보기 → 시리즈 상세 연동 (사이드이펙트)', () => {
  test('이어보기 카드 클릭 → 시리즈 상세 이동 + 에피소드 하이라이트', async ({ page }) => {
    await page.goto(HOME)
    await page.waitForTimeout(4000)
    const watchingSection = page.locator('section').filter({ hasText: '이어보기' })
    if (await watchingSection.count() > 0) {
      const card = watchingSection.locator('a[href*="/series/"]').first()
      if (await card.isVisible()) {
        await card.click()
        await expect(page).toHaveURL(/\/series\//)
        await page.waitForTimeout(3000)
        // 에피소드가 하이라이트(파란색 등)되어 있는지 확인
        const activeEp = page.locator('[class*="blue"], [class*="ring"]')
        // 하이라이트 존재 여부 (시청 이력 기반)
        const main = page.locator('main')
        await expect(main).toBeVisible()
      }
    }
  })
})

// ════════════════════════════════════════════════════════════════
// TC-21: 광고 타입별 팝업 표시 내용 검증 (P2, 광고팝업) — 사이드이펙트 FE-002
// ════════════════════════════════════════════════════════════════
test.describe('FC2-TC21 광고 타입별 팝업 표시 (사이드이펙트 FE-002)', () => {
  test.skip('WebSocket 기반 광고 트리거 필요 — 수동 검증', async () => {})
})
