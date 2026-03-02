# X-Hub 프로젝트 개발 규칙

## 1. 프로젝트 목표 (Phase 1)

- **핵심 목표**: 제조사(Maker)가 NDT 리포트(PDF)를 업로드하고, 발주처(Owner)가 웹에서 원격으로 확인 및 승인하는 MVP(Minimum Viable Product)를 3주 안에 개발한다.
- **주요 기능**: RT 리포트 기능 완성, 범용 PDF 리포트 관리(PDF.js), 외부(Owner) 승인 워크플로우, Maker/Owner 역할 분리, PostgreSQL + Prisma 기반 DB 구축.

## 2. 기술 스택

- **Frontend**: Vite, React 19, TypeScript, TailwindCSS, Wouter, React Query, PDF.js
- **Backend**: Node.js, Express.js, TypeScript, Prisma
- **Database**: PostgreSQL
- **File Storage**: S3 호환 스토리지 (로컬에서는 MinIO)

## 3. 데이터 모델 (핵심 계층 구조)

```
Owner (발주처)
  └─ Project (프로젝트)
       └─ Item (검사 대상 제품/부품)
            └─ Report (NDT 검사 보고서)
                 └─ RtResultRow (RT 검사 결과 행, RT 리포트에만 존재)

InspectionCompany (검사 업체) → Report 에 연결
User (사용자, Role: OWNER | MAKER | ADMIN)
```

## 4. 코딩 스타일 및 원칙

- **상태 관리**: 서버 상태는 `@tanstack/react-query`를 사용하여 관리한다. 클라이언트 상태는 `useState`, `useContext`를 최소한으로 사용한다.
- **컴포넌트**: UI는 `shadcn/ui` 컴포넌트를 최대한 재활용한다. 기능별로 컴포넌트를 명확히 분리한다.
- **API 연동**: 모든 데이터는 API를 통해 비동기적으로 호출한다. `client/src/data/mockData.ts`는 더 이상 사용하지 않는다.
- **타입 정의**: Prisma 스키마를 기반으로 `shared/types.ts`에 모든 공유 타입을 정의하고, 프론트엔드와 백엔드에서 이를 임포트하여 사용한다.
- **에러 처리**: API 호출 시 발생할 수 있는 에러를 `ErrorBoundary`와 `react-query`의 에러 처리 메커니즘을 사용하여 견고하게 처리한다.
- **주석**: 복잡한 로직이나 중요한 결정 사항에는 간결한 주석을 추가한다.

## 5. 1단계 개발 범위 (In-Scope / Out-of-Scope)

**In-Scope (구현 대상)**:
- RT 리포트 기능 완성 (기존 3-Pane UI 유지, 실제 DB 연동)
- 기타 검사 유형(MT, UT, HT 등)은 PDF 업로드 + PDF.js 뷰어로 관리
- Owner가 웹에서 리포트를 확인하고 승인/반려하는 기능
- Maker/Owner 역할에 따른 UI 분기 처리
- JWT 기반 인증

**Out-of-Scope (1단계 제외)**:
- 검사 업체 내부의 다단계 승인 프로세스
- 리포트 자동 생성 기능
- MT, UT 등 각 검사 유형에 최적화된 상세 UI

## 6. 파일 구조 가이드

```
x-hub/
├── .cursor/
│   └── rules.md          ← 이 파일 (Cursor AI 지침)
├── client/
│   └── src/
│       ├── components/
│       │   ├── PdfViewer.tsx        ← 신규 (PDF.js 래퍼)
│       │   ├── ReportUploadForm.tsx ← 신규 (리포트 업로드 폼)
│       │   └── ApprovalControls.tsx ← 신규 (Owner 승인 UI)
│       ├── pages/
│       │   ├── Dashboard.tsx        ← 수정 (역할별 UI 분기)
│       │   └── Workspace.tsx        ← 수정 (reportType 분기)
│       └── data/
│           └── mockData.ts          ← 삭제 예정
├── server/
│   └── index.ts                     ← 수정 (API 라우터 추가)
├── shared/
│   └── types.ts                     ← 신규 (공유 타입 정의)
└── prisma/
    └── schema.prisma                ← 신규 (DB 스키마)
```
