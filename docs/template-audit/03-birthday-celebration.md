# 03. 생일 초대장

| 항목 | 값 |
|---|---|
| id | `birthday-celebration-template-001` |
| 카테고리 | 생일 · 생일(일반) |
| 콘셉 | 파스텔 컨페티 + 코럴. 홈파티형 생일 |
| 테마 | 크림-피치 배경 + 컨페티 장식 + 코럴 accent |
| 페이지 높이 | 3688px (5구간) |
| 캡처 | `_shots/birthday-celebration-template-001__00~04.png` |

**모듈 구성 (10개)**
`main → greeting → datetime → venue → dday → rsvp → interview(주인공 인터뷰) → gallery → account → guestbook`

---

## 이 템플릿의 핵심 진단

> 시각적으로는 11개 중 가장 밝고 완성도가 높다. 컨페티 장식과 폴라로이드 커버가 잘 맞는다.
> 문제는 **주인공이 없다**는 것. 이름도, 나이도, 얼굴도 없이 "HAPPY BIRTHDAY!" 만 있다.
> 그리고 **가는 방법을 알려주지 않는다.**

---

## P1 — 주요

### D-1. 주인공의 이름과 나이가 어디에도 없다

**현상.**

- 커버: `HAPPY BIRTHDAY!` + 케이크 폴라로이드 + 날짜/장소만
- 인사말 제목: `생일에 초대합니다`
- 인터뷰 제목: `주인공 인터뷰` — **주인공이 누구인지 모름**

**왜 문제인가.** 카카오톡으로 링크만 받은 사람은 **누구 생일인지 모른다.** 초대장의 존재 이유가 흔들린다. 돌잔치 템플릿이 `+ 시안 +` 로 이름을 명시하는 것과 대조적이다.

**수정안.**

```ts
defaultContent: {
  invitationTitle: '지우의 생일에 초대합니다',
  // main textSlots
  textSlots: {
    topText: 'HAPPY BIRTHDAY!',
    brandTitle: '지우',                       // 신설
    subText: "JIWOO'S 30th BIRTHDAY",         // 신설 — 나이/회차
    bottomText: '2026. 08. 22. (토) PM 5:00',
  },
}
```

인터뷰 제목도 `주인공 인터뷰` → **`지우의 한마디`** 로. (돌잔치가 `시안이의 한마디` 로 잘 처리한 패턴)

### D-2. 오시는 길 · 주차 · 문의 모듈이 통째로 없다

**현상.** 모듈 10개 중 **`tab` / `slide` / `contact` 가 전부 없다.** 지도 하나로 끝이다.

**왜 문제인가.** `더 가든 파티하우스 2F` 같은 소규모 파티룸은 **찾아가기 어려운 곳**인 경우가 많다. 지하철에서 몇 분인지, 주차가 되는지, 안 되면 어디에 대야 하는지가 없다. 지도 앱 버튼은 있지만 그건 "주소를 아는 사람"용이다.

또한 문의처가 없어 **길을 잃었을 때 연락할 곳이 없다.**

**수정안.** 최소 2개 모듈 추가.

```ts
{ id: 'bday-tab-1', type: 'tab', order: 5, config: {
    koreanTitle: '안내', englishTitle: 'Information',
    tabs: [
      { label: '오시는 길', content: '<p style="text-align: center">2호선 합정역 5번 출구 도보 7분</p>' },
      { label: '주차',     content: '<p style="text-align: center">건물 지하 주차장 2시간 무료 (입구에서 등록)</p>' },
      { label: '파티 안내', content: '<p style="text-align: center">간단한 핑거푸드와 음료가 준비됩니다.</p><p style="text-align: center">편한 차림으로 오세요!</p>' },
    ],
}},
{ id: 'bday-contact-1', type: 'contact', order: 11, config: {
    koreanTitle: '문의', englishTitle: 'Contact',
    groups: [{ label: '연락처', contacts: [{ name: '지우', phone: '010-0000-0000' }] }],
}},
```

### D-3. 생일에 계좌(마음 전하실 곳)가 기본 ON

**현상.** `마음 전하실 곳 / Gift / 마음 전하실 곳` → `축하의 마음` 아코디언.

**왜 문제인가.** 한국에서 **친구 생일 초대장에 계좌번호를 기본으로 넣는 것은 부담스럽게 읽힌다.** 환갑·칠순·팔순(같은 카테고리의 다른 서브카테고리)에서는 자연스럽지만, `birthday-general` 에서는 아니다.

**수정안.** 두 가지 중 선택.

- **(A) 기본 OFF** — 에디터에서 켤 수 있게 두되 템플릿 기본값에서 제외. **권장.**
- **(B) 성격 전환** — 계좌 대신 **선물 위시리스트 / "선물은 사양합니다"** 안내로 대체.

환갑·칠순용 템플릿을 별도로 만들 때 계좌를 기본 ON 으로 두면 카테고리 구분도 명확해진다.

### D-4. 제목 중복 — `마음 전하실 곳` 2번

D-3 을 (B)로 가더라도 중복은 정리. → [00-common.md C-8](00-common.md)

### D-5. 인사말 서명이 없다

**현상.** 인사말 끝에 서명이 없다. (다른 템플릿의 "신랑·신부" 버그는 없지만, 이번엔 **아무것도 없어서** 누가 초대하는지 모른다 — D-1 과 같은 뿌리)

**수정안.** `greetingAuthor: '지우 드림'`

---

## P2 — 개선

### D-6. 인터뷰 답변의 톤이 커버와 맞지 않는다

인터뷰 내용은 명백히 **성인**이다.

> "올 한 해 가장 기억에 남는 순간은?" → "좋아하는 사람들과 함께한 모든 날들이요."
> "다가올 한 해 이루고 싶은 것이 있다면?"

그런데 커버 사진은 **파스텔 풍선 + 알록달록 케이크 + 색종이**로 아동 생일파티에 가깝다. 갤러리 4장도 같은 톤이다.

**수정안.** 어느 쪽을 정체성으로 잡을지 결정한다.

- **(A) 성인 홈파티** (권장 — 인터뷰 문구가 이미 그쪽) → 커버/갤러리를 **차분한 파스텔 + 어른 손·와인잔·감성 케이크**로 교체
- **(B) 아동 생일** → 인터뷰 문항을 아이 눈높이로 재작성 (`좋아하는 음식은?`, `커서 뭐가 되고 싶어?`)

두 수요가 모두 크므로 **장기적으로는 템플릿을 2개로 분리**하는 것이 맞다.

### D-7. `주인공 인터뷰` 위치

현재 `rsvp → interview → gallery` 순이다. RSVP(행동 유도)가 감상 콘텐츠 앞에 나오면 흐름이 끊긴다.

**권장 순서** — `datetime → venue → tab(오시는 길) → dday → interview → gallery → rsvp → contact → guestbook`

### D-8. 장소 상세주소 미노출 / 캘린더 주말색

→ [00-common.md C-9, C-13](00-common.md)

---

## 이미지 애셋 교체 계획

### 현재 상태

| 용도 | 개수 | 상태 |
|---|---|---|
| 커버 | 1 (폴라로이드 프레임) | 톤 결정에 따라 교체 |
| gallery | 4 | 4장 다 아동 파티 톤. 톤 결정에 따라 교체 |

이미지 품질 자체는 11개 중 상위권이다. **문제는 품질이 아니라 타깃 불일치**(D-6)다.

### (A) 성인 홈파티로 갈 경우 — 권장

**공통 룩**: 크림·더스티핑크·소프트 코럴, 자연광, 저채도, 어른의 손과 소품 중심, 얼굴 노출 최소.

#### 커버

```
Overhead view of a small elegant birthday cake with a few thin candles on a
cream ceramic stand, minimal cream and dusty pink decorations, a couple of
pale balloons out of focus in the background, linen tablecloth, warm afternoon
window light, soft muted pastel color grade, calm and grown-up mood, editorial
lifestyle photography, no people, vertical 4:5 composition
```

#### gallery 01~04

| # | 내용 |
|---|---|
| 01 | 촛불을 켠 케이크 클로즈업 — 따뜻한 촛불빛 |
| 02 | 크림/더스티핑크 풍선 벽 + 소품 테이블 |
| 03 | 잔을 부딪치는 **손** 클로즈업 (얼굴 없음) |
| 04 | 테이블 위 상차림 — 핑거푸드, 접시, 냅킨 |

```
(03)
Close-up of several adult hands raising glasses of sparkling drink in a toast,
faces not visible, warm string lights bokeh in the background, cream and dusty
pink color palette, soft indoor evening light, shallow depth of field, candid
lifestyle photography, vertical 4:5 composition
```

### (B) 아동 생일로 갈 경우

현재 이미지를 유지하고 **인터뷰·인사말 문구를 아이 눈높이로 재작성**하는 것이 비용이 훨씬 적다. 이미지 작업 없음.

---

## 작업 체크리스트

**결정 필요**

- [ ] D-6 성인 홈파티(A) vs 아동 생일(B) — 이 결정에 따라 이미지 작업 유무가 갈린다
- [ ] D-3 계좌 모듈 기본 OFF 여부

**seed (`prisma/seed.ts` — `BIRTHDAY_TEMPLATE`)**

- [ ] D-1 커버·인사말·인터뷰에 주인공 이름/나이 반영
- [ ] D-2 `tab`(오시는 길·주차·파티 안내) + `contact` 모듈 추가
- [ ] D-3 `account` 기본 OFF 또는 위시리스트로 전환
- [ ] D-4 제목 중복 제거
- [ ] D-5 `greetingAuthor` 추가
- [ ] D-7 모듈 `order` 재배치
- [ ] C-7 `eventDate` 상대 날짜화 (오늘 +28일 권장)

**코드** — [00-common.md](00-common.md) 배치 1

**이미지** — (A) 선택 시 커버 1 + 갤러리 4 = 5장 / (B) 선택 시 0장
