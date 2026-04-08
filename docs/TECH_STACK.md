# 기술 스택 정리

## 전체 기술 스택

### Frontend

| 기술 | 용도 |
|------|------|
| **Next.js 14** (App Router) | React 기반 SSR/CSR 프레임워크 |
| **TypeScript** | 타입 안전성 |
| **Tailwind CSS** | 유틸리티 기반 스타일링 |

### Backend

| 기술 | 용도 |
|------|------|
| **FastAPI** (Python) | REST API 서버 |
| **PostgreSQL + pgvector** | 관계형 DB + 벡터 유사도 검색 |

### ML / AI 파이프라인

| 기술 | 용도 |
|------|------|
| **CLIP (ViT-B/32)** | 영상 임베딩 (512차원) |
| **ALS 행렬 분해** | 협업 필터링 (사용자 임베딩) |
| **YOLOv8** | 실시간 사물 인식 (광고 매칭용) |
| **Sentence Transformers** | 메타데이터 임베딩 (384차원) |

### 데이터 수집

| 기술 | 용도 |
|------|------|
| **TMDB / KMDB / Naver / JustWatch API** | VOD 메타데이터 자동 수집 |

### 인프라 / 배포

| 기술 | 용도 |
|------|------|
| **Google Cloud Run Service** | 프론트엔드 + API 서버 컨테이너 배포 |
| **Google Cloud Run Job** | ML 파이프라인 주기적 실행 |
| **VPC Connector** | Cloud Run ↔ PostgreSQL 보안 연결 |

### 개발 환경

| 기술 | 용도 |
|------|------|
| **Python 3.12 (Conda: myenv)** | ML/백엔드 통합 환경 |
| **Node.js / npm** | 프론트엔드 빌드 및 실행 |
| **Git (GitHub)** | 버전 관리, 브랜치 기반 협업 |

---

## 프론트엔드 기술스택 선택 이유

### 1. Next.js 14 (App Router)

**비교 대상**: Streamlit, React CRA, Vue

#### 선택 이유

| 장점 | 설명 |
|------|------|
| SSR/SSG 지원 | VOD 메타데이터를 서버에서 렌더링하여 초기 로딩이 빠르고 SEO에 유리 |
| App Router (파일 기반 라우팅) | `series/[series_id]/page.tsx`처럼 동적 라우팅이 폴더 구조만으로 완성되어 VOD 상세페이지에 최적 |
| 풀스택 가능 | API Route로 간단한 서버 로직 처리가 가능하여 FastAPI와 역할 분담 용이 |
| React 생태계 | PosterCard, HorizontalSection 등 공용 컴포넌트 재사용 |

#### 대안을 선택하지 않은 이유

| 대안 | 미선택 사유 |
|------|------------|
| **Streamlit** | ML 프로젝트에서 흔히 쓰이지만, 데이터 대시보드 용도에 특화되어 있음. 캐러셀, 가로 스크롤, 모달, WebSocket 광고 팝업 같은 복잡한 VOD 서비스 UI 구현이 불가하고 커스텀 디자인에 제약이 큼 |
| **React CRA** | CSR만 지원하여 초기 로딩이 느리고 SEO에 불리. 라우팅을 별도 설정(react-router)해야 하며, 2023년부터 React 공식 문서에서도 Next.js를 권장 |

### 2. TypeScript

**비교 대상**: JavaScript

#### 선택 이유

| 장점 | 설명 |
|------|------|
| 타입 안전성 | VOD 데이터 구조(series_id, asset_nm, episodes[])가 복잡하여 타입 정의로 런타임 오류를 사전에 방지 |
| 자동완성 및 리팩토링 | API 응답 타입을 정의해두면 IDE가 필드명을 자동완성하여 개발 속도 향상 |
| 협업 시 명확성 | mock 데이터에서 실제 API 전환 시 인터페이스만 보면 데이터 흐름 파악 가능 |

#### 대안을 선택하지 않은 이유

| 대안 | 미선택 사유 |
|------|------------|
| **JavaScript** | 백엔드(FastAPI)와 주고받는 VOD 데이터 필드가 많아 오타 및 누락 발견이 런타임에서야 가능. 팀 프로젝트에서 타입 없이 협업하면 의사소통 비용이 증가 |

### 3. Tailwind CSS

**비교 대상**: CSS Modules, styled-components, SCSS

#### 선택 이유

| 장점 | 설명 |
|------|------|
| 유틸리티 클래스 | `w-60 h-[360px] rounded-lg` 한 줄로 스타일이 완성되어 별도 CSS 파일 관리가 불필요 |
| 일관된 디자인 시스템 | 간격(gap-3, mt-8), 색상(zinc-900) 등 정해진 디자인 토큰을 사용하여 디자인 통일성 유지 |
| 빠른 프로토타이핑 | MVP 방식으로 빠르게 UI를 구현해야 하는 상황에 최적 |
| 번들 최적화 | 사용한 클래스만 빌드에 포함되어 CSS 파일 크기 최소화 |

#### 대안을 선택하지 않은 이유

| 대안 | 미선택 사유 |
|------|------------|
| **styled-components** | SSR 환경(Next.js)에서 스타일 하이드레이션 이슈가 발생할 수 있으며, 런타임 CSS-in-JS 방식이라 성능 오버헤드 존재 |
| **SCSS** | 컴포넌트마다 별도 `.scss` 파일을 관리해야 하는 부담이 있고, 클래스 네이밍 컨벤션 합의가 필요하여 소규모 팀에서 오버헤드 |

---

## 요약

> ML 프로젝트지만 VOD 서비스 수준의 UI가 필요했기 때문에, **빠른 프로토타이핑(Tailwind CSS)** + **타입 안전성(TypeScript)** + **서버 렌더링(Next.js 14)** 조합을 선택했다.
