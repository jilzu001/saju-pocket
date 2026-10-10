import {currentFortune,kstParts} from './fortune.js';
import {tenGod,pairFeatures} from './reading.js';
import {DAY_STORIES} from './reading-content.js';
import {FLOW_STORIES} from './fortune-content.js';

const sec=(title,paragraphs,steps)=>({title,paragraphs,steps});
const doc=(title,kicker,summary,basis,sections)=>({title,kicker,summary,basis,sections});
const label=p=>p.stemKo+p.branchKo;
const time=d=>new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(d);
const periodDate=(year,month,day=1)=>new Date(`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}T00:00:00+09:00`);
const getStory=(person,p)=>FLOW_STORIES[tenGod(person.details.day.stemIdx,p.stemIdx)];
const FOCUS=['전체','관계','일','돈'];
export const focusOptions=FOCUS;

// Scenes and missions are original writing, separate from calendar calculations.
const SCENES={
 비견:{line:'맞춰 주기 전에, 내 생각도 한 문장.',love:'좋아하는 방식부터 말해요',people:'의견 차이를 경쟁으로 읽지 않기',work:'내가 결정할 일을 먼저 고르기',money:'남의 소비보다 내 사용 기준',scene:'친구가 정한 약속에 모두 동의한 뒤, 사실은 다른 장소가 좋았다고 뒤늦게 느낄 수 있어요.',missions:['약속 하나에 내가 원하는 조건을 한 문장 말하기','내가 결정할 일과 함께 정할 일을 하나씩 나누기','오늘 선택한 이유를 남과의 비교 없이 한 줄 적기']},
 겁재:{line:'같이 가는 즐거움에, 내 여유도 한 칸.',love:'편하게 거절할 여지도 남기기',people:'친절과 책임을 구분하기',work:'함께할 일의 담당을 확인하기',money:'나눠 쓰는 비용부터 합의하기',scene:'분위기를 좋게 만들려고 모임의 예약과 준비를 전부 맡았다가 내 일정이 밀릴 수 있어요.',missions:['함께하는 일 하나의 담당과 끝낼 시간을 확인하기','부탁 하나에 가능한 범위와 어려운 범위를 말하기','공동 비용 하나의 분담 방식을 먼저 물어보기']},
 식신:{line:'큰 결심보다, 손에 남는 작은 결과.',love:'일상의 작은 도움으로 표현하기',people:'부담 없는 대화를 이어 가기',work:'익숙한 기술을 한 번 더 다듬기',money:'이미 가진 것을 활용하기',scene:'잘해야 한다는 마음 때문에 시작이 늦어졌던 일을, 15분짜리 초안으로 꺼내면 훨씬 가볍게 풀릴 수 있어요.',missions:['익숙하게 잘하는 일 하나를 15분짜리 결과로 남기기','가까운 사람에게 필요한 작은 도움이 있는지 묻기','이미 가진 물건 하나의 새로운 쓰임을 찾아보기']},
 상관:{line:'번뜩인 생각은 살리고, 말의 모서리는 다듬기.',love:'느낌과 제안을 나눠 말하기',people:'평가 대신 바꾸고 싶은 상황 말하기',work:'새 아이디어를 작은 초안으로',money:'새로운 지출은 작게 확인하기',scene:'회의에서 “그 방식은 별로예요”라고 말하고 싶을 때, 바꾸고 싶은 이유와 대안까지 말하면 생각이 더 잘 전해져요.',missions:['하고 싶은 말을 사실·내 느낌·제안의 세 문장으로 쓰기','바꾸고 싶은 방식 하나의 작은 대안을 만들기','떠오른 아이디어를 바로 약속하지 말고 초안으로 남기기']},
 편재:{line:'새로움은 반갑게, 약속은 감당할 만큼.',love:'새로운 경험을 가볍게 제안하기',people:'선택할 수 있는 초대 건네기',work:'기회 세 개 중 하나만 확인하기',money:'시도할 비용과 중단 조건 정하기',scene:'재미있어 보이는 제안이 여러 개 들어오면 모두 잡고 싶어질 수 있어요. 지금 한 번 확인할 수 있는 것만 고르면 경험이 남아요.',missions:['눈에 들어온 기회 세 개 중 확인할 한 개만 고르기','새로운 활동 하나를 거절해도 괜찮은 초대로 제안하기','새 시도 하나의 시간·비용 한도를 적기']},
 정재:{line:'생활의 빈틈 하나를 정리하면 마음도 가벼워져요.',love:'지킬 수 있는 약속으로 안심 주기',people:'가능한 시간과 범위를 구체적으로',work:'반복 업무의 낭비 한 군데 줄이기',money:'쓰지 않는 반복 지출 확인하기',scene:'하루 종일 바쁘게 움직였는데 중요한 일은 남아 있다면, 반복하는 일 하나의 순서를 정리하는 데서 실마리를 찾을 수 있어요.',missions:['반복 지출 한 항목의 실제 사용 여부 확인하기','반복 업무 하나의 끝낼 기준을 적기','이번 주 약속 하나의 시간과 가능한 범위를 확인하기']},
 편관:{line:'어려운 일 앞에서도, 혼자 다 버틸 필요는 없어요.',love:'상황을 알려 추측을 줄이기',people:'급할수록 필요한 것을 확인하기',work:'도움 요청 기준을 먼저 정하기',money:'급한 마음으로 결제하지 않기',scene:'마감이 가까워질수록 도움을 부탁할 시간이 없다고 느낄 수 있어요. 막힌 부분을 한 문장으로 좁히면 부탁도 쉬워져요.',missions:['어려운 일 하나에 도움을 요청할 기준을 쓰기','막힌 부분을 한 문장으로 좁혀 질문하기','오늘 일정에 회복할 시간 10분을 남기기']},
 정관:{line:'완벽해 보이기보다, 믿고 맡길 수 있는 한 가지.',love:'말한 것과 할 수 있는 것 맞추기',people:'바뀐 사정을 일찍 알려 주기',work:'반드시 지킬 기준 두 개 고르기',money:'익숙한 결제 조건도 읽어 보기',scene:'기대에 맞추려고 새 부탁까지 받아들이기 전에, 이미 약속한 일의 마무리를 먼저 확인해 보세요.',missions:['맡은 일 하나에서 꼭 지킬 기준 두 개만 고르기','변경된 일정 하나를 기다리는 사람에게 먼저 알리기','약속 하나의 완료 조건을 상대와 확인하기']},
 편인:{line:'생각이 많아질수록, 확인할 질문은 하나만.',love:'숨은 뜻보다 직접 확인하는 말',people:'혼자 정리할 시간도 알려 주기',work:'다른 분야의 사례 하나 보기',money:'비교를 끝낼 시점 정하기',scene:'짧은 답장 하나를 여러 의미로 해석하다 보면 실제로 묻고 싶었던 질문을 놓치기 쉬워요. 확인할 것부터 좁혀 보세요.',missions:['궁금한 것 세 개 중 확인할 질문 한 개를 고르기','사실과 추측을 한 줄씩 따로 적기','계속 찾아보던 자료의 탐색 종료 시간을 정하기']},
 정인:{line:'배운 것 하나를 써 보면, 오늘이 조금 달라져요.',love:'필요한 도움을 구체적으로 말하기',people:'받은 도움에 짧게 고마움 전하기',work:'새 지식을 실제 일 한 곳에 적용하기',money:'배움에 쓰는 비용의 활용 계획',scene:'좋은 방법을 많이 알아도 내 일에 한 번 써 보기 전에는 막연할 수 있어요. 완전히 이해할 때까지 기다리지 않아도 돼요.',missions:['오늘 배운 내용 한 개를 실제 일에 10분 적용하기','도움받은 사람에게 구체적인 고마움 한 가지 말하기','준비 중인 일을 작은 초안으로 한 번 보여 주기']}
};
export function communicationHints(type){
 if(!/^[IE][SN][TF][JP]$/.test(type||''))return ['성향을 추정하기보다 지금 편한 대화 방식부터 골라 보세요.'];
 return [type[0]==='I'?'전하고 싶은 말을 메모로 정리한 뒤 편한 시점에 꺼내 보세요.':'생각을 대화로 꺼낸 뒤 상대도 정리할 시간을 남겨 주세요.',type[1]==='S'?'실제로 있었던 장면 한 개를 예로 들면 뜻이 더 잘 전해져요.':'큰 방향을 설명한 뒤 지금 할 수 있는 한 가지를 덧붙여 주세요.',type[2]==='T'?'판단의 이유를 말하기 전에 상대가 느낀 점도 한 번 확인해 주세요.':'상대의 마음을 살피면서도 내가 원하는 조건은 분명히 말해 주세요.',type[3]==='J'?'일정을 정하되 바꿀 수 있는 조건 하나를 함께 남겨 주세요.':'유연하게 움직이되 언제 다시 정할지는 함께 알려 주세요.'];
}
export function dayExperience(person,now=new Date(),focus='전체'){
 const context=currentFortune(now),god=tenGod(person.details.day.stemIdx,context.day.pillar.stemIdx),scene=SCENES[god],story=FLOW_STORIES[god];
 const priority=FOCUS.includes(focus)?focus:'전체',line=priority==='일'?scene.work:priority==='돈'?scene.money:priority==='관계'?scene.people:scene.line;
 const yesterday=currentFortune(new Date(context.day.start.getTime()-12*3600000)),previous=tenGod(person.details.day.stemIdx,yesterday.day.pillar.stemIdx);
 return {context,god,scene,story,line,focus:priority,hints:communicationHints(person.input.mbti),comparison:`어제의 '${FLOW_STORIES[previous].theme}'에서 오늘은 '${story.theme}'으로 초점을 옮겨 보세요.`};
}
export function linkedMission(person,now=new Date(),focus='전체',id=''){
 const e=dayExperience(person,now,focus),day=Math.floor(e.context.day.start.getTime()/86400000);let salt=0;for(const c of id)salt=(salt*31+c.charCodeAt(0))>>>0;
 const variant=((Math.floor(day/10)+salt)%3+3)%3;
 return {key:`${e.context.date}:${e.god}:${variant}`,tag:e.story.theme,title:e.scene.missions[variant],guide:e.scene.scene,hint:e.hints[variant%e.hints.length],date:e.context.date};
}
const monthCache=new Map();
export function calendarMonthSlices(year,month){
 const key=`${year}-${month}`;if(monthCache.has(key))return monthCache.get(key);
 const end=month===12?periodDate(year+1,1):periodDate(year,month+1);let cursor=periodDate(year,month);const slices=[];
 while(cursor<end&&slices.length<4){const c=currentFortune(cursor),until=new Date(Math.min(end.getTime(),c.month.end.getTime()));slices.push({start:cursor,end:until,pillar:c.month.pillar,yearPillar:c.year.pillar});cursor=until;}
 monthCache.set(key,slices);return slices;
}
function monthBrief(person,year,month){const slices=calendarMonthSlices(year,month);return {month,slices,theme:slices.map(x=>getStory(person,x.pillar).theme).join(' → '),story:getStory(person,slices[slices.length-1].pillar)};}
const monthSections=(person,year,month)=>calendarMonthSlices(year,month).map(x=>{const s=getStory(person,x.pillar);return `${time(x.start)}부터 ${time(x.end)} 직전까지 ${label(x.pillar)}의 '${s.theme}'을 배경으로 읽습니다. ${s.summary} ${s.action}을 작은 실행으로 골라 보세요.`;});
export function buildMonthReport(person,now=new Date(),requestedMonth=null){
 const p=kstParts(now),year=requestedMonth?.year??p.year,month=requestedMonth?.month??p.month;if(!Number.isInteger(month)||month<1||month>12||year<1962||year>2098)throw new TypeError('지원하지 않는 보고서 월입니다.');
 const b=monthBrief(person,year,month),prev=monthBrief(person,month===1?year-1:year,month===1?12:month-1),next=monthBrief(person,month===12?year+1:year,month===12?1:month+1),s=b.story,self=DAY_STORIES[person.details.day.stemIdx];
 return doc(`${month}월, 나에게 맞는 속도 찾기`,`${year}년 ${month}월 · 달력 월간 보고서`,`${prev.story.theme}을 돌아보고, 이번 달에는 ${s.theme}을 생활에 가져오는 보고서입니다.`,['양력 달력 월의 시작부터 다음 달 1일 직전까지','달 안의 월주는 절입 시각을 경계로 나누어 계산','이 문서는 선택한 달의 보고서 · 현재 절기월 운세는 별도 제공','사주 상징과 선택한 MBTI를 연결한 자체 편집 해석'],[
  sec('이달의 중심 주제',[`${self.title}의 나에게 이번 달은 '${b.theme}'이라는 질문이 이어집니다. ${s.summary}`,`달력의 한 달 안에서도 절기가 바뀌면 실행의 초점이 달라집니다. 앞부분에서 정리한 경험을 뒷부분의 선택에 가져가며 읽어 보세요.`]),
  sec('지난달과 무엇이 달라지는가',[`지난달의 주제는 '${prev.theme}'이었습니다. ${prev.story.next} 이번 달에는 '${s.theme}'이라는 질문으로 확인할 부분을 바꿔 봅니다.`,`지난달에 실제로 도움이 된 행동 하나는 계속해도 됩니다. 달이 바뀌었다고 모두 새로 시작하기보다 부담이 된 조건 하나만 바꾸면 변화가 더 선명하게 보입니다.`]),
  sec('만남과 가까운 관계',[s.relationship,`나의 표현 방식은 ${self.speech}이라는 문장으로 연습해 볼 수 있습니다. ${communicationHints(person.input.mbti).join(' ')}`]),
  sec('일과 배움의 실행',[s.work,`장점인 ${self.gift}을 쓰면서도 ${self.excess}이 반복되는지 살펴보세요. 이번 달에 끝낼 결과 한 개를 정하고, 시작·확인·마무리 시간을 나누면 계획이 덜 부풀어 오릅니다.`]),
  sec('돈과 생활의 여유',[s.money,`이달의 지출에서 계속 쓸 것, 한 번 확인할 것, 보류할 것을 각각 하나씩 골라 보세요. 선택 이유를 남기면 다음 달에도 같은 고민을 처음부터 반복하지 않을 수 있습니다.`]),
  sec('달 안에서 흐름이 바뀌는 시점',monthSections(person,year,month)),
  sec('다음 달을 준비하는 작은 여백',[`다음 달에는 '${next.theme}'을 읽습니다. ${next.story.summary} 지금부터 할 수 있는 준비는 ${s.next}`,s.caution],[s.action,'지난달보다 편해진 조건 하나와 다음 달에 조정할 조건 하나를 기록하기'])
 ]);
}
export function buildYearReport(person,now=new Date()){
 const year=kstParts(now).year,annual=currentFortune(periodDate(year,7,15)).year.pillar,s=getStory(person,annual),self=DAY_STORIES[person.details.day.stemIdx],months=Array.from({length:12},(_,i)=>monthBrief(person,year,i+1));
 const sections=[sec('올해의 큰 그림',[`${year}년의 ${label(annual)} 세운은 '${s.theme}'을 큰 질문으로 삼습니다. ${s.summary} 나의 ${self.gift}을 어느 영역에 쓰고 싶은지 먼저 골라 보세요.`,`달력의 신년 보고서는 1월부터 12월까지를 보여 줍니다. 사주 세운은 입춘에 바뀌므로 1월과 입춘 전에는 이전 해의 기운이 이어지고, 월별 내용도 절입에 맞춰 나누어 읽습니다.`]),sec('연애와 관계의 방향',[s.relationship,`나의 편한 표현은 '${self.speech}'입니다. 관계를 좋게 유지하려는 마음이 ${self.excess}으로 이어지지 않도록, 친밀함과 내가 필요한 여유를 함께 말해 보세요.`,...communicationHints(person.input.mbti)]),sec('일과 돈에서 챙길 기반',[s.work,s.money]),sec('키울 장점과 보완할 반응',[`올해 키워 볼 장점은 ${self.gift}입니다. 예를 들어 ${self.example}처럼 작은 범위에서 이미 잘하는 방식을 활용해 보세요.`,`보완할 반응은 ${self.trigger}에 나타나는 ${self.excess}입니다. ${self.repair} 잘한 결과만 기록하기보다 어려웠던 조건도 남기면 다음 계획을 조정하기 쉽습니다.`],[self.practice,s.action])];
 for(let q=0;q<4;q++){const block=months.slice(q*3,q*3+3);sections.push(sec(`${q+1}분기 · ${block[1].story.theme}`,block.map(x=>`${x.month}월: ${x.theme}. ${x.story.next}`),[block[1].story.action]));}
 const calendar=months.map(x=>{const sectionIndex=sections.length;sections.push(sec(`${x.month}월 미리보기 · ${x.story.theme}`,monthSections(person,year,x.month),[x.story.action]));return {month:x.month,title:x.story.theme,sectionIndex};});
 sections.push(sec('한 해의 흐름을 내 기록으로 만들기',[`매달 잘 맞았던 행동과 달랐던 상황을 한 줄씩 남겨 보세요. 같은 상징을 읽어도 내 역할과 일정이 바뀌면 필요한 행동은 달라집니다. 연말에는 잘 지킨 계획의 개수보다 편해진 생활의 조건을 확인해 볼 수 있습니다.`],['올해 이어갈 습관 하나를 정하기','분기마다 목표의 크기와 여유 시간을 함께 확인하기']));
 return {...doc(`${year}년, 나의 한 해를 펼치다`,`${year}년 신년 보고서 · 12개월 미리보기`,`${s.theme}을 올해의 중심에 두고, 관계·일·돈과 12개월의 실행 방향을 함께 읽습니다.`,['양력 1~12월 보고서 · 세운은 입춘 경계','월별 미리보기는 각 달의 절입 전후 월주를 사용','원국의 일간·선택 MBTI를 참고 · 사건 발생 확률을 산출하지 않음'],sections),calendar};
}
export function buildMeetingReading(person,now=new Date(),kind='새로운 인연'){
 const self=DAY_STORIES[person.details.day.stemIdx],e=dayExperience(person,now),allowed=['새로운 인연','친구와 연결','일에서 만남'],context=allowed.includes(kind)?kind:allowed[0];
 const place=context==='일에서 만남'?'함께 만드는 작은 결과나 배움을 나누는 자리':context==='친구와 연결'?'같은 관심사를 편하게 나누는 모임':'서로의 취향과 일상을 천천히 알아갈 수 있는 자리';
 return doc('나답게 시작하는 만남',`${context} · ${e.context.date}`,`${self.gift}을 살리고, ${self.excess}이 관계의 시작을 어렵게 만들지 않도록 읽는 만남 이야기입니다.`,['나의 일간 상징·선택 MBTI·현재 일운을 함께 참고','상대 정보 없이 나의 표현과 관계의 조건을 읽음','다른 사람의 속마음이나 미래 배우자를 특정하지 않음'],[
  sec('내가 편하게 다가가는 방식',[`${self.core}라는 상징을 만남에 옮기면 ${self.gift}이 자연스러운 연결의 출발점이 될 수 있습니다. ${place}에서 내가 즐겁게 이야기할 소재를 하나 골라 보세요.`,`첫 만남에 나의 모든 면을 보여 줄 필요는 없습니다. 좋아하는 이유를 한 가지 말하고 상대의 이유를 듣는 것만으로도 대화의 접점이 생깁니다.`]),
  sec('끌림 뒤에 확인하면 좋은 것',[`내가 끌리는 모습과 함께 지내기 편한 조건은 따로 적어 보세요. 표현의 속도, 약속을 정하는 방식, 혼자 필요한 시간이 실제로 맞는지 알아가면 관계가 더 구체적으로 보입니다.`,`내가 ${self.trigger}에 민감해질 때 ${self.excess}이 나타날 수 있다는 생활 질문도 확인해 보세요. ${self.repair}`]),
  sec('잘 맞는 관계를 만드는 조건',[`나의 편한 말을 빌리면 '${self.speech}'입니다. 말하지 않아도 알아주기를 기다리기보다 원하는 시간·거리·활동의 크기를 구체적으로 전해 보세요.`,`상대가 나와 같은 방식이어야만 편한 것은 아닙니다. 서로 다르게 정리하거나 결정하는 부분을 알아 두면 반응을 오해하지 않고 기다릴 조건을 만들 수 있습니다.`]),
  sec('성향에 맞춘 대화의 첫걸음',communicationHints(person.input.mbti)),
  sec('오늘 만남에 더해 볼 작은 흐름',[e.scene.scene,e.story.relationship,`오늘은 '${e.story.theme}'을 작은 행동으로 골라 봅니다. ${e.comparison}`]),
  sec('한 번의 만남 뒤 돌아볼 질문',['대화가 계속되는 속도보다 내가 편하게 말할 수 있었는지, 상대의 말을 들을 여유가 있었는지 확인해 보세요. 다음에 함께할 작은 활동을 하나 제안하고 서로 선택할 여지를 남겨 두는 정도면 충분합니다.'],['함께 이야기할 소재 하나를 준비하기','나에게 편한 조건 한 가지를 자연스럽게 말하기','만남 뒤 즐거웠던 장면과 부담이 된 조건을 하나씩 기록하기'])
 ]);
}
export const zodiacNames=['쥐','소','호랑이','토끼','용','뱀','말','양','원숭이','닭','개','돼지'];
const ZODIAC_HINTS=['작은 단서를 모아 상황을 읽기','한 번 정한 일을 꾸준히 이어 가기','새 시도의 첫발을 열기','편안한 대화로 분위기를 만들기','큰 방향을 현실의 한 단계로 나누기','확인할 조건을 좁혀 판단하기','생각을 밖으로 꺼내 활기를 나누기','관계를 이어갈 여유를 남기기','다른 방법을 찾아 막힌 흐름 풀기','마무리의 기준을 선명하게 정하기','지킬 약속과 필요한 경계를 함께 말하기','편안하게 나누되 내 범위를 지키기'];
export function buildZodiacReading(index,now=new Date()){
 if(!Number.isInteger(index)||index<0||index>11)throw new TypeError('띠를 선택해 주세요.');
 const c=currentFortune(now),delta=Math.abs(index-c.day.pillar.branchIdx),style=delta===0?'익숙한 방식을 돌아보는 하루':delta===6?'속도와 조건을 조정하는 하루':[[0,1],[2,11],[3,10],[4,9],[5,8],[6,7]].some(([a,b])=>index===a&&c.day.pillar.branchIdx===b||index===b&&c.day.pillar.branchIdx===a)?'함께할 접점을 찾는 하루':'작은 선택을 가볍게 정리하는 하루';
 const hint=ZODIAC_HINTS[index],next=ZODIAC_HINTS[(index+c.day.pillar.stemIdx+1)%12];
 return doc(`${zodiacNames[index]}띠 · ${style}`,`${c.date} · 생일 없이 보는 띠별 이야기`,`${hint}을 오늘의 작은 키워드로 삼아 보세요.`,['선택한 띠의 지지와 오늘 일지의 동일·충·육합 상징 참고','출생 년월일시를 사용하지 않은 일반적인 띠별 콘텐츠','저장 사주에서 자동 선택할 때는 입춘 기준 년주의 지지를 사용'],[
  sec('오늘의 한 줄',[`${style}입니다. ${hint}에 초점을 맞추고, 많은 계획 가운데 실제로 할 수 있는 한 가지를 먼저 골라 보세요.`,`이 이야기는 같은 띠를 고른 사람이 함께 읽는 가벼운 콘텐츠입니다. 내 생일을 입력한 개인 운세에서는 일간과 관계를 더해 다른 관점으로 읽을 수 있습니다.`]),
  sec('사람과 만남',['약속을 정할 때 상대의 뜻을 추측하기보다 원하는 시간이나 활동을 물어보세요. 함께하고 싶은 마음과 지금 가능한 범위를 나누어 말하면 부담이 줄어듭니다.',`오늘의 연결 힌트는 '${hint}'입니다. 상대의 반응이 예상과 다르다면 설명을 더 늘리기 전에 실제로 필요한 것이 무엇인지 확인해 보세요.`]),
  sec('일과 생활',[`오늘 할 일 하나를 '${hint}'이라는 관점으로 다시 살펴보세요. 시작이 막혔다면 10분짜리 초안으로, 마무리가 막혔다면 완료 기준 한 줄로 크기를 줄일 수 있습니다.`,`돈을 쓰는 선택에서도 지금의 쓰임과 유지할 조건을 먼저 확인해 보세요. 띠별 상징으로 지출의 결과를 정하기보다 내가 선택한 이유를 적어 두면 다음에 비교하기 쉽습니다.`]),
  sec('오늘의 작은 행동',[`${next}이라는 방식도 한 번 시험해 보세요. 익숙한 방법 하나와 바꿔 볼 방법 하나를 나누면 오늘의 경험이 더 잘 남습니다.`],['원하는 조건을 한 문장으로 말하기','작은 결과 한 개를 남기고 하루를 마무리하기'])
 ]);
}
export function pairFocusSections(a,b,relation){
 const f=pairFeatures(a,b),same=f.left.mbti&&f.right.mbti&&f.left.mbti===f.right.mbti,an=a.input.name||'첫 번째 사람',bn=b.input.name||'두 번째 사람';
 const scene=relation==='부부'?'집안일·생활비·각자 쉬는 시간':relation==='동료'?'역할·초안·완료 기준':relation==='친구'?'모임·연락·참여 비용':'약속·연락·함께하는 시간';
 return [sec('대화 · 서로 정리하는 방식',[`${an}와 ${bn}가 ${scene}을 이야기할 때 결론을 빨리 내는 사람과 충분히 확인하고 싶은 사람의 차이를 먼저 물어보세요. ${same?'같은 MBTI를 선택했어도 실제 선호가 같은지 직접 확인하는 편이 좋습니다.':'선택한 성향 정보는 소통의 힌트로 쓰고 역할이나 경험의 차이도 함께 살펴보세요.'}`,...communicationHints(a.input.mbti).slice(0,2).map(x=>`${an}: ${x}`),...communicationHints(b.input.mbti).slice(0,2).map(x=>`${bn}: ${x}`)]),sec('감정 표현 · 위로와 해결을 나누기',['힘든 일을 이야기할 때 필요한 것이 들어 주는 시간인지, 함께 해결할 제안인지 먼저 물어보세요. 한쪽의 빠른 해결이 다른 쪽에는 마음을 건너뛰는 말처럼 들릴 수 있습니다.','“지금은 들어 주면 좋겠어” 또는 “방법을 함께 생각해 줄래?”처럼 필요한 도움을 구체적으로 말하면 대화의 목적이 선명해집니다.']),sec('생활 리듬 · 함께와 각자의 여백',[`${relation} 관계에서는 ${scene}의 기준을 구체적으로 정하는 편이 좋습니다. 계획을 미리 세우는 쪽과 상황에 따라 바꾸는 쪽이 있다면, 꼭 정할 부분과 유연하게 둘 부분을 함께 골라 보세요.`,'연락이나 함께하는 시간의 양을 친밀함의 유일한 기준으로 쓰기보다 둘 다 편했던 조건을 기록해 보세요.']),sec('시간·돈 · 작은 합의를 만드는 법',[`다음 한 번의 ${relation==='동료'?'작업':relation==='부부'?'생활 계획':'약속'}에서 비용의 범위, 담당할 일, 변경을 알릴 시점을 하나씩 정해 보세요. 가까운 사이일수록 예상이 같을 것이라 가정하기 쉬우므로 작은 합의부터 남기는 편이 좋습니다.`,'한 사람이 계속 준비나 비용을 떠안는다면 성격의 문제로만 읽지 말고 역할과 자원을 다시 나눠 보세요.'])];
}
