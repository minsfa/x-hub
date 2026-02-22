# X-Hub Mockup 디자인 아이디어

## 배경
X-Hub는 NDT(비파괴검사) 리포트 관리 시스템으로, 산업 현장의 품질 관리 업무를 위한 내부 도구입니다.
사용자는 제조사(Maker)와 발주처(Owner)로 나뉘며, 각자 다른 목적으로 시스템을 사용합니다.

---

<response>
<text>
## Approach A: Industrial Precision Dark

**Design Movement**: Bauhaus Industrial + Data Terminal Aesthetic
**Probability**: 0.07

**Core Principles**:
1. 정보 밀도 최우선 — 공간 낭비 없이 최대한 많은 데이터를 한 화면에 표시
2. 상태 중심 색상 — 승인(녹색), 반려(적색), 대기(황색)가 UI의 핵심 언어
3. 격자 기반 레이아웃 — 좌측 사이드바 + 3-Pane 분할 구조
4. 기계적 정밀함 — 둥근 모서리 최소화, 선명한 경계선

**Color Philosophy**: 
- 배경: 짙은 네이비 블랙 (#0a0f1e)
- 패널: 다크 슬레이트 (#111827)
- 강조: 일렉트릭 블루 (#3b82f6)
- 알림: 앰버 (#f59e0b), 레드 (#ef4444), 그린 (#10b981)

**Layout Paradigm**: 
- 좌측 고정 사이드바 (프로젝트 트리)
- 중앙 3-Pane 분할 (Report → Study → Image)
- 우측 상세 패널 (승인 컨트롤)

**Signature Elements**:
- LED 상태 인디케이터 (점멸 효과)
- 모노스페이스 폰트 for 리포트 번호/코드
- 데이터 테이블의 얇은 구분선

**Interaction Philosophy**: 클릭 → 즉각 반응, 호버 시 행 하이라이트
**Animation**: 패널 슬라이드인, 상태 변경 시 색상 전환
**Typography**: JetBrains Mono (코드) + Inter (UI)
</text>
<probability>0.07</probability>
</response>

<response>
<text>
## Approach B: Clean Technical Light (선택)

**Design Movement**: Swiss Grid System + Technical Documentation Aesthetic
**Probability**: 0.08

**Core Principles**:
1. 명확한 계층 구조 — 프로젝트 > 아이템 > 리포트의 트리 구조를 시각적으로 명확히 표현
2. 데이터 우선 — 차트, 배지, 진행률 바로 현황을 즉각 파악
3. 역할 기반 색상 구분 — Maker(파란색 계열), Owner(인디고 계열)로 역할 구분
4. 기능적 미니멀리즘 — 불필요한 장식 제거, 기능에 집중

**Color Philosophy**:
- 배경: 쿨 화이트 (#f8fafc)
- 사이드바: 슬레이트 (#1e293b)
- Primary: 스틸 블루 (#2563eb)
- 상태 색상: 그린(승인), 레드(반려), 앰버(대기), 그레이(초안)

**Layout Paradigm**:
- 좌측 고정 다크 사이드바 (네비게이션 + 프로젝트 목록)
- 우측 메인 콘텐츠 영역 (페이지별 레이아웃)
- 대시보드: 통계 카드 + 프로젝트 그리드
- 워크스페이스: 3-Pane 분할 (Report List | Detail | PDF/Image Viewer)

**Signature Elements**:
- 상태 배지 (색상 코딩된 pill 형태)
- 진행률 바 (프로젝트별 완료율)
- 역할 전환 스위처 (Maker ↔ Owner 뷰 전환)

**Interaction Philosophy**: 
- 클릭 시 선택 상태 명확히 표시
- 승인/반려 시 확인 다이얼로그
- 업로드 진행 상태 실시간 표시

**Animation**: 페이지 전환 페이드, 카드 호버 섀도우 증가
**Typography**: IBM Plex Sans (UI) + IBM Plex Mono (코드/번호)
</text>
<probability>0.08</probability>
</response>

<response>
<text>
## Approach C: Compact Data Grid

**Design Movement**: Bloomberg Terminal + Enterprise Dashboard
**Probability**: 0.06

**Core Principles**:
1. 정보 압축 — 최소 공간에 최대 정보
2. 색상 코딩 시스템 — 모든 상태를 색상으로 즉각 인지
3. 키보드 중심 — 마우스 없이도 모든 작업 가능
4. 실시간 업데이트 감각 — 데이터가 살아있는 느낌

**Color Philosophy**:
- 배경: 미드나잇 블루 (#0f172a)
- 데이터 그리드: 짙은 회색 (#1e293b)
- 강조: 네온 그린 (#22c55e), 사이언 (#06b6d4)

**Layout Paradigm**:
- 전체 화면 그리드 레이아웃
- 탭 기반 멀티 뷰
- 압축된 데이터 테이블

**Signature Elements**:
- 고밀도 데이터 테이블
- 실시간 카운터 애니메이션
- 컴팩트 필터 바

**Interaction Philosophy**: 빠른 필터링, 대량 선택/처리
**Animation**: 숫자 카운트업, 그리드 정렬 애니메이션
**Typography**: Space Mono + DM Sans
</text>
<probability>0.06</probability>
</response>

---

## 선택: Approach B — Clean Technical Light

산업 현장의 품질 관리 담당자가 주 사용자인 점을 고려하여, 데이터를 명확하게 파악할 수 있는 Clean Technical Light 스타일을 선택합니다.
좌측 다크 사이드바와 우측 라이트 콘텐츠 영역의 대비가 역할 전환(Maker/Owner)을 직관적으로 표현하며,
IBM Plex 폰트 패밀리가 기술 문서 특유의 신뢰감을 부여합니다.
