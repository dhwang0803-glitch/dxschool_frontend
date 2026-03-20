# Frontend UI/UX Common Polish Guide

> 단일 컴포넌트 디자인 개선 작업 기준 문서.
> 레이아웃 프레임은 **변경 금지** — 버튼·슬라이더 등 인터랙티브 요소만 폴리쉬 대상.

---

## 1. 작업 범위 (Scope)

### 변경 금지 (FROZEN — 건드리지 말 것)

| 컴포넌트 | 고정 항목 | 현재 값 |
|----------|-----------|---------|
| `PosterCard` | 카드 크기 | `w-32 h-48` (128×192px) |
| `PosterCard` | 카드 간격 (HorizontalSection 내) | `gap-3` |
| `WatchingCard` | 카드 크기 | `w-36 h-24` (144×96px) |
| `HeroBanner` | 배너 높이 | `h-[480px]` |
| `HeroBanner` | 텍스트 영역 패딩 | `pb-16 px-10` |
| `HeroBanner` | 타이틀 크기 | `text-5xl` |
| `GNB` | 높이 | `h-14` |
| `GNB` | 최대 너비 컨테이너 | `max-w-screen-xl` |
| `HorizontalSection` | 섹션 상단 여백 | `mt-8` |
| `HorizontalSection` | 좌우 패딩 | `px-6` |

### 변경 허용 (POLISH 대상)

| 분류 | 대상 컴포넌트 | 작업 예시 |
|------|--------------|-----------|
| **버튼** | `GNB` 네비 탭, `HeroBanner` 인디케이터 버튼 | hover 효과, active 상태, 색상, 라운드 |
| **슬라이드바** | `HeroBanner` 진행 인디케이터 (`h-1 w-8/w-4`) | 두께, 애니메이션, 색상 |
| **진행바** | `WatchingCard` 시청률 프로그레스 바 | 색상, 높이, 라운드 |
| **링크/아이콘** | `GNB` 마이페이지 아이콘, `PosterCard` hover overlay | 색상 전환, 크기 유지 |
| **텍스트 스타일** | 장르 배지, 시청률 레이블 | 색상, 폰트 웨이트 (크기 제외) |
| **카드 효과** | `PosterCard`, `WatchingCard` hover | brightness, shadow, ring (크기/레이아웃 변경 X) |

---

## 2. 현재 컴포넌트 인벤토리

### GNB (`frontend/components/GNB.tsx`)

```
[로고: DX VOD] [홈 탭] [스마트 추천 탭]                    [마이페이지 아이콘]
```

- 활성 탭: `bg-white text-black` 필드
- 비활성 탭: `text-white/70 hover:text-white hover:bg-white/10`
- 탭 형태: `rounded-full px-4 py-1.5`
- **폴리쉬 포인트**: 탭 전환 애니메이션, hover 리플, 아이콘 hover 색상

### HeroBanner (`frontend/components/HeroBanner.tsx`)

```
[배경 그라디언트 슬라이드]
  [카테고리 배지] [타이틀] [메타 정보] [설명]
  [● ● ● 인디케이터]                    [N / M]
```

- 인디케이터 활성: `w-8 h-1 bg-white rounded-full`
- 인디케이터 비활성: `w-4 h-1 bg-white/30 rounded-full`
- 전환: `transition-all duration-300`
- **폴리쉬 포인트**: 인디케이터 버튼 hover, 슬라이드바 두께·색상, 카운터 스타일

### PosterCard (`frontend/components/PosterCard.tsx`)

```
[포스터 이미지 128×192]
[타이틀]
[장르]
```

- hover: `scale-105 brightness-110 duration-200`
- **폴리쉬 포인트**: hover ring/glow, 타이틀 배지 스타일, 장르 텍스트 색상

### WatchingCard (`frontend/components/WatchingCard.tsx`)

```
[썸네일 144×96]
[──────── 진행바 ────────]
[N% 시청]
```

- 진행바 트랙: `h-1 bg-white/20 rounded-full`
- 진행바 필: `h-full bg-blue-400 rounded-full`
- **폴리쉬 포인트**: 진행바 색상·두께, hover glow, 시청률 레이블 스타일

---

## 3. 디자인 원칙

| 원칙 | 내용 |
|------|------|
| **다크 테마 유지** | 배경 `bg-black`, 텍스트 기본 `text-white` 계열 |
| **색상 팔레트** | 포인트 컬러 `blue-400` (#60A5FA) / 화이트 알파 계열 |
| **전환 일관성** | `transition-all duration-200` (카드), `duration-300` (배너/탭) |
| **크기 불변** | `w-*`, `h-*`, `p-*`, `m-*`, `gap-*` 는 레이아웃 항목이므로 수정 금지 |
| **과도한 효과 금지** | bounce, spin 등 과도한 애니메이션 사용 금지 |

---

## 4. 작업 체크리스트

작업 전 반드시 확인:

- [ ] 변경 파일이 `PosterCard`, `WatchingCard`, `GNB`, `HeroBanner`, `HorizontalSection` 중 어느 것인지 식별
- [ ] 변경 항목이 "변경 금지" 표의 항목과 무관한지 확인
- [ ] `w-*`, `h-*` 수치 변경 없음 확인
- [ ] `px-*`, `py-*`, `gap-*`, `mt-*`, `mb-*` 수치 변경 없음 확인 (레이아웃 간격)
- [ ] 브라우저에서 레이아웃 깨짐 없음 확인

---

*최초 작성: 2026-03-20 / 대상 브랜치: main (Frontend)*
