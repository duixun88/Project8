# 전 세계 증권거래소 모니터링 시스템 - 완전 개발 가이드

## 🎯 시스템 개요

전 세계 15개 주요 증권거래소의 실시간 운영상태를 모니터링하는 React 기반 웹 애플리케이션입니다. 한국시간(KST) 기준으로 각 거래소의 개장/폐장 시간을 24시간 타임라인에 시각화하고, 500ms마다 자동 업데이트되는 실시간 시계 기능을 제공합니다.

### 🌟 주요 기능 목록

1. **실시간 모니터링**: 500ms 간격 자동 업데이트
2. **이중 보기 모드**: 카드 보기 ↔ 타임라인 보기 전환
3. **거래소 선택**: 왼쪽 설정 패널에서 원하는 거래소만 선택
4. **다크 모드**: 완전한 다크/라이트 테마 지원
5. **서머타임(DST) 지원**: 유럽/미주 거래소 서머타임 자동 적용
6. **점심시간 표시**: 도쿄/상하이/홍콩 거래소 점심휴장 주황색 표시
7. **알람 시스템**: 개장/폐장 알림 + 사운드 효과 + 팝업 알림
8. **3D 플립 카드**: 거래소 카드 클릭 시 상세정보 표시
9. **호버 툴팁**: DST 정보 및 GMT 오프셋 상세 정보
10. **반응형 디자인**: 모바일/태블릿/데스크톱 대응

---

## 📁 프로젝트 구조

```
/
├── App.tsx                    # 메인 애플리케이션
├── components/
│   ├── ExchangeCard.tsx       # 3D 플립 거래소 카드
│   ├── TimelineView.tsx       # 24시간 타임라인 뷰
│   ├── TimeIndicator.tsx      # 실시간 시간 표시기
│   ├── ExchangeSelector.tsx   # 거래소 선택 패널
│   ├── AlertSettings.tsx      # 알람 설정 패널
│   ├── AlertBanner.tsx        # 상단 알람 배너
│   ├── AlertPopup.tsx         # 팝업 알림
│   └── ui/                    # shadcn/ui 컴포넌트들
├── data/
│   └── exchanges.ts           # 거래소 데이터
├── types/
│   ├── exchange.ts            # 거래소 타입 정의
│   └── alert.ts              # 알람 타입 정의
├── utils/
│   ├── timeUtils.ts           # 시간 계산 유틸리티
│   └── alertSounds.ts         # 알람 사운드 매니저
└── styles/
    └── globals.css            # Tailwind V4 스타일
```

---

## 🏗️ 세부 구현 요구사항

### 1. 거래소 데이터 구조 (data/exchanges.ts)

```typescript
export interface Exchange {
  id: string;                    // 'krx', 'nyse' 등
  name: string;                  // 영문명
  nameKr: string;                // 한글명
  country: string;               // 국가명
  timezone: string;              // IANA timezone
  gmtOffset: number;             // GMT 오프셋 (시간)
  openTime: string;              // "09:00" 형식
  closeTime: string;             // "15:30" 형식
  region: 'asia' | 'europe' | 'americas';
  lunchBreak?: {                 // 점심휴장 (선택)
    start: string;               // "11:30"
    end: string;                 // "13:00"
  };
  dst?: {                        // 서머타임 정보 (선택)
    startMonth: number;          // 시작 월 (1-12)
    startWeek: number;           // 시작 주 (1-5, -1=마지막주)
    startDay: number;            // 시작 요일 (0=일요일)
    endMonth: number;            // 종료 월
    endWeek: number;             // 종료 주
    endDay: number;              // 종료 요일
    offsetDiff: number;          // DST 오프셋 차이 (+1)
  };
  specialInfo: {
    features: string[];          // 특징들
    tradingCurrency: string;     // 거래통화
    settlementCycle: string;     // 결제주기
    website: string;             // 웹사이트
  };
}
```

### 2. 필수 거래소 15개

**아시아 (7개)**
1. KRX (한국거래소) - GMT+9, 09:00-15:30
2. TSE (도쿄증권거래소) - GMT+9, 09:00-15:00, 점심: 11:30-12:30
3. SSE (상하이증권거래소) - GMT+8, 09:30-15:00, 점심: 11:30-13:00
4. SZSE (선전증권거래소) - GMT+8, 09:30-15:00, 점심: 11:30-13:00
5. HKEX (홍콩거래소) - GMT+8, 09:30-16:00, 점심: 12:00-13:00
6. NSE (인도 봄베이거래소) - GMT+5.5, 09:15-15:30
7. ASX (호주증권거래소) - GMT+10, 10:00-16:00

**유럽 (5개) - 모두 DST 적용**
8. LSE (런던증권거래소) - GMT+0/+1, 08:00-16:30
9. Euronext Paris - GMT+1/+2, 09:00-17:30
10. XETRA (프랑크푸르트) - GMT+1/+2, 09:00-17:30
11. SIX (스위스거래소) - GMT+1/+2, 09:00-17:30
12. Borsa Italiana - GMT+1/+2, 09:00-17:30

**미주 (3개) - 모두 DST 적용**
13. NYSE (뉴욕증권거래소) - GMT-5/-4, 09:30-16:00
14. NASDAQ - GMT-5/-4, 09:30-16:00
15. TSX (토론토증권거래소) - GMT-5/-4, 09:30-16:00

### 3. 서머타임(DST) 규칙

**유럽**: 3월 마지막 일요일 ~ 10월 마지막 일요일
**미주**: 3월 둘째 일요일 ~ 11월 첫째 일요일

```typescript
// 유럽 DST 설정
dst: {
  startMonth: 3,      // 3월
  startWeek: -1,      // 마지막 주
  startDay: 0,        // 일요일
  endMonth: 10,       // 10월
  endWeek: -1,        // 마지막 주
  endDay: 0,          // 일요일
  offsetDiff: 1       // +1시간
}

// 미주 DST 설정
dst: {
  startMonth: 3,      // 3월
  startWeek: 2,       // 둘째 주
  startDay: 0,        // 일요일
  endMonth: 11,       // 11월
  endWeek: 1,         // 첫째 주
  endDay: 0,          // 일요일
  offsetDiff: 1       // +1시간
}
```

### 4. 시간 계산 로직 (utils/timeUtils.ts)

**핵심 함수들:**

```typescript
// 현재 KST 시간 구하기
export function getCurrentKSTTime(): Date

// DST 적용 여부 확인
export function isDSTActive(exchange: Exchange, currentDate: Date): boolean

// DST를 고려한 현재 GMT 오프셋
export function getCurrentGmtOffset(exchange: Exchange, currentDate: Date): number

// 거래소 상태 계산 (개장/점심휴장/폐장)
export function getExchangeStatus(exchange: Exchange, kstTime: Date): ExchangeStatus

// 알람 감지
export function getUpcomingAlertsWithSettings(
  exchanges: Exchange[], 
  alertSettings: AlertSettings[], 
  kstTime: Date
): AlertInfo[]
```

### 5. UI 컴포넌트 요구사항

#### TimelineView.tsx
- **24시간 타임라인**: 0-24시 눈금 표시
- **거래시간 막대**: 초록색 막대로 표시
- **점심휴장**: 주황색 오버레이
- **현재 시간**: 빨간 점선 + 애니메이션
- **GMT 오프셋**: DST 적용 시 파란색 + * 표시
- **DST 아이콘**: ☀️ (서머타임), 🌙 (비서머타임)
- **호버 툴팁**: shadcn/ui Tooltip 컴포넌트 사용

#### ExchangeCard.tsx
- **3D 플립 효과**: 클릭 시 앞면 ↔ 뒷면 전환
- **앞면**: 기본 정보 + 상태 표시
- **뒷면**: 상세 정보 (특징, 통화, 결제주기 등)
- **상태 표시**: 개장(초록)/점심휴장(주황)/폐장(회색) 점
- **CSS Transform**: rotateY(180deg) 사용

#### 알람 시스템
- **AlertSettings.tsx**: 거래소별 개장/폐장 알람 설정
- **AlertBanner.tsx**: 상단 알람 배너 (활성 알람 표시)
- **AlertPopup.tsx**: 팝업 알림 (우측 하단)
- **사운드**: 개장/폐장 각각 다른 사운드

### 6. 상태 관리

```typescript
// App.tsx 핵심 상태들
const [currentTime, setCurrentTime] = useState<Date>(getCurrentKSTTime());
const [exchangeStatuses, setExchangeStatuses] = useState<ExchangeStatus[]>([]);
const [selectedExchanges, setSelectedExchanges] = useState<string[]>([]);
const [viewMode, setViewMode] = useState<'cards' | 'timeline'>('timeline');
const [isDarkMode, setIsDarkMode] = useState(false);
const [alertSettings, setAlertSettings] = useState<AlertSettings[]>([]);
const [alertPopups, setAlertPopups] = useState<AlertPopup[]>([]);
```

**LocalStorage 저장 항목:**
- selectedExchanges
- darkMode
- alertSettings
- soundEnabled
- viewMode

### 7. 스타일링 가이드

**Tailwind V4 사용**
- CSS 변수 기반 테마 시스템
- 다크 모드: `.dark` 클래스 토글
- 반응형: md:, lg:, xl: 브레이크포인트
- 애니메이션: animate-pulse, animate-ping 등

**컬러 스키마:**
- 아시아: text-blue-700/400
- 유럽: text-green-700/400  
- 미주: text-orange-700/400
- 개장: bg-green-500
- 점심휴장: bg-orange-400
- 폐장: bg-gray-400
- 현재시간: bg-red-500
- DST 적용: text-blue-600/400

### 8. 성능 최적화 요구사항

1. **업데이트 주기**: 500ms (setInterval)
2. **메모이제이션**: React.memo 사용 권장
3. **지연 로딩**: 필요시 React.lazy 적용
4. **상태 최적화**: 불필요한 리렌더링 방지

### 9. 접근성 요구사항

1. **키보드 네비게이션**: Tab 순서 올바르게 설정
2. **ARIA 라벨**: 시각적 요소에 적절한 라벨
3. **색상 대비**: WCAG 2.1 AA 준수
4. **스크린 리더**: 상태 변화 알림

### 10. 브라우저 지원

- **최신 버전**: Chrome, Firefox, Safari, Edge
- **모바일**: iOS Safari, Chrome Mobile
- **기능**: ES2020+, CSS Grid, Flexbox

---

## 🚀 개발 단계별 가이드

### Phase 1: 기본 구조
1. 타입 정의 (exchange.ts, alert.ts)
2. 거래소 데이터 (exchanges.ts)
3. 시간 유틸리티 (timeUtils.ts)
4. 기본 UI 컴포넌트

### Phase 2: 핵심 기능
1. 실시간 업데이트 로직
2. 카드 보기 구현
3. 타임라인 보기 구현
4. 거래소 선택 기능

### Phase 3: 고급 기능
1. DST 계산 로직
2. 알람 시스템
3. 3D 플립 카드
4. 다크 모드

### Phase 4: UX 개선
1. 호버 툴팁
2. 애니메이션
3. 반응형 디자인
4. 성능 최적화

---

## 🔧 개발 팁

1. **시간대 처리**: moment.js 대신 native Date API 사용
2. **DST 계산**: 매년 정확한 날짜 계산 필요
3. **상태 동기화**: localStorage와 상태 일치 유지
4. **에러 핸들링**: 시간 계산 오류 대응
5. **테스트**: 다양한 시간대와 DST 전환일 테스트

---

## 📚 의존성

**필수 패키지:**
- React 18+
- TypeScript
- Tailwind CSS V4
- @shadcn/ui components
- Lucide React (아이콘)

**선택 패키지:**
- Motion/React (애니메이션)
- React Hook Form (폼 관리)

---

이 가이드를 따라 개발하면 완전히 동일한 기능을 가진 전 세계 증권거래소 모니터링 시스템을 구축할 수 있습니다.