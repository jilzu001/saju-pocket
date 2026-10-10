# 데이터와 출처

| 데이터 | 출처·조건 | 실제 용도 |
|---|---|---|
| 한국 음양력 | usingsky/korean_lunar_calendar_js 0.4.0, MIT | 양력·음력 변환, 윤달·날짜 검증 |
| 절입·명식 | golbin/ssaju 0.2.0, MIT | 양력과 한국 시각으로 년·월·일·시주 계산 |
| 일간 10종·오행 5종 해석 | 자체 작성 `content.js` | 강점·과용 패턴·개선 행동·관계·일·돈 |
| MBTI | 입력한 4축 조합별 자체 문장 | 선택한 성향의 소통 힌트, 문항 검사 없음 |
| 혈액형 | 선택한 혈액형의 재미 질문 | 자기 생각을 나누는 질문만 제공, 계산·궁합에 영향 없음 |
| 나이대 6구간 | 자체 생활 제안 | 탐색·선택·기반·조정·경험·리듬; 대운과 구분 |
| 개인 미션 30종 / 둘 미션 12종 | 자체 작성 | 날짜별 작은 행동 제안 |
| 한국천문연구원 2026 달력자료 | 로컬 조사 참고, 예비 자료 | 설날 2월 17일 음력 변환 검증; 운영 자산·공개 저장소에 원문 미배포 |

라이브러리 라이선스 원문은 `vendor/`에 보존. 달력 모듈은 CommonJS export를 ES module export로 바꾸어 브라우저에 사용했다. 배포본에서 외부 CDN에 의존하지 않는다.

상세 콘텐츠 확장판의 자체 문장은 `reading-content.js`, 조합 규칙은 `reading.js`에 있다. 일간 10종, 오행 5종, 계절 4종, 십신 10종, MBTI 4축, 생활 단계 6구간, 관계 3종을 연결한다. 기능·한계는 `DEVELOPMENT_CONTENT.md`, 내부 검증 결과는 `INTERPRETATION_AUDIT.md`에 기록했다.

- https://github.com/usingsky/korean_lunar_calendar_js
- https://github.com/golbin/ssaju
- https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2026

달력 자료는 사주풀이의 과학적 타당성을 입증하지 않는다. 엔진은 검증한 대표 사례 외 전체 날짜 정밀성 인증을 받지 않았으며, 절입 경계 근처에는 계산 차이가 있을 수 있다.


### 운의 흐름 보완 (2026-10-11)

대운은 기존 MIT ssaju 0.2.0의 `daeun` 결과를 사용한다. 현재와 다음 구간, 순행/역행, 절입까지 일수, 시작 나이(3일/1년·반올림), 만 나이 구간을 함께 표시한다. 남·여 기준을 임의 추정하지 않는다. 시간 모름은 정오 참고값이며 출생 절기 경계일에는 보류한다. 세운·월운·일운은 현재 한국시간의 년주·월주·일주를 사용하고, 다음 절입/자정 전후를 검증했다. 월운은 양력 1일 단위가 아니다.

출처: https://github.com/golbin/ssaju (라이브러리 API·MIT), 강의 자료 https://elearning.kocw.net/document/lec/2012/Kicu/AnSungJae/02.pdf (절입 월주), https://www.gachon.ac.kr/bbs/asiaculture/398/130484/download.do (대운·세운 명리 개념). 외부 해석 문장은 복사하지 않으며 `fortune-content.js`는 자체 작성이다.
