# 10. 송년회 초대장

| 항목 | 값 |
|---|---|
| id | `seasonal-yearend-template-001` |
| 카테고리 | 시즌/기념일 · 송년회 |
| 콘셉 | 크림 + 골드 밀랍 봉인. `2026 SEASON FINALE` |
| 테마 | 크림 배경 + 골드 accent + 세리프 |
| 페이지 높이 | 3228px (4구간) |
| 캡처 | `_shots/seasonal-yearend-template-001__00~03.png` |

**모듈 구성 (8개)**
`main → greeting → datetime → venue → dday → gallery → tab(안내) → guestbook`

---

## 이 템플릿의 핵심 진단

> **웨딩 청첩장과 구분되지 않는다.** 크림 배경 · 골드 밀랍 봉인 · 세리프 타이포 · "따뜻한 발걸음 부탁드립니다" — 전부 청첩장의 시각·언어 코드다.
> 게다가 갤러리에 그 **밀랍 봉인 그래픽이 사진 대신 한 번 더** 나온다.
> 12월 송년회라는 계절감과 모임의 성격이 화면 어디에도 없다.

---

## P1 — 주요

### Y-1. 갤러리가 밀랍 봉인 그래픽 재탕

**현상.** `갤러리 / Gallery` 섹션에 **커버의 금색 밀랍 봉인 일러스트**가 그대로 한 번 더, 더 크게 나온다.
`yearendGallery = [main_img.png]`.

**왜 문제인가.** 사진이 아니라 **장식 그래픽**이 갤러리에 들어가 있다. "갤러리"라는 제목과 내용이 완전히 어긋난다. 5개 템플릿의 커버 재탕 문제 중에서도 가장 티가 난다.

**수정안.** 송년회 갤러리는 **작년 모임 사진**이 정답이다.

| # | 내용 |
|---|---|
| 1 | 작년 송년회 단체 사진 (원경, 얼굴 작게) |
| 2 | 테이블 세팅 · 건배 순간 |
| 3 | 겨울 저녁 라운지 실내 무드 |
| 4 | 한 해를 돌아보는 소품 (캘린더/사진/캔들) |

### Y-2. 웨딩 템플릿과 시각적으로 구분되지 않는다

**현상.** 커버 구성이 `2026 SEASON FINALE` (스몰캡 골드) + `한 해의 마지막, 따뜻한 자리에 모십니다` (명조 대형) + **금색 밀랍 봉인 + 봉투 플랩** + 날짜 박스.

밀랍 봉인 + 봉투 모티프는 **청첩장의 대표 관습**이다. 크림/골드 팔레트도 클래식 웨딩 템플릿과 거의 같다.

**왜 문제인가.** 템플릿 목록에서 웨딩과 송년회가 비슷해 보이면 **선택 이유가 사라진다.** 카테고리별 차별화는 템플릿 서비스의 핵심 가치다.

**수정안 — 송년회 고유 코드로 재설계**

| 요소 | 현재 | 제안 |
|---|---|---|
| 팔레트 | 크림 + 골드 | **딥 그린 / 버건디 / 미드나잇 + 골드** — 겨울 연말 |
| 모티프 | 밀랍 봉인 · 봉투 | **캔들 · 와인잔 · 전구 · 눈 · 전나무 가지** |
| 배경 | 종이 질감 | 어두운 무드 or 보케 조명 |
| 타이포 | 명조 세리프 | 유지 가능 (연말 격식) |

`themeConfig.bgColors` 에 이미 `#241b0e`(다크 브라운), `#312615` 같은 어두운 옵션이 들어 있다면 **기본값을 어두운 쪽으로 옮기는 것**만으로도 큰 차이가 난다.

### Y-3. 인사말 서명이 "신랑 · 신부"

→ [00-common.md C-1](00-common.md)

```ts
greetingAuthor: '드림',    // 또는 '모임 총무 드림'
```

### Y-4. 인사말이 청첩장 어투

> "저물어 가는 한 해의 마지막 자리에 **따뜻한 발걸음 부탁드립니다.**"

`발걸음 부탁드립니다` 는 경조사 관용구다. 앞 두 문단("함께해 주신 한 해에 감사드립니다 / 돌아보면 모든 순간이 여러분 덕분에 빛났습니다")은 좋다.

**수정안.** 마지막 문단만 교체하고, **모임의 성격을 드러내는 한 줄**을 추가.

```
함께해 주신 한 해에 감사드립니다.

돌아보면 모든 순간이
여러분 덕분에 빛났습니다.

올해의 마지막 저녁,
편하게 얼굴 보며 한 해를 정리하는 자리입니다.
가벼운 마음으로 오세요.
```

### Y-5. 송년회 필수 정보가 없다

현재 tab 은 `드레스 코드 / 메뉴 / 오시는 길` 3개. 드레스 코드 내용은 `Warm & Cozy — 자유롭게, 편안한 차림으로 와주세요.` (좋다)

**없어서 곤란한 것.**

| 항목 | 왜 필요한가 |
|---|---|
| **회비** | 송년회는 회비를 걷는 경우가 대다수. 금액·입금 계좌·마감 |
| **참석 회신 (RSVP)** | 인원에 따라 장소·메뉴가 달라진다 |
| **진행 순서** | 식사만인지, 시상/게임/추첨이 있는지 |
| **주차 / 대리운전** | 술자리이므로 특히 중요 |
| **2차 안내** | 있으면 미리 알려주는 게 예의 |

**수정안.**

```ts
// 모듈 추가
{ id: 'yearend-rsvp-1', type: 'rsvp', order: 7, config: {
    koreanTitle: '참석 회신', englishTitle: 'RSVP' }},
{ id: 'yearend-account-1', type: 'account', order: 8, config: {
    koreanTitle: '회비 안내', englishTitle: 'Fee',
    groups: [{ label: '회비 3만원', accounts: [{ bank: '국민', name: '총무 김OO', number: '000000-00-000000' }] }] }},
{ id: 'yearend-contact-1', type: 'contact', order: 10, config: {
    koreanTitle: '문의', englishTitle: 'Contact' }},
```

```ts
// tab 확장
tabs: [
  { label: '드레스 코드', content: '...' },       // 현재 내용 유지
  { label: '진행 순서', content: '18:00 모임 · 18:30 식사 · 20:00 시상 & 추첨 · 21:30 마무리' },
  { label: '메뉴',      content: '...' },
  { label: '주차',      content: '건물 지하 2시간 무료 · 대리운전 이용 권장' },
  { label: '오시는 길', content: '...' },
]
```

### Y-6. `2026 SEASON FINALE` 이 무엇인지 모호하다

**현상.** 커버 상단 `2026 SEASON FINALE`, 인사말 제목 `2026 SEASON FINALE 송년회`.

**왜 문제인가.** `SEASON FINALE` 은 드라마 용어다. 회사·동호회·동창회 송년회 어디에도 잘 붙지 않는 조어라, 받는 사람이 **어떤 모임인지 알 수 없다.**

**수정안.** 모임 정체를 넣을 수 있는 형태로.

```
2026 송년의 밤
○○팀 송년회 / ○○동호회 송년 모임
```

영문 라벨이 필요하다면 `YEAR-END PARTY 2026` 또는 `2026 WRAP UP` 이 자연스럽다.

---

## P2 — 개선

### Y-7. 섹션 라벨

| 현재 | 제안 |
|---|---|
| `인사말` / `Invitation` | `초대의 말` / `Invitation` |
| `행사 일시` / `Event Day` | `모임 일시` / `When` |
| `행사 장소` / `Location` | `모임 장소` / `Where` |
| `디데이` / `D-day` | `송년회까지` / `Countdown` |
| `안내` / `Information` | 유지 |
| `방명록` / `Guestbook` | `한 해 인사` / `Message` |

### Y-8. 상세주소 · 캘린더 주말색 · 줄간격

→ [00-common.md C-9, C-13, C-12](00-common.md)
`한남 빈티지 라운지` 만 표시.

### Y-9. bgEffect `paper` 가 골드 톤과 잘 안 맞는다

배경의 가로 줄무늬(종이 질감)가 크림 배경에서 미묘하게 줄이 그어진 것처럼 보인다. Y-2 에서 팔레트를 어둡게 바꾼다면 `bgEffect: 'none'` 또는 은은한 `dot` 이 낫다.

---

## 이미지 애셋 교체 계획

### 현재 상태

| 용도 | 개수 | 상태 |
|---|---|---|
| 커버 | 1 (금색 밀랍 봉인 일러스트) | Y-2 방향 결정에 따라 **교체** |
| gallery | 1 (= 커버 그래픽) | **교체 필수** |

### 공통 사양

9:16(커버) / 4:5(갤러리), 1600px 이상.
**공통 룩(제안 — 딥 그린·버건디 방향)**: 딥 포레스트 그린 · 버건디 · 웜 골드 · 캔들라이트. 저조도 실내, 따뜻한 텅스텐 광원, 보케. 겨울 연말의 아늑함.

#### 커버 (Y-2 재설계 반영)

```
Cozy winter year-end gathering table shot from above at night, deep green
linen tablecloth, a few lit taper candles in brass holders, wine glasses
catching warm light, sprigs of fir and dried orange slices scattered as
decoration, warm string lights bokeh in the dark background, no people,
intimate and warm mood, deep green burgundy and gold color grade, low-key
warm lighting, generous dark negative space at the top for overlaid text,
editorial lifestyle photography, vertical 9:16 composition
```

#### gallery 01~04

```
(01)
Wide candid shot of about fifteen adults gathered around a long table at a
year-end dinner party, seen from a distance so faces are small and not
identifiable, warm candlelight and string lights, deep green and burgundy
interior, relaxed celebratory mood, warm low-key color grade, documentary
photography, vertical 4:5 composition
```

```
(02)
Close-up of several hands raising wine glasses in a toast across a dinner
table, faces not visible, warm candlelight reflecting in the glass, deep green
tablecloth, string light bokeh in the background, shallow depth of field,
warm low-key color grade, vertical 4:5 composition
```

```
(03)
Interior of a warm vintage lounge on a winter evening, worn leather seating,
dark green walls, brass wall lamps casting pools of warm light, a small
decorated fir branch arrangement on a side table, no people, cozy intimate
mood, warm low-key color grade, vertical 4:5 composition
```

```
(04)
Still life of a wall calendar turned to December, a few instant photos, a
lit candle and a glass of red wine on a dark wooden table, warm side light
from a nearby lamp, nostalgic year-end mood, no people, deep green and warm
gold color grade, vertical 4:5 composition
```

---

## 작업 체크리스트

**결정 필요**

- [ ] Y-2 팔레트 전환(크림/골드 → 딥그린·버건디/골드) 여부 — 이미지 작업량이 여기서 갈린다

**seed (`prisma/seed.ts` — `SEASONAL_YEAREND_TEMPLATE`)**

- [ ] Y-1 `yearendGallery` 를 4장으로 교체
- [ ] Y-3 `greetingAuthor` 추가
- [ ] Y-4 인사말 마지막 문단 교체
- [ ] Y-5 `rsvp` · `account`(회비) · `contact` 모듈 추가, tab 확장
- [ ] Y-6 `2026 SEASON FINALE` → 모임 정체가 드러나는 문구
- [ ] Y-7 섹션 라벨 조정
- [ ] Y-9 `bgEffect` 재검토
- [ ] C-7 `eventDate` 상대 날짜화 (오늘 +70일 권장 — 다만 송년회는 12월 고정이 자연스러워 예외 검토)

> **참고** — 송년회는 계절 고정 행사라 상대 날짜화가 어색할 수 있다. 이 템플릿만 **"가장 가까운 12월 셋째 주 토요일"** 로 계산하는 것이 자연스럽다.

**코드** — [00-common.md](00-common.md) 배치 1

**이미지**

- [ ] 커버 재생성 (Y-2 방향)
- [ ] `gallery/01~04` 4장
