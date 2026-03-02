# X-Hub 진행 현황 및 다음 단계

- **최종 업데이트**: 2026년 3월 2일

---

## 1. 완료된 작업

### 1단계 (2026-02-22 완료)

| 항목 | 내용 |
|------|------|
| Prisma | schema.prisma, Prisma 7 adapter |
| Docker | PostgreSQL 15, MinIO |
| API | GET /api/projects, /projects/:id, /projects/:id/reports, /reports/:id |
| 프론트 | Dashboard, Workspace, React Query, mockData 제거 |
| 시드 | 프로젝트, 리포트, RT 결과 행 |

### 2단계 Phase 2-A Day 1 (2026-03-02 완료)

| 항목 | 내용 |
|------|------|
| **설계서** | docs/X-Hub 2단계 설계 계획서 v2.0.md |
| **스키마** | ProjectMaker(N:M), NdtReport, Attachment, Item→projectMakerId |
| **시드** | Owner, Maker 3개, ProjectMaker, Item 3개, NdtReport 3개, Attachment, RtResultRow, User 2명 |
| **서버** | API를 2단계 스키마에 맞게 수정 |
| **타입** | shared/types.ts → NdtReport, Attachment 등 반영 |

### 2단계 Phase 2-A Day 2 (2026-03-02 완료)

| 항목 | 내용 |
|------|------|
| **shared/types.ts** | MakerSummary, ItemListItem, ItemDetail, NdtReportListItem 추가 |
| **server/index.ts** | `GET /api/projects/:projectId/makers` |
| | `GET /api/projects/:projectId/makers/:makerId/items` |
| | `GET /api/items/:itemId` |
| **라우트 순서** | /makers, /makers/:makerId/items를 /projects/:id보다 먼저 등록 |

### 테스트 계정

- `owner@test.com` / `test1234` (OWNER)
- `maker@test.com` / `test1234` (MAKER)

---

### 2단계 Phase 2-A Day 3 (2026-03-02 완료)

| 항목 | 내용 |
|------|------|
| **client/src/lib/api.ts** | fetchMakersByProject, fetchItemsByMaker, fetchItem 추가 |

### 2단계 Phase 2-A Day 4 (2026-03-02 완료)

| 항목 | 내용 |
|------|------|
| **RoleContext** | 데모용 역할 시뮬레이션 (OWNER/MAKER) |
| **OwnerDashboard** | My Projects, 클릭 → `/project/:projectId` |
| **MakerDashboard** | My Assigned Projects, 클릭 → `/workspace/:projectId/:makerId` |
| **ProjectDetail** | Owner 전용 Maker별 현황 테이블 |
| **Layout** | 역할 전환 버튼 (OWNER / MAKER) |
| **App.tsx** | 라우트 `/project/:projectId`, `/workspace/:projectId/:makerId` |

### 2단계 Phase 2-A Day 5 (2026-03-02 완료)

| 항목 | 내용 |
|------|------|
| **ItemListPanel** | Maker의 Item 목록 (좌측) |
| **ReportListPanel** | 선택 Item의 Report 목록 (중앙) |
| **ReportDetailPanel** | Report 상세 (Attachments, RT Studies, Approval) |
| **Workspace** | ResizablePanelGroup 3-Panel 구조 |
| **makerId 없을 때** | 첫 번째 Maker 자동 사용 |

---

### 2단계 Phase 2-B Day 6 (2026-03-02 완료)

| 항목 | 내용 |
|------|------|
| **server/middleware/auth.ts** | authenticate, authorize, signToken, verifyToken |
| **POST /api/auth/login** | email/password → JWT + user |
| **GET /api/auth/me** | Bearer 토큰 → 현재 사용자 정보 |
| **.env.example** | JWT_SECRET 추가 |
| **api.ts** | login(), fetchMe() 함수 추가 |

---

## 2. 다음 단계 (Phase 2-B: 인증 + 핵심 기능)

### 2단계 Phase 2-B Day 7 (2026-03-02 완료)

| 항목 | 내용 |
|------|------|
| **AuthContext** | token, user, login, logout, localStorage |
| **Login.tsx** | 이메일/비밀번호 폼, 로그인 후 / 리다이렉트 |
| **ProtectedRoute** | 미인증 시 /login 리다이렉트 |
| **api.ts** | axios interceptor (Authorization Bearer) |
| **Layout** | useAuth 사용자명, 로그아웃 |
| **Dashboard** | user.role 기반 Owner/Maker 분기 |

---

### 2단계 Phase 2-B Day 8 (2026-03-02 완료)

| 항목 | 내용 |
|------|------|
| **server/lib/storage.ts** | MinIO S3 업로드, ensureBucket |
| **POST /api/reports** | Maker 전용, multer + MinIO, 다중 파일 |
| **GET /api/inspection-companies** | 검사기관 목록 |
| **ReportUploadForm** | 리포트 생성 폼 (Report No, Type, Company, Date, Files) |
| **ReportListPanel** | Maker용 "New" 버튼 |
| **Workspace** | ReportUploadForm 다이얼로그 연동 |

### 2단계 Phase 2-B Day 9 (2026-03-02 완료)

| 항목 | 내용 |
|------|------|
| **PdfViewer.tsx** | react-pdf, 페이지 넘김, 확대/축소 |
| **ReportDetailPanel** | reportType 분기: RT → RtStudies, non-RT → PdfViewer |

### 2단계 Phase 2-B Day 10 (2026-03-02 완료)

| 항목 | 내용 |
|------|------|
| **PATCH /api/reports/:id/approval** | Owner 전용, status(APPROVED/REJECTED), comment |
| **ApprovalControls.tsx** | Approve/Reject + 코멘트 → API 연동 |
| **ReportDetailPanel** | ApprovalControls 연동 |

---

## 4. 실행 방법

```bash
cd /Users/ykmin/Documents/code/x-hub/x-hub

# 1. Docker (DB, MinIO)
docker compose up -d

# 2. 개발 서버
npm run dev
```

→ http://localhost:3000

---

## 5. 참고 문서

- [X-Hub 2단계 설계 계획서 v2.0](./X-Hub%202단계%20설계%20계획서%20v2.0.md)
- [X-Hub 1단계 상세 개발 계획서](./X-Hub%201단계%20상세%20개발%20계획서.md)
- [work-log-2026-02-22](./work-log-2026-02-22.md)
