# X-Hub 1단계 개발 실행 가이드 for Cursor

- **목표**: Cursor IDE의 AI 기능을 활용하여 X-Hub 1단계 개발을 3주 안에 효율적으로 완료합니다.
- **전제**: `x-hub` 프로젝트가 Cursor에서 열려 있고, `X-Hub_Phase1_Development_Plan.md` 파일이 프로젝트 루트에 존재합니다.

---

## 1. 사전 준비: Cursor에 프로젝트 맥락 알려주기

개발 시작 전, Cursor AI가 프로젝트의 목표와 규칙을 이해하도록 `.cursor/rules.md` 파일을 생성하고 아래 내용을 붙여넣으세요. 이 파일은 AI가 코드를 생성하거나 수정할 때마다 참고하는 최상위 지침서 역할을 합니다.

**파일 경로**: `.cursor/rules.md`

```markdown
# X-Hub 프로젝트 개발 규칙

## 1. 프로젝트 목표 (Phase 1)

- **핵심 목표**: 제조사(Maker)가 NDT 리포트(PDF)를 업로드하고, 발주처(Owner)가 웹에서 원격으로 확인 및 승인하는 MVP(Minimum Viable Product)를 3주 안에 개발한다.
- **주요 기능**: RT 리포트 기능 완성, 범용 PDF 리포트 관리(PDF.js), 외부(Owner) 승인 워크플로우, Maker/Owner 역할 분리, PostgreSQL + Prisma 기반 DB 구축.

## 2. 기술 스택

- **Frontend**: Vite, React 19, TypeScript, TailwindCSS, Wouter, React Query, PDF.js
- **Backend**: Node.js, Express.js, TypeScript, Prisma
- **Database**: PostgreSQL
- **File Storage**: S3 호환 스토리지 (로컬에서는 MinIO)

## 3. 코딩 스타일 및 원칙

- **상태 관리**: 서버 상태는 `react-query`를 사용하여 관리한다. 클라이언트 상태는 `useState`, `useContext`를 최소한으로 사용한다.
- **컴포넌트**: UI는 `shadcn/ui` 컴포넌트를 최대한 재활용한다. 기능별로 컴포넌트를 명확히 분리한다.
- **API 연동**: 모든 데이터는 API를 통해 비동기적으로 호출한다. `mockData.ts`는 사용하지 않는다.
- **타입 정의**: Prisma 스키마를 기반으로 `shared/types.ts`에 모든 공유 타입을 정의하고, 프론트엔드와 백엔드에서 이를 임포트하여 사용한다.
- **에러 처리**: API 호출 시 발생할 수 있는 에러를 `ErrorBoundary`와 `react-query`의 에러 처리 메커니즘을 사용하여 견고하게 처리한다.
- **주석**: 복잡한 로직이나 중요한 결정 사항에는 간결한 주석을 추가한다.
```

---

## 2. 주차별 개발 실행 계획 (Composer 프롬프트 가이드)

아래 계획에 따라 각 작업을 Cursor의 **Composer(Cmd+K)** 또는 **Chat** 기능을 사용하여 진행하세요. `@` 기호를 사용하여 파일이나 심볼을 AI의 컨텍스트에 포함시킬 수 있습니다.

### **1주차: DB 및 핵심 API 구축, 프론트엔드 리팩토링**

#### **Day 1: 백엔드 환경 설정**

1.  **Prisma 초기화 및 스키마 작성**
    -   **목표**: Prisma를 설정하고 `schema.prisma` 파일을 1단계 개발 계획서에 맞게 작성합니다.
    -   **터미널 실행**: `npm install prisma --save-dev && npx prisma init`
    -   **Composer (Cmd+K)** 프롬프트 (수정할 파일: `prisma/schema.prisma`):
        ```
        @X-Hub_Phase1_Development_Plan.md 의 "2. 1단계 데이터 모델 정의" 섹션을 참고하여 prisma schema 전체를 작성해줘.
        ```

2.  **Docker Compose 설정**
    -   **목표**: 로컬 개발을 위한 PostgreSQL, MinIO 컨테이너를 설정합니다.
    -   **Composer (Cmd+K)** 프롬프트 (생성할 파일: `docker-compose.yml`):
        ```
        PostgreSQL 15와 MinIO를 사용하는 docker-compose.yml 파일을 생성해줘. PostgreSQL의 데이터는 ./data/postgres에, MinIO의 데이터는 ./data/minio에 저장되도록 볼륨을 설정해줘. 환경변수 파일은 .env를 사용하도록 설정해줘.
        ```
    -   `.env` 파일에 DB 및 MinIO 접속 정보를 추가하세요.

#### **Day 2: 타입 정의 및 API 클라이언트 설정**

1.  **공유 타입 파일 생성**
    -   **목표**: Prisma 모델을 기반으로 프론트/백엔드에서 함께 사용할 TypeScript 타입을 정의합니다.
    -   **터미널 실행**: `npx prisma generate`
    -   **Composer (Cmd+K)** 프롬프트 (생성할 파일: `shared/types.ts`):
        ```
        @prisma/schema.prisma 파일을 참고해서, 각 모델(User, Project, Item, Report 등)에 대한 TypeScript 인터페이스를 생성해줘. Prisma에서 생성된 타입을 import하고 export하는 방식으로 작성해줘. 예를 들어, `import type { Project as PrismaProject } from '@prisma/client'; export type Project = PrismaProject;` 와 같이 작성해줘.
        ```

2.  **API 클라이언트 및 React Query 설정**
    -   **목표**: `axios`와 `react-query`를 설정하여 API 호출 기반을 마련합니다.
    -   **터미널 실행**: `cd client && npm install axios @tanstack/react-query`
    -   **Composer (Cmd+K)** 프롬프트 (수정할 파일: `client/src/main.tsx`):
        ```
        @tanstack/react-query 를 사용하여 QueryClientProvider를 설정하는 코드를 추가해줘.
        ```

#### **Day 3-4: 백엔드 핵심 API 구현**

1.  **Prisma 클라이언트 및 Express 서버 확장**
    -   **목표**: Express 서버에 Prisma 클라이언트를 연동하고, API 라우터를 설정합니다.
    -   **Composer (Cmd+K)** 프롬프트 (수정할 파일: `server/index.ts`):
        ```
        PrismaClient를 초기화하고, /api/projects, /api/items, /api/reports 경로에 대한 express 라우터를 설정하는 코드를 추가해줘. JSON body parser도 추가해줘.
        ```

2.  **프로젝트/아이템 API 구현**
    -   **목표**: 프로젝트와 아이템 목록/상세를 조회하는 API를 구현합니다.
    -   **Chat** 프롬프트 (참고할 파일: `server/index.ts`, `shared/types.ts`):
        ```
        @server/index.ts 에서 /api/projects 와 /api/projects/:id 에 대한 GET 요청 핸들러를 작성해줘. Prisma를 사용해서 DB에서 데이터를 조회하고, @shared/types.ts 에 정의된 타입을 사용해야 해.
        ```

#### **Day 5: 프론트엔드 리팩토링**

1.  **Mock Data 제거 및 API 연동**
    -   **목표**: 기존 `mockData.ts`를 사용하는 부분을 실제 API 호출로 변경합니다.
    -   **Composer (Cmd+K)** 프롬프트 (수정할 파일: `client/src/pages/Dashboard.tsx`):
        ```
        @client/src/data/mockData.ts 를 사용하는 부분을 제거하고, @tanstack/react-query의 useQuery를 사용해서 /api/projects API를 호출하여 프로젝트 목록을 가져오도록 수정해줘. 로딩 및 에러 상태도 처리해줘.
        ```
    -   `Workspace.tsx` 등 다른 페이지도 동일한 방식으로 수정하고, `mockData.ts` 파일을 최종적으로 삭제하세요.

---

### **2주차: 인증 및 핵심 기능 UI 구현**

#### **Day 6-7: 인증 및 권한 구현 (백엔드)**

1.  **로그인 API 및 JWT 발급**
    -   **목표**: 이메일/패스워드 기반 로그인 API를 만들고 JWT를 발급합니다.
    -   **Chat** 프롬프트 (참고할 파일: `server/index.ts`):
        ```
        bcrypt와 jsonwebtoken 라이브러리를 사용해서 /api/auth/login API 핸들러를 작성해줘. 사용자가 존재하면 비밀번호를 비교하고, 성공 시 userId와 role을 담은 JWT를 생성해서 반환해줘.
        ```

2.  **인증 미들웨어 구현**
    -   **목표**: API 요청 헤더의 JWT를 검증하는 Express 미들웨어를 구현합니다.
    -   **Chat** 프롬프트 (참고할 파일: `server/index.ts`):
        ```
        Express 미들웨어를 작성해줘. 이 미들웨어는 Authorization 헤더에서 Bearer 토큰을 추출하고 jsonwebtoken으로 검증한 뒤, 유효하면 request 객체에 user 정보를 추가해야 해. 특정 role만 접근 가능하도록 하는 옵션도 추가해줘.
        ```

#### **Day 8-9: 리포트 업로드 및 PDF 뷰어 구현 (프론트엔드)**

1.  **리포트 업로드 폼 생성**
    -   **목표**: PDF 파일과 관련 메타데이터를 입력받는 폼을 만듭니다.
    -   **Composer (Cmd+K)** 프롬프트 (생성할 파일: `client/src/components/ReportUploadForm.tsx`):
        ```
        @shadcn/ui 의 Input, Select, Button 컴포넌트와 react-hook-form을 사용하여 NDT 리포트를 업로드하는 폼을 만들어줘. PDF 파일을 선택하는 File Input과, reportNo, reportType, issuedDate, inspectionCompany 등을 입력하는 필드를 포함해줘. 폼 제출 시 POST /api/reports API를 호출해야 해.
        ```

2.  **PDF 뷰어 컴포넌트 생성**
    -   **목표**: `pdfUrl`을 받아 PDF를 렌더링하는 컴포넌트를 만듭니다.
    -   **터미널 실행**: `cd client && npm install react-pdf`
    -   **Composer (Cmd+K)** 프롬프트 (생성할 파일: `client/src/components/PdfViewer.tsx`):
        ```
        `react-pdf` 라이브러리를 사용하여 PDF를 렌더링하는 PdfViewer 컴포넌트를 만들어줘. `url` prop으로 PDF 파일 경로를 받고, 페이지 넘김, 확대/축소 기능을 포함해줘.
        ```

#### **Day 10: 워크스페이스 UI 분기 처리**

-   **목표**: 리포트 유형에 따라 RT 뷰 또는 PDF 뷰어를 동적으로 표시합니다.
-   **Composer (Cmd+K)** 프롬프트 (수정할 파일: `client/src/pages/Workspace.tsx`):
    ```
    @X-Hub_Phase1_Development_Plan.md 의 "4-나. 워크스페이스 UI 분기 로직" 섹션을 참고해서, 현재 선택된 리포트의 reportType에 따라 다른 컴포넌트를 렌더링하도록 수정해줘. reportType이 'RT'이면 기존 3-Pane 뷰를, 'OTHER'이면 방금 만든 @client/src/components/PdfViewer.tsx 를 보여주도록 해줘.
    ```

---

### **3주차: 승인 기능 및 최종 테스트**

#### **Day 11-12: 승인 기능 구현 (백엔드/프론트엔드)**

1.  **승인 API 구현 (백엔드)**
    -   **Chat** 프롬프트 (참고할 파일: `server/index.ts`):
        ```
        /api/reports/:id/approval 경로에 대한 PATCH 요청 핸들러를 작성해줘. 요청 본문으로 받은 status와 comment를 해당 리포트의 ownerApprovalStatus, ownerComment 필드에 업데이트해야 해. 이 API는 'OWNER' 역할을 가진 사용자만 호출할 수 있도록 인증 미들웨어를 적용해줘.
        ```

2.  **승인 UI 컴포넌트 구현 (프론트엔드)**
    -   **Composer (Cmd+K)** 프롬프트 (생성할 파일: `client/src/components/ApprovalControls.tsx`):
        ```
        'Approve', 'Reject' 버튼과 코멘트를 입력할 수 있는 Textarea로 구성된 승인 UI 컴포넌트를 만들어줘. 현재 로그인한 사용자의 역할이 'OWNER'일 때만 이 컴포넌트가 보이도록 해야 해. 버튼 클릭 시 PATCH /api/reports/:id/approval API를 호출하도록 구현해줘.
        ```

#### **Day 13-14: 역할 기반 UI 처리 및 통합 테스트**

-   **목표**: 사용자의 역할(Maker/Owner)에 따라 다른 UI/UX를 제공하고 전체 워크플로우를 테스트합니다.
-   **Chat** 프롬프트 (참고할 파일: `client/src/App.tsx`, `client/src/pages/Dashboard.tsx`):
    ```
    로그인 시 사용자 정보를 전역 상태(Context API 사용)로 관리하는 로직을 추가하고 싶어. 이 전역 상태를 사용해서, @client/src/pages/Dashboard.tsx 에서 Maker에게는 리포트 업로드 버튼을, Owner에게는 승인 대기 중인 리포트 목록을 보여주도록 UI를 분기 처리해줘.
    ```

#### **Day 15: 최종 검토 및 배포 준비**

-   전체 워크플로우(로그인 → 리포트 업로드 → PDF 뷰어 확인 → 승인/반려)를 E2E 관점에서 테스트합니다.
-   코드 전체를 대상으로 `Cmd+Shift+L`을 눌러 AI에게 코드 리뷰를 요청하고, 제안된 개선 사항을 반영합니다.
-   README 파일을 업데이트하여 로컬 환경 설정 및 실행 방법을 문서화합니다.

---

이 가이드를 따라 단계별로 진행하면, Cursor의 AI 기능을 최대한 활용하여 1단계 개발을 체계적이고 신속하게 완료할 수 있을 것입니다.
