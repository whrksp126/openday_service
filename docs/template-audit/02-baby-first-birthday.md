# 02. 돌잔치 초대장

| 항목 | 값 |
|---|---|
| id | `baby-first-birthday-template-001` |
| 카테고리 | 베이비 · 돌잔치 |
| 콘셉 | 파스텔 피치/코럴. 아기 "시안"의 첫 생일 |
| 테마 | 크림-피치 배경 + 코럴 accent |
| 페이지 높이 | 6785px (8구간, 11개 중 2위) |
| 캡처 | `_shots/baby-first-birthday-template-001__00~07.png` |

**모듈 구성 (18개 — 11개 중 최다)**
`main → greeting → solo_profile → midphoto → datetime → venue → dday → gallery → timeline(성장 이야기) → interview → tab(오시는 길) → slide(안내사항) → guestbook → account → contact → rsvp → photo_share → ending`

---

## 이 템플릿의 핵심 진단

> 구성은 11개 중 가장 풍부하다. "성장 이야기" 타임라인과 "시안이의 한마디" 인터뷰는 이 카테고리에서 매우 잘 맞는 아이디어다.
> 문제는 **주인공이 누구인지가 사진마다 바뀐다**는 것과, 웨딩 잔재 문구가 남아 있다는 것.

---

## P0 — 치명

### B-1. 인사말 서명이 "신랑 · 신부"

**현상.** "저희 시안이의 첫 생일에 따뜻한 축하를 부탁드립니다." 바로 아래 **`신랑 · 신부`**.

**왜 치명적인가.** 돌잔치 초대장에서 신랑·신부는 완전한 오류다. 받는 사람이 즉시 "복붙 템플릿"임을 알아챈다.

**원인 / 수정.** → [00-common.md C-1](00-common.md)

```ts
greetingAuthor: '아빠 · 엄마 드림',
```

### B-2. 사진마다 다른 아기

**현상.**

| 위치 | 아기 |
|---|---|
| 커버 | 분홍 한복 · 화관 · 앞니가 난 **여아, 체감 2~3세** |
| timeline "출생 당일 / 100일 / 처음이 가득했던 날들" | 서로 다른 아기들 |
| timeline "첫 생일" | **아기가 아니라 풍선 사진** |
| ending | 구름 위 **웃는 남아 (6개월 정도)** |

한 아이의 1년 성장기를 보여주는 `성장 이야기` 타임라인인데 **각 단계의 아이가 다른 사람**이다. 콘셉 자체가 무너진다.

**부수 문제** — 커버 아기는 이가 여러 개 나 있고 머리숱이 많아 **만 1세보다 커 보인다.** "1st BIRTHDAY" 와 시각적으로 어긋난다.

**수정안.** 동일 아기 1명으로 전 컷 재생성. 성장 단계별 나이를 명시적으로 프롬프트에 넣는다. (이미지 계획 참조)

### B-3. D+90 — 이미 지난 행사

`eventDate: 2026-04-26`, 오늘 2026-07-25 → **D+90**. → [00-common.md C-7](00-common.md)

---

## P1 — 주요

### B-4. 사진 공유 모듈이 빈 회색 박스로 보인다

**현상.** `사진 공유 / Photo Share` 섹션에 카메라 아이콘 + **`하객 사진`** 텍스트가 든 회색 빈 박스.

**문제 둘.**

1. **`하객`은 웨딩 용어**다. 돌잔치에서는 어색하다.
2. 미리보기에서 **빈 플레이스홀더**가 그대로 노출돼 "미완성"으로 읽힌다.

**수정안.**

```ts
{ id: 'baby-photoshare-1', type: 'photo_share', order: 18, config: {
    koreanTitle: '사진 공유', englishTitle: 'Photo Share',
    label: '오늘의 사진',                        // '하객 사진' → 변경
    description: '함께한 순간을 남겨 주세요',
    sampleImages: [ /* 미리보기용 예시 3~4장 */ ],
}},
```

미리보기에서는 **샘플 썸네일 3~4장이 채워진 상태**로 보이게 한다. 빈 박스보다 훨씬 설득력이 있다.

### B-5. 계좌 섹션 제목 중복

`계좌 정보` / `Account` / `마음 전하실 곳` 3줄. → [00-common.md C-8](00-common.md)

돌잔치에서는 **`마음 전하실 곳`** 하나면 충분하다.

### B-6. 연락처가 "아빠" / "엄마" 뿐

**현상.** `아빠 FATHER` 그룹에 이름이 `아빠`, `엄마 MOTHER` 그룹에 이름이 `엄마`. 그룹 라벨과 연락처 이름이 같은 글자다.

**수정안.**

```ts
groups: [
  { label: '아빠', englishLabel: 'FATHER', contacts: [{ name: '김도현', phone: '010-0000-0000' }] },
  { label: '엄마', englishLabel: 'MOTHER', contacts: [{ name: '이서연', phone: '010-0000-0000' }] },
]
```

`solo_profile`(주인공 소개)에도 부모 이름이 없다. 돌잔치는 **부모가 초대의 주체**이므로 프로필에 `김도현 · 이서연의 첫째` 같은 한 줄이 있으면 좋다.

### B-7. 돌잡이 · 식순 안내가 없다

**현상.** `slide(안내사항)` 은 식사 안내 + 드레스 코드 2장뿐.

**왜 문제인가.** 돌잔치에 오는 사람이 실제로 궁금해하는 것은

- **돌잡이 시간** (늦게 오면 놓치는 하이라이트)
- **식순** (몇 시에 뭐 하는지)
- **답례품 / 돌떡** 수령 여부
- **주차 등록** 방법
- 아기가 있는 하객을 위한 **유아 의자 / 수유실** 여부

**수정안.** `tab` 또는 `slide` 에 항목 추가.

| 탭 | 내용 |
|---|---|
| 식순 | `11:00 입장 · 11:30 돌잡이 · 12:00 식사 · 13:00 마무리` |
| 돌잡이 | 참여 방법 안내 |
| 답례품 | 돌떡 수령 위치 |
| 오시는 길 | 현재 내용 유지 |
| 주차 | **신설** — 등록 방법 |

### B-8. `ending` 모듈에 제목이 없어 갑자기 끝난다

**현상.** RSVP → 사진 공유(빈 박스) → **구름 위 아기 사진 + "시안이의 첫 생일을 함께해 주셔서 감사합니다."** → 공유 버튼.

ending 이 섹션 제목 없이 사진만 크게 나와서, 앞 섹션과의 경계가 모호하고 사진 공유 모듈의 일부처럼 읽힌다.

**수정안.** ending 위에 얇은 디바이더를 두거나, `감사합니다 / Thank You` 라벨을 추가.

### B-9. 장소 상세주소 미노출

`비비드바우스 파티룸` 만 표시. → [00-common.md C-9](00-common.md)

---

## P2 — 개선

### B-10. 인사말 문구가 "감사"에 치우쳐 있다

현재: "첫 걸음마, 첫 미소, 첫 옹알이… 소중한 순간들을 **함께해 주신 분들께 감사의 마음을 전하고자 합니다.**"

돌잔치 초대장은 **초대**가 목적인데 문장의 무게가 감사에 실려 있다. 마지막 문단("저희 시안이의 첫 생일에 따뜻한 축하를 부탁드립니다")이 초대이지만 뒤에 붙어 약하다. 초대 → 감사 순서로 바꾸는 편이 자연스럽다.

### B-11. 6785px 는 길다

모듈 18개가 전부 ON. `midphoto` 는 커버 직후라 커버와 역할이 겹치고, `interview`(시안이의 한마디)와 `solo_profile`(주인공 소개)도 성격이 유사하다.

기본 ON 은 14~15개로 줄이고 나머지는 에디터에서 추가하도록.

### B-12. `주인공 소개` 의 해시태그

`#웃음요정 #잠꾸러기` — 좋은 아이디어. 다만 그 아래 `울다 웃다 자다 / 그렇게 1년` 은 시적이지만 **정보가 0** 이다. 태어난 날짜 · 키/몸무게 · 좋아하는 것 같은 구체 정보가 한 줄 있으면 더 살아난다.

---

## 이미지 애셋 교체 계획

### 현재 상태

| 용도 | 개수 | 상태 |
|---|---|---|
| 커버 | 1 | 품질 좋음. **나이가 커 보임** → 재생성 권장 |
| midphoto | 0 | 비어 있음 |
| gallery | 3 (webp) | 아기 일치 여부 확인 필요 |
| timeline | 4 | **전부 다른 아기 + 1장은 풍선** → 전량 교체 |
| ending | 1 | **또 다른 아기** → 교체 |
| photo_share | 0 | 샘플 채우기 필요 |

### 인물 일관성 전략

웨딩과 동일하게 **레퍼런스 고정 + 얼굴 노출 조절**을 병행한다. 다만 아기는 성장 단계별로 외모가 크게 달라지는 것이 자연스럽기 때문에, **"같은 아이의 다른 시기"로 보이게** 하는 것이 목표다. 아래를 고정하면 동일 아이로 읽힌다.

- 성별 · 피부톤 · **머리 색과 헤어라인**
- 눈 모양 (쌍꺼풀 유무)
- 배경 톤 (전 컷 크림/피치 통일)

### 공통 사양

4:5 또는 1:1, 1400px 이상, WebP/JPEG q85.
**공통 룩**: 크림·피치·소프트 코럴, 자연광, 밝고 부드러운 하이키, 저채도 파스텔. 한국인 아기.

#### 커버 (재생성)

```
Studio portrait of a smiling Korean baby girl at exactly twelve months old,
sitting upright in a soft pink hanbok with a delicate cream flower crown,
only two small lower front teeth visible, fine wispy dark hair, chubby cheeks,
soft pastel peach and cream floral backdrop softly out of focus, bright natural
window light, high-key soft lighting, gentle pastel color grade, professional
Korean baby first-birthday (doljanchi) studio photography, vertical 9:16
composition
```

> 핵심 지시어: `exactly twelve months old`, `only two small lower front teeth`, `fine wispy hair` — 현재 컷이 나이 들어 보이는 원인을 직접 겨냥.

#### timeline 4장 (성장 단계)

| 단계 | 프롬프트 요지 |
|---|---|
| 출생 당일 | 신생아, 흰 속싸개, 부모 손 위, 눈 감음 |
| 100일 | 3개월 아기, 크림 니트 바디수트, 배밀이 자세로 미소 |
| 처음이 가득했던 날들 | 8~10개월, 거실 러그 위 걸음마 시도, 부모가 뒤에서 박수 |
| **첫 생일** | **커버와 같은 12개월 아기 + 돌상/돌잡이 상차림** ← 풍선 사진 대체 |

```
(첫 생일)
Korean baby girl at twelve months old in a soft pink hanbok sitting in front of
a traditional Korean doljanchi table with rice cakes, fruit and a small stack of
doljabi objects, warm cream and peach pastel decorations, balloons softly out of
focus in the background, bright natural light, high-key soft pastel color grade,
professional Korean first-birthday photography, square 1:1 composition
```

#### ending (교체)

```
Korean baby girl at twelve months old lying on a soft cream blanket looking up
and laughing, surrounded by pale peach and ivory balloons, bright airy natural
light, high-key pastel color grade, dreamy soft focus edges, ample empty space
at the bottom for overlaid text, horizontal 16:9 composition
```

#### photo_share 샘플 3장

하객이 올릴 법한 **캐주얼한 스냅** 느낌이어야 한다 (스튜디오 컷이면 샘플로 보이지 않는다).

```
Candid smartphone-style snapshot at a Korean first-birthday party, guests'
hands clapping, a baby in pink hanbok blurred in the background, pastel
balloons and a cake table, slightly imperfect framing, warm indoor lighting,
natural casual mood, square 1:1 composition
```

---

## 작업 체크리스트

**seed (`prisma/seed.ts` — `BABY_FIRST_BIRTHDAY_TEMPLATE`)**

- [ ] B-1 `greetingAuthor: '아빠 · 엄마 드림'`
- [ ] B-3 `eventDate` 상대 날짜화 (오늘 +45일 권장) + 파생 문자열 전부 갱신
- [ ] B-4 `photo_share` 라벨 `하객 사진` → `오늘의 사진`, 샘플 이미지 추가
- [ ] B-5 `account` `titleBigVisible: false`
- [ ] B-6 `contact` 부모 실명 + 전화번호
- [ ] B-7 `tab` 에 식순 · 돌잡이 · 답례품 · 주차 추가
- [ ] B-8 `ending` 라벨 또는 디바이더
- [ ] B-10 인사말 초대 → 감사 순서로 재작성
- [ ] B-11 기본 ON 모듈 14~15개로 축소
- [ ] B-12 `solo_profile` 에 구체 정보 한 줄 추가

**코드** — [00-common.md](00-common.md) 배치 1

**이미지 (동일 아기 1명, 9장)**

- [ ] 커버 재생성 (12개월로 보이게)
- [ ] timeline 01~04 (출생/100일/걸음마/**첫 생일**)
- [ ] gallery 01~03 재확인 후 필요 시 교체
- [ ] ending 1장
- [ ] photo_share 샘플 3장
