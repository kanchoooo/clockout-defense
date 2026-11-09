# 🕕 칼퇴 디펜스

모니터 구석의 작은 **시계탑 요새**를 09:00부터 18:00까지 지켜 정시에 퇴근하는 도트 서바이벌 디펜스.
안 읽은 메일·회의 슬라임·야근 유령이 사방에서 몰려오고, 11:59·14:59·**17:59**에는 시계가 멈추며 요일마다 다른 보스가 나타납니다.

- 맥 / 윈도우 (Electron 44 + TypeScript, 프레임워크 없음 — 첫눈·웜홀·비둘기 모니터와 같은 구조)
- 480×300 도트 화면을 1 / 1.5 / 2 / 3배로 키워 화면 구석에 항상 위로 띄움
- 이펙트·몬스터: [pixelfx](https://github.com/patch-gg/pixelfx) (MIT)
- 한글 글꼴: [Galmuri](https://github.com/quiple/galmuri) (OFL)

## 다운로드

- 윈도우 10/11 (64비트): [ClockOutDefense-Setup.exe](https://github.com/kanchoooo/clockout-defense/releases/latest/download/ClockOutDefense-Setup.exe) — "Windows의 PC 보호" 창이 뜨면 **추가 정보 → 실행**

## 실행

```bash
npm install
npm run dev              # 개발 모드
npm test                 # 규칙 시험 + 자동 플레이 승률표
npm run dist:mac:local   # 서명 없이 이 맥용 앱 만들기 → dist/mac/ClockOutDefense.app
```

배포용: `npm run dist:mac`(유니버설 + Developer ID 서명 + 공증, 첫눈 모니터와 같은 스크립트 · 아직 돌려 본 적 없음) · `npm run dist:win`(서명 없는 NSIS).
GitHub 릴리스·자동 업데이트는 저장소를 만들 때 `electron-builder.yml` 의 `publish` 와 `electron-updater` 를 붙이면 됩니다.

## 게임 방법

| 조작 | 하는 일 |
|---|---|
| 화면 누르기 | **결재 도장** 쾅 — 범위 피해, 누르고 있으면 계속 찍음 |
| Space | **사직서** 제출 — 화면 전체 공격 (처치로 충전) |
| 1 · 2 · 3 | 배속 |
| P · Esc | 일시정지 |
| M | 소리 켜기/끄기 |
| ⌃⌥D (윈도우 Ctrl+Alt+D) | **팀장 등장** — 표 계산 위장 화면 또는 창 숨기기 (설정에서 선택) |

**흐름** 첫 장비 1개 고르기 → 27라운드(20분 단위) 동안 자동 공격으로 방어 → 라운드 사이 **쉬는 시간**에 장비·복지 카드 구매. 12:00 점심시간은 멘탈 40% 회복 + 20% 할인.

- **장비 15종, 부서 6개**: 총무팀(서류)·탕비실(불)·시설팀(얼음)·전산팀(전기)·야근조(독·어둠)·인사팀(빛). 같은 부서를 모으면 시너지.
- **승진**: 같은 장비를 또 사면 사원 → 대리 → 과장 → 차장 → 부장 → 이사.
- **복지 카드 27종**: 공격 속도·피해·치명타·멘탈 회복 등.
- **이자**: 수당을 남기면 다음 라운드에 이자가 붙음.
- **요일 5개**: 월요일을 깨면 화요일이 열리고, 금요일까지. 요일마다 등장 유닛 구성과 보스 3종이 다릅니다 (보스 15종, 유닛 25종).
- **난이도 4개**: 이지·노말은 처음부터, 하드는 노말 금요일을 깨면, 헬은 하드 금요일을 깨면 열립니다. 요일 진행은 난이도별로 따로입니다.
- **무한 야근**: 아무 난이도든 금요일을 깨면 열림. 18시 이후 쓰러질 때까지 계속되고 9라운드마다 보스가 나옵니다.
- **사내 복지**: 받은 월급으로 사는 영구 강화 10종.
- **자동 근무**: 켜 두면 쇼핑·도장·사직서를 대신해서 일하면서 구경만 해도 됨.
- 쉬는 시간마다 저장되어 껐다 켜도 이어서 출근.

## 구조

| 경로 | 내용 |
|---|---|
| `src/renderer/src/game/defs.ts` | **숫자를 고치는 곳**: 장비·카드·적·라운드·요일 |
| `src/renderer/src/game/sim.ts` | 규칙 전부. 화면과 분리, 1/60초 고정·시드 난수 (같은 입력 = 같은 결과) |
| `src/renderer/src/game/autoplay.ts` | 자동 근무 + 밸런스 측정용 플레이어 |
| `src/renderer/src/gfx/view.ts` | 사건을 pixelfx 이펙트로 바꿔 한 프레임에 합성 |
| `src/renderer/src/gfx/bake.ts` | 몬스터 애니메이션을 시작할 때 프레임으로 구움 |
| `src/renderer/src/gfx/art/` | 시계탑·기사·골렘·보스·사무용품 유닛 (pixelfx 방식의 코드 도트) |
| `src/renderer/src/vendor/pixelfx/` | pixelfx 중 쓰는 파일만 복사 (`VERSION` 에 커밋, `LICENSE`·`NOTICE.md` 유지) |
| `src/renderer/src/ui/app.ts` | 화면 흐름·입력·HUD·상점 |
| `src/renderer/src/ui/script.ts` | 시험용 자동 조작 |
| `src/main/index.ts` | 창(구석 배치·항상 위·투명)·트레이·단축키·저장 |

저장 위치: 앱 userData 의 `settings.json` · `profile.json` · `run.json`.

## 시험

```bash
npm test                                    # 규칙 시험
BAL=1 N=30 ONLY=normal META=none npm test   # 난이도·복지별 승률표만 (ONLY·META 생략 시 전부)
node scripts/art-lab.mjs 확인.png            # 시계탑·보스 그림을 한 장으로

# 실제 앱을 화면 없이 돌리기 (npm run build 먼저)
PD_HEADLESS=1 PD_SCRIPT=flow PD_LOG=1 npx electron .                     # 실제 클릭·키로 처음부터 끝까지
PD_HEADLESS=1 PD_SCRIPT=tour PD_SHOT_DIR=폴더 PD_LOG=1 npx electron .     # 주요 장면 저장 + 프레임 시간
```

`PD_USERDATA=폴더` 를 주면 진짜 저장을 건드리지 않습니다.
