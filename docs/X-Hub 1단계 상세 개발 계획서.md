# X-Hub 1단계 상세 개발 계획서

- **문서 버전**: v1.0
- **작성일**: 2026년 2월 22일
- **목표**: 2~3주 내 빠른 런칭을 통한 시장 검증 (MVP)
- **기반 문서**: X-Hub 개발계획서 v0.1, 20260222 회의록

---

## 1. 1단계 목표 및 핵심 범위

**목표**: 제조사(Maker)가 NDT 리포트(PDF)를 웹에 업로드하고, 발주처(Owner)가 이를 원격으로 확인 및 승인하는 핵심 워크플로우를 구현하여 빠른 시장 검증을 완료한다.

**핵심 범위 (In-Scope)**:

1.  **RT 리포트 기능 완성**: 기존 3-Pane UI를 유지하되, 실제 데이터 모델 기반으로 기능을 완성한다.
2.  **범용 PDF 리포트 관리**: RT 외 모든 검사(MT, UT, HT 등)는 '기타 리포트'로 취급, PDF.js 기반 뷰어를 통해 조회/관리하는 기능을 제공한다.
3.  **외부(Owner) 승인 워크플로우**: 제조사가 업로드한 리포트를 발주처가 웹에서 확인하고 '승인' 또는 '반려' 처리하는 기능을 구현한다.
4.  **사용자 역할 분리**: 초기 타겟인 '메이커(Maker)'와 '오너(Owner)' 역할을 분리하여 대시보드와 접근 권한을 차별화한다.
5.  **데이터베이스 구축**: PostgreSQL + Prisma ORM 기반으로 실제 데이터를 저장할 수 있는 DB 스키마를 구축한다.

**제외 범위 (Out-of-Scope)**:

-   **내부 승인 워크플로우**: 검사 업체(Inspection Company) 내부의 다단계 승인 프로세스는 1단계에서 제외한다.
-   **리포트 자동 생성**: 시스템 내에서 리포트를 생성하는 기능은 제외하며, 완성된 PDF를 업로드하는 것만 지원한다.
-   **상세한 검사 유형별 UI**: MT, UT 등 각 검사 유형에 최적화된 상세 UI는 2단계 과제로 넘긴다.

---

## 2. 1단계 데이터 모델 정의 (Prisma Schema 기반)

기존 `mockData.ts`를 폐기하고, 실제 데이터 구조를 반영하여 `prisma/schema.prisma` 파일을 설계한다.

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id       String  @id @default(cuid())
  email    String  @unique
  name     String?
  role     Role    @default(MAKER)
  projects Project[] @relation("ProjectUsers")
  owner    Owner?  @relation(fields: [ownerId], references: [id])
  ownerId  String?
  maker    Maker?  @relation(fields: [makerId], references: [id])
  makerId  String?
}

enum Role {
  OWNER
  MAKER
  ADMIN
}

model Owner {
  id   String @id @default(cuid())
  name String @unique
  User User[]
}

model Maker {
  id   String @id @default(cuid())
  name String @unique
  User User[]
}

model InspectionCompany {
  id      String   @id @default(cuid())
  name    String   @unique
  reports Report[]
}

model Project {
  id        String   @id @default(cuid())
  name      String
  owner     Owner    @relation(fields: [ownerId], references: [id])
  ownerId   String
  items     Item[]
  members   User[]   @relation("ProjectUsers")
}

model Item {
  id      String   @id @default(cuid())
  name    String   // e.g., WATER FLASH VESSEL
  number  String   // e.g., AZ5172-V-003
  project   Project  @relation(fields: [projectId], references: [id])
  projectId String
  reports   Report[]

  @@unique([projectId, number])
}

model Report {
  id                  String   @id @default(cuid())
  reportNo            String
  reportType          ReportType
  testPhase           TestPhase @default(NA)
  pdfUrl              String
  issuedDate          DateTime
  tags                Json?     // { "drawingNo": "...", "inspector": "..." }

  item                Item     @relation(fields: [itemId], references: [id])
  itemId              String
  inspectionCompany   InspectionCompany @relation(fields: [inspectionCompanyId], references: [id])
  inspectionCompanyId String

  // RT-specific structured data
  rtResultRows        RtResultRow[]

  // Owner Approval
  ownerApprovalStatus ApprovalStatus @default(PENDING)
  ownerApprovedById   String?
  ownerApprovedAt     DateTime?
  ownerComment        String?

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@unique([itemId, reportNo])
}

enum ReportType {
  RT
  MT
  UT
  HT
  PMI
  OTHER // For Phase 1, non-RT reports will use this type
}

enum TestPhase {
  BEFORE_PWHT
  AFTER_PWHT
  NA
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
}

// Only for RT Reports
model RtResultRow {
  id               String  @id @default(cuid())
  report           Report  @relation(fields: [reportId], references: [id])
  reportId         String
  identificationNo String  // e.g., CWL1
  locationNo       String  // e.g., 1-2
  result           String  // ACC, REJ
  defect           String? // PO, CR, LF etc.
}
```

---

## 3. 1단계 백엔드 API 설계 (Express.js)

`server/index.ts`를 확장하여 다음 API 엔드포인트를 구현합니다.

| Method | Path | 기능 | 권한 |
|---|---|---|---|
| `GET` | `/api/projects` | 사용자가 속한 프로젝트 목록 조회 | Maker, Owner |
| `GET` | `/api/projects/:id` | 단일 프로젝트 상세 정보 및 아이템 목록 조회 | Maker, Owner |
| `GET` | `/api/items/:id` | 단일 아이템 상세 정보 및 리포트 목록 조회 | Maker, Owner |
| `POST`| `/api/reports` | 새 리포트 생성 (PDF 업로드 포함) | Maker |
| `GET` | `/api/reports/:id` | 단일 리포트 상세 정보 조회 (RT는 구조화 데이터 포함) | Maker, Owner |
| `PUT` | `/api/reports/:id` | 리포트 정보 수정 (태그 등) | Maker |
| `PATCH`| `/api/reports/:id/approval` | 오너의 승인/반려 처리 | Owner |

**PDF 업로드 처리**: `POST /api/reports` 요청 시 `multipart/form-data`로 PDF 파일을 받아 S3 호환 스토리지(MinIO 또는 Cloudflare R2)에 업로드하고, `pdfUrl`을 DB에 저장합니다.

---

## 4. 1단계 프론트엔드 UI/UX 계획 (React)

### 가. 컴포넌트 및 페이지 신규/수정

| 파일 경로 | 변경/신규 | 주요 작업 내용 |
|---|---|---|
| `client/src/data/mockData.ts` | **삭제** | 실제 API 호출로 대체 |
| `client/src/shared/types.ts` | **신규** | Prisma 스키마와 동기화된 TypeScript 타입 정의 |
| `client/src/pages/Dashboard.tsx` | **수정** | 역할(Maker/Owner)에 따라 다른 위젯 표시. API 호출로 데이터 로드. |
| `client/src/pages/Workspace.tsx` | **수정** | Report Type에 따라 분기 처리. RT는 기존 3-Pane 유지, OTHER는 PDF 뷰어 표시. |
| `client/src/components/PdfViewer.tsx` | **신규** | Mozilla PDF.js 라이브러리를 래핑한 컴포넌트. `pdfUrl`을 prop으로 받음. |
| `client/src/components/ReportUploadForm.tsx` | **신규** | 리포트 PDF 파일 및 필수 태그(보고서 번호, 검사일 등)를 입력받는 폼. |
| `client/src/components/ApprovalControls.tsx` | **신규** | Owner에게만 표시되는 승인/반려 버튼 및 코멘트 입력 UI. |

### 나. 워크스페이스 UI 분기 로직

`Workspace.tsx`에서 선택된 리포트의 `reportType`에 따라 동적으로 컴포넌트를 렌더링합니다.

-   **If `report.reportType === 'RT'`**:
    -   기존 3-Pane 레이아웃 (`ReportList` -> `StudyList` -> `ImageList`)을 유지합니다.
    -   `StudyList`와 `ImageList`는 `rtResultRows` 데이터를 기반으로 렌더링합니다.
-   **If `report.reportType === 'OTHER'`**:
    -   `ReportList`는 유지하되, 오른쪽 Pane 전체를 `<PdfViewer url={report.pdfUrl} />` 컴포넌트로 대체합니다.
    -   하단에 `<ApprovalControls />`를 배치하여 승인/반려 처리를 할 수 있도록 합니다.

---

## 5. 1단계 개발 타임라인 (3주 목표)

| 주차 | 담당 | 핵심 목표 및 작업 내용 |
|---|---|---|
| **1주차** | 백엔드 | **DB 및 핵심 API 구축**<br/>- `schema.prisma` 최종 확정 및 DB 마이그레이션<br/>- S3 호환 스토리지(MinIO) 로컬 설정<br/>- 사용자/프로젝트/리포트 CRUD API 구현<br/>- PDF 업로드 API 구현 |
| | 프론트엔드 | **기반 리팩토링**<br/>- `shared/types.ts` 작성<br/>- `mockData.ts` 제거 및 API 호출 로직(e.g., `react-query`) 추가<br/>- 대시보드, 프로젝트 목록 API 연동 |
| **2주차** | 백엔드 | **인증 및 권한 구현**<br/>- JWT 기반 로그인 API (`/api/auth/login`) 구현<br/>- API 요청에 대한 역할(Role) 기반 접근 제어 미들웨어 구현 |
| | 프론트엔드 | **핵심 기능 UI 구현**<br/>- `<ReportUploadForm />` 및 리포트 생성 페이지 구현<br/>- `<PdfViewer />` 컴포넌트 구현 및 워크스페이스 연동<br/>- RT 리포트 뷰 API 연동 완료 |
| **3주차** | 백엔드 | **승인 로직 및 테스트**<br/>- 승인 API (`/api/reports/:id/approval`) 구현<br/>- API 통합 테스트 및 버그 수정 |
| | 프론트엔드 | **승인 UI 및 최종 테스트**<br/>- `<ApprovalControls />` 구현 및 API 연동<br/>- 역할(Owner/Maker)에 따른 UI 분기 처리 완료<br/>- 전체 워크플로우 E2E 테스트 및 배포 준비 |

---

## 6. 기술 스택 및 인프라 (1단계)

-   **Frontend**: Vite, React 19, TypeScript, TailwindCSS, Wouter, React Query, PDF.js
-   **Backend**: Node.js, Express.js, TypeScript, Prisma
-   **Database**: PostgreSQL (Docker Compose로 로컬 구동)
-   **File Storage**: MinIO (Docker Compose로 로컬 구동, S3 API 호환)
-   **Deployment**: 기존과 동일 (사내 PC + ngrok) 유지
