# VOD Recommendation — Claude Code 프로젝트 규칙

모든 브랜치 공통 지침. 브랜치별 CLAUDE.md가 있으면 이 파일과 함께 적용된다.

---

## 프로젝트 개요

IPTV/케이블 VOD 콘텐츠를 대상으로 한 **지능형 추천·광고 시스템** 풀스택 구현.

| 레이어 | 설명 |
|--------|------|
| 데이터 인프라 | PostgreSQL + pgvector, 메타데이터 자동수집 (TMDB/KMDB/Naver/JustWatch), 시리즈 포스터 수집, 사용자 행동 벡터 임베딩 |
| ML 추천 엔진 | 행렬 분해(CF) + 벡터 유사도 2종 (콘텐츠 기반 + 영상 임베딩) |
| 영상 AI | CLIP 임베딩, 실시간 사물인식 |
| 광고 시스템 | TV 실시간 시간표 + 사물인식 → 유사 홈쇼핑 상품 팝업 |
| 서비스 레이어 | FastAPI 백엔드 + React/Next.js 프론트엔드 |

상세 로드맵 → [`docs/ROADMAP.md`](docs/ROADMAP.md)

---

## 실행 환경 (전 브랜치 통일)

**단일 환경: `myenv` (Python 3.12)**

```bash
# 최초 설치 (팀원 온보딩)
conda activate myenv
pip install -r requirements.txt

# CLIP ViT-B/32 별도 설치 (VOD_Embedding 영상 임베딩 담당자만)
pip install git+https://github.com/openai/CLIP.git

# GPU 환경인 경우 torch GPU 버전으로 교체
# https://pytorch.org/get-started/locally/
```

> `base` env나 `env3.8.3`은 사용하지 않는다. 모든 스크립트는 `myenv`에서 실행.

---

## 브랜치 구조

### Phase 1 — 데이터 인프라 (진행 중)

| 브랜치 | 역할 | 주요 경로 |
|--------|------|-----------|
| `main` | 공통 설정, 문서, 에이전트 템플릿 | `.claude/`, `_agent_templates/`, `docs/` |
| `Database_Design` | PostgreSQL 스키마 + 마이그레이션 | `Database_Design/schemas/`, `migrations/` |
| `RAG` | 메타데이터 결측치 자동수집 파이프라인 | `RAG/src/`, `RAG/scripts/` |
| `VOD_Embedding` | CLIP 영상 임베딩(512) + 메타데이터 임베딩(384) 파이프라인 | `VOD_Embedding/src/`, `VOD_Embedding/scripts/` |
| `Poster_Collection` | Naver 포스터 수집 → 로컬 저장 → DB `poster_url` 적재 | `Poster_Collection/src/`, `Poster_Collection/scripts/` |
| `User_Embedding` | VOD 결합 임베딩(512+384=896차원) 기반 ALS 행렬분해 → `user_embedding` 적재 | `User_Embedding/src/`, `User_Embedding/scripts/` |

### Phase 2 — 추천 엔진

| 브랜치 | 역할 |
|--------|------|
| `CF_Engine` | 행렬 분해 기반 협업 필터링 추천 엔진 |
| `Vector_Search` | 벡터 유사도 검색 엔진 (콘텐츠 기반 + 임베딩 기반) |

### Phase 3 — 영상 AI (로컬 연산 → VPC thin serving)

| 브랜치 | 역할 | 주요 경로 |
|--------|------|-----------|
| `Object_Detection` | YOLOv8 배치 사전 분석 → `vod_detected_object.parquet` (로컬 전용) | `Object_Detection/src/`, `Object_Detection/scripts/` |
| `Shopping_Ad` | 탐지 결과 + EPG + 상품 카탈로그 매칭 → `serving.shopping_ad` (VPC 적재) | `Shopping_Ad/src/`, `Shopping_Ad/scripts/` |

### Phase 4 — 서비스 레이어

| 브랜치 | 역할 |
|--------|------|
| `API_Server` | FastAPI 백엔드 (추천/검색/광고 엔드포인트) |
| `Frontend` | React/Next.js 클라이언트 (시청자 UI + 광고 팝업) |

---

## 폴더 구조 컨벤션 (전 브랜치 통일)

### ML/데이터 파이프라인 모듈

```
{Module}/
├── src/          ← import되는 라이브러리 (직접 실행 X)
├── scripts/      ← 직접 실행 스크립트 (python scripts/run_xxx.py)
├── tests/        ← pytest
├── config/       ← yaml, .env.example
└── docs/         ← 설계 문서, 파일럿 리포트
```

### API 서버 (FastAPI)

```
API_Server/
├── app/
│   ├── routers/      ← 엔드포인트별 라우터
│   ├── services/     ← 비즈니스 로직
│   ├── models/       ← Pydantic 스키마
│   └── main.py
├── tests/
└── config/
```

### 프론트엔드 (React/Next.js)

```
Frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/     ← API 클라이언트
├── public/
└── tests/
```

### 규칙 요약

| 폴더 | 용도 |
|------|------|
| `src/` | `import`되는 모듈. 직접 실행 X |
| `scripts/` | `python scripts/run_xxx.py`로 실행 |
| `tests/` | pytest. `scripts/`는 테스트 대상 아님 |
| `config/` | `.yaml`, `.env.example` (실제 `.env` 제외) |
| `docs/` | 설계 문서, 파일럿 결과 리포트 |

---

## 프로젝트 개요 (Database_Design 브랜치)

- **프로젝트**: VOD 추천 시스템 PostgreSQL 데이터베이스
- **DB**: PostgreSQL on VPC
- **접속 정보**: `.env` 파일 (Git 제외, 팀 내 별도 공유)

## 커밋 금지 파일

- `.env` — DB 접속 정보
- `.claude/settings.local.json` — Claude Code 로컬 설정 (자격증명 포함 가능)
- `data/` — CSV 원본 데이터 (대용량)

---

## 🗄️ DB 스키마 협업 규칙 (Rule 1 & Rule 3 — 모든 브랜치 적용)

### Rule 1 — DB 스키마 참조 규칙

**`Database_Design` 브랜치가 스키마 단일 진실 원천(SSoT)이다. 직접 기재 금지.**

**확인 순서:**
```
테이블/컬럼 정보가 필요할 때 →
  1순위: Database_Design/schemas/ SQL 파일 직접 확인
  2순위: Database_Design/docs/DEPENDENCY_MAP.md 컬럼 상세
  ← 둘 중 하나와 다른 내용이 CLAUDE.md/문서에 있으면 Database_Design 기준으로 즉시 수정
```

**신규 브랜치 생성 시 (DB 접근 코드 작성 전 필수):**
1. `Database_Design/docs/DEPENDENCY_MAP.md` 에 브랜치 등록 (→ Rule 4)
2. 브랜치 CLAUDE.md 인터페이스 섹션을 Rule 3 형식으로 작성

### Rule 3 — 인터페이스 섹션 표준화 형식

각 브랜치 CLAUDE.md의 **인터페이스** 섹션은 테이블·컬럼·타입 수준으로 명시한다.

```markdown
## 인터페이스

### 업스트림 (읽기)

| 테이블 | 컬럼 | 타입 | 용도 |
|--------|------|------|------|
| `public.vod` | `full_asset_id`, `asset_nm` | VARCHAR(64), VARCHAR | 처리 대상 |

### 다운스트림 (쓰기)

| 테이블 | 컬럼 | 타입 | 비고 |
|--------|------|------|------|
| `public.some_table` | `col_name` | TYPE | ON CONFLICT 기준 등 |
```

스키마 변경은 `Database_Design` 에 먼저 반영 후 이 섹션을 업데이트한다.
컬럼/타입이 불확실하면 `Database_Design/docs/DEPENDENCY_MAP.md` 를 기준으로 한다.

---

## 🔒 보안 규칙 (MANDATORY — 모든 브랜치 적용)

**파일 수정/생성 또는 git commit 전 반드시 검증한다.**

### 1. 하드코딩된 자격증명 금지

```python
# 절대 금지
TMDB_API_KEY = "abcd1234..."
DB_PASSWORD  = "mysecret"

# 올바른 방식
TMDB_API_KEY = os.getenv("TMDB_API_KEY", "")
DB_PASSWORD  = os.getenv("DB_PASSWORD")
```

### 2. os.getenv() 기본값에 실제 인프라 정보 금지

```python
# 절대 금지 — 실제 서버 IP, DB명, 사용자명 노출
host=os.getenv("DB_HOST", "10.0.0.1")
dbname=os.getenv("DB_NAME", "prod_db")
user=os.getenv("DB_USER", "dbadmin")

# 올바른 방식
host=os.getenv("DB_HOST")
dbname=os.getenv("DB_NAME")
user=os.getenv("DB_USER")
port=int(os.getenv("DB_PORT", "5432"))  # 공개 표준 포트는 허용
```

### 3. .env 파일 직접 읽기 금지
- `.env` 파일을 Read 도구로 읽지 않는다
- `.env` 내용을 대화창, 로그에 출력하지 않는다
- DB 비밀번호, API 키 실제 값을 응답 텍스트에 포함하지 않는다
- 자격증명이 필요한 경우 사용자가 직접 터미널에서 입력하도록 안내
- 새 자격증명 설정 시 `.env.example`만 제공하고 실제 값은 사용자가 직접 입력

### 4. DB 접속 명령어 작성 규칙

```bash
# 올바른 방식
set -a && source .env && set +a
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME

# 절대 금지
PGPASSWORD=실제비밀번호 psql -h 실제IP ...
```

### 5. .gitignore 확인
커밋 전 아래 파일이 .gitignore에 포함되어 있는지 확인:
- `.env`
- `*.pem`, `*.key`, `credentials.json`
- `.claude/settings.local.json`

### 6. Pre-commit 점검 절차
```
파일 수정 시 →
  Grep: "os.getenv\(.*," 패턴 스캔 →
    기본값에 실제 인프라 정보 있으면 즉시 제거 →
      commit 전 보안 점검 결과 명시적으로 보고
```

**위반 시**: 커밋 중단, 즉시 수정 후 재커밋

---

## 🌿 브랜치 생성 및 PR 규칙 (모든 브랜치 적용)

상세 절차 → [`.claude/commands/PR-report.md`](.claude/commands/PR-report.md)

### 브랜치 기본 규칙

1. **main에서 분기** — 브랜치 생성 전 반드시 `git checkout main` 후 생성
2. **다른 브랜치 파일 건드리지 않기** — 현재 브랜치 폴더 외 다른 폴더 절대 스테이징 금지
3. **push 전 사용자 확인** — 명시적 요청 전 `git push` 금지
4. **보안 점검** — 커밋 전 아래 항목 스캔 필수

### 커밋 단위 규칙

- **관련 작업끼리 묶어서 커밋** — 디자인 변경, 문서 수정, 기능 추가는 각각 별도 커밋
- **사용자가 "커밋해줘"라고 요청할 때만 커밋** — 작업 완료 후 자동 커밋 금지
- 예시: UI 폴리쉬 작업 3개 → 1커밋 / 문서 업데이트 → 별도 1커밋

### 커밋 전 보안 점검 (Frontend 기준)

```bash
# 하드코딩된 자격증명 탐지
git diff | grep -E "(password|secret|api_key|token|host)\s*=\s*['\"][^'\"]{4,}"
```

| 점검 항목 | 기준 |
|-----------|------|
| 하드코딩된 API 키·토큰 | 소스 코드에 직접 기재 금지 |
| `.env` 파일 포함 여부 | `.gitignore`에 `.env` 있는지 확인 |
| `data/` 포함 여부 | `.gitignore`에 `data/` 있는지 확인 |

### 절대 금지 규칙

1. `git push origin main` — main 브랜치 직접 push 금지
2. PR 없이 main에 직접 merge 금지
3. 다른 브랜치 폴더 파일을 현재 브랜치 커밋에 포함 금지
4. 요청하지 않은 파일을 추가로 커밋·push 금지

**사용자가 명시적으로 "push해줘", "merge해줘"라고 말하기 전까지 위 규칙 유효.**

### 커밋 단위 규칙

- 관련된 작업(디자인 수정, 기능 추가 등)끼리 묶어서 한 번에 커밋
- 작업 중간에 임의로 커밋하지 않음
- 사용자가 명시적으로 "커밋해줘"라고 요청할 때만 커밋 진행

### Frontend 브랜치별 터치 허용 파일

Next.js 라우팅 구조를 그대로 사용하며, 브랜치별 파일 범위는 아래로 제한한다.

#### 공용 파일 관리 기준

| 구분 | 브랜치 | 해당 작업 예시 |
|------|--------|---------------|
| 구조/스타일 변경 | `main` 직접 커밋 | 레이아웃, 폰트, 카드 크기, 컴포넌트 프레임 |
| 기능 추가 | feature 브랜치 → PR | 검색창 동작, 알림 로직, 필터, 인터랙션 |

> **"어떻게 보이냐"** → main 직접 / **"어떻게 동작하냐"** → feature 브랜치 → PR

공용 파일 목록 (어느 브랜치에서도 동일하게 보여야 하는 파일):

| 파일 | 설명 |
|------|------|
| `frontend/app/layout.tsx` | 폰트, 전체 레이아웃 |
| `frontend/app/globals.css` | 전역 스타일 |
| `frontend/components/GNB.tsx` | 공통 네비게이션 바 |
| `frontend/components/PosterCard.tsx` | 공용 포스터 카드 |
| `frontend/components/WatchingCard.tsx` | 공용 이어보기 카드 |
| `frontend/components/HorizontalSection.tsx` | 공용 가로 스크롤 섹션 |

#### 마이페이지 찜 목록 정렬 규칙

- 찜 목록은 **항상 최신순(찜한 날짜 내림차순)** 고정. 별도 정렬 UI 추가 금지.
- 백엔드 API 연동 시에도 `order_by=wishlisted_at DESC` 적용 필수.

#### 페이지 전용 파일 — 각 feature 브랜치에서 작업

| 브랜치 | 터치 허용 파일 |
|--------|---------------|
| `feat/home` | `frontend/app/page.tsx`, `frontend/components/HeroBanner.tsx` |
| `feat/recommend` | `frontend/app/recommend/page.tsx` |
| `feat/series-detail` | `frontend/app/series/[series_id]/page.tsx` |
| `feat/purchase` | `frontend/app/purchase/[series_id]/page.tsx` |
| `feat/my` | `frontend/app/my/page.tsx` |

### 백엔드 추가 요청 사항

프론트엔드 연동을 위해 백엔드에 추가 구현을 요청한 항목은 `docs/BACKEND_TODO.md` 참조.

| 항목 | 엔드포인트 | 상태 |
|------|-----------|------|
| 홈 섹션 개인화 | `GET /home/sections/{user_id}` | 🔴 미구현 |
| GNB 통합 검색 | `GET /vod/search?q={query}` | 🔴 미구현 |
| 알림 시스템 | `GET /user/me/notifications` 외 3개 | 🔴 미구현 |

---

## 🎨 Frontend CSS 폴리쉬 규칙 (Frontend 브랜치 적용)

상세 가이드 → [`docs/UI_POLISH_GUIDE.md`](docs/UI_POLISH_GUIDE.md)

### 레이아웃 프레임 변경 금지 (FROZEN)

현재 CSS 작업은 **단일 컴포넌트 디자인(버튼, 슬라이더 등 인터랙티브 요소)만** 변경한다.
아래 항목은 지시 전까지 절대 수정하지 않는다.

| 컴포넌트 | 고정 항목 | 고정 값 |
|----------|-----------|---------|
| `PosterCard` | 카드 크기 | `w-60 h-[360px]` |
| `WatchingCard` | 카드 크기 | `w-60 h-40` |
| `HeroBanner` | 배너 높이 | `h-[480px]` |
| `HeroBanner` | 텍스트 패딩 | `pb-16 px-10` |
| `HeroBanner` | 타이틀 크기 | `text-5xl` |
| `GNB` | 높이 | `h-14` |
| `GNB` | 최대 너비 | `max-w-screen-xl` |
| `HorizontalSection` | 섹션 여백·패딩 | `mt-8 px-6 gap-3` |

### 변경 허용 항목

- 버튼 hover/active 상태, 색상, 라운드
- 슬라이드 인디케이터 두께·색상·애니메이션
- 진행바(WatchingCard) 색상·두께
- 카드 hover 효과 (brightness, shadow, ring — 크기 변경 X)
- 텍스트 색상·웨이트 (크기 변경 X)

### 수정 전 필수 체크

```
CSS 수정 시 →
  w-*, h-* 수치 변경 없음 확인 →
    px-*, py-*, gap-*, mt-*, mb-* 레이아웃 간격 변경 없음 확인 →
      브라우저에서 레이아웃 깨짐 없음 확인
```

### 마이페이지 찜 목록 규칙

- 항상 최신순(찜한 날짜 내림차순) 고정
- 별도 정렬 옵션 UI 추가 금지
- 백엔드 연동 시 `order_by=wishlisted_at DESC` 적용

---

## feat/home 브랜치 전용 규칙

### 담당 파일
- `frontend/app/page.tsx`
- `frontend/components/HeroBanner.tsx`

### 작업 규칙
- `WatchingSection`은 `page.tsx` 내 별도 함수 컴포넌트로 분리 유지
- 화살표 네비게이션: `onMouseEnter/Leave` + `opacity-0/100` 토글 방식 유지
- 이어보기 섹션 카드 6개 표시 기준 유지 (`w-60 h-40`)
