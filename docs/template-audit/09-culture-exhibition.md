# 09. 전시회 초대장

| 항목 | 값 |
|---|---|
| id | `culture-exhibition-template-001` |
| 카테고리 | 아트/문화 · 전시회 |
| 콘셉 | 오프화이트 + 미니멀. 개인전 `고요한 시간들` |
| 테마 | 오프화이트 배경 + 차분한 뉴트럴 accent |
| 페이지 높이 | 3637px (5구간) |
| 캡처 | `_shots/culture-exhibition-template-001__00~04.png` |

**모듈 구성 (10개)**
`main → greeting → interview(작가의 말) → datetime → venue → dday → tab(관람 안내) → gallery(전시 미리보기) → contact → guestbook`

---

## 이 템플릿의 핵심 진단

> 11개 중 **콘셉 완성도가 가장 높다.** `작가의 말`을 인터뷰 모듈로 푼 것, `전시 미리보기`로 갤러리 이름을 바꾼 것, `오프닝까지` D-day 라벨 — 모두 카테고리를 정확히 이해한 설계다.
> 남은 문제는 **전시 기간이 없다**는 것과 **커버 텍스트 가독성**이다.

---

## P1 — 주요

### E-1. 전시 기간(시작~종료)이 없다

**현상.** 날짜 정보가 전부 **오프닝 하루**에 대한 것이다.

| 위치 | 표시 |
|---|---|
| 커버 | `2026. 09. 18. (금) PM 6:00 · 더 화이트 갤러리 B1` |
| `행사 일시` | `2026. 09. 18. 금요일` / `PM 6:00 오프닝` |
| 캘린더 | 9월 18일 하나만 하이라이트 |
| `오프닝까지` D-day | `D-55` |
| `관람 안내` 탭 | `11:00 – 19:00` / `매주 월요일 휴관` — **시간만, 기간은 없음** |

**왜 문제인가.** 전시회 초대장에서 **가장 중요한 정보가 전시 기간**이다. 오프닝에 못 가는 사람이 대다수이고, 그들은 "그럼 언제까지 하지?"를 알아야 한다. 지금 이 초대장은 **오프닝 리셉션 초대장**이지 전시 초대장이 아니다.

**수정안 — 두 층위**

**(1) 즉시 (seed)** — `관람 안내` 탭 최상단에 기간 명시 + 커버에 기간 한 줄 추가.

```ts
textSlots: {
  brandTitle: '고요한\n시간들',
  subText: '2026. 09. 18. FRI — 10. 12. SUN',      // 전시 기간 신설
  bottomText: 'Opening 09. 18. (FRI) PM 6:00 · 더 화이트 갤러리 B1',
}
```

```ts
{ label: '관람 시간', content:
  '<p style="text-align: center">2026. 9. 18. (금) — 10. 12. (일)</p>' +
  '<p style="text-align: center">11:00 – 19:00 · 매주 월요일 휴관</p>' },
```

**(2) 구조적 (배치 4)** — `datetime` 모듈에 **기간(start–end) 지원**을 추가한다. 전시·페어·팝업 등 문화 카테고리 전반에 필요하다. 캘린더도 단일 날짜가 아니라 **기간 범위 하이라이트**로 렌더되어야 한다.

### E-2. 커버 타이틀이 잘 안 읽힌다

**현상.** 커버 상단의 **`고요한 / 시간들`** 이 흰 글씨인데, 배경이 갤러리 천장의 **밝은 회백색**이다. 대비가 거의 없다.
하단의 `2026. 09. 18. (금) PM 6:00 · 더 화이트 갤러리 B1` 도 밝은 나무 바닥 위 흰 글씨라 읽기 어렵다.

**왜 문제인가.** 미니멀·저채도를 지향한 결과지만, **읽히지 않는 타이포는 미니멀이 아니라 결함**이다. 특히 전시 제목은 초대장의 핵심 정보다.

**수정안.** 세 가지 중 조합.

- 텍스트 뒤에 **부드러운 그라디언트 스크림**을 깐다 (상단 `rgba(0,0,0,0.28)` → 투명, 하단도 동일)
- 커버 이미지를 **상단·하단이 어두운 컷**으로 교체 (이미지 계획 참조)
- 텍스트 색을 차콜(`#2b2b2b`)로 바꾸고 밝은 배경을 활용

미니멀 톤을 지키려면 **세 번째(차콜 텍스트) + 이미지 교체** 조합이 가장 자연스럽다.

### E-3. 작가가 누구인지 없다

**현상.** `작가의 말 / Artist Note` 섹션이 있는데 **작가 이름이 없다.** 문의처도 `더 화이트 갤러리` 라는 갤러리 이름뿐이다.

**왜 문제인가.** 개인전 초대장에서 **작가명은 전시명만큼 중요**하다. 받는 사람이 검색해볼 수도 없다.

**수정안.**

```ts
textSlots: { ..., topText: '김하린 개인전' },        // 커버
// interview 모듈
{ koreanTitle: '작가의 말', englishTitle: 'Artist Note',
  authorName: '김하린', authorNote: '회화 · 서울 작업' }
greetingAuthor: '작가 김하린',
```

작가 프로필(약력 2~3줄, 이전 전시 이력)을 `profile` 모듈로 넣으면 더 좋다.

### E-4. 작품 정보(캡션)가 없다

**현상.** `전시 미리보기` 에 작품 이미지 4장이 나오지만 **제목 · 재료 · 크기 · 제작연도가 없다.**

**왜 문제인가.** 전시 관람객에게 캡션은 기본 정보다. 컬렉터·기자에게는 더 중요하다. 캡션이 없으면 "이미지 장식"으로만 기능한다.

**수정안.** 갤러리 모듈에 캡션 필드를 쓰거나(있다면), `timeline` 모듈로 작품+캡션 구조를 만든다.

```
《고요한 시간 I》 2026, 캔버스에 유채, 162×130cm
《고요한 시간 II》 2026, 캔버스에 유채, 116×91cm
《머무는 자리》 2025, 도자, 45×30×30cm
《결》 2026, 캔버스에 혼합재료, 91×73cm
```

갤러리 모듈에 캡션 지원이 없다면 배치 4 로.

### E-5. 문의처 전화번호가 비어 죽은 버튼

`더 화이트 갤러리` 카드의 통화/문자 아이콘이 회색 비활성. → [00-common.md C-10](00-common.md)

전시는 **관람 예약 · 작품 문의**로 실제 연락이 오는 채널이므로 특히 필요하다.

### E-6. `인사말 / Invitation` 라벨

전시 맥락에서는 `초대의 글` / `Invitation` 또는 `전시 소개` / `About` 이 맞다. 본문 내용("오랜 시간 담아 온 작업을 조심스레 선보이는 자리입니다")은 매우 좋다.

| 현재 | 제안 |
|---|---|
| `인사말` / `Invitation` | `초대의 글` / `Invitation` (영문은 유지 가능) |
| `행사 일시` / `Event Day` | `전시 기간` / `Dates` |
| `행사 장소` / `Location` | `전시 장소` / `Venue` |
| `오프닝까지` / `D-day` | 유지 — 좋다 |
| `관람 안내` / `Visit` | 유지 — 좋다 |
| `전시 미리보기` / `Gallery` | 유지 — 좋다 |

### E-7. 커버 장식 `✦` 스파클

졸업식·부고와 동일한 장식이 커버 우하단과 좌상단에 떠 있다. 미니멀 전시 톤에서는 불필요한 노이즈다. → [04번 문서 G-3](04-education-graduation.md)

---

## P2 — 개선

### E-8. 관람 안내에 실용 정보 보강

현재 `관람 시간 / 입장 / 오시는 길` 3탭.

| 탭 | 보강안 |
|---|---|
| 관람 기간 | E-1 |
| 입장 | 무료 관람 · 예약 불필요 (또는 예약 링크) |
| 작품 구매 | 문의 방법 — 개인전에서 자주 묻는 것 |
| 사진 촬영 | 촬영 가능 여부 · 플래시 금지 등 |
| 오시는 길 | 현재 내용 |
| 주차 | **없음** — 갤러리는 주차가 어려운 경우가 많아 반드시 필요 |

### E-9. 오프닝 리셉션 상세가 없다

오프닝 `PM 6:00` 만 있고, 몇 시까지인지 · 작가와의 대화(아티스트 토크)가 있는지 · 다과가 제공되는지가 없다. 오프닝 참석 여부를 결정하는 정보다.

### E-10. RSVP 없음

오프닝 리셉션은 다과·좌석 준비가 있으므로 참석 회신이 유용하다. 다만 전시는 열린 행사라 **필수는 아니다** — 선택 모듈로 두는 것이 적절.

### E-11. 상세주소 미노출 / 캘린더 주말색

`더 화이트 갤러리 B1` 만 표시. → [00-common.md C-9, C-13](00-common.md)

---

## 이미지 애셋 교체 계획

### 현재 상태

| 용도 | 개수 | 상태 |
|---|---|---|
| 커버 | 1 (갤러리 공간 + 걸린 그림) | **교체** — 텍스트 대비 부족(E-2) |
| gallery | 4 (작품 이미지) | **품질 양호** — 캡션만 붙이면 됨 |

갤러리 4장은 11개 템플릿 중 가장 잘 만들어진 축에 든다(추상 회화, 도자 조형, 임파스토 클로즈업). 교체 불필요.

### 공통 사양

9:16(커버), 1600px 이상.
**공통 룩**: 오프화이트 · 웜 그레이 · 원목. 갤러리 조명(트랙 스포트), 저채도, 정적인 구성.

#### 커버 (재생성 — 텍스트 영역 확보)

```
Interior of a minimal white-walled art gallery with warm oak flooring, a single
large abstract painting in muted cream and charcoal tones hanging on the far
wall, soft directional track lighting, no people, the upper third of the frame
occupied by a darker shadowed ceiling area and the lower third by shadowed
floor, leaving high-contrast regions for overlaid light text, quiet contemplative
mood, muted off-white and warm grey color grade, editorial architectural
photography, vertical 9:16 composition
```

> 핵심 지시어: `the upper third … darker shadowed ceiling area` — E-2 의 원인을 직접 겨냥. 텍스트가 놓일 위치가 어두워야 흰 글씨가 읽힌다.

#### 대안 — 작품 클로즈업 커버

전시 초대장은 **공간보다 작품**을 보여주는 편이 강할 때가 많다.

```
Extreme close-up of thick impasto oil paint texture on canvas in muted cream,
warm grey and soft charcoal tones, raking side light revealing the ridges and
brush marks, abstract and calm, large areas of relatively flat tone at the top
for overlaid text, fine art photography, vertical 9:16 composition
```

#### 선택 — 작가 프로필 1장 (E-3)

```
Environmental portrait of a Korean artist in their thirties standing in a
bright studio with canvases leaning against a white wall, wearing a simple
linen apron over neutral clothing, soft natural window light, calm and
unposed, muted off-white and warm grey color grade, documentary portrait
photography, vertical 4:5 composition
```

---

## 작업 체크리스트

**seed (`prisma/seed.ts` — `EXHIBITION_TEMPLATE`)**

- [ ] E-1 커버 · 관람 안내에 **전시 기간** 명시
- [ ] E-3 작가명(`김하린`) 커버 · 인터뷰 · 서명에 반영
- [ ] E-4 작품 캡션 4개 추가
- [ ] E-5 `contact` 전화번호 채우기
- [ ] E-6 섹션 라벨 조정
- [ ] E-8 tab 에 작품 구매 · 사진 촬영 · 주차 추가
- [ ] E-9 오프닝 리셉션 상세 (종료 시각 · 아티스트 토크 · 다과)
- [ ] C-7 `eventDate` 상대 날짜화 (오늘 +55일 권장)

**코드**

- [ ] E-2 커버 텍스트 스크림 또는 차콜 텍스트
- [ ] E-7 커버 장식 `✦` 제거 (문화 카테고리)
- [ ] [00-common.md](00-common.md) 배치 1
- [ ] (배치 4) `datetime` 기간(start–end) 지원 + 캘린더 범위 하이라이트
- [ ] (배치 4) `gallery` 캡션 필드

**이미지**

- [ ] 커버 재생성 (텍스트 영역 대비 확보)
- [ ] (선택) 작가 프로필 1장
- [ ] gallery 4장 — **교체 불필요**
