# X-Hub 구조 개편 및 2단계 설계 계획서

- **문서 버전**: v2.0
- **작성일**: 2026년 3월 2일
- **목표**: 1주차 완료 기반 위에 데이터 모델 재설계 + 역할별 UI 분기 구현
- **기반**: 1단계 개발 계획서 v1.0, 2026-02-22 작업 로그, 구조 재설계 논의

---

## 1. 구조 재설계 배경

### 1-1. 현재 구조의 한계

```
현재: Owner → Project → Item → Report → RtResultRow
```

- Maker(제작사)가 Project-Item 사이에 없음 → 어떤 제작사가 어떤 Item을 담당하는지 표현 불가
- Report에 pdfUrl 1개만 → NDE Map, Scan Plan 등 다중 첨부 불가
- Owner/Maker 역할별 뷰 차이가 설계되지 않음

### 1-2. 재설계 핵심 변경점

| 항목 | 현재 | 변경 후 |
|------|------|---------|
| Maker 위치 | User의 Role일 뿐 | Project-Item 중간 계층 (ProjectMaker) |
| 첨부 파일 | Report.pdfUrl 단일 | Attachment[] 다중 모델 |
| Workspace 진입 | Report → Study → Image | Item → Report → Detail(Attachment + Studies) |
| Dashboard | 역할 무관 단일 뷰 | Owner뷰 / Maker뷰 분리 |

---

## 2. 데이터 모델 재설계 (Prisma Schema)

### 2-1. 전체 계층 구조

```
Owner (발주처: ADNOC, Saudi Aramco ...)
  └── Project (EPC FOR DALMA GAS DEVELOPMENT)
        └── ProjectMaker (N:M 중간 테이블)
              ├── Maker: DS21 CO.,LTD.
              ├── Maker: DS22 CO.,LTD.
              └── Maker: DS24 CO.,LTD.
                    └── Item (AZ5172-V-003 / Water Flash Vessel)
                          └── NdtReport (KG-DALMA-RT-003)
                                ├── Attachment (NDE Map.pdf)
                                ├── Attachment (Scan Plan.pdf)
                                ├── Attachment (Report.pdf)
                                └── RtResultRow[] (RT 전용)
                                      └── → [새 창] x-view (Study → Images)

InspectionCompany → NdtReport에 연결
User (Role: OWNER | MAKER | ADMIN) → ProjectMaker에 연결
```

### 2-2. 수정된 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

// ============================================================
// 사용자 및 조직
// ============================================================

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt 해시
  name      String?
  role      Role     @default(MAKER)

  // 소속 조직 (하나만 선택)
  owner     Owner?   @relation(fields: [ownerId], references: [id])
  ownerId   String?
  maker     Maker?   @relation(fields: [makerId], references: [id])
  makerId   String?

  // 승인 기록
  approvedReports NdtReport[] @relation("ApprovedBy")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  OWNER
  MAKER
  ADMIN
}

model Owner {
  id       String    @id @default(cuid())
  name     String    @unique  // 예: ADNOC, Saudi Aramco
  users    User[]
  projects Project[]

  createdAt DateTime @default(now())
}

model Maker {
  id             String          @id @default(cuid())
  name           String          @unique  // 예: DS21 CO.,LTD.
  users          User[]
  projectMakers  ProjectMaker[]

  createdAt DateTime @default(now())
}

model InspectionCompany {
  id      String      @id @default(cuid())
  name    String      @unique  // 예: KG검사
  reports NdtReport[]

  createdAt DateTime @default(now())
}

// ============================================================
// 프로젝트 및 제작사 배정
// ============================================================

model Project {
  id      String   @id @default(cuid())
  name    String   // 예: EPC FOR DALMA GAS DEVELOPMENT PROJECT
  code    String?  // 예: DALMA-2026 (프로젝트 코드)
  status  ProjectStatus @default(ACTIVE)

  owner   Owner    @relation(fields: [ownerId], references: [id])
  ownerId String

  projectMakers ProjectMaker[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum ProjectStatus {
  ACTIVE
  HOLD
  DONE
}

// ★ 핵심: Project-Maker N:M 중간 테이블
// 하나의 프로젝트에 여러 제작사, 하나의 제작사가 여러 프로젝트
model ProjectMaker {
  id        String   @id @default(cuid())
  project   Project  @relation(fields: [projectId], references: [id])
  projectId String
  maker     Maker    @relation(fields: [makerId], references: [id])
  makerId   String

  items     Item[]   // 이 Maker가 이 Project에서 담당하는 Item들

  createdAt DateTime @default(now())

  @@unique([projectId, makerId])
}

// ============================================================
// 검사 대상 (Item) 및 리포트
// ============================================================

model Item {
  id       String @id @default(cuid())
  name     String // 예: WATER FLASH VESSEL
  number   String // 예: AZ5172-V-003
  drawingNo String? // 예: DWG-2026-001

  projectMaker   ProjectMaker @relation(fields: [projectMakerId], references: [id])
  projectMakerId String

  reports NdtReport[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([projectMakerId, number])
}

model NdtReport {
  id         String     @id @default(cuid())
  reportNo   String     // 예: KG-DALMA-RT-003
  reportType ReportType
  testPhase  TestPhase  @default(NA)
  issuedDate DateTime
  tags       Json?      // 자유 필드 { "inspector": "...", "procedureCode": "..." }

  item   Item   @relation(fields: [itemId], references: [id])
  itemId String

  inspectionCompany   InspectionCompany @relation(fields: [inspectionCompanyId], references: [id])
  inspectionCompanyId String

  // ★ 다중 첨부파일 (NDE Map, Scan Plan, Report PDF 등)
  attachments Attachment[]

  // RT 전용 구조화 데이터
  rtResultRows RtResultRow[]

  // Owner 승인
  ownerApprovalStatus ApprovalStatus @default(PENDING)
  ownerApprovedBy     User?          @relation("ApprovedBy", fields: [ownerApprovedById], references: [id])
  ownerApprovedById   String?
  ownerApprovedAt     DateTime?
  ownerComment        String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([itemId, reportNo])
}

enum ReportType {
  RT
  MT
  UT
  HT
  PMI
  VT
  OTHER
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

// ============================================================
// 첨부파일
// ============================================================

// ★ 신규: 리포트당 다중 첨부
model Attachment {
  id           String         @id @default(cuid())
  fileName     String         // 원본 파일명
  fileUrl      String         // S3/MinIO URL
  fileSize     Int?           // bytes
  fileType     AttachmentType @default(REPORT_PDF)

  report   NdtReport @relation(fields: [reportId], references: [id], onDelete: Cascade)
  reportId String

  uploadedAt DateTime @default(now())
}

enum AttachmentType {
  REPORT_PDF   // 리포트 본문 PDF
  NDE_MAP      // NDE Map
  SCAN_PLAN    // Scan Plan
  WELD_MAP     // Weld Map
  OTHER        // 기타
}

// ============================================================
// RT 전용 결과 행
// ============================================================

model RtResultRow {
  id               String  @id @default(cuid())
  report           NdtReport @relation(fields: [reportId], references: [id], onDelete: Cascade)
  reportId         String
  identificationNo String  // 예: CWL1 (용접 이음부 ID)
  locationNo       String  // 예: 1-2 (필름 위치)
  result           String  // ACC, REJ
  defect           String? // PO, CR, LF, SI 등

  // x-view 연동용 (선택)
  studyInstanceUid String? // DICOM Study UID
}
```

### 2-3. 모델 관계 다이어그램 (ER 요약)

```
┌─────────┐     ┌──────────┐      ┌──────────────┐
│  Owner   │──1:N──│ Project  │──1:N──│ ProjectMaker │
└─────────┘     └──────────┘      └──────┬───────┘
                                         │ N:1     1:N
                                   ┌─────┴─────┐
                                   │   Maker    │
                                   └───────────┘
                                         │
                              ProjectMaker │──1:N──┐
                                                   │
                                            ┌──────┴──────┐
                                            │    Item      │
                                            └──────┬──────┘
                                                   │ 1:N
                                            ┌──────┴──────┐
                                            │  NdtReport   │
                                            └──┬───┬───┬──┘
                                               │   │   │
                                          1:N  │   │   │ 1:N
                                    ┌──────────┘   │   └──────────┐
                                    │              │              │
                             ┌──────┴─────┐  ┌────┴────┐  ┌──────┴──────┐
                             │ Attachment  │  │RtResult │  │ Inspection  │
                             │             │  │  Row    │  │  Company    │
                             └────────────┘  └─────────┘  └─────────────┘
```

---

## 3. API 설계 (Express.js)

### 3-1. 기존 API 변경 사항

| 기존 API | 변경 | 이유 |
|----------|------|------|
| `GET /api/projects` | 유지 (로직 수정) | 역할별 필터링 추가 |
| `GET /api/projects/:id` | 유지 (응답 확장) | projectMakers 포함 |
| `GET /api/projects/:projectId/reports` | **삭제** | Maker 기준으로 재설계 |
| `GET /api/reports/:id` | 유지 (모델명 변경) | NdtReport + attachments |

### 3-2. 전체 API 목록

#### 인증

| Method | Path | 기능 | 권한 |
|--------|------|------|------|
| `POST` | `/api/auth/login` | 로그인 (JWT 발급) | 공개 |
| `GET`  | `/api/auth/me` | 현재 사용자 정보 | 인증 필요 |

#### 프로젝트

| Method | Path | 기능 | 비고 |
|--------|------|------|------|
| `GET` | `/api/projects` | 프로젝트 목록 | Owner: 내 프로젝트 전체, Maker: 내가 참여한 프로젝트 |
| `GET` | `/api/projects/:projectId` | 프로젝트 상세 + Maker 목록 | ProjectMaker[] 포함 |

#### Maker별 현황 (Owner 전용 드릴다운)

| Method | Path | 기능 | 비고 |
|--------|------|------|------|
| `GET` | `/api/projects/:projectId/makers` | 프로젝트 내 Maker 목록 + 통계 | itemCount, pendingCount, progress |
| `GET` | `/api/projects/:projectId/makers/:makerId/summary` | 특정 Maker 통합 리포트 요약 | 전체 Item·Report 현황 |

#### Item 및 리포트

| Method | Path | 기능 | 비고 |
|--------|------|------|------|
| `GET` | `/api/projects/:projectId/makers/:makerId/items` | Item 목록 | Workspace 좌측 패널용 |
| `GET` | `/api/items/:itemId` | Item 상세 + 리포트 목록 | NdtReport[] 포함 |
| `GET` | `/api/reports/:reportId` | 리포트 상세 | attachments[], rtResultRows[] 포함 |
| `POST` | `/api/reports` | 리포트 생성 (다중 파일 업로드) | Maker 전용, multipart/form-data |
| `PUT` | `/api/reports/:reportId` | 리포트 수정 | Maker 전용 |

#### 첨부파일

| Method | Path | 기능 | 비고 |
|--------|------|------|------|
| `POST` | `/api/reports/:reportId/attachments` | 첨부파일 추가 | multipart/form-data |
| `DELETE` | `/api/attachments/:attachmentId` | 첨부파일 삭제 | Maker 전용 |

#### 승인

| Method | Path | 기능 | 비고 |
|--------|------|------|------|
| `PATCH` | `/api/reports/:reportId/approval` | 승인/반려 | Owner 전용 |

### 3-3. API 응답 타입 예시

```typescript
// GET /api/projects (Owner 뷰)
interface ProjectListItem {
  id: string;
  name: string;
  code: string | null;
  status: "ACTIVE" | "HOLD" | "DONE";
  makerCount: number;      // 참여 제작사 수
  totalItems: number;       // 전체 Item 수
  pendingCount: number;     // 승인 대기 리포트 수
  progress: number;         // 승인 완료 비율 (0~100)
  lastUpdated: string;
}

// GET /api/projects/:projectId/makers (Owner 드릴다운)
interface MakerSummary {
  id: string;               // projectMaker.id
  makerId: string;
  makerName: string;         // 예: DS21 CO.,LTD.
  itemCount: number;
  reportCount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  progress: number;          // (approved / total) * 100
}

// GET /api/projects/:projectId/makers/:makerId/items (Workspace 좌측)
interface ItemListItem {
  id: string;
  number: string;            // AZ5172-V-003
  name: string;              // WATER FLASH VESSEL
  reportCount: number;
  pendingCount: number;
  latestReportDate: string;
}

// GET /api/reports/:reportId (리포트 상세)
interface ReportDetail {
  id: string;
  reportNo: string;
  reportType: ReportType;
  testPhase: TestPhase;
  issuedDate: string;
  tags: Record<string, string> | null;
  ownerApprovalStatus: ApprovalStatus;
  ownerComment: string | null;
  item: { id: string; name: string; number: string };
  inspectionCompany: { id: string; name: string };
  attachments: AttachmentItem[];
  rtResultRows: RtResultRowItem[];  // RT 전용, 비어있으면 []
}

interface AttachmentItem {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  fileType: AttachmentType;
  uploadedAt: string;
}
```

---

## 4. 페이지 및 라우트 설계

### 4-1. 라우트 구조

```typescript
// client/src/App.tsx

<Switch>
  {/* 공개 */}
  <Route path="/login" component={Login} />

  {/* 인증 필요 (ProtectedRoute 래퍼) */}
  <Route path="/" component={Dashboard} />
  <Route path="/project/:projectId" component={ProjectDetail} />       {/* Owner 전용 */}
  <Route path="/workspace/:projectId/:makerId" component={Workspace} />
  <Route path="/404" component={NotFound} />
  <Route component={NotFound} />
</Switch>
```

### 4-2. 페이지별 상세

#### (1) Login — `/login` (신규)

```
┌─────────────────────────────────┐
│          X-Hub Login            │
│                                 │
│   Email    [______________]     │
│   Password [______________]     │
│                                 │
│          [ Sign In ]            │
└─────────────────────────────────┘
```

- JWT 발급 → localStorage 저장
- 로그인 후 역할에 따라 `/` 로 리다이렉트

#### (2) Dashboard — `/` (수정)

**역할에 따라 동일 URL, 다른 뷰 렌더링:**

```typescript
function Dashboard() {
  const { user } = useAuth();

  if (user.role === "OWNER") return <OwnerDashboard />;
  if (user.role === "MAKER") return <MakerDashboard />;
  return <AdminDashboard />;  // 향후
}
```

**Owner Dashboard:**

```
┌──────────────────────────────────────────────────────────┐
│  My Projects                              [Search] [Sort]│
├──────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐             │
│  │ ■ DALMA GAS      │  │ ■ OTHER PROJECT  │             │
│  │   Makers: 3      │  │   Makers: 2      │             │
│  │   Items: 35      │  │   Items: 16      │             │
│  │   🟡 12 Pending  │  │   🟢 All Clear   │             │
│  │   ████████░░ 72% │  │   ██████████ 100%│             │
│  └──────────────────┘  └──────────────────┘             │
│           │ 클릭                                         │
│           ▼                                              │
│     /project/:projectId (Maker별 현황)                   │
└──────────────────────────────────────────────────────────┘
```

**Maker Dashboard:**

```
┌──────────────────────────────────────────────────────────┐
│  My Assigned Projects                     [Search] [Sort]│
├──────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────┐       │
│  │ ■ DALMA GAS (Owner: ADNOC)                  │       │
│  │   My Items: 15  │  🟡 9 Pending  │  40%     │       │
│  └──────────────────────────────────────────────┘       │
│  ┌──────────────────────────────────────────────┐       │
│  │ ■ OTHER PROJECT (Owner: Saudi Aramco)        │       │
│  │   My Items: 8   │  🟢 All Clear  │  100%    │       │
│  └──────────────────────────────────────────────┘       │
│           │ 클릭                                         │
│           ▼                                              │
│     /workspace/:projectId/:makerId (바로 Workspace)      │
└──────────────────────────────────────────────────────────┘
```

**핵심 차이:**
- Owner: 카드 클릭 → `/project/:projectId` (Maker 목록 중간 단계)
- Maker: 카드 클릭 → `/workspace/:projectId/:makerId` (바로 작업 공간)

#### (3) ProjectDetail — `/project/:projectId` (신규, Owner 전용)

```
┌──────────────────────────────────────────────────────────┐
│  ← Back   DALMA GAS DEVELOPMENT PROJECT                 │
│           Owner: ADNOC                                   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Maker별 현황                                [통합 리포트]│
│  ┌────────────┬───────┬─────────┬──────────┬────────┐   │
│  │ Maker      │ Items │ Reports │ Pending  │ 진행률 │   │
│  ├────────────┼───────┼─────────┼──────────┼────────┤   │
│  │ DS21       │  12   │   24    │    3     │   88%  │   │
│  │ DS22       │   8   │   16    │    0     │  100%  │   │
│  │ DS24       │  15   │   30    │    9     │   70%  │   │
│  └────────────┴───────┴─────────┴──────────┴────────┘   │
│         │ DS24 클릭                                      │
│         ▼                                                │
│   /workspace/:projectId/:makerId                         │
└──────────────────────────────────────────────────────────┘
```

- Owner가 프로젝트 전체를 조감하는 페이지
- Maker 행 클릭 시 해당 Maker의 Workspace로 이동
- [통합 리포트] 버튼: 프로젝트 전체 리포트 현황 요약

#### (4) Workspace — `/workspace/:projectId/:makerId` (대폭 수정)

**Owner와 Maker 모두 접근하지만, 보이는 액션이 다름:**

```
┌──────────────────────────────────────────────────────────────┐
│  ← Back   Project: DALMA GAS  │  Maker: DS24  │  User: Kim │
├────────────┬─────────────┬───────────────────────────────────┤
│  Items     │  Reports    │  Report Detail                    │
│            │             │                                   │
│ ┌────────┐ │ ┌─────────┐ │ ┌─────────────────────────────┐  │
│ │V-003   │ │ │RT-003 🟡│ │ │ Report: KG-DALMA-RT-003     │  │
│ │  3 rpt │ │ │RT-004 🟢│ │ │ Type: RT │ Phase: After PWHT│  │
│ │  1 pnd │ │ │MT-001 🟡│ │ │ Issued: 2026-02-15          │  │
│ ├────────┤ │ │UT-001 🟢│ │ │ Status: 🟡 PENDING          │  │
│ │V-004   │ │ └─────────┘ │ ├─────────────────────────────┤  │
│ │  2 rpt │ │             │ │ Attachments                  │  │
│ │  0 pnd │ │             │ │  📎 RT-003-Report.pdf    [👁]│  │
│ ├────────┤ │             │ │  📎 NDE-Map-V003.pdf    [👁]│  │
│ │E-001   │ │             │ │  📎 Scan-Plan.pdf       [👁]│  │
│ │  5 rpt │ │             │ │  [+ Upload]  ← Maker만      │  │
│ │  3 pnd │ │             │ ├─────────────────────────────┤  │
│ └────────┘ │             │ │ RT Studies                   │  │
│            │             │ │  CWL1 (4 shots) ACC         │  │
│            │             │ │  CWL2 (3 shots) REJ ⚠       │  │
│            │             │ │  CWL3 (5 shots) ACC         │  │
│            │             │ │  [Open x-view 🔗]  ← 새 창  │  │
│            │             │ ├─────────────────────────────┤  │
│            │             │ │ ★ Owner Approval             │  │
│            │             │ │  [✓ Approve] [✗ Reject]     │  │
│            │             │ │  Comment: [___________]      │  │
│            │             │ │  ↑ Owner에게만 표시           │  │
│            │             │ └─────────────────────────────┘  │
└────────────┴─────────────┴───────────────────────────────────┘
```

**역할별 차이점:**

| 영역 | Owner | Maker |
|------|-------|-------|
| Item List | 읽기 전용 | 읽기 전용 |
| Report List | 읽기 전용 | + "New Report" 버튼 |
| Attachments | 다운로드/뷰어만 | + "Upload" 버튼 |
| RT Studies | 조회 + x-view 열기 | 조회 + x-view 열기 |
| Approval 영역 | **표시됨** (승인/반려) | **숨겨짐** (상태만 표시) |

**Report Detail의 동적 분기:**

```typescript
// reportType에 따라 하단 영역 분기
if (report.reportType === "RT") {
  // RT Studies 섹션 표시 + Open x-view 버튼
  // x-view는 window.open()으로 새 창
} else {
  // PDF 뷰어 (첫 번째 REPORT_PDF 타입 첨부파일)
  // <PdfViewer url={reportPdfAttachment.fileUrl} />
}
```

---

## 5. 컴포넌트 설계

### 5-1. 신규 / 수정 파일 목록

```
client/src/
├── components/
│   ├── Layout.tsx                  ← 수정: 역할별 사이드바, 인증 정보
│   ├── ProtectedRoute.tsx          ← 신규: 인증 라우트 가드
│   ├── PdfViewer.tsx               ← 신규: PDF.js 래퍼
│   ├── ReportUploadForm.tsx        ← 신규: 리포트+첨부 업로드 폼
│   ├── AttachmentList.tsx          ← 신규: 첨부파일 목록/업로드/다운로드
│   ├── ApprovalControls.tsx        ← 신규: Owner 승인/반려 UI
│   ├── RtStudiesPanel.tsx          ← 신규: RT Study 목록 + x-view 연동
│   ├── MakerSummaryTable.tsx       ← 신규: Maker별 현황 테이블
│   ├── ItemListPanel.tsx           ← 신규: Workspace 좌측 Item 목록
│   ├── ReportListPanel.tsx         ← 신규: Workspace 중앙 Report 목록
│   ├── ReportDetailPanel.tsx       ← 신규: Workspace 우측 상세
│   └── ui/                         ← 기존 shadcn/ui 유지
│
├── contexts/
│   ├── ThemeContext.tsx             ← 기존 유지
│   └── AuthContext.tsx              ← 신규: JWT 인증 상태 관리
│
├── hooks/
│   ├── useAuth.ts                  ← 신규: AuthContext 편의 훅
│   └── useRole.ts                  ← 신규: 역할 기반 조건부 렌더링 훅
│
├── lib/
│   ├── api.ts                      ← 수정: 새 API 엔드포인트 반영
│   └── utils.ts                    ← 기존 유지
│
├── pages/
│   ├── Login.tsx                   ← 신규
│   ├── Dashboard.tsx               ← 수정: OwnerDashboard / MakerDashboard 분기
│   ├── ProjectDetail.tsx           ← 신규: Owner 전용 Maker별 현황
│   ├── Workspace.tsx               ← 대폭 수정: 3-Panel (Item → Report → Detail)
│   └── NotFound.tsx                ← 기존 유지
│
└── App.tsx                         ← 수정: 라우트 추가, AuthProvider
```

### 5-2. 핵심 컴포넌트 인터페이스

```typescript
// ProtectedRoute.tsx
interface ProtectedRouteProps {
  component: React.ComponentType;
  allowedRoles?: Role[];  // 비어있으면 인증만 체크
}

// AttachmentList.tsx
interface AttachmentListProps {
  reportId: string;
  attachments: AttachmentItem[];
  canUpload: boolean;       // Maker만 true
  onUploadComplete: () => void;
}

// ApprovalControls.tsx
interface ApprovalControlsProps {
  reportId: string;
  currentStatus: ApprovalStatus;
  onApprovalComplete: () => void;
}

// RtStudiesPanel.tsx
interface RtStudiesPanelProps {
  rtResultRows: RtResultRowItem[];
  reportNo: string;
  onOpenViewer: (studyInstanceUid: string) => void;
  // → window.open(`/viewer/?studyid=${uid}`, ...)
}

// ItemListPanel.tsx
interface ItemListPanelProps {
  projectId: string;
  makerId: string;
  selectedItemId: string | null;
  onSelectItem: (itemId: string) => void;
}

// ReportListPanel.tsx
interface ReportListPanelProps {
  itemId: string;
  selectedReportId: string | null;
  onSelectReport: (reportId: string) => void;
  canCreate: boolean;  // Maker만 true
}

// ReportDetailPanel.tsx
interface ReportDetailPanelProps {
  reportId: string;
  userRole: Role;
}
```

---

## 6. 인증 및 권한 설계

### 6-1. JWT 토큰 구조

```typescript
interface JwtPayload {
  userId: string;
  email: string;
  role: Role;          // "OWNER" | "MAKER" | "ADMIN"
  ownerId?: string;    // Owner 소속일 때
  makerId?: string;    // Maker 소속일 때
  iat: number;
  exp: number;         // 24시간
}
```

### 6-2. 미들웨어

```typescript
// server/middleware/auth.ts

// 인증 검증
function authenticate(req, res, next) { ... }

// 역할 기반 접근 제어
function authorize(...roles: Role[]) {
  return (req, res, next) => { ... }
}

// 사용예:
app.get("/api/projects", authenticate, handler);
app.patch("/api/reports/:id/approval", authenticate, authorize("OWNER"), handler);
app.post("/api/reports", authenticate, authorize("MAKER"), handler);
```

### 6-3. 프론트엔드 인증 흐름

```
Login → POST /api/auth/login → JWT 수신
  → localStorage에 저장
  → AuthContext에 user 정보 설정
  → axios interceptor로 모든 요청에 Authorization 헤더 추가
  → Dashboard로 리다이렉트
```

---

## 7. 파일 업로드 설계 (MinIO/S3)

### 7-1. 업로드 흐름

```
[Maker 브라우저]
  ↓ multipart/form-data (PDF + metadata)
[Express API - POST /api/reports]
  ↓ multer로 파일 수신
  ↓ S3 SDK로 MinIO에 업로드
  ↓ fileUrl 생성
[DB에 NdtReport + Attachment 레코드 저장]
```

### 7-2. S3 버킷 구조

```
x-hub-files/
  └── {projectId}/
        └── {makerId}/
              └── {itemNumber}/
                    └── {reportNo}/
                          ├── KG-DALMA-RT-003-Report.pdf
                          ├── NDE-Map-V003.pdf
                          └── Scan-Plan.pdf
```

---

## 8. 구현 타임라인 (수정)

### Phase 2-A: 구조 개편 (1주)

| Day | 영역 | 작업 내용 |
|-----|------|----------|
| **1** | DB | `schema.prisma` 재작성 (이 문서 기준), `prisma migrate dev` |
|  | DB | `seed.ts` 수정 (ProjectMaker, Attachment 시드 데이터) |
| **2** | 백엔드 | `shared/types.ts` 재작성 |
|  | 백엔드 | `server/index.ts` API 전면 재작성 (새 라우트) |
| **3** | 프론트 | `api.ts` 재작성 (새 API 엔드포인트) |
|  | 프론트 | `Dashboard.tsx` → Owner/Maker 분기 |
| **4** | 프론트 | `ProjectDetail.tsx` 신규 (Owner Maker별 현황) |
|  | 프론트 | `Workspace.tsx` 대폭 수정 (Item → Report → Detail 3-Panel) |
| **5** | 통합 | API 연동 테스트, 시드 데이터 검증 |

### Phase 2-B: 인증 + 핵심 기능 (1주)

| Day | 영역 | 작업 내용 |
|-----|------|----------|
| **6** | 백엔드 | JWT 로그인 API, 인증 미들웨어, 역할 미들웨어 |
| **7** | 프론트 | `Login.tsx`, `AuthContext`, `ProtectedRoute`, axios interceptor |
| **8** | 프론트 | `ReportUploadForm.tsx`, `AttachmentList.tsx` |
|  | 백엔드 | `POST /api/reports` (multer + MinIO 업로드) |
| **9** | 프론트 | `PdfViewer.tsx` (react-pdf), `RtStudiesPanel.tsx` |
| **10** | 프론트 | `ApprovalControls.tsx`, `PATCH /api/reports/:id/approval` |

### Phase 2-C: 완성 + 테스트 (3~5일)

| Day | 영역 | 작업 내용 |
|-----|------|----------|
| **11** | 프론트 | Workspace 역할별 UI 분기 마무리 |
| **12** | 통합 | 전체 워크플로우 E2E 테스트 |
| **13** | 배포 | 배포 준비, README 업데이트, 버그 수정 |

---

## 9. Cursor 개발 가이드 (프롬프트)

### 9-1. `.cursor/rules.md` 업데이트

기존 rules.md를 아래 내용으로 **교체**하세요:

```markdown
# X-Hub 프로젝트 개발 규칙 (v2.0)

## 1. 프로젝트 목표 (Phase 2)
- NDT 리포트 비대면 승인 시스템
- Owner가 프로젝트 전체를 조감, Maker가 담당 Item을 관리
- 같은 데이터, 다른 뷰: 역할(Owner/Maker)에 따라 Dashboard와 액션이 다름

## 2. 핵심 데이터 계층
```
Owner → Project → ProjectMaker(N:M) → Item → NdtReport → Attachment[]
                                                        → RtResultRow[] (RT만)
```

## 3. 기술 스택
- Frontend: Vite, React 19, TypeScript, TailwindCSS v4, Wouter, React Query, PDF.js
- Backend: Node.js, Express.js, TypeScript, Prisma 7
- Database: PostgreSQL 15 (Docker)
- File Storage: MinIO (S3 호환, Docker)
- Auth: JWT (jsonwebtoken + bcrypt)

## 4. 코딩 원칙
- 서버 상태: @tanstack/react-query 사용
- 클라이언트 상태: useState, useContext 최소 사용
- UI: shadcn/ui 컴포넌트 최대 재활용
- 타입: shared/types.ts에 정의, 프론트/백엔드 공유
- API: 모든 데이터는 REST API 통해 비동기 호출
- 에러: ErrorBoundary + react-query 에러 처리

## 5. 역할별 뷰 규칙
- Owner Dashboard → /project/:projectId (Maker별 현황) → /workspace/:projectId/:makerId
- Maker Dashboard → /workspace/:projectId/:makerId (바로 진입)
- Workspace 내: Owner는 승인 액션, Maker는 업로드 액션

## 6. 파일 구조
```
x-hub/
├── prisma/schema.prisma        # DB 스키마 (소스 오브 트루스)
├── server/index.ts             # Express API 서버
├── shared/types.ts             # 공유 타입
├── client/src/
│   ├── contexts/AuthContext.tsx # 인증 상태
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx       # 역할 분기: OwnerDashboard / MakerDashboard
│   │   ├── ProjectDetail.tsx   # Owner 전용: Maker별 현황
│   │   └── Workspace.tsx       # 3-Panel: Item → Report → Detail
│   ├── components/
│   │   ├── AttachmentList.tsx
│   │   ├── ApprovalControls.tsx
│   │   ├── RtStudiesPanel.tsx
│   │   ├── PdfViewer.tsx
│   │   └── ReportUploadForm.tsx
│   └── lib/api.ts              # API 클라이언트
├── docker-compose.yml
└── docs/                       # 설계 문서
```

## 7. 주의사항
- Report 모델명이 NdtReport로 변경됨
- pdfUrl 단일 필드 대신 Attachment[] 사용
- Item은 ProjectMaker에 소속 (projectMakerId FK)
- RT 뷰어(x-view)는 항상 window.open()으로 새 창
```

### 9-2. Day 1 Composer 프롬프트 (스키마 마이그레이션)

```
기존 prisma/schema.prisma를 삭제하고,
@docs/X-Hub 2단계 설계 계획서 v2.0.md 의 "2-2. 수정된 Prisma Schema" 섹션 전체를
prisma/schema.prisma에 작성해줘.

주의:
- Report 모델은 NdtReport로 변경
- ProjectMaker 중간 테이블 추가
- Attachment 모델 추가
- Item은 projectMakerId로 연결
```

### 9-3. Day 1 Composer 프롬프트 (시드 데이터)

```
@prisma/schema.prisma 를 참고하여 prisma/seed.ts를 재작성해줘.

시드 데이터 요구사항:
1. Owner: ADNOC
2. Maker: DS21 CO.,LTD., DS22 CO.,LTD., DS24 CO.,LTD.
3. InspectionCompany: KG검사, 한국검사기술
4. Project: "EPC FOR DALMA GAS DEVELOPMENT PROJECT" (Owner: ADNOC)
5. ProjectMaker: DS21, DS22, DS24 모두 이 프로젝트에 배정
6. DS24의 Item 3개: V-003 (Water Flash Vessel), V-004 (Separator), E-001 (Heat Exchanger)
7. V-003에 NdtReport 3개: RT-003(RT, PENDING), MT-001(MT, APPROVED), UT-001(UT, PENDING)
8. RT-003에 Attachment 2개: Report.pdf, NDE-Map.pdf
9. RT-003에 RtResultRow 5개: CWL1 (ACC 3개), CWL2 (REJ 1개 포함)
10. User 2명: owner@test.com (OWNER), maker@test.com (MAKER) - 비밀번호 bcrypt 해시
```

---

## 10. 기존 코드와의 호환성 노트

### 삭제/대체 대상

| 파일 | 액션 | 이유 |
|------|------|------|
| 기존 `server/index.ts` API 핸들러 | 전면 재작성 | 라우트 구조 변경 |
| `shared/types.ts` | 전면 재작성 | NdtReport, ProjectMaker 등 새 모델 |
| `client/src/lib/api.ts` | 전면 재작성 | 새 API 엔드포인트 |
| `Dashboard.tsx` | 대폭 수정 | Owner/Maker 분기 |
| `Workspace.tsx` | 대폭 수정 | Item 중심 3-Panel |

### 유지 대상

| 파일 | 비고 |
|------|------|
| `client/src/components/ui/*` | shadcn/ui 전체 유지 |
| `client/src/components/Layout.tsx` | 구조 유지, 인증 정보 추가 |
| `client/src/components/ErrorBoundary.tsx` | 그대로 유지 |
| `client/src/contexts/ThemeContext.tsx` | 그대로 유지 |
| `docker-compose.yml` | 그대로 유지 |
| `vite.config.ts` | 그대로 유지 |
| `package.json` | 의존성 추가만 (bcrypt, jsonwebtoken, multer, @aws-sdk/client-s3) |
