# A3 프로그램 소개 판넬 제작 프롬프트

아래 `---` 사이를 통째로 복사해서 디자인을 맡길 AI(또는 디자이너)에게 붙여 넣으세요.

---

# 작업: 부스 프로그램 「퀴어 활동 캐해」 A3 소개 판넬 디자인

부산퀴어행동이 2026 부산퀴어문화축제 부스에서 운영하는 유형 테스트 프로그램의 **A3 세로 판넬 1장**을 만들어 주세요.
지나가는 사람이 2~3m 거리에서 보고 다가와 QR을 찍게 만드는 것, 그리고 참여한 사람이 **자기 유형 칸에 스티커를 붙이는** 참여형 판넬이 목표입니다.

## 1. 결과물 규격

- 크기: **A3 세로 297 × 420mm**, 사방 **도련 3mm** (작업 크기 303 × 426mm), 중요한 글자·그림은 재단선 안쪽 **10mm 안전 여백** 안에
- 해상도: 300dpi 기준. 캐릭터는 아래 고해상도 PNG를 그대로 사용
- 결과 형식: **인쇄용 PDF** + 수정 가능한 원본
  - 코드로 만든다면: HTML 한 파일 + `@page { size: 297mm 420mm; margin: 0 }` 로 크롬 "PDF로 저장" 시 A3 한 장이 나오게
  - Figma/Canva/일러스트레이터라면: A3 아트보드에 아래 URL의 이미지를 직접 가져와 배치
- 스티커: 참여자가 지름 **약 8~10mm 원형 스티커**를 붙임 → 유형마다 **스티커 칸(최소 60 × 35mm, 비워 둔 영역)** 필요. 칸 안은 흰색 또는 아주 연한 색, 점선 테두리

## 2. 캐릭터 이미지 불러오기 (가장 중요)

8종 모두 **배경이 투명한 PNG**(세로 1800px, A3에 7cm로 넣어도 600dpi 이상)입니다.
**반드시 아래 URL의 파일을 실제로 내려받아/불러와서 쓰고, 비슷한 그림을 새로 그리거나 생성하지 마세요.**

| 코드 | 유형 이름 | 이미지 URL | 예비 URL (위가 안 열릴 때) |
|---|---|---|---|
| FPM | 현장의 지지자 | https://typetest.busanqueeract.kr/assets/print/characters/FPM.png | https://raw.githubusercontent.com/moah0o0/BQA_TYPETEST_PAGE_FRONTEND/claude/upbeat-heisenberg-tj5kuk/assets/print/characters/FPM.png |
| IPM | 탐구하는 정책 기획자 | https://typetest.busanqueeract.kr/assets/print/characters/IPM.png | https://raw.githubusercontent.com/moah0o0/BQA_TYPETEST_PAGE_FRONTEND/claude/upbeat-heisenberg-tj5kuk/assets/print/characters/IPM.png |
| FCM | 개혁하는 문화인 | https://typetest.busanqueeract.kr/assets/print/characters/FCM.png | https://raw.githubusercontent.com/moah0o0/BQA_TYPETEST_PAGE_FRONTEND/claude/upbeat-heisenberg-tj5kuk/assets/print/characters/FCM.png |
| ICS | 공동체의 파수꾼 | https://typetest.busanqueeract.kr/assets/print/characters/ICS.png | https://raw.githubusercontent.com/moah0o0/BQA_TYPETEST_PAGE_FRONTEND/claude/upbeat-heisenberg-tj5kuk/assets/print/characters/ICS.png |
| FCS | 소통하는 확성기 | https://typetest.busanqueeract.kr/assets/print/characters/FCS.png | https://raw.githubusercontent.com/moah0o0/BQA_TYPETEST_PAGE_FRONTEND/claude/upbeat-heisenberg-tj5kuk/assets/print/characters/FCS.png |
| IPS | 법제화의 이끔이 | https://typetest.busanqueeract.kr/assets/print/characters/IPS.png | https://raw.githubusercontent.com/moah0o0/BQA_TYPETEST_PAGE_FRONTEND/claude/upbeat-heisenberg-tj5kuk/assets/print/characters/IPS.png |
| FPS | 열정적인 마이크 | https://typetest.busanqueeract.kr/assets/print/characters/FPS.png | https://raw.githubusercontent.com/moah0o0/BQA_TYPETEST_PAGE_FRONTEND/claude/upbeat-heisenberg-tj5kuk/assets/print/characters/FPS.png |
| ICM | 내일을 보는 기록자 | https://typetest.busanqueeract.kr/assets/print/characters/ICM.png | https://raw.githubusercontent.com/moah0o0/BQA_TYPETEST_PAGE_FRONTEND/claude/upbeat-heisenberg-tj5kuk/assets/print/characters/ICM.png |

이미지 사용 규칙

1. **8장 모두 불러왔는지 먼저 확인**하고 시작하세요. 하나라도 실패하면 예비 URL로 다시 시도하고, 그래도 안 되면 그 칸을 회색 상자 + "FPM 이미지 자리"처럼 표시하고 **어떤 파일이 실패했는지 알려 주세요.** 임의의 그림으로 대체하지 마세요.
2. HTML로 만든다면 `<img src="(위 URL)">`를 그대로 쓰고, `object-fit: contain` · 원본 비율 유지. 로컬 파일로 받았다면 `characters/FPM.png`처럼 상대 경로로 바꿔도 됩니다.
3. 그림을 **자르지(crop) 말고, 색을 바꾸거나 필터를 씌우지 마세요.** 투명 배경이라 어떤 바탕색 위에도 그대로 올라갑니다.
4. 8마리 모두 **같은 높이(약 55~70mm)** 로 맞추고, 그림마다 좌우 폭이 달라도 가운데 정렬.
5. 그림은 "무지개색 목털을 가진 비둘기"가 각자 소품(횃불·확성기·돋보기·기타·연단·법전·찻잔·카메라)을 든 손그림 일러스트입니다.

QR 코드 (테스트 사이트 https://typetest.busanqueeract.kr/ 로 연결)

- SVG(권장, 확대해도 깨지지 않음): https://typetest.busanqueeract.kr/assets/print/qr-typetest.svg
- PNG: https://typetest.busanqueeract.kr/assets/print/qr-typetest.png
- 인쇄 크기 **최소 45 × 45mm**, 둘레에 흰 여백 유지, 색 바꾸지 말 것(검정/흰색)

전체 유형 데이터(JSON, 문구를 정확히 옮길 때 참고): https://typetest.busanqueeract.kr/assets/print/types.json

## 3. 들어갈 내용과 문안

문안은 아래를 바탕으로 다듬어도 되지만, **유형 이름·한 줄 설명·축 조합은 바꾸지 마세요.** 말투는 친근한 반말·해요체 섞인 축제 톤, 짧고 리듬감 있게.

### ① 상단 타이틀 영역 (판넬 위 1/4)

- 작은 글씨: `부산퀴어행동 부스 프로그램`
- 메인 타이틀(가장 크게): **`퀴어 활동 캐해`**
- 부제: `나에게 맞는 퀴어 활동 유형 찾기`
- 한 줄 후킹 문구 (예시, 다듬어도 됨): `운동에는 여러 역할이 필요해요. 당신은 어떤 활동가인가요?`

### ② 참여 방법 (번호 붙인 4단계, 아이콘 또는 숫자 원)

1. **QR 찍기** — 폰 카메라로 QR을 찍어요
2. **15문항 답하기** — 닉네임을 정하고, 15개 질문에 답해요 (2~3분)
3. **한마디 남기기** — 행진하며 외치고 싶은 한마디를 남기면, 내 캐릭터가 온라인 행진에 합류해요
4. **해설지 받고 스티커 붙이기** — 결과 번호를 부스에 말하면 해설지 라벨을 뽑아 드려요. 판넬의 **내 유형 칸에 스티커**를 붙여 주세요!

- QR은 이 영역 옆에 크게 (45mm 이상), 아래에 `typetest.busanqueeract.kr` 텍스트도 함께
- 작은 안내: `이름·연락처는 받지 않아요. 닉네임과 결과만 저장돼요.`

### ③ 8가지 유형 (판넬의 중심, 가장 넓게: 2열 × 4행 또는 4열 × 2행)

유형은 세 가지 축으로 나뉘어요. 축 설명을 유형 그리드 위에 작게 넣어 주세요:
`활동 무대 현장 ↔ 제도 · 지향 가치 정치 ↔ 문화·미디어 · 연대 대상 대중 ↔ 당사자`

각 유형 카드에 들어갈 것: **캐릭터 그림 / 유형 이름(크게) / 한 줄 설명 / 축 태그 3개 / 스티커 칸**

| 코드 | 유형 이름 | 한 줄 설명 | 축 태그 |
|---|---|---|---|
| FPM | 현장의 지지자 | 항상 사람들 곁을 지키는 사람 | 현장 · 정치 · 대중 |
| IPM | 탐구하는 정책 기획자 | 우리의 내일이 구체적으로 바뀌길 바라는 사람 | 제도 · 정치 · 대중 |
| FCM | 개혁하는 문화인 | 우리의 활동을 더 아름답게 만드는 사람 | 현장 · 문화·미디어 · 대중 |
| ICS | 공동체의 파수꾼 | 따뜻한 공동체를 가꾸어 가는 사람 | 제도 · 문화·미디어 · 당사자 |
| FCS | 소통하는 확성기 | 우리의 활동을 더 매력적으로 바꾸는 사람 | 현장 · 문화·미디어 · 당사자 |
| IPS | 법제화의 이끔이 | 지성과 이성으로 힘을 모으는 사람 | 제도 · 정치 · 당사자 |
| FPS | 열정적인 마이크 | 말과 글로 벽을 깨부수는 사람 | 현장 · 정치 · 당사자 |
| ICM | 내일을 보는 기록자 | 어제와 오늘을 모아 내일을 만드는 사람 | 제도 · 문화·미디어 · 대중 |

- 순서는 위 표 순서 그대로. 축이 비슷한 유형끼리 이웃하게 배치하고 싶다면 `현장(F…)` 4개 / `제도(I…)` 4개로 나눠도 좋음
- 스티커 칸에는 작은 안내 `여기에 스티커를 붙여 주세요` (첫 카드에만 넣거나, 모든 칸에 아주 연하게)
- 카드 안 글자 크기: 유형 이름 22pt 이상, 한 줄 설명 11pt 이상, 축 태그 9pt 이상

### ④ 하단 (판넬 아래, 좁은 띠)

- `혼자서 모든 역할을 할 수는 없어요. 운동이 성공하려면 여러 역할이 모두 필요해요.` (평화캠프 "활동가의 네 가지 역할"에서)
- `부산퀴어행동` 로고 자리 (텍스트로 대체 가능)
- `2026 부산퀴어문화축제`

## 4. 디자인 방향

웹사이트(https://typetest.busanqueeract.kr)와 한 세트로 보이게 해 주세요. 사이트를 직접 열어 분위기를 참고해도 좋습니다.

- **모티프**: 위에서 내려다본 **행진 대열**. 파랑·보라 바탕 위에 흰 **점선 차선**(세로 3줄)과 아래로 향하는 연한 **화살표**, 그 위를 캐릭터들이 걸어가는 느낌. 참여 버튼처럼 **물결치는 무지개 깃발** 띠를 강조 요소로 한 번 사용
- **색** (사이트와 동일)
  - 바탕: `#5A52D5`(위) → `#5874E6`(아래) 그라데이션
  - 진한 남색(글자·테두리): `#1D1D4F`
  - 강조 분홍: `#FF4D6D` · 노랑: `#FFE45E` · 연보라 카드: `#E7C8FF` / `#F4F3FF`
  - 무지개 띠: `#FF3B3B #FF9F1C #FFE14D #7ED957 #5AA9FF #8A4DFF`
- **글꼴**
  - 타이틀: **Gasoek One** (Google Fonts, 굵고 둥근 한글 디스플레이체)
  - 본문: **Pretendard** (굵기 600~800 위주)
- **카드 스타일**: 흰 카드 + 진한 남색 **2.5~3px 테두리** + 아래로 떨어지는 단색 그림자(`0 6px 0 rgba(29,29,79,.18)` 느낌), 모서리 둥글게(4~6mm)
- 전체적으로 **밝고 장난스럽지만 정돈된** 축제 포스터. 캐릭터가 주인공이 되도록 장식은 절제
- 2~3m 거리에서 타이틀과 QR, 8개 캐릭터가 한눈에 들어올 것. 글자는 바탕과 대비 충분히(흰 바탕 카드 위 남색 글자)

## 5. 제출 전 점검표

- [ ] 8개 캐릭터 이미지가 **모두 실제 파일로** 들어갔다 (자리 표시만 있는 칸 없음)
- [ ] 유형 이름·한 줄 설명·축 태그가 위 표와 **글자 하나까지 같다**
- [ ] QR이 45mm 이상이고, 폰으로 찍으면 https://typetest.busanqueeract.kr/ 이 열린다
- [ ] 유형마다 스티커 칸(60 × 35mm 이상)이 비어 있다
- [ ] A3(297 × 420mm) + 도련 3mm, 안전 여백 10mm 안에 중요한 요소가 있다
- [ ] 가장 작은 글자가 9pt 이상이다
- [ ] 어떤 이미지가 불러와지지 않았는지, 문안을 어디서 다듬었는지 마지막에 정리해서 알려 준다

---
