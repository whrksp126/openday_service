# 01. 클래식 웨딩 청첩장

| 항목 | 값 |
|---|---|
| id | `wedding-classic-template-001` |
| 카테고리 | 웨딩 · 웨딩(본식) |
| 콘셉 | 크림/베이지 클래식. 서비스의 **간판 템플릿** |
| 테마 | 크림 배경 + 테라코타 accent |
| 페이지 높이 | **8557px** (11개 중 최장, 10구간) |
| 캡처 | `_shots/wedding-classic-template-001__00~09.png` |

**모듈 구성 (16개)**
`main → greeting → midphoto → profile → datetime → venue → gallery → slide(안내사항) → guestbook → account → contact → timeline → timeline_polaroid → rsvp → tab(오시는 길) → interview`

---

## 이 템플릿의 핵심 진단

> 개별 모듈의 완성도는 11개 중 가장 높다. 문제는 **일관성과 순서**다.
> 사진마다 커플이 바뀌고, 위치 정보가 5개 섹션 떨어져 두 군데로 쪼개져 있고, 8557px 를 다 내려가면 인터뷰로 끝난다.

---

## P0 — 치명

### W-1. 사진마다 커플이 다르다

**현상.** 한 청첩장 안에서 **최소 4~5쌍의 서로 다른 커플**이 등장한다.

| 위치 | 인물 |
|---|---|
| 커버 (`main`) | 베이지 수트 남 · 레이스 드레스 여 (의자에 앉은 컷) |
| `midphoto` | **다른 커플** — 한복 스튜디오 |
| `gallery` 9장 | 실내 웨딩드레스 커플 / 야외 정원 커플 / 한복 커플 / 주방 신부 솔로 — **적어도 4쌍** |
| `timeline_polaroid` 3장 | 한복 신부 솔로 · 한복 신랑 솔로 · 한복 커플 |
| `slide(안내사항)` 배경 | 또 다른 흰 옷 커플 |

**왜 치명적인가.** 청첩장은 **두 사람의 이야기**다. 사용자가 이 템플릿을 미리보기로 열었을 때 "내 사진을 넣으면 이렇게 되겠구나"를 상상해야 하는데, 지금은 **스톡 사진 모음집**으로 읽힌다. 웨딩은 서비스의 간판 카테고리이므로 여기서의 신뢰 손실이 가장 크다.

**수정안.** **동일 커플 1쌍**으로 전 컷을 재생성한다. 아래 이미지 애셋 계획 참조. 인물 일관성이 이 템플릿 개선의 최대 난이도이자 최대 효과 지점이다.

---

### W-2. 위치 정보가 두 군데로 쪼개져 있다

**현상.** 모듈 순서상

```
… venue(지도) → gallery → slide → guestbook → account → contact
  → timeline → polaroid → rsvp → tab(오시는 길) → interview
```

**지도와 "오시는 길(지하철/버스/택시)" 사이에 8개 섹션 / 약 4000px** 이 끼어 있다. 하객이 교통편을 확인하려면 지도를 본 뒤 한참을 더 내려가야 하고, 그 사실을 모르면 "교통 안내가 없네"라고 판단한다.

**수정안.** `tab(오시는 길)` 을 `venue` 직후로 이동. → [00-common.md C-11](00-common.md)

---

## P1 — 주요

### W-3. 모듈 순서 전반 재배치

**현상.** 현재 순서는 스토리라인이 없다. `guestbook`(방명록, 상호작용)이 중간에 나오고, `timeline`·`polaroid`(두 사람 이야기)가 계좌·연락처 뒤에 있으며, `interview` 가 **맨 마지막**이다.

**왜 문제인가.** 청첩장은 아래 흐름이 관습이자 정보 우선순위다.

```
누구 → 왜(인사) → 두 사람 소개 → 언제 → 어디서 → 어떻게 가나
→ (감상) 사진·이야기 → 참석 회신 → 마음 전하기 → 연락처 → 방명록
```

**수정안 — 권장 순서**

| order | 모듈 | 근거 |
|---|---|---|
| 1 | main | |
| 2 | greeting | |
| 3 | midphoto | 인사말 뒤 호흡 |
| 4 | profile (저희를 소개합니다) | |
| 5 | datetime | **핵심 정보 시작** |
| 6 | venue | |
| 7 | **tab (오시는 길)** | **venue 바로 뒤로 이동** (W-2) |
| 8 | slide (안내사항) | 예식 당일 유의사항 — 위치 정보 직후가 맥락상 맞음 |
| 9 | gallery | 감상 파트 시작 |
| 10 | timeline | |
| 11 | timeline_polaroid | |
| 12 | interview | **감상 파트 안으로 이동** (현재 맨 끝) |
| 13 | rsvp | **행동 유도** |
| 14 | account | |
| 15 | contact | |
| 16 | guestbook | 마무리 |

### W-4. 연락처에 이름이 아니라 역할만 나온다

**현상.** 커버·인사말은 `김민준` / `이지수` 인데, 연락처 카드는 `신랑` · `신랑 아버님` · `신랑 어머님` · `신부` … 로 **역할명만** 표시된다.

또한 신랑/신부만 전화 아이콘이 활성이고 부모 4명은 회색 비활성이라, **한 카드 묶음 안에 활성/비활성이 섞여 버그처럼 보인다.**

**수정안.**

```ts
groups: [
  { label: '신랑 측', englishLabel: 'GROOM', contacts: [
    { name: '신랑 김민준',    phone: '010-0000-0000' },
    { name: '아버지 김아빠',  phone: '010-0000-0000' },
    { name: '어머니 박엄마',  phone: '010-0000-0000' },
  ]},
  { name 동일 패턴으로 신부 측 }
]
```

`profile` 모듈이 이미 `김아빠 · 박엄마의 아들` 이라고 부모 이름을 쓰고 있으므로 **연락처와 이름이 일치**해야 한다. → 빈 번호 처리는 [00-common.md C-10](00-common.md)

### W-5. 계좌 섹션 제목 3중 중복

`계좌 정보` / `Account` / `마음 전하실 곳` 이 연달아 3줄. → [00-common.md C-8](00-common.md)

```ts
// to-be
{ koreanTitle: '마음 전하실 곳', englishTitle: 'Account', titleBigVisible: false }
```

### W-6. 폴라로이드 캡션과 사진이 따로 논다

| 캡션 | 실제 사진 |
|---|---|
| `우리의 하루` — "평범하지만 특별한 일상을 담았습니다." | 한복 스튜디오 신부 솔로컷 |
| `웨딩 촬영` — "가장 빛나는 순간을 사진에 새겼습니다." | 한복 스튜디오 신랑 솔로컷 |
| `함께한 시간` | 한복 커플 |

"평범한 일상"이라면서 스튜디오 정장 컷을 쓰고, "웨딩 촬영"이라면서 한복을 쓴다. 게다가 **3장 모두 한복 스튜디오**라 갤러리의 한복 컷과 중복된다.

**수정안.** 캡션에 맞는 사진으로 교체 — 일상 스냅(카페/산책), 웨딩 촬영 현장, 함께 걷는 뒷모습. (이미지 계획 참조)

### W-7. 안내사항 슬라이드의 기본 내용이 지나치게 특수하다

**현상.** 첫 슬라이드가 **"강아지 화동 안내"** — "특별한 순간에 저희 반려견이 화동으로 함께합니다. 알러지나 두려움이 있으신 분은 미리 알려주시면…"

**왜 문제인가.** 템플릿 기본값은 **대다수 사용자가 그대로 쓰거나 살짝 고쳐 쓰는 것**이어야 한다. 반려견 화동은 소수 사례이고, 대부분의 사용자는 이 슬라이드를 통째로 지워야 한다. 미리보기에서도 "이 서비스는 뭔가 특이하네"로 읽힌다.

**수정안.** 범용 항목으로 교체하고, 반려견 화동은 **선택 프리셋**으로 별도 제공.

| 슬라이드 | 내용 |
|---|---|
| 1. 화환 안내 | 축하 화환은 정중히 사양합니다 (또는 받습니다) |
| 2. 연회 & 식사 안내 | 현재 내용 유지 — 좋다 |
| 3. 포토부스 / 사진 촬영 | 본식 사진 촬영 협조 안내 |
| (선택 프리셋) | 반려견 화동 · 답례품 · 셔틀버스 |

또한 첫 슬라이드에서 **본문이 잘려 페이드아웃**된다("미리 알려주시면 반려견 동선과…"에서 끊김). 슬라이드 높이가 고정이라 긴 본문이 넘친다 — 높이 auto 또는 본문 길이 가이드 필요.

### W-8. 지도 핀이 예식장이 아니라 강남역 사거리

**현상.** `venue.name` = `서울 그랜드 웨딩홀 2층 그레이스홀` 인데 지도는 **강남역 지하철 출구 · IBK기업은행 · 메가박스 · 다이소** 가 보이는 교차로 중심이다. 예식장 건물이 어디인지 알 수 없다.

**수정안.** 실제 웨딩홀급 건물의 좌표를 쓰거나, 좌표를 살짝 조정해 랜드마크가 아닌 건물 위에 핀이 오도록 한다. `zoom` 을 16 → 17 로 올려 건물 단위로 좁히는 것도 도움이 된다.

### W-9. 인터뷰 3번 문항만 답변 형식이 다르다

Q1·Q2 는 `신랑 김민준` / `신부 이지수` 로 나눠 답하는데, Q3(신혼여행)만 라벨 없이 `미국과 칸쿤으로 13박 14일.` 한 줄이다. 형식 통일 또는 Q3 를 공동 답변임이 드러나는 라벨(`두 사람`)로 처리.

---

## P2 — 개선

### W-10. 8557px 는 너무 길다

11개 중 최장이며 2위(돌잔치 6785px)와도 큰 차이가 난다. 모듈 16개 전부가 기본 ON 이다.

**수정안.** `timeline` 과 `timeline_polaroid` 는 **성격이 겹친다**(둘 다 "우리의 이야기를 사진+텍스트로"). 기본값은 둘 중 하나만 ON, 나머지는 에디터에서 추가하도록 한다. 이것만으로 ~1500px 가 줄고 스토리 중복도 사라진다.

### W-11. 커버 부케 색이 팔레트와 충돌

크림/베이지/테라코타 톤인데 부케가 **주황·빨강**이라 화면에서 가장 튀는 요소가 되어버렸다. 아이보리·샴페인·더스티핑크 계열 부케로 교체.

### W-12. 섹션 라벨을 웨딩 어휘로

`행사 일시` / `행사 장소` → **`예식 일시`** / **`예식 장소`**. → [00-common.md C-6](00-common.md)

---

## 이미지 애셋 교체 계획

### 현재 상태

| 용도 | 개수 | 상태 |
|---|---|---|
| 커버 | 1 | 구도·조명 양호. 부케 색만 조정 |
| midphoto | 1 | 다른 커플 → **교체** |
| gallery | **9** | 최소 4쌍 혼재 → **전량 교체** |
| polaroid | 3 | 캡션 불일치 + 한복 중복 → **전량 교체** |
| slide 배경 | 2 | 또 다른 커플 → **교체** |

**총 16장을 동일 커플 1쌍으로 재생성해야 한다.** 이 템플릿의 이미지 작업량이 11개 중 압도적으로 크다.

### 인물 일관성 확보 전략

이미지 생성 시 얼굴 일관성은 프롬프트만으로는 유지되지 않는다. 아래 중 하나를 택한다.

1. **레퍼런스 이미지 고정** — 커버 컷 1장을 먼저 확정하고, 이후 모든 컷을 그 이미지를 레퍼런스로 넣어 생성 (Gemini/Imagen 의 image-to-image / character reference 기능).
2. **얼굴 노출 최소화** — 뒷모습 · 옆모습 · 손 클로즈업 · 실루엣 · 얕은 심도로 구성하고, 정면 얼굴은 커버와 profile 2장만. **가장 현실적이고 실패 위험이 낮다.**
3. **한 세션 연속 생성** — 같은 대화 세션에서 "동일 인물" 을 유지하며 연속 생성.

→ **2번을 기본 전략으로, 정면 컷만 1번을 병행**할 것을 권한다.

### 공통 사양

4:5 세로(갤러리) / 3:4(폴라로이드) / 16:9(midphoto), 1600px 이상, JPEG q85.
**공통 룩**: 아이보리·크림·웜 베이지·소프트 테라코타. 자연광, 필름 그레인 약간, 저채도. 한국인 20대 후반~30대 초반 커플. 신랑 베이지/아이보리 수트, 신부 레이스 슬리브 드레스.

#### 커버 (재생성 — 부케만 조정)

```
Korean couple in their late twenties seated on wooden chairs facing each other
in a bright studio with an ivory wall, groom in a soft beige suit with white
tee, bride in a long ivory lace-sleeve wedding dress with a delicate veil and
a small floral hairpiece, bride holding a bouquet of ivory garden roses,
champagne ranunculus and dusty pink lisianthus, soft natural window light from
the left, warm cream color grade, fine film grain, editorial Korean wedding
studio photography, vertical 9:16 composition
```

#### midphoto (16:9 가로 · 한복)

```
Same Korean couple in traditional hanbok standing side by side against a plain
warm grey studio backdrop, bride in an ivory hanbok holding a small bouquet of
white and cream flowers, groom in a beige and ivory hanbok, both looking at the
camera with gentle smiles, soft even studio lighting, muted warm color grade,
editorial Korean wedding photography, horizontal 16:9 composition
```

#### gallery 01~09 (얼굴 노출 최소 전략)

| # | 프롬프트 요지 |
|---|---|
| 01 | 커버와 같은 스튜디오, 이마를 맞댄 클로즈업, 눈 감음 |
| 02 | 창가 커튼 앞 실루엣, 역광 |
| 03 | 정원 아치 아래 걸어가는 **뒷모습** 전신 |
| 04 | 맞잡은 손 클로즈업 — 반지, 드레스 레이스 |
| 05 | 신부 뒷모습 — 베일과 드레스 뒷라인 |
| 06 | 한복 커플 옆모습, 얕은 심도 |
| 07 | 부케 정물 — 인물 없음 |
| 08 | 웨딩홀 로비 창가에 앉은 두 사람 원경 |
| 09 | 걸어가며 웃는 커플 뒷모습, 햇살 플레어 |

예시 (03):

```
Rear view of a Korean bride and groom walking away hand in hand under a garden
arch covered in white roses, bride in a long ivory lace wedding dress with a
flowing veil, groom in a beige suit, dappled afternoon sunlight, soft bokeh
foliage, warm cream and sage color grade, fine film grain, editorial wedding
photography, full body, faces not visible, vertical 4:5 composition
```

예시 (04):

```
Extreme close-up of a Korean couple's hands clasped together, simple gold
wedding bands, the bride's ivory lace sleeve and a few small cream flowers
softly out of focus in the background, warm natural window light, shallow depth
of field, cream and champagne color grade, fine film grain, editorial detail
shot, vertical 4:5 composition
```

#### polaroid 01~03 (캡션과 일치하도록)

| 캡션 | 프롬프트 요지 |
|---|---|
| 우리의 하루 | 카페 창가에서 마주 보고 웃는 **캐주얼 사복** 커플, 자연광 스냅 |
| 웨딩 촬영 | 스튜디오 촬영 현장 — 드레스 자락을 정리하는 순간, 비하인드 무드 |
| 함께한 시간 | 노을 진 강변을 나란히 걷는 **뒷모습** |

```
Candid photo of a Korean couple in their late twenties sitting across a small
cafe table by a sunlit window, casual everyday clothes in cream and beige tones,
both laughing naturally, coffee cups on the table, warm afternoon light, soft
film grain, muted warm color grade, documentary lifestyle photography,
vertical 3:4 composition
```

#### slide 배경 2장

안내사항 슬라이드의 배경은 **텍스트 가독성이 우선**이다. 인물이 크게 들어가면 글자를 읽기 어렵다.

```
Very soft, overexposed, low-contrast image of a Korean wedding couple standing
far away in a bright ivory room, heavily blurred and washed out, dominated by
large areas of pale cream and white negative space, dreamy high-key lighting,
intended as a subtle background layer behind overlaid text, horizontal 16:9
composition
```

---

## 작업 체크리스트

**seed (`prisma/seed.ts` — `WEDDING_TEMPLATE`)**

- [ ] W-2/W-3 모듈 `order` 전면 재배치 (위 표)
- [ ] W-4 `contact` 이름을 실명 + 통일된 전화번호로
- [ ] W-5 `account` `titleBigVisible: false`, `koreanTitle: '마음 전하실 곳'`
- [ ] W-6 폴라로이드 캡션↔사진 정합
- [ ] W-7 `slide` 안내사항 기본 내용 교체 (강아지 화동 → 화환 안내)
- [ ] W-8 `venue.lat/lng` 를 건물 단위로 조정
- [ ] W-9 인터뷰 Q3 답변 형식 통일
- [ ] W-10 `timeline_polaroid` 기본 OFF (또는 `timeline` OFF)
- [ ] W-12 `venueKoreanTitle: '예식 장소'`, `datetimeKoreanTitle: '예식 일시'`
- [ ] C-7 `eventDate` 상대 날짜화 (오늘 +85일 권장)

**코드** — [00-common.md](00-common.md) 배치 1 전체 + W-7 슬라이드 높이 auto

**이미지 (16장, 동일 커플 1쌍)**

- [ ] 커버 재생성 (부케 색 조정)
- [ ] midphoto 1장
- [ ] gallery 01~09 (9장)
- [ ] polaroid 01~03 (3장)
- [ ] slide 배경 2장
