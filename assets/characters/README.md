# 유형별 캐릭터 그림

그림이 준비되면 이 폴더에 넣고 `js/content.js`에서 해당 유형의 `image` 칸에 경로를 적으세요.

| 코드 | 유형 | 파일 예시 |
|---|---|---|
| FPM | 현장의 지지자 | `assets/characters/FPM.png` |
| IPM | 탐구하는 정책 기획자 | `assets/characters/IPM.png` |
| FCM | 개혁하는 문화인 | `assets/characters/FCM.png` |
| ICS | 공동체의 파수꾼 | `assets/characters/ICS.png` |
| FCS | 소통하는 확성기 | `assets/characters/FCS.png` |
| IPS | 법제화의 이끔이 | `assets/characters/IPS.png` |
| FPS | 열정적인 마이크 | `assets/characters/FPS.png` |
| ICM | 내일을 보는 기록자 | `assets/characters/ICM.png` |

```js
FPM: {
  name: "현장의 지지자",
  image: "assets/characters/FPM.png",   // ← 여기
```

권장 사양
- 배경이 투명한 PNG (또는 SVG), 세로로 긴 비율 약 **5 : 6** (예: 500×600px)
- 행진 화면에서 위에서 내려다보며 걷는 모습이면 레퍼런스(온라인 퀴어퍼레이드)와 잘 어울려요
- 영수증에는 흑백으로 인쇄되니, 선이 또렷한 그림이 좋아요
- 파일 크기는 장당 200KB 이하 권장 (모바일 데이터 · 핫스팟 환경)

`image`를 비워 두면 유형 색깔로 그린 임시 캐릭터가 자동으로 나옵니다.
