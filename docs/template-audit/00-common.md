# 00. 횡단 이슈 — 11개 템플릿 전부에 영향

이 문서의 항목은 **템플릿 데이터가 아니라 렌더링 코드**에서 나온다. 여기 1건을 고치면 11개 템플릿이 동시에 개선된다. 배치 1로 먼저 처리할 것을 권한다.

렌더링은 공개 초대장(`/i/[slug]`)·미리보기(`/templates/[id]`)·에디터가 **모두 `src/components/editor/PreviewPane.tsx` 하나**를 공유한다. 따라서 이 파일의 하드코딩이 곧 전 서비스의 하드코딩이다.

---

## C-1. 인사말 서명이 "신랑 · 신부" (P0)

### 현상

웨딩이 아닌 템플릿에서도 인사말 맨 아래에 **`신랑 · 신부`** 가 찍힌다.

실제 확인된 템플릿 — 돌잔치, 비즈 세미나, 신제품 런칭, 오픈 테니스 컵, VIP 나이트, 송년회 (6개).
"2026 Annual Business Forum에 모십니다 … 자리를 빛내 주시면 감사하겠습니다." 아래에 `신랑 · 신부` 가 붙는다.

### 원인

`src/components/editor/PreviewPane.tsx:237-238, 248`

```tsx
const groomName = `${groom.last ?? '신'}${groom.first ?? '랑'}`   // → '신랑'
const brideName = `${bride.last ?? '신'}${bride.first ?? '부'}`   // → '신부'
...
const author = content.greetingAuthor ?? `${first} · ${second}`
```

`content.groom` / `content.bride` 가 비어 있으면 글자 단위 fallback 으로 "신랑"·"신부"가 조립된다. 비웨딩 템플릿은 이 필드를 채우지 않으므로 항상 이 값이 나온다.

### 수정안

```tsx
// as-is
const author = content.greetingAuthor ?? `${first} · ${second}`
const authorVisible = content.greetingAuthorVisible !== false

// to-be — 커플 이름이 실제로 있을 때만 자동 서명
const hasCouple = Boolean(content.groom?.first || content.bride?.first)
const author = content.greetingAuthor ?? (hasCouple ? `${first} · ${second}` : '')
const authorVisible = content.greetingAuthorVisible !== false && Boolean(author)
```

동시에 각 템플릿 seed 에 주최자 서명을 명시한다.

| 템플릿 | `greetingAuthor` |
|---|---|
| 비즈 세미나 | `주최 · 오픈데이 파트너스` |
| 신제품 런칭 | `PRESTIGE` |
| 오픈 테니스 컵 | `대회 운영위원회` |
| VIP 나이트 | `호스트 드림` |
| 송년회 | `드림` |
| 돌잔치 | `아빠 · 엄마 드림` (또는 `시안이 부모 드림`) |

---

## C-2. 공유 버튼이 "청첩장 주소 복사하기" (P0)

### 현상

**11개 전부**, 부고 · 추모 안내에서까지 하단 공유 버튼이 `청첩장 주소 복사하기` 로 나온다.

### 원인

`src/components/editor/PreviewPane.tsx:1948-1953` — 문자열이 완전 하드코딩.

```tsx
<button className="w-full py-3 rounded-xl text-xs font-medium" style={{ backgroundColor: '#FAE100', color: '#3A1D1D' }}>
  카카오톡으로 공유하기
</button>
<button className="w-full py-3 rounded-xl text-xs border border-gray-200 text-gray-600">
  청첩장 주소 복사하기
</button>
```

### 수정안

1. 기본 문구를 **`초대장 주소 복사하기`** 로 변경.
2. 카테고리별 오버라이드를 허용한다. `PreviewPane` 은 이미 `categorySlug` 를 store 에서 접근할 수 있다.

| 카테고리 | 복사 버튼 | 카카오 버튼 |
|---|---|---|
| wedding | 청첩장 주소 복사하기 | 카카오톡으로 공유하기 |
| memorial | **부고 주소 복사하기** | **카카오톡으로 알리기** |
| business / sports / culture | 초대장 주소 복사하기 | 카카오톡으로 공유하기 |
| 그 외 | 초대장 주소 복사하기 | 카카오톡으로 공유하기 |

3. **부고에서는 카카오 브랜드 노란색(`#FAE100`)을 쓰지 않는다.** 조문 상황에서 형광 노랑 CTA 는 부적절하다. memorial 카테고리는 아웃라인 버튼 + 테마 accent 로 대체한다. (→ 11번 문서 M-2)

---

## C-3. 방명록 샘플에 내부 문구 노출 (P0)

### 현상

11개 전부, 방명록 첫 카드에

```
from. 샘플 방명록
이 방명록은 미리보기용 예시입니다.
에디터에서는 실제 데이터 대신 이렇게 샘플로 표시됩니다.
2026-01-01 00:00
```

**"에디터"** 라는 내부 용어가 공개 미리보기 페이지에 그대로 노출된다. 게다가 부고의 "추모의 글" 자리에도 이 문구가 들어간다.

### 원인

`src/components/editor/PreviewPane.tsx:1163-1164`

### 수정안

카테고리에 맞는 자연스러운 예시 방명록으로 교체하고, 문구에서 "에디터"를 제거한다.

| 카테고리 | from | message |
|---|---|---|
| wedding | 대학 동기 지원 | `두 분 결혼 진심으로 축하해! 오래오래 행복하길 :)` |
| baby | 이모 | `시안이 벌써 한 살이라니. 건강하게만 자라렴!` |
| birthday | 민수 | `생일 축하해! 그날 꼭 갈게 :)` |
| education | 담임 선생님 | `졸업 축하합니다. 앞날에 좋은 일만 가득하길.` |
| business | 김지훈 팀장 | `초대 감사합니다. 당일 참석하겠습니다.` |
| sports | 코트 메이트 | `올해도 참가합니다! 좋은 경기 해요.` |
| social / seasonal | 준영 | `초대 고마워요. 그날 봬요!` |
| culture | 관람객 | `조용히 오래 머물다 갑니다. 좋은 전시 감사합니다.` |
| memorial | 고인의 벗 | `삼가 고인의 명복을 빕니다. 유가족께 위로의 말씀을 전합니다.` |

날짜도 `2026-01-01 00:00` 같은 명백한 더미 대신 **행사일 기준 상대 날짜**(예: 3일 전)로 계산한다.

---

## C-4. 다크 테마에서 카드·버튼이 흰색으로 뚫림 (P0 — VIP 나이트)

### 현상

VIP 나이트(`bgColor #142339`)에서

- 지도 하단 **네이버지도 / 티맵 / 카카오맵 버튼 3개가 순백 카드**
- **방명록 샘플 카드가 순백**
- 하단 **"청첩장 주소 복사" 버튼 테두리가 `border-gray-200`**, 텍스트가 `text-gray-600` 이라 배경에 묻힘
- 섹션 구분선이 `border-gray-200` 이라 다크 배경에서 밝은 줄로 튐

즉 다크 템플릿에서 화면 절반이 라이트 테마 잔재다.

### 원인

`PreviewPane.tsx` 안에 `bg-white` 13곳, `border-gray-200` / `text-gray-600` 다수가 하드코딩. 대표 위치:

| 라인 | 대상 |
|---|---|
| 385 | 지도 앱 버튼 (`NavButton`) |
| 506, 549 | 프로필 / 인터뷰 카드 |
| 634 | 타임라인 카드 |
| 744 | 폴라로이드 카드 |
| 1226 | 방명록 엔트리 |
| 1321, 1341 | 계좌 아코디언 |
| 1420 | 연락처 카드 |
| 1581 | 폴라로이드 |
| 1916 | 커버 캡션 바 |
| 1948-1952 | 공유 버튼 / 푸터 |

### 수정안

**표면(surface) 토큰을 도입한다.** `styles.bgColor` 의 명도로 라이트/다크를 판정하고 CSS 변수로 내려보낸다.

```tsx
// PreviewPane 최상단 컨테이너
function relativeLuminance(hex: string) { /* sRGB → 상대 휘도 */ }
const isDark = relativeLuminance(bgColor) < 0.4

const surfaceVars = isDark
  ? { '--od-surface': 'rgba(255,255,255,0.06)',
      '--od-surface-border': 'rgba(255,255,255,0.14)',
      '--od-text': '#e8eaee',
      '--od-text-muted': 'rgba(232,234,238,0.62)',
      '--od-divider': 'rgba(255,255,255,0.12)' }
  : { '--od-surface': '#ffffff',
      '--od-surface-border': '#f3f4f6',
      '--od-text': '#374151',
      '--od-text-muted': '#9ca3af',
      '--od-divider': '#e5e7eb' }
```

그리고 `bg-white` → `bg-[var(--od-surface)]`, `border-gray-200` → `border-[var(--od-divider)]`, `text-gray-600` → `text-[var(--od-text)]` 로 일괄 치환.

지도 앱 버튼 3개는 브랜드 아이콘이 컬러라 다크에서도 식별되므로 **배경만 반투명 표면**으로 바꾸면 충분하다.

> 대안(빠른 우회): `themeConfig` 에 `surface: 'light' | 'dark'` 를 추가하고 seed 에서 명시. 자동 판정보다 예측 가능하지만 사용자가 에디터에서 배경색을 바꿨을 때 따라가지 못한다. **자동 판정 + `themeConfig` 오버라이드** 조합을 권한다.

---

## C-5. 지도가 라이트 스킨 고정 (P1)

### 현상

VIP 나이트의 깊은 네이비 화면 한가운데에 **네이버 지도 기본 라이트 스킨**이 밝게 떠 있다. 카페·은행 POI 아이콘까지 컬러로 표시돼 시선을 다 뺏는다.

### 원인

`src/components/shared/NaverMap.tsx` — 테마 관련 prop 이 아예 없다.

```tsx
const map = new window.naver.maps.Map(mapRef.current, {
  center, zoom: 16, scaleControl: false, mapDataControl: false, logoControl: false,
})
```

### 수정안

Naver Maps JS v3 는 무료 등급에서 커스텀 다크 스타일(`customStyleId`)을 제공하지 않는다. 실무적으로 가능한 선택지는 셋이다.

**(A) CSS 필터 — 권장.** 구현 비용이 가장 낮고 즉시 반영된다.

```tsx
interface Props { /* ... */ theme?: 'light' | 'dark' }

<div
  ref={mapRef}
  className="naver-map-container"
  style={{
    width: '100%', height, position: 'relative', overflow: 'hidden',
    filter: theme === 'dark'
      ? 'invert(0.92) hue-rotate(180deg) saturate(0.75) brightness(0.95) contrast(1.05)'
      : undefined,
  }}
/>
```

주의 — 필터는 마커에도 걸리므로 마커 색이 반전된다. 마커는 `naver.maps.Marker` 의 `icon` 에 커스텀 SVG(테마 accent 색)를 지정하고 필터를 상쇄하는 색으로 넣거나, 마커를 지도 위 별도 오버레이 레이어로 올려 필터 밖에 둔다.

**(B) 정적 지도 이미지 + 오버레이 틴트.** Static Map API 로 받은 이미지 위에 `mix-blend-mode: multiply` 로 테마 색을 얹는다. 인터랙션은 포기하되 렌더가 완벽히 통제된다. 어차피 아래에 네이버지도/티맵/카카오맵 앱 연결 버튼이 있으므로 **지도 자체의 인터랙션 필요성은 낮다.**

**(C) 다크 템플릿에서는 지도를 끄고 약도 이미지로 대체.** VIP 나이트·부고처럼 무드가 중요한 템플릿은 이 선택도 유효하다.

→ **(A) 를 기본으로 하고, `themeConfig.mapStyle: 'auto' | 'dark' | 'static'` 로 템플릿이 고를 수 있게 한다.**

---

## C-6. 섹션 라벨이 웨딩 기본값 고정 (P1)

### 현상

seed 가 라벨을 지정하지 않으면 웨딩 기준 기본값이 나온다. 그 결과

- **부고**에 `행사 일시` / `행사 장소`
- **전시회**에 `행사 일시`(실제로는 오프닝 일시)
- 세미나·런칭·테니스·VIP·송년회 전부 `행사 일시 / 행사 장소`
- 인사말 영문 라벨이 전부 `Invitation` — VIP 나이트는 커버에도 `INVITATION` 이 있어 **화면에 INVITATION 이 두 번**

### 원인

`PreviewPane.tsx` 기본값:

| 위치 | 기본값 |
|---|---|
| :278 | `'인사말'` |
| :240 | `'Invitation'` |
| :284 | `'소중한 분들을 초대합니다'` |
| :289 | `'저희 두 사람의 작은 만남이…'` (웨딩 전문) |
| :430 | `'행사 장소'` |
| :431 | `'Location'` |
| DatetimeSection | `'행사 일시'` / `'Event Day'` / `'낮 12시 00분'` |

### 수정안

**카테고리별 라벨 프리셋**을 `src/lib/category-labels.ts` 로 분리한다.

```ts
export const CATEGORY_LABELS: Record<string, Partial<SectionLabels>> = {
  wedding:  { greeting: '인사말',    datetime: '예식 일시', venue: '예식 장소' },
  baby:     { greeting: '인사말',    datetime: '행사 일시', venue: '행사 장소' },
  business: { greeting: '초대의 말', datetime: '행사 일정', venue: '행사 장소' },
  sports:   { greeting: '대회 안내', datetime: '경기 일정', venue: '경기 장소' },
  culture:  { greeting: '초대의 글', datetime: '오프닝',    venue: '전시 장소' },
  memorial: { greeting: '부고',      datetime: '발인 일시', venue: '빈소' },
  // ...
}
```

우선순위: `module.config` / `content.*Title` > 카테고리 프리셋 > 전역 기본값.

영문 라벨(`Invitation`, `Event Day`, `Location`)도 같은 방식으로 카테고리화한다. 특히 **인사말 영문 라벨의 전역 기본값을 `Invitation` 에서 `Greeting` 으로 바꾸면** 커버의 `INVITATION` 과의 중복이 사라진다.

---

## C-7. D-day 가 지난 날짜를 표시 (P0 — 시간이 지날수록 악화)

### 현상

2026-07-25 기준

| 템플릿 | eventDate | 화면 |
|---|---|---|
| 돌잔치 | 2026-04-26 | **D+90** |
| 비즈 세미나 | 2026-05-21 | **D+65** |
| 신제품 런칭 | 2026-06-15 | **D+40** |
| 오픈 테니스 컵 | 2026-07-12 | **D+13** |

템플릿 **쇼케이스**에서 "이미 끝난 행사"가 보인다. 나머지 7개도 시간이 지나면 순차적으로 같은 상태가 된다 — 가장 늦은 졸업식(2027-02-05)도 반년 뒤면 D+ 로 넘어간다.

### 원인

`prisma/seed.ts` 가 `eventDate` 를 절대 날짜 문자열로 고정하고, 화면 표시용 `datetimeTitleBig` / 커버 `textSlots` / `shareText` 에도 같은 날짜를 **문자열로 중복 하드코딩**한다. 날짜를 바꾸려면 한 템플릿당 4~5곳을 동시에 고쳐야 한다.

`PreviewPane.tsx:1499`

```tsx
const label = diff > 0 ? `D-${diff}` : diff === 0 ? 'D-Day' : `D+${Math.abs(diff)}`
```

### 수정안

**두 층위로 나눠 고친다.**

**(1) seed — 날짜를 상대 기준으로 생성**

```ts
// prisma/seed.ts 상단
const SEED_TODAY = new Date()
function daysFromNow(n: number) {
  const d = new Date(SEED_TODAY); d.setDate(d.getDate() + n)
  return d
}
function isoDate(d: Date) { return d.toISOString().slice(0, 10) }

// 템플릿별 오프셋 — 주제에 맞는 리드타임
const OFFSETS = {
  wedding: 85, baby: 45, birthday: 28, graduation: 120,
  seminar: 60, launch: 40, tennis: 35, vipNight: 50,
  yearend: 70, exhibition: 55, memorial: 4,       // 부고는 임박이 자연스럽다
}
```

그리고 표시 문자열은 하드코딩하지 말고 **날짜 하나에서 파생**시킨다.

```ts
function displayStrings(date: Date, time: string) {
  return {
    datetimeTitleBig: `${y}. ${mm}. ${dd}. ${weekday}요일`,
    coverBottom: `${y}. ${mm}. ${dd}. (${wd}) ${time}`,
    coverEn: `${enWd}. ${d} ${enMon} ${y} · ${time}`,
    shareText: `${y}.${mm}.${dd} ${weekday}요일 ${time} · ${venueName}`,
  }
}
```

**(2) 렌더 — 지난 행사 표시 개선**

템플릿 미리보기에서 D+ 가 뜨면 그 자체가 이상하지만, **실제 사용자 초대장에서도** 행사 다음 날 `D+1` 이 크게 뜨는 건 어색하다.

```tsx
const label =
  diff > 0  ? `D-${diff}` :
  diff === 0 ? 'D-Day' :
  (module.config?.showPastDays ? `D+${Math.abs(diff)}` : '행사가 종료되었습니다')
```

기본값은 종료 문구, `showPastDays: true` 일 때만 D+ 를 노출한다. 부고처럼 D-day 모듈이 없는 템플릿은 영향 없음.

---

## C-8. 제목 2~3중 중복 출력 (P1)

### 현상

| 템플릿 | 화면 |
|---|---|
| 클래식 웨딩 | `계좌 정보` / `Account` / **`마음 전하실 곳`** — 3줄 |
| 생일 | `마음 전하실 곳` / `Gift` / **`마음 전하실 곳`** — 같은 말 2번 |
| 부고 | `마음 전하실 곳` / **`마음 전하실 곳`** — 같은 말 2번 |
| 부고 | `상주` / **`상주`** `CHIEF MOURNER` — 섹션 제목과 그룹 라벨이 동일어 |

### 원인

seed 에서 `koreanTitle` 과 `titleBig` 에 같은/유사한 문자열을 넣고 `titleBigVisible: true` 로 둔 결과.

### 수정안

seed 정리가 정답이다. **`koreanTitle` 은 섹션 이름, `titleBig` 는 부연**이라는 규칙으로 통일한다.

```ts
// as-is (생일)
{ titleBig: '마음 전하실 곳', koreanTitle: '마음 전하실 곳', englishTitle: 'Gift', titleBigVisible: true }

// to-be
{ koreanTitle: '마음 전하실 곳', englishTitle: 'Gift', titleBigVisible: false }
```

부고 상주 섹션은 섹션 제목을 `상주`, 그룹 라벨을 `유가족` 으로 분리하거나 그룹 라벨 표시를 끈다.

추가로 `PreviewPane` 쪽에 **동일 문자열이면 하나만 렌더하는 가드**를 넣으면 앞으로 같은 실수를 막는다.

```tsx
const showTitleBig = titleBigVisible && titleBig && titleBig !== koreanTitle
```

---

## C-9. 장소 상세주소가 화면에 안 나옴 (P1)

### 현상

11개 전부, 행사 장소 섹션에 **건물명만** 나온다.

- VIP 나이트 → `강남 시그니처 라운지 23F`
- 웨딩 → `서울 그랜드 웨딩홀 2층 그레이스홀`
- 부고 → `한빛장례식장 3층 특7호실`

정작 seed 에는 주소가 다 있다 (`서울특별시 강남구 테헤란로 511` 등). 초대장을 받는 사람 입장에서 **주소 텍스트는 지도보다 중요하다** — 택시 기사에게 불러주고, 복사해서 다른 앱에 붙여넣는다.

### 원인

`PreviewPane.tsx:429-441` `VenueSection` 은 `venueTitleBig` / `venueTitleSmall` 만 렌더하고 `venue.address` 는 지도와 앱 링크에만 쓴다.

### 수정안

건물명 아래에 주소 한 줄 + 주소 복사 액션을 추가한다.

```tsx
{venue?.address && (
  <button
    type="button"
    onClick={() => navigator.clipboard?.writeText(venue.address ?? '')}
    className="text-xs mb-4 underline underline-offset-4 decoration-1"
    style={{ color: 'var(--od-text-muted)' }}
  >
    {venue.address}
  </button>
)}
```

부고는 여기에 **`빈소 · 발인 시각`** 도 함께 묶어 보여주는 게 낫다 (→ 11번 문서).

---

## C-10. 연락처 전화번호가 비어 죽은 버튼으로 렌더 (P1)

### 현상

- 졸업식 `학사 지원팀` — 통화/문자 아이콘 **회색 비활성**
- 전시회 `더 화이트 갤러리` — 동일
- 부고 `장남 홍길동` / `차남 홍길서` — 동일
- 웨딩은 신랑/신부만 활성, 부모 4명은 비활성 → **한 카드 안에 활성/비활성이 섞여 버그처럼 보인다**

### 원인

seed 의 `contacts[].phone` 이 `''`.

### 수정안

두 가지를 함께 한다.

1. **seed 에 예시 번호를 넣는다.** 템플릿은 "완성된 결과물"을 보여주는 것이 목적이므로 실제로 눌리는 상태가 맞다. 실번호 노출을 피하려면 예약 대역인 **`010-0000-0000`** 을 쓴다 (사용자는 어차피 에디터에서 자기 번호로 바꾼다).
2. **번호가 없으면 아이콘 자체를 렌더하지 않는다.** 회색 원형 버튼이 두 개 떠 있는 것보다 아무것도 없는 편이 깔끔하다.

```tsx
{contact.phone && (
  <div className="flex gap-2"> {/* 전화 / 문자 */} </div>
)}
```

---

## C-11. 오시는 길이 지도에서 멀리 떨어져 있음 (P2)

### 현상

클래식 웨딩 모듈 순서:

```
… 행사 장소(지도) → 갤러리 → 안내사항 → 방명록 → 계좌 → 연락처
  → 타임라인 → 폴라로이드 → RSVP → 오시는 길 → 인터뷰
```

**지도와 "오시는 길(지하철/버스/택시)" 사이에 8개 섹션**이 끼어 있다. 8557px 짜리 페이지에서 위치 정보가 두 군데로 쪼개져 있는 셈이다.

세미나·런칭·테니스도 `venue → dday → gallery → tab(오시는 길)` 로 갤러리가 사이에 낀다.

### 수정안

**교통/주차 탭은 항상 venue 모듈 바로 다음**에 오도록 seed 의 `order` 를 재배치한다. 웨딩 권장 순서는 1번 문서에 정리했다.

추가로 **`tab` 모듈 중 `label` 이 교통 관련(`오시는 길`, `주차`, `지하철`)이면 venue 섹션 안으로 흡수하는 옵션**(`venue.config.embedDirections: true`)을 두면 구조적으로 해결된다.

---

## C-12. 인사말 본문의 줄간격이 과하다 (P2)

### 현상

인사말 본문에서 문단 사이 빈 줄이 실제 화면에서 매우 크게 벌어진다. 세미나·런칭·테니스·송년회 모두 문단당 화면 1/3 을 차지한다.

### 원인

`PreviewPane.tsx:289` `className="text-xs text-gray-600 leading-8 mb-6"` — `leading-8`(2rem)이 `text-xs`(0.75rem) 대비 2.67배다. 여기에 `\n\n` 이 빈 `<p>` 로 렌더되면서 한 줄이 더 붙는다.

### 수정안

`leading-8` → `leading-7`, 빈 문단은 `margin` 으로 처리한다.

```tsx
className="text-xs leading-7 mb-6 [&_p:empty]:h-3 [&_p:empty]:m-0"
```

---

## C-13. 캘린더 주말 색이 웨딩 관습 고정 (P2)

### 현상

모든 템플릿의 달력에서 **일요일이 빨강, 토요일이 파랑**으로 표시된다. 웨딩 청첩장 관습이다.

- 비즈 세미나(모노톤 그리드 테마)에 빨강·파랑이 튄다
- VIP 나이트(네이비/골드)에서도 동일
- 부고에서 빨강은 특히 부적절하다

### 수정안

주말 색을 `themeConfig` 로 뽑는다.

```ts
weekendColors: { sun: '#e05a5a', sat: '#5a7fe0' }  // wedding / baby / birthday
weekendColors: null                                 // business / culture / memorial → accent 단일톤
```

`null` 이면 평일과 동일 색, 행사일 하이라이트만 accent 로 처리한다.

---

## C-14. 미리보기 페이지 헤더 CTA 색이 테마와 무관 (P2)

### 현상

`/templates/[id]` 상단의 **`시작하기`** 버튼이 11개 전부 동일한 **살구/테라코타(#C08A6E 계열)**다. VIP 나이트의 네이비·골드 위에서도, 부고의 세이지·차콜 위에서도 같은 색이다.

이 버튼은 서비스 UI(초대장 콘텐츠가 아님)라 통일하는 게 맞을 수도 있지만, 현재 색은 **프로젝트 컨벤션인 primary `#5B4FCF` 도 아니다**. 의도된 색인지 확인이 필요하다.

### 수정안

둘 중 하나로 정한다.

- **(A)** 서비스 UI 로 간주 → `#5B4FCF` (`.claude/rules/design.md` 의 primary)로 통일
- **(B)** 미리보기 몰입 우선 → 템플릿 `accentColor` 를 따라가게

→ **(A) 권장.** 미리보기 상단바는 명백히 서비스 chrome 이고, 템플릿 색을 따라가면 다크 테마에서 대비 확보가 매번 문제가 된다.

---

## 배치 1 체크리스트

- [ ] C-1 `GreetingSection` 서명 fallback 제거 + 8개 템플릿 `greetingAuthor` 시딩
- [ ] C-2 공유 버튼 문구 카테고리화, 기본값 `초대장 주소 복사하기`
- [ ] C-3 샘플 방명록 카테고리별 교체, "에디터" 문구 제거, 날짜 상대화
- [ ] C-4 surface 토큰 도입 후 `bg-white` 13곳 / `border-gray-200` / `text-gray-600` 치환
- [ ] C-5 `NaverMap` 에 `theme` prop 추가 (CSS 필터 방식) + 마커 색 보정
- [ ] C-6 `src/lib/category-labels.ts` 신설, 섹션 라벨 기본값 카테고리화
- [ ] C-8 `showTitleBig` 중복 가드 + seed 5곳 정리
- [ ] C-9 venue 주소 한 줄 + 탭하면 복사
- [ ] C-10 빈 전화번호일 때 아이콘 미렌더 + seed 예시 번호
- [ ] C-12 인사말 `leading-7` + 빈 문단 처리
- [ ] C-13 `weekendColors` 를 `themeConfig` 로
- [ ] C-14 `시작하기` 버튼 색 결정

## 배치 2 체크리스트 (공통 파트)

- [ ] C-7 `seed.ts` 날짜 상대 생성 유틸 + 표시 문자열 파생화 (11개 전부)
- [ ] C-7 D-day 지난 행사 문구 (`showPastDays` 옵션)
- [ ] C-11 교통/주차 탭을 venue 직후로 `order` 재배치 (웨딩·세미나·런칭·테니스)
