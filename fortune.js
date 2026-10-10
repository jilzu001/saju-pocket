import {calculateSaju} from './vendor/ssaju.mjs';
import {tenGod} from './reading.js';
import {ELEMENTS,STEM_NAMES,DAY_STORIES} from './reading-content.js';
import {FLOW_STORIES} from './fortune-content.js';
const BRANCH_NAMES=['자','축','인','묘','진','사','오','미','신','유','술','해'];
const MAIN_STEMS=[9,5,0,1,4,2,3,5,6,7,4,8];
const DAY=86400000,MINUTE=60000;
export function kstParts(now){return Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));}
const stamp=now=>{const p=kstParts(now);return `${p.year}-${String(p.month).padStart(2,'0')}-${String(p.day).padStart(2,'0')}`;};
const localTime=now=>new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now);
const pillarsAt=now=>calculateSaju({...kstParts(now),now,timezone:'Asia/Seoul',applyLocalMeanTime:false}).pillarDetails;
const code=p=>p.stem+p.branch;
const name=p=>(p.stemKo||STEM_NAMES[p.stemIdx])+(p.branchKo||BRANCH_NAMES[p.branchIdx]);
const enrich=p=>({...p,stemKo:STEM_NAMES[p.stemIdx],branchKo:BRANCH_NAMES[p.branchIdx],element:p.element||{stem:ELEMENTS[Math.floor(p.stemIdx/2)]}});
const ranges=new Map();
function bisectChange(low,high,key){low=Math.floor(low/MINUTE);high=Math.ceil(high/MINUTE);const old=code(pillarsAt(new Date(low*MINUTE))[key]);while(high-low>1){const mid=Math.floor((low+high)/2);if(code(pillarsAt(new Date(mid*MINUTE))[key])===old)low=mid;else high=mid;}return new Date(high*MINUTE);}
function monthRange(now,pillar){const p=kstParts(now),key=`${p.year}:${code(pillar)}`;if(ranges.has(key))return ranges.get(key);const time=now.getTime();let before=time,after=time;for(let n=1;n<=35;n++){before=time-n*DAY;if(code(pillarsAt(new Date(before)).month)!==code(pillar))break;}for(let n=1;n<=35;n++){after=time+n*DAY;if(code(pillarsAt(new Date(after)).month)!==code(pillar))break;}const range={start:bisectChange(before,before+DAY,'month'),end:bisectChange(after-DAY,after,'month')};ranges.set(key,range);return range;}
function ipchun(year){const key=`ipchun:${year}`;if(!ranges.has(key))ranges.set(key,bisectChange(Date.parse(`${year}-02-01T00:00:00+09:00`),Date.parse(`${year}-02-10T00:00:00+09:00`),'year'));return ranges.get(key);}
export function currentFortune(now=new Date()){
 const parts=kstParts(now),p=pillarsAt(now),cycleYear=p.year.stemIdx===(parts.year-4)%10?parts.year:parts.year-1;
 const year={pillar:p.year,start:ipchun(cycleYear),end:ipchun(cycleYear+1),cycleYear};
 const month={pillar:p.month,...monthRange(now,p.month)};
 const dayStart=new Date(`${stamp(now)}T00:00:00+09:00`),day={pillar:p.day,start:dayStart,end:new Date(dayStart.getTime()+DAY)};
 const nextYear=pillarsAt(new Date(year.end.getTime()+MINUTE)).year,nextMonth=pillarsAt(new Date(month.end.getTime()+MINUTE)).month,tomorrow=pillarsAt(new Date(day.end.getTime()+12*60*MINUTE)).day;
 return {date:stamp(now),year,month,day,nextYear,nextMonth,tomorrow};
}
export function calculateDaeun(person,now=new Date()){
 if(!['남','여'].includes(person.input.gender))return {missing:'gender'};
 if(person.boundary&&!person.input.time)return {missing:'boundaryTime'};
 const [hour,minute]=person.input.time?person.input.time.split(':').map(Number):[12,0];
 const input={...person.solar,hour,minute,gender:person.input.gender,now,timezone:'Asia/Seoul',applyLocalMeanTime:false};
 const r=calculateSaju(input),d=r.daeun;
 let startRange=[d.startAge,d.startAge];
 if(!person.input.time){const a=calculateSaju({...input,hour:0,minute:0}).daeun,b=calculateSaju({...input,hour:23,minute:59}).daeun;startRange=[Math.min(a.startAge,b.startAge),Math.max(a.startAge,b.startAge)];}
 const index=d.current?d.list.findIndex(x=>x.startAge===d.current.startAge):-1;
 return {...d,age:r.currentAge,current:d.current?enrich(d.current):null,next:enrich(d.list[index+1]||d.list[0]),list:d.list.map(enrich),approximate:!person.input.time,startRange};
}
const section=(title,paragraphs,steps)=>({title,paragraphs,steps});
const document=(title,kicker,summary,basis,sections)=>({title,kicker,summary,basis,sections});
function storyFor(person,pillar){return FLOW_STORIES[tenGod(person.details.day.stemIdx,pillar.stemIdx)];}
function branchNote(person,pillar){
 const natal=person.details.day,other=pillar.branchIdx,delta=Math.abs(natal.branchIdx-other),a=natal.branchKo,b=BRANCH_NAMES[other];
 if(delta===6)return `나의 일지 ${a}와 이 시기의 지지 ${b}는 전통적으로 충으로 구분합니다. 서로 다른 방향을 조정하는 질문으로 읽어, 일정의 여유나 대화의 확인 단계를 남겨 보세요. 이 조합만으로 이별·사고 같은 사건을 예고하지 않습니다.`;
 if([[0,1],[2,11],[3,10],[4,9],[5,8],[6,7]].some(([x,y])=>natal.branchIdx===x&&other===y||natal.branchIdx===y&&other===x))return `나의 일지 ${a}와 이 시기의 지지 ${b}는 육합으로 구분합니다. 맞춰 갈 접점을 찾는 상징으로 읽되, 합이 있다고 모든 제안에 동의할 필요는 없습니다. 서로 원하는 조건을 말하고 지킬 수 있는 약속을 골라 보세요.`;
 if(delta===0)return `나의 일지와 이 시기의 지지가 ${a}로 같습니다. 익숙한 반응을 알아차리는 질문으로 활용해 보세요. 잘 이어지는 습관은 남기고, 늘 같은 곳에서 막힌다면 순서나 도움받는 방식을 하나 바꿔 볼 수 있습니다.`;
 return `나의 일지 ${a}와 이 시기의 지지 ${b} 사이에서 이 앱이 사용하는 같은 지지·충·육합 관계는 잡히지 않습니다. 특별한 일이 없다는 판정이 아니라, 여기서는 천간의 주제와 실제 생활 조건에 더 무게를 두어 읽는다는 뜻입니다.`;
}
function layers(person,outer,inner,label){const a=storyFor(person,outer),b=storyFor(person,inner),same=tenGod(person.details.day.stemIdx,outer.stemIdx)===tenGod(person.details.day.stemIdx,inner.stemIdx);return same?`${label}의 천간이 모두 '${a.theme}'에 연결됩니다. 같은 주제가 겹치므로 이번에 반복해 볼 행동 한 개를 고르면 좋습니다. 겹쳤다는 이유로 결과가 두 배가 되거나 특정 일이 확정되는 것은 아닙니다.`:`${label}을 함께 읽으면 '${a.theme}'이라는 큰 방향 안에서 '${b.theme}'을 작은 실행으로 고를 수 있습니다. 서로 다른 주제가 있어도 하나가 다른 하나를 취소하지 않습니다. 예를 들어 장기적으로 협업을 넓히더라도 오늘은 혼자 자료를 정리하며 다음 대화를 준비할 수 있습니다.`;}
function periodDoc(person,c,kind){
 const meta={year:{label:'세운',title:'올해의 흐름',unit:'올해',next:'내년',update:'입춘 절입 시각',outer:null},month:{label:'월운',title:'이번 절기월의 흐름',unit:'이번 절기월',next:'다음 절기월',update:'매월 절입 시각',outer:'year'},day:{label:'일운',title:'오늘의 흐름',unit:'오늘',next:'내일',update:'한국시간 자정',outer:'month'}}[kind];
 const period=c[kind],p=period.pillar,next=kind==='year'?c.nextYear:kind==='month'?c.nextMonth:c.tomorrow;
 const god=tenGod(person.details.day.stemIdx,p.stemIdx),branchGod=tenGod(person.details.day.stemIdx,MAIN_STEMS[p.branchIdx]),s=FLOW_STORIES[god],ns=storyFor(person,next),self=DAY_STORIES[person.details.day.stemIdx];
 const d=calculateDaeun(person,new Date(`${c.date}T12:00:00+09:00`));
 const basis=[`일간 ${name(person.details.day).slice(0,1)}${person.details.day.element.stem} · ${meta.label} ${name(p)}(${code(p)})`,`천간 ${god} · 지지 정기 ${branchGod} (지장간 전체·용신 종합 판정은 하지 않음)`,`기간 ${localTime(period.start)} ~ ${localTime(period.end)} 직전 · 한국시간`,`갱신 기준: ${meta.update} · 절기 시각은 ssaju 천문 근사 계산`,'전통 상징에 따른 자체 생활 해석 · 길흉 점수와 사건 발생 확률을 산출하지 않음'];
 const scale=kind==='year'?'한 해의 큰 계획을 읽는 세운':kind==='month'?'절기 사이의 실행 환경을 읽는 월운':'하루의 행동과 말의 속도를 읽는 일운';
 return document(`${meta.title} · ${s.theme}`,`${meta.label} ${name(p)} · ${kind==='year'?c.year.cycleYear+'년':kind==='month'?name(p)+'월':c.date}`,s.summary,basis,[
  section(`${meta.unit}, 어떤 기운을 만나는가`,[`${name(p)}의 천간을 나의 일간과 비교하면 ${god}입니다. ${scale}으로, '${s.theme}'을 이번의 중심 질문으로 잡았습니다. ${s.summary}`,`${self.core}이라는 나의 기본 그림 위에 시기의 질문을 더하는 방식입니다. 타고난 성격이 이 시기마다 바뀐다는 뜻보다, 같은 성향을 어디에 어떻게 쓸지 살펴보는 제안으로 읽어 주세요.`]),
  section('일과 배움에서 살릴 기회',[s.work,`나의 기본 강점인 ${self.gift}을 활용하되 ${self.excess}이 나타나면 규모를 줄여 보세요. 이미 진행 중인 일이 있다면 새 목표를 계속 추가하기보다 이번 기간 안에서 마무리할 부분을 하나 고르는 편이 좋습니다.`]),
  section('사람과 대화에서 살필 점',[s.relationship,branchNote(person,p)]),
  section('돈과 생활 자원의 쓰임',[s.money,`지지 ${BRANCH_NAMES[p.branchIdx]}의 정기를 일간과 비교하면 ${branchGod}이며, '${FLOW_STORIES[branchGod].theme}'이라는 보조 질문을 더할 수 있습니다. 천간의 주제와 지지의 보조 질문을 함께 읽되 두 글자만으로 수입·손실·투자 결과를 정하지 않습니다.`]),
  section('큰 흐름과 작은 흐름을 함께 읽기',[meta.outer?layers(person,c[meta.outer].pillar,p,kind==='month'?'세운과 월운':'월운과 일운'):d.current?layers(person,d.current,p,'대운과 세운'):'대운의 계산 기준이 준비되지 않았다면 올해의 주제부터 현재 생활에 적용해 보세요. 저장한 정보에서 대운 기준을 추가하면 긴 흐름과 함께 읽을 수 있습니다.',kind==='day'?layers(person,c.year.pillar,p,'세운과 일운'):`${s.caution} 시기의 상징이 실제 경험과 다르게 느껴지면 지금의 역할·여유·약속을 우선해 행동을 조정하세요.`]),
  section(`${meta.next}으로 이어지는 변화`,[`${meta.next}의 간지는 ${name(next)}이며 '${ns.theme}'을 다음 질문으로 삼습니다. 지금의 '${s.theme}'에서 다음 주제로 옮길 때는 ${s.next}`,`현재 기간은 ${localTime(period.end)}에 끝나고 다음 흐름으로 갱신됩니다. ${kind==='month'?'양력 1일이 아니라 절입 시각에 월운이 바뀌므로 같은 달 안에서도 표시가 바뀔 수 있습니다.':kind==='day'?'미션은 별도로 한국시간 자정에 바뀌며, 일운의 해석과 함께 작은 행동을 고르는 데 활용할 수 있습니다.':'1월 1일과 세운의 경계가 다르므로 입춘 전에는 전년도 간지가 표시될 수 있습니다.'}`]),
  section(`${meta.unit}의 작은 실천`,[s.caution],[s.action,kind==='day'?'하루를 마치며 도움이 된 행동 하나를 기록하기':'기간 끝에 유지할 행동과 바꿀 조건을 하나씩 확인하기'])
 ]);
}
function daeunDoc(person,c,now){
 const d=calculateDaeun(person,now);
 if(d.missing)return document('대운을 펼칠 준비',`대운 · 약 10년의 흐름`,d.missing==='gender'?'전통 순행·역행 계산에 사용할 남·여 기준을 추가하면 지금과 다음 대운을 볼 수 있어요.':'절기 경계일에는 출생 시각에 따라 년주·월주가 달라질 수 있어요. 시간을 확인한 뒤 대운을 펼쳐 주세요.',['대운 방향: 양남·음녀 순행, 음남·양녀 역행','월주에서 순서대로 이동 · 절입까지 3일을 1년으로 환산'],[
  section('대운은 무엇을 보는가',['태어난 달의 기둥에서 출발해 순행 또는 역행으로 약 10년씩 이어지는 간지를 보는 전통 계산입니다. 나이대별 생활 조언과 구분해, 이 앱에서는 계산한 간지와 일간의 관계로 현재·다음 구간의 생활 질문을 만듭니다.']),
  section('필요한 정보',['대운 계산의 남·여 기준은 년간의 음양과 함께 순행·역행을 정하는 데 씁니다. 선택하지 않으면 임의로 추정하지 않습니다. 기존 저장한 사주도 정보 수정에서 이 항목만 보충할 수 있습니다.']),
  section('시작 나이의 계산',['순행이면 태어난 시각에서 다음 절입까지, 역행이면 직전 절입에서 태어난 시각까지의 날짜 간격을 구합니다. 이 라이브러리는 간격을 3으로 나누고 정수로 반올림한 시작 나이를 사용합니다. 다른 만세력의 세는 나이나 반올림 방식과 차이가 날 수 있습니다.']),
  section('지금 볼 수 있는 흐름',['대운 기준을 보충하기 전에도 세운·월운·일운과 오늘 미션은 현재 날짜에 맞춰 볼 수 있습니다. 대운을 볼 준비가 되면 결과 화면의 정보 수정에서 필요한 항목을 보충해 주세요.'])
 ]);
 const current=d.current,next=d.next,s=current?storyFor(person,current):null,ns=storyFor(person,next),direction=d.basis.direction==='forward'?'순행':'역행';
 const years=d.list.map(x=>`${x.startAge}~${x.endAge}세 · ${name(x)} · ${storyFor(person,x).theme}${current?.startAge===x.startAge?' · 현재':''}`);
 return document(current?`지금의 대운 · ${s.theme}`:'첫 대운을 기다리는 시기',`${direction} · 시작 약 ${d.startAge}세 · 현재 만 ${d.age}세`,current?`${name(current)} 대운(${current.startAge}~${current.endAge}세)은 ${s.summary}`:`첫 대운은 약 ${d.startAge}세부터 시작합니다. 지금은 기초 경험을 쌓으며 ${name(next)}의 다음 흐름을 준비하는 관점으로 읽어 보세요.`,[
  `계산 기준 ${person.input.gender} · 년간 ${person.details.year.stemKo} · ${direction}`,
  `출생 ~ ${direction==='순행'?'다음':'이전'} 절입 간격 ${d.basis.diffDays}일 ÷ 3 · 정수 반올림, 최소 1세·최대 10세`,
  `참고 시작 나이 ${d.startAgePrecise}년 · 표시는 약 ${d.startAge}세부터 10년 단위`,
  d.approximate?`출생 시간 모름: 정오 가정의 참고 대운 · 0시~23시59분의 시작 나이 범위 ${d.startRange.join('~')}세`:'입력한 출생 시각과 당시 한국시간 보정 사용',
  '현재 구간: 정수 시작 나이와 만 나이 기준 · 정확한 교운 날짜를 단정하지 않음 · 절기는 천문 근사 계산'
 ],[
  section('현재 10년 흐름의 중심',[current?`${name(current)}의 천간은 나의 일간과 비교해 ${tenGod(person.details.day.stemIdx,current.stemIdx)}입니다. '${s.theme}'을 긴 흐름의 중심 질문으로 삼습니다. 이 구간 전체가 같은 하루로 반복된다는 뜻은 아니며, 그 안에서 세운·월운·일운이 각각 다른 실행의 질문을 더합니다.`:`아직 첫 대운 시작 나이에 이르지 않았습니다. 세운·월운·일운은 지금 날짜로 볼 수 있지만, 첫 대운 간지를 현재 대운인 것처럼 표시하지 않습니다.`,d.approximate?'출생 시간을 몰라 시작 나이는 정오를 가정한 참고값입니다. 실제 시각에 따라 시작 나이와 경계 근처의 현재 구간이 달라질 수 있습니다. 시간을 확인하면 정보 수정으로 다시 계산해 주세요.':'시작 나이를 정수로 표시하는 방식을 사용합니다. 다음 구간으로 넘어가는 실제 날짜를 정밀하게 확정한 계산과는 차이가 있을 수 있어 경계에서는 참고 구간으로 읽어 주세요.']),
  section('일과 역할에서 키울 방향',[s?s.work:ns.work,`나의 기본 강점인 ${DAY_STORIES[person.details.day.stemIdx].gift}을 오래 써도 지치지 않을 구조로 만드는 질문입니다. 큰 성과를 한 번에 목표로 잡기보다 배움·작업·회복이 반복될 수 있는 조건을 먼저 살펴보세요.`]),
  section('관계와 자원에서 지킬 균형',[s?s.relationship:ns.relationship,s?s.money:ns.money,s?s.caution:ns.caution]),
  section('다음 대운으로 이어지는 준비',[`다음 구간은 약 ${next.startAge}~${next.endAge}세의 ${name(next)} 대운입니다. '${ns.theme}'을 새로운 질문으로 삼으며, ${ns.summary}`,current?`${s.next} 지금 구간의 방법을 모두 버리는 것이 아니라 다음 구간에서도 쓸 수 있는 경험을 고르는 과정으로 생각해 보세요.`:'처음 대운을 맞기 전에는 실제 생활에서 즐겁게 반복할 수 있는 경험과 도움을 받을 사람을 찾아보는 작은 준비부터 시작해 보세요.']),
  section('올해 흐름과 함께 읽기',[current?layers(person,current,c.year.pillar,'대운과 세운'):'첫 대운 이전에도 세운이 던지는 올해의 질문은 현재 생활에 적용할 수 있습니다.',`올해는 ${name(c.year.pillar)} 세운으로 '${storyFor(person,c.year.pillar).theme}'을 읽습니다. 긴 기간의 방향을 한 해의 작은 계획으로 나누고, 더 짧은 월운·일운에서 실행할 행동을 고르면 흐름을 함께 볼 수 있습니다.`]),
  section('나의 대운 순서',['아래는 월주에서 순행 또는 역행으로 계산한 10개 구간입니다. 표시 나이는 만 나이 기준의 참고 구간이며, 각 기간에 특정 사건이나 성공·실패가 정해져 있다는 뜻은 아닙니다.'],years),
  section('긴 흐름을 오늘에 가져오기',['지금까지 반복해서 도움이 된 경험과 자주 부담이 된 조건을 하나씩 적어 보세요. 대운의 질문이 실제 생활에 맞는지 확인하며 사용할 수 있습니다.'],[(s||ns).action,'다음 구간에도 유지할 습관과 줄일 부담을 하나씩 기록하기'])
 ]);
}
export function buildFortuneReadings(person,{now=new Date()}={}){const context=currentFortune(now);return {context,daeun:daeunDoc(person,context,now),year:periodDoc(person,context,'year'),month:periodDoc(person,context,'month'),day:periodDoc(person,context,'day')};}
