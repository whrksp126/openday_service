# 08. 오픈 테니스 컵 초대장

| 항목 | 값 |
|---|---|
| id | `sports-tennis-template-001` |
| 카테고리 | 대회/스포츠 · 테니스 |
| 콘셉 | 시안 블루 + 그리드. 아마추어 오픈 대회 |
| 테마 | 화이트 배경 + grid bgEffect + `#1aaedb` accent + `pop` 스크롤 |
| 페이지 높이 | 3068px (11개 중 최단, 4구간) |
| 캡처 | `_shots/sports-tennis-template-001__00~03.png` |

**모듈 구성 (8개)**
`main → greeting → datetime → venue → dday → gallery → tab(대회 안내) → guestbook`

---

## 이 템플릿의 핵심 진단

> **대회인데 참가 신청을 할 수가 없다.**
> 참가비도, 부문도, 인원 제한도, 마감일도, 문의처도 없다. `대회 안내` 탭에 경기 방식 두 줄이 전부다.
> 초대장이 아니라 "대회가 있다는 사실을 알리는 포스터"에 머물러 있다.

---

## P0 — 치명

### T-1. 참가 신청(RSVP)이 없다

**현상.** 모듈 8개 중 `rsvp` 없음. 방명록만 있다.

**왜 치명적인가.** 대회는 **참가 신청이 존재 이유**다. 초대장을 받은 사람이 "나가고 싶다"고 생각한 순간 할 수 있는 행동이 없다. 주최자도 몇 명이 오는지 알 수 없어 대진표를 짤 수 없다.

**수정안.** `rsvp` 를 추가하되, 대회에 맞는 항목을 받는다.

```ts
{ id: 'tennis-rsvp-1', type: 'rsvp', order: 6, config: {
    koreanTitle: '참가 신청', englishTitle: 'Entry',
    // 대회용 추가 필드가 필요하다면 배치 4
}},
```

**받아야 할 정보** — 이름 / 연락처 / 참가 부문(단식·복식) / 복식이면 파트너 / NTRP 또는 구력 / 티셔츠 사이즈.
현재 RSVP 모듈이 "참석 여부"만 받는다면 **부문 선택 필드 확장이 필요**하다(배치 4).

### T-2. 참가비 · 마감 · 정원 정보가 없다

**현상.** 대회 안내 탭 = `경기 방식` / `준비물` / `오시는 길` 3개.
경기 방식 내용은 `단·복식 토너먼트 / 1세트 6게임 (타이브레이크 적용)` 두 줄.

**없어서 결정을 못 하는 것.**

| 항목 | 왜 필요한가 |
|---|---|
| **참가비** | 유·무료조차 모름. 있으면 입금 계좌까지 |
| **신청 마감일** | 언제까지 결정해야 하는지 |
| **정원 / 선착순** | 지금 신청해야 하는지 판단 |
| **부문 구분** | 남단/여단/혼복/남복… 내가 나갈 종목이 있나 |
| **시상 / 상품** | 참가 동기의 큰 부분 |
| **우천 시 진행 여부** | 야외 대회의 필수 고지 |
| **경기 시간대** | 오전 9시 시작이면 몇 시에 끝나는지 |
| **문의처** | 대회는 문의가 반드시 발생한다 |

**수정안 — 탭 재구성**

| 탭 | 내용 |
|---|---|
| 참가 안내 | 참가비 3만원(볼·간식 포함) · 선착순 32팀 · 신청 마감 7/5 |
| 부문 | 남자단식 / 여자단식 / 남자복식 / 혼합복식 |
| 경기 방식 | 현재 내용 + 예선 조별 리그 후 본선 토너먼트 |
| 시상 | 부문별 1·2·3위 트로피 및 상품 |
| 준비물 | 라켓 · 실내외 겸용화 · 여벌 옷 · 개인 음료 |
| 우천 시 | 당일 오전 7시 카톡 공지, 연기 시 대체일 안내 |
| 오시는 길 | 현재 내용 |

이 정도가 채워져야 "대회 초대장"이다.

### T-3. 인사말 서명이 "신랑 · 신부"

→ [00-common.md C-1](00-common.md)

```ts
greetingAuthor: '오픈 테니스 컵 운영위원회',
```

### T-4. D+13 — 이미 지난 대회

`eventDate: 2026-07-12`, 오늘 2026-07-25. → [00-common.md C-7](00-common.md)

대회 템플릿에서 특히 나쁘다 — **"신청 마감이 지났다"** 로 읽힌다.

---

## P1 — 주요

### T-5. 갤러리가 커버와 똑같은 테니스공 사진

**현상.** `갤러리 / Gallery` 에 커버의 **파란 코트 위 테니스공** 사진이 그대로 한 번 더.
`tennisGallery = [main_img.png]`.

**수정안.** 지난 대회 현장 사진 4장. 대회 갤러리는 **"이 대회가 어떤 분위기인가"** 를 보여주는 자리다 — 참가 결정에 직접 영향을 준다.

| # | 내용 |
|---|---|
| 1 | 코트 전경 + 대회 배너 |
| 2 | 경기 중 스윙 순간 (아마추어 레벨이 드러나게) |
| 3 | 시상식 / 트로피 |
| 4 | 참가자 단체 사진 (얼굴 작게) |

### T-6. 문의처가 없다

대회 운영에서 문의는 반드시 발생한다(대진표, 우천, 주차, 파트너 매칭). `contact` 모듈 추가.

```ts
{ id: 'tennis-contact-1', type: 'contact', order: 9, config: {
    koreanTitle: '대회 문의', englishTitle: 'Contact',
    groups: [{ label: '운영위원회', contacts: [{ name: '대회 운영팀', phone: '010-0000-0000' }] }],
}},
```

### T-7. `인사말 / Invitation` 라벨이 대회와 안 맞는다

**현상.** 대회 안내 글의 섹션 제목이 `인사말` / `Invitation`.

**수정안.** `대회 안내` / `About` 또는 `초대의 글` / `Welcome`.
`대회 안내` 는 이미 tab 제목으로 쓰이므로 겹치지 않게 정리한다.

| 현재 | 제안 |
|---|---|
| `인사말` / `Invitation` | `대회 소개` / `About` |
| `행사 일시` / `Event Day` | `경기 일정` / `Schedule` |
| `행사 장소` / `Location` | `경기 장소` / `Court` |
| `디데이` / `D-day` | `대회까지` / `Countdown` |
| `대회 안내` / `Tournament Info` | 유지 — 좋다 |
| `방명록` / `Guestbook` | `참가자 한마디` / `Message` |

### T-8. 인사말이 대회 정보를 담지 않는다

> "함께 즐기는 코트 위의 시간, 2026 오픈 테니스 컵에 초대합니다.
> 실력보다 즐거움을 나누는 대회입니다. 가벼운 마음으로 함께해 주세요!"

톤은 좋다(아마추어 친화적). 다만 **정보가 0** 이다. 여기에 규모·연혁·대상 수준을 한 줄씩 넣으면 신뢰가 올라간다.

```
올해로 4회를 맞는 오픈 테니스 컵에 초대합니다.
구력 1년부터 10년까지, 32팀이 함께합니다.

실력보다 즐거움을 나누는 대회입니다.
경기 후에는 코트 옆에서 간단한 뒤풀이도 준비했습니다.
가벼운 마음으로 함께해 주세요!
```

### T-9. 상세주소 미노출

`양재 시민의숲 테니스장` 만 표시. `서울특별시 서초구 매헌로 99` 가 안 보인다.
공공 체육시설은 **입구가 여러 개**라 주소와 "몇 번 게이트"가 특히 중요하다. → [00-common.md C-9](00-common.md)

---

## P2 — 개선

### T-10. 캘린더 주말 빨강/파랑

시안 블루 단일 accent 테마에서 빨강이 튄다. → [00-common.md C-13](00-common.md)
스포츠 대회는 대개 주말에 열리므로 **행사일 하이라이트만 강조**하면 충분하다.

### T-11. 그리드 배경이 비즈니스 템플릿과 동일

`bgEffect: 'grid'` 가 비즈 세미나 · 졸업식과 같다. 색만 다르다(하늘색 vs 회색).
스포츠 템플릿은 **코트 라인 모티프**(대각선, 라인 마킹)가 훨씬 잘 맞는다. `bgEffect` 에 `court` 프리셋 추가를 검토.

### T-12. `pop` 스크롤 애니메이션

이 템플릿만 `scrollAnimation: 'pop'` 이다. 스포츠의 경쾌함과 맞아서 좋은 선택이다. 유지.

---

## 이미지 애셋 교체 계획

### 현재 상태

| 용도 | 개수 | 상태 |
|---|---|---|
| 커버 | 1 (파란 코트 + 공, 1.9MB) | 좋음 — 유지. 다만 **파일이 1.9MB 로 과대**, 최적화 필요 |
| gallery | 1 (= 커버) | **교체** |

> **부가 발견** — `sports-tennis-template-001/main_img.png` 가 **1,926,093 bytes (1.9MB)** 다. 다른 템플릿 커버가 80KB~460KB 인 것과 비교하면 4~20배다. 모바일에서 첫 화면 로딩을 직접 지연시킨다. WebP 변환 + 리사이즈 권장.

### 공통 사양

4:5 세로, 1600px 이상, WebP 권장.
**공통 룩**: 시안 블루 코트 · 화이트 라인 · 라임 옐로우 공. 맑은 날 자연광, 채도 있는 밝은 톤(다른 템플릿과 달리 여기는 **채도를 살리는 게 맞다**). 아마추어 동호인 분위기 — 프로 경기 스톡 느낌 회피.

#### gallery 01~04

```
(01)
Wide view of an outdoor hard tennis court with bright blue surface and crisp
white lines on a clear sunny day, a simple tournament banner on the fence,
folding chairs and water coolers at the side, no players on court, vivid but
natural color, bright daylight, amateur community tournament atmosphere,
vertical 4:5 composition
```

```
(02)
Amateur adult tennis player in casual sportswear mid-swing on a blue outdoor
hard court, motion captured at the moment of contact, sunny day with strong
directional light, opponent blurred in the far background, vivid natural color,
faces not clearly identifiable, documentary sports photography, vertical 4:5
composition
```

```
(03)
Small trophies and medals arranged on a folding table beside a blue tennis
court, a few tennis balls and a racket next to them, warm late afternoon
sunlight, simple amateur tournament setting, no people, vivid natural color,
vertical 4:5 composition
```

```
(04)
Group of about twenty amateur adult tennis players standing together on a blue
outdoor court holding rackets, seen from a distance so faces are small and not
identifiable, sunny day, casual sportswear in mixed colors, celebratory relaxed
mood, documentary photography, vertical 4:5 composition
```

---

## 작업 체크리스트

**seed (`prisma/seed.ts` — `SPORTS_TENNIS_TEMPLATE`)**

- [ ] T-1 `rsvp`(참가 신청) 모듈 추가
- [ ] T-2 tab 을 참가 안내 · 부문 · 시상 · 우천 시 포함으로 확장
- [ ] T-3 `greetingAuthor: '오픈 테니스 컵 운영위원회'`
- [ ] T-4 `eventDate` 상대 날짜화 (오늘 +35일 권장)
- [ ] T-5 `tennisGallery` 를 4장으로 교체
- [ ] T-6 `contact` 모듈 추가
- [ ] T-7 섹션 라벨 스포츠 어휘로
- [ ] T-8 인사말에 규모·연혁 추가

**코드**

- [ ] [00-common.md](00-common.md) 배치 1
- [ ] (배치 4) RSVP 에 부문 선택 · 파트너 · 구력 필드 확장
- [ ] (선택) `bgEffect` 에 `court` 프리셋

**이미지**

- [ ] 커버 최적화 (1.9MB → WebP, 300KB 이하)
- [ ] `gallery/01~04` 지난 대회 현장 4장
