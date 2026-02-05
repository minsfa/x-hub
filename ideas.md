# X-Hub 비대면 승인 시스템 디자인 아이디어

## 프로젝트 개요
NDT (Non-Destructive Testing) 검사 데이터를 관리하고 비대면으로 승인하는 산업용 시스템

---

<response>
<text>
## Idea 1: Industrial Precision (산업용 정밀 기기 디자인)

### Design Movement
독일 산업 디자인(Braun/Dieter Rams)과 계측기 UI의 결합. 정밀함과 신뢰성을 시각적으로 전달.

### Core Principles
1. **Functional Clarity**: 모든 요소가 명확한 목적을 가짐. 장식적 요소 최소화
2. **Data Density**: 한 화면에 최대한 많은 정보를 효율적으로 배치
3. **Status Visibility**: 상태 정보가 항상 눈에 띄게 표시 (계측기의 LED 인디케이터처럼)
4. **Grid Precision**: 엄격한 8px 그리드 시스템

### Color Philosophy
- **Primary**: #1A1A2E (깊은 네이비 블랙) - 신뢰성과 전문성
- **Accent**: #E94560 (경고 레드) - 승인 대기 알림
- **Success**: #0F9D58 (산업용 그린) - 승인 완료
- **Surface**: #16213E (다크 블루 그레이) - 패널 배경
- **Text**: #EAEAEA (밝은 회색) - 가독성

### Layout Paradigm
- 좌측 고정 사이드바 (네비게이션)
- 우측 메인 컨텐츠 영역
- 상단 고정 헤더 (시스템 상태 표시)
- 카드 기반 그리드 레이아웃

### Signature Elements
1. **LED-style Status Dots**: 작은 원형 인디케이터로 상태 표시
2. **Beveled Panels**: 미세한 입체감을 주는 패널 테두리
3. **Monospace Numbers**: 숫자는 모노스페이스 폰트로 정렬

### Interaction Philosophy
- 즉각적인 피드백 (클릭 시 미세한 눌림 효과)
- 최소한의 애니메이션 (0.15s 이하)
- 호버 시 미세한 밝기 변화

### Animation
- 상태 변경 시 0.2s ease-out 트랜지션
- 알림 뱃지 pulse 애니메이션 (1.5s 주기)
- 패널 전환 시 fade (0.15s)

### Typography System
- **Display**: Inter Bold (제목)
- **Body**: Inter Regular (본문)
- **Data**: JetBrains Mono (숫자, 코드)
</text>
<probability>0.08</probability>
</response>

---

<response>
<text>
## Idea 2: Technical Blueprint (설계 도면 스타일)

### Design Movement
건축/엔지니어링 청사진(Blueprint)과 CAD 소프트웨어의 미학. 기술 문서의 정밀함을 웹으로 재해석.

### Core Principles
1. **Blueprint Aesthetic**: 청사진의 그리드와 라인 스타일 차용
2. **Layered Information**: 정보를 레이어처럼 겹쳐서 표현
3. **Technical Annotation**: 데이터에 기술적 주석 스타일 적용
4. **Structured Hierarchy**: 명확한 정보 계층 구조

### Color Philosophy
- **Primary**: #0A1628 (딥 네이비) - 청사진 배경
- **Grid Lines**: #1E3A5F (청사진 그리드)
- **Accent**: #00D4FF (시안) - 활성 요소, 하이라이트
- **Alert**: #FF4757 (레드) - 경고, 대기 상태
- **Success**: #2ED573 (그린) - 승인 완료
- **Text Primary**: #FFFFFF
- **Text Secondary**: #8892A0

### Layout Paradigm
- 전체 화면을 그리드 라인으로 구획
- 좌측에서 우측으로 흐르는 3-Pane 구조
- 각 패널이 독립적인 "도면 시트"처럼 작동
- 상단에 프로젝트 정보 바 (도면 타이틀 블록처럼)

### Signature Elements
1. **Grid Overlay**: 미세한 그리드 라인이 배경에 표시
2. **Corner Markers**: 패널 모서리에 L자 마커
3. **Dimension Lines**: 섹션 구분에 치수선 스타일 적용

### Interaction Philosophy
- 선택된 요소에 글로우 효과
- 드래그 가능한 패널 경계선
- 키보드 단축키 중심 네비게이션

### Animation
- 패널 확장/축소 시 슬라이드 (0.3s ease-in-out)
- 선택 시 테두리 글로우 펄스
- 데이터 로딩 시 스캔라인 효과

### Typography System
- **Display**: Rajdhani Bold (기술적 느낌의 산세리프)
- **Body**: IBM Plex Sans (가독성 높은 기술 폰트)
- **Data**: IBM Plex Mono (숫자, 코드)
</text>
<probability>0.07</probability>
</response>

---

<response>
<text>
## Idea 3: Clean Professional (클린 프로페셔널)

### Design Movement
스칸디나비안 미니멀리즘과 현대 SaaS 대시보드의 결합. 깔끔하고 효율적인 비즈니스 도구.

### Core Principles
1. **Whitespace as Structure**: 여백을 적극적으로 활용하여 구조 형성
2. **Soft Depth**: 부드러운 그림자로 레이어 구분
3. **Color Restraint**: 색상을 절제하여 중요 정보 강조
4. **Readable Data**: 데이터 가독성 최우선

### Color Philosophy
- **Background**: #F8FAFC (밝은 그레이)
- **Surface**: #FFFFFF (카드 배경)
- **Primary**: #0F172A (다크 슬레이트) - 텍스트, 중요 요소
- **Accent**: #3B82F6 (블루) - 인터랙티브 요소
- **Alert**: #EF4444 (레드) - 승인 대기
- **Success**: #22C55E (그린) - 승인 완료
- **Border**: #E2E8F0 (연한 그레이)

### Layout Paradigm
- 카드 기반 대시보드
- 상단 네비게이션 바
- 반응형 그리드 (4열 → 2열 → 1열)
- 충분한 패딩과 여백

### Signature Elements
1. **Soft Cards**: 둥근 모서리(12px)와 부드러운 그림자
2. **Status Pills**: 캡슐 형태의 상태 뱃지
3. **Progress Bars**: 얇고 둥근 진행률 바

### Interaction Philosophy
- 호버 시 카드 살짝 떠오르는 효과
- 부드러운 색상 전환
- 명확한 포커스 상태

### Animation
- 페이지 전환 시 fade-in (0.2s)
- 카드 호버 시 translateY(-2px) + shadow 증가
- 버튼 클릭 시 scale(0.98)

### Typography System
- **Display**: Plus Jakarta Sans Bold (현대적 산세리프)
- **Body**: Plus Jakarta Sans Regular
- **Data**: Plus Jakarta Sans Medium (숫자)
</text>
<probability>0.06</probability>
</response>

---

## 선택된 디자인: Industrial Precision (Idea 1)

### 선택 이유
1. **산업 도메인 적합성**: NDT 검사 시스템은 산업용 소프트웨어로, 계측기/정밀기기 느낌이 사용자에게 신뢰감을 줌
2. **데이터 밀도 지원**: 많은 정보를 효율적으로 표시해야 하는 요구사항에 적합
3. **Alert 중심 설계**: 승인 대기 건수를 강조하는 UI 요구사항과 LED 인디케이터 스타일이 잘 맞음
4. **다크 테마**: 장시간 사용하는 전문가용 도구에 적합한 눈의 피로 감소

### 구현 세부사항
- Dark Theme 기본 적용
- 좌측 사이드바 네비게이션
- 상태 표시에 LED 스타일 도트 사용
- 숫자 데이터에 모노스페이스 폰트 적용
- 승인 대기 알림에 pulse 애니메이션 적용
