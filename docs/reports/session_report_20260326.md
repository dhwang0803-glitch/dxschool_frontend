# feat/shopping-ad-popup 세션 리포트 (2026-03-26)

## 작업 내용

### Shopping_Ad 광고 팝업 프론트엔드 구현 + 버그 수정 + 위치/전체화면 대응

`development` 브랜치에서 `feat/shopping-ad-popup` 브랜치를 생성하여 작업.

---

## PR 이력

| PR | 제목 | 상태 |
|----|------|------|
| #8 | feat: Shopping_Ad 광고 팝업 WebSocket 연동 | MERGED |
| #9 | fix: WebSocket URL 자동 파생 + 재연결 안정화 | MERGED |
| #11 | fix: 축제 GIF 필드명 + 제철장터 텍스트 + 팝업 위치 + 전체화면 | OPEN |

---

## 수정 파일

| 파일 | 역할 |
|------|------|
| `frontend/lib/useAdSocket.ts` | WebSocket 연결 훅 (신규) |
| `frontend/components/ShoppingAdPopup.tsx` | 광고 팝업 컴포넌트 (신규) |
| `frontend/app/series/[series_id]/page.tsx` | 플레이어 안쪽에 팝업 통합 (수정) |
| `frontend/app/globals.css` | slideUp/fadeIn 애니메이션 (수정) |
| `CLAUDE.md` | 브랜치 규칙 + 백엔드 요청 사항 (수정) |
| `docs/SHOPPING_AD_POPUP_SPEC.md` | 설계 문서 (신규) |

---

## 버그 수정 이력

### 1. WebSocket URL localhost 고정 (PR #9)
- **증상**: Cloud Run 배포 시 `ws://localhost:8000`으로 연결 시도 → ERR_CONNECTION_REFUSED
- **원인**: `NEXT_PUBLIC_WS_URL` 환경변수 미설정 시 기본값이 localhost
- **수정**: `NEXT_PUBLIC_API_URL`에서 `http→ws`(`https→wss`) 자동 변환

### 2. WebSocket 재연결 폭주 (PR #9)
- **증상**: 서버 거부 시 3초마다 무한 재시도, 콘솔에 에러 폭주
- **수정**: exponential backoff (3초→6초→12초→...최대 30초) + 최대 10회 제한

### 3. 축제 GIF 미표시 (PR #11)
- **증상**: 축제 팝업에 텍스트만 나오고 GIF가 안 보임
- **원인**: 프론트엔드 `ad.data.image_url` vs 백엔드 `ad.data.ad_image_url` 필드명 불일치
- **수정**: `ad_image_url` 필드로 접근하도록 변경

### 4. 제철장터 텍스트 중복 (PR #11)
- **증상**: "채널 제철장터 제철장터에서 아산 포기김치 판매 중입니다"
- **원인**: channel 필드값("제철장터")을 본문에 중복 사용
- **수정**: 고정 포맷 "지금 제철장터에서 {상품명} 판매 중입니다" + 헤더 "CH 25"

### 5. 팝업 위치 (PR #11)
- **증상**: 팝업이 페이지 우하단에 뜸 → 스크롤하면 안 보임
- **수정**: `fixed` → `absolute`, ShoppingAdPopup을 플레이어 div 안쪽으로 이동

### 6. 전체화면 대응 (PR #11)
- **증상**: 전체화면 시 팝업이 플레이어 뒤에 가려짐
- **수정**: `fullscreenchange` 이벤트 감지 → 전체화면일 때 `absolute` → `fixed` 전환

### 7. 축제 팝업 불필요한 텍스트 (PR #11)
- **증상**: GIF에 축제명+일정이 이미 포함되어 있는데 별도 텍스트도 표시
- **수정**: `popup_title`/`popup_body`/`product_name` 텍스트 제거, GIF만 표시

### 8. 축제 팝업 자동 dismiss (PR #11)
- **요구사항**: 축제 팝업은 최소화 후 10초 뒤 자동 제거
- **수정**: local_gov 타입은 visible(10초) → minimized(10초) → 자동 dismiss

---

## 최종 팝업 동작

### 축제 (local_gov)
```
GIF 표시 (10초) → 최소화 [🔵reopen / 🔴dismiss] (10초) → 자동 제거
                                    │
                                    └→ reopen 클릭 시 dismiss 타이머 취소 → 다시 GIF 표시
```
- GIF만 표시 (텍스트 없음, 버튼 없음)
- GIF에 축제명+일정 포함 (520x300)
- `data.ad_image_url`로 OCI Object Storage URL 참조

### 제철장터 (seasonal_market)
```
팝업 표시 (10초) → 최소화 [🔵reopen / 🔴dismiss]
      │
      ├→ [시청 예약] → reserve_watch 전송 → 서버 응답 토스트 → 2초 후 제거
      └→ [닫기] → dismiss 전송 → 즉시 제거
```
- 헤더: `[제철장터] CH 25`
- 본문: `지금 제철장터에서 {상품명} 판매 중입니다`

### 팝업 위치
- **일반 모드**: 플레이어 컨테이너 기준 `absolute` 우하단 (bottom-48, right-16)
- **전체화면**: `fixed` 우하단으로 전환 → 전체화면 위에 표시

### WebSocket
- URL: `NEXT_PUBLIC_API_URL`에서 `http→ws` 자동 파생
- 재연결: exponential backoff (3초~30초) + 최대 10회
- playback_update: 0.5초 간격, YouTube PLAYING 상태에서만

---

## 백엔드 연동 상태

| 항목 | 상태 |
|------|------|
| `serving.shopping_ad` DB | 완료 (10건) |
| `/ad/popup` WebSocket | 완료 (PR #88 merged) |
| 광고 타이밍 수정 (YOLO 프레임 기준) | 백엔드 PR 완료 |
| 프론트엔드 팝업 | PR #11 (배포 대기) |
