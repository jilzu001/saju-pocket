import {ELEMENTS,STEM_NAMES,DAY_STORIES,ELEMENT_STORIES,SEASON_STORIES,GOD_STORIES,AXES,LIFE_STAGES,RELATION_STORIES} from './reading-content.js';

// Relations are directional: from is the subject, to is the compared element.
export function elementRelation(from,to){
  const a=ELEMENTS.indexOf(from),b=ELEMENTS.indexOf(to);
  if(a<0||b<0)throw new TypeError('유효한 오행이 필요합니다.');
  return ['same','output','control','pressure','resource'][(b-a+5)%5];
}
export function tenGod(dayStemIdx,targetStemIdx){
  if(!Number.isInteger(dayStemIdx)||!Number.isInteger(targetStemIdx)||dayStemIdx<0||dayStemIdx>9||targetStemIdx<0||targetStemIdx>9)throw new TypeError('천간 번호는 0~9여야 합니다.');
  const r=elementRelation(ELEMENTS[Math.floor(dayStemIdx/2)],ELEMENTS[Math.floor(targetStemIdx/2)]),same=dayStemIdx%2===targetStemIdx%2;
  return {same:['비견','겁재'],output:['식신','상관'],control:['편재','정재'],pressure:['편관','정관'],resource:['편인','정인']}[r][same?0:1];
}
const positions={year:'년간',month:'월간',hour:'시간'};
function seasonOf(branchIdx){return SEASON_STORIES[branchIdx>=2&&branchIdx<=4?'spring':branchIdx>=5&&branchIdx<=7?'summer':branchIdx>=8&&branchIdx<=10?'autumn':'winter'];}
function koreanDate(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
function parseDate(date){if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date+'T00:00:00Z')))throw new TypeError('기준일은 YYYY-MM-DD 형식이어야 합니다.');return date.split('-').map(Number);}
export function deriveFeatures(person){
  const day=person.details.day,story=DAY_STORIES[day.stemIdx];
  if(!story)throw new TypeError('일간 정보가 필요합니다.');
  const knownTime=Boolean(person.input.time&&person.details.hour);
  const keys=['year','month','day',...(knownTime?['hour']:[])];
  const counts=Object.fromEntries(ELEMENTS.map(e=>[e,0]));
  for(const key of keys){const pillar=person.details[key];if(!pillar)continue;for(const e of [pillar.element.stem,pillar.element.branch])if(e in counts)counts[e]++;}
  const max=Math.max(...Object.values(counts)),min=Math.min(...Object.values(counts));
  const most=ELEMENTS.filter(e=>counts[e]===max),least=ELEMENTS.filter(e=>counts[e]===min);
  const visibleGods=['year','month',...(knownTime?['hour']:[])].filter(k=>person.details[k]).map(k=>({position:positions[k],name:tenGod(day.stemIdx,person.details[k].stemIdx),stem:person.details[k].stemKo}));
  const godNames=[...new Set(visibleGods.map(g=>g.name))];
  const godCounts=Object.fromEntries(godNames.map(g=>[g,visibleGods.filter(x=>x.name===g).length]));
  const mbti=/^[IE][SN][TF][JP]$/.test(person.input.mbti||'')?person.input.mbti:'';
  return {day,story,counts,most,least,max,min,knownTime,visibleGods,godNames,godCounts,season:seasonOf(person.details.month.branchIdx),mbti,name:person.input.name||'당신',boundary:Boolean(person.boundary),month:person.details.month};
}
const sec=(title,paragraphs,steps)=>({title,paragraphs,...(steps?{steps}: {})});
const doc=(title,kicker,summary,basis,sections)=>({title,kicker,summary,basis,sections});
function countText(f){return ELEMENTS.map(e=>`${e} ${f.counts[e]}`).join(' · ');}
function distribution(f){return `확인한 ${f.knownTime?'8':'6'}글자의 오행 개수에서 ${f.most.join('·')}${f.most.length>1?'이 공동으로':'이'} 가장 많고(${f.max}개), ${f.least.join('·')}${f.least.length>1?'이 공동으로':'이'} 가장 적습니다(${f.min}개).`;}
function uncertainty(f){return f.boundary?'출생 시간을 모르는 절기 경계일입니다. 년주·월주와 그에 연결된 계절·개수·십신 설명은 정오 기준의 임시 그림이며 실제 시각에 따라 달라질 수 있습니다.':f.knownTime?'출생 시간까지 입력한 네 기둥을 사용했습니다. 글자 개수는 단순 분포이며 계절과 뿌리 등을 종합한 신강·신약 판정은 하지 않습니다.':'시간을 몰라 시주를 제외한 세 기둥만 읽습니다. 비어 있는 시간의 성향을 추정하거나, 여섯 글자로 기운의 강약을 확정하지 않습니다.';}
function basis(f,extras=[]){return [`일간 ${f.day.stemKo}${f.day.element.stem} · ${f.day.yinYang.stem}`,`월지 ${f.month.branchKo} · ${f.season.name}${f.boundary?' (정오 가정)':''}`,countText(f),`보이는 천간 십신: ${f.visibleGods.map(g=>`${g.position} ${g.stem}→${g.name}`).join(', ')} · 일간·지장간 제외`,uncertainty(f),...extras];}
function relationWords(from,to){const k=elementRelation(from,to);return {same:`${from}와 ${to}는 같은 오행`,output:`${from}가 ${to}를 생하는 방향`,resource:`${to}가 ${from}를 생하는 방향`,control:`${from}가 ${to}를 극하는 방향`,pressure:`${to}가 ${from}를 극하는 방향`}[k];}
function godParagraphs(f){return f.godNames.map(g=>{const s=GOD_STORIES[g],places=f.visibleGods.filter(x=>x.name===g).map(x=>x.position).join('·');return `${places}에 보이는 ${g}(${f.godCounts[g]}개)는 '${s.focus}'의 질문으로 풀었습니다. ${s.why} 생활에서는 ${s.gift}으로 써 볼 수 있습니다. 다만 ${s.risk}에는 이 관점을 잠시 내려놓고 실제 조건을 확인해 주세요.`;});}
function polarity(f){return f.day.yinYang.stem==='양'?'양간의 상징은 먼저 방향이나 형태를 밖으로 드러내는 질문으로, 음간의 상징은 세부 조건을 조정하는 질문으로 구분했습니다. 양간이라고 외향적이어야 하는 것은 아닙니다. 조용히 계획을 세우더라도 내가 제안할 방향을 분명하게 적는 방식으로 활용할 수 있습니다.':'음간의 상징은 주변 조건에 맞춰 표현을 조정하는 질문으로, 양간의 상징은 먼저 방향을 드러내는 질문으로 구분했습니다. 음간이라고 내향적이어야 하는 것은 아닙니다. 활발하게 대화하더라도 내 조건을 지우지 않고 필요한 조정을 선택하는 방식으로 활용할 수 있습니다.';}
function seasonParagraph(f){return `월지 ${f.month.branchKo}는 ${f.season.branches}에 속해 '${f.season.name}'을 배경으로 삼았습니다. ${f.season.why} ${f.story.gift}에 ${f.season.opportunity}을 더하는 식입니다. ${f.season.caution}${f.boundary?' 다만 절기 경계일이므로 이 계절 배경 자체가 달라질 수 있어, 맞는 부분만 임시 질문으로 읽어 주세요.':''}`;}
function axisSections(f){return AXES.map((axis,i)=>sec(axis.name,[f.mbti?`${f.mbti[i]}를 선택한 응답에서 가져온 별도의 소통 힌트입니다. ${axis[f.mbti[i]]} 실제 상황에서 다르게 느껴지면 현재의 필요를 우선하세요.`:`MBTI를 선택하지 않았으므로 이 축을 추정하지 않습니다. ${['지금 바로 이야기하는 것이 편한지, 잠시 정리한 뒤 이야기하는 것이 편한지 먼저 확인해 보세요.','실제 사례와 큰 방향을 하나씩 말해 보고 어느 쪽에서 이해가 빨라지는지 살펴보세요.','선택의 기준과 사람에게 미칠 영향을 둘 다 말해 보세요.','언제까지 정할 것인지와 무엇을 바꿀 수 있는지를 함께 정해 보세요.'][i]}`]));}

export function buildPersonalReading(person,{date=koreanDate(),annualPillar=null}={}){
  parseDate(date);const f=deriveFeatures(person),s=f.story,most=f.most.map(e=>ELEMENT_STORIES[e]),least=f.least.map(e=>ELEMENT_STORIES[e]);
  const summary=doc(s.title,'나를 읽는 기본 지도',`${f.name==='당신'?'당신':f.name+'님'}의 일간 ${f.day.stemKo}${f.day.element.stem}에서 '${s.gift}'을 첫 질문으로 잡았습니다. ${f.season.name}과 확인된 글자의 분포를 함께 보되, 실제 경험으로 맞는 부분을 골라 보세요.`,basis(f),[
    sec('일간이 들려주는 중심 질문',[`${s.core}를 빌린 자체 편집 풀이입니다. 여기서 중심은 '${s.gift}'입니다. 타고난 능력을 확인했다는 뜻이 아니라, 평소 선택을 돌아볼 때 먼저 살펴볼 관점입니다. 같은 일간이어도 환경·경험·가치에 따라 전혀 다른 생활을 할 수 있습니다.`, `예를 들면 ${s.example}을 떠올릴 수 있습니다. 이런 장면이 낯설다면 닮은 사람을 찾으려 하지 말고, 내가 편한 방식과 무엇이 다른지 적어 보세요.`]),
    sec('계절을 배경으로 함께 읽기',[seasonParagraph(f)], [f.season.action]),
    sec('많은 것과 적은 것을 구분하기',[distribution(f),`가장 많은 ${f.most.join('·')}는 ${most.map(e=>e.resource).join(', ')}의 상징을 더 자주 살펴보자는 표시입니다. 가장 적은 ${f.least.join('·')}도 능력의 결핍을 의미하지 않습니다. ${f.min===0?'표면 글자에 없다는 것과 생활에서 그 능력이 없다는 것은 다른 이야기입니다.':'개수 차이가 곧 능력의 우열이나 균형 점수는 아닙니다.'} 동률이면 어느 하나를 대표 성향으로 임의 선정하지 않습니다.`]),
    sec('겉으로 보이는 역할의 언어',[`일간을 제외한 ${f.visibleGods.length}개의 천간에서는 ${f.godNames.join('·')}을 확인했습니다. 십신은 일간과 다른 천간의 오행·음양 관계에 붙이는 전통 용어입니다. 이 풀이에서는 운의 좋고 나쁨 대신 생활의 역할을 돌아보는 언어로 사용합니다.`,...godParagraphs(f)]),
    sec('겉으로 맡는 역할과 내 안의 기준',[`월간 ${person.details.month.stemKo}를 일간과 비교하면 ${tenGod(f.day.stemIdx,person.details.month.stemIdx)}입니다. 여기서는 '${GOD_STORIES[tenGod(f.day.stemIdx,person.details.month.stemIdx)].focus}'이라는 바깥의 역할로 읽고, 일간의 '${s.gift}'이라는 내 방식과 나란히 놓아 봅니다. 두 표현이 다르게 느껴져도 성격의 모순이라기보다 상황에 따라 꺼내 쓰는 역할이 다른 장면일 수 있습니다.`,`${{same:'주변과 비슷한 기준으로 움직여 편안할 수 있지만, 모두 나처럼 생각할 것이라는 기대가 생길 때는 의견을 다시 확인해 보세요.',output:'주변에서는 생각을 빨리 설명하고 결과를 보여 주길 바랄 수 있어요. 내 기준을 정리하는 시간과 밖으로 보여 주는 시간을 나누면 급한 표현 뒤의 아쉬움을 줄일 수 있습니다.',resource:'자료를 이해하고 조언을 구하는 역할과 스스로 결정하려는 마음이 함께 놓입니다. 충분히 알고 싶은 마음이 시작을 늦춘다면, 알고 있는 범위에서 해 볼 작은 선택 하나를 정해 보세요.',control:'사람과 자원을 조정해 결과를 내야 하는 상황에서 내 기준을 지킬 여유가 줄어들 수 있어요. 요청을 바로 수락하기 전에 필요한 시간과 내 몫을 분명하게 말해 보세요.',pressure:'밖에서는 기준과 책임을 맞추느라 단정하고 빈틈없이 보이려 할 수 있어요. 혼자서는 내 방식대로 해 보고 싶다면, 반드시 지킬 약속과 자율적으로 선택할 방법을 구분해 보세요.'}[elementRelation(f.day.element.stem,person.details.month.element.stem)]}${f.boundary?' 출생 시간이 없는 절기 경계일이므로 이 월간 비교는 정오 기준의 잠정 풀이입니다.':''}`]),
    sec('읽은 뒤 남길 한 가지',[`한 장에서 나를 모두 설명하려고 하지 않아도 됩니다. '${s.question}'라는 질문에 최근의 실제 장면 하나를 붙여 보세요. 잘 맞는 부분과 맞지 않는 부분을 같이 남기면 다음 풀이를 읽을 때도 나의 경험이 기준이 됩니다.`],[s.practice,'며칠 뒤 도움이 된 행동과 부담이 된 행동을 각각 한 줄 남기기'])
  ]);
  const strength=doc('잘하는 방식을 반복 가능한 힘으로','강점 개발',`${s.gift}을 작은 결과로 만드는 연습입니다. 잘했다는 느낌보다 다시 쓸 수 있는 방법을 남겨 보세요.`,basis(f),[
    sec('내가 맡아 볼 역할',[`${f.day.stemKo}${f.day.element.stem}의 상징을 일에 옮기면 ${s.work}을 먼저 시험해 볼 수 있습니다. 특정 직업에 맞는다는 판정은 아닙니다. 지금 하는 일이나 생활 안에서 이 기능을 작게 맡고 실제 반응을 확인하는 방식이 적절합니다.`,`장면으로는 ${s.example}이 있습니다. 편하게 해냈던 부분이 있다면 결과만 칭찬하기보다 어떤 준비와 선택이 도움이 됐는지 찾아보세요.`]),
    sec('계절의 질문을 더한 연습',[seasonParagraph(f),`이번에는 ${f.season.opportunity}을 더해 보세요. ${s.finish}까지 연결하면 한 번의 좋은 반응에 그치지 않고 다음에도 사용할 방법이 남습니다.`],[f.season.action]),
    sec('강점이 이어지는 연결 고리',f.most.map(e=>`${e}가 ${f.counts[e]}개로 ${f.most.length>1?'공동 최다':'최다'}라는 사실에서 '${ELEMENT_STORIES[e].verb}'의 역할을 골랐습니다. 일간의 ${s.gift}을 준비한 뒤, ${ELEMENT_STORIES[e].small}를 연결해 보세요. 실제로 더 수월한지 확인한 뒤 남길 연습을 정하면 됩니다.`)),
    sec('십신을 행동의 선택지로',[...godParagraphs(f),`여러 십신이 보인다고 모두 동시에 잘해야 하는 것은 아닙니다. 지금 필요한 역할 하나를 고르고, 다음 주에는 다른 역할을 시험해도 됩니다. 보이지 않는 십신의 능력을 갖추지 못했다고 해석하지 않습니다.`],f.godNames.map(g=>GOD_STORIES[g].task)),
    sec('혼자 잘하기에서 함께 쓰기로',[polarity(f),`강점은 다른 사람이 이어받을 수 있을 때 쓰임이 넓어집니다. '${s.finish}'을 목표로 내가 한 선택의 이유를 짧게 남겨 보세요. 도움을 요청할 때도 막연히 봐 달라고 하기보다 어느 부분을 확인해 주면 되는지 말하는 편이 좋습니다.`],['작은 결과물 하나에 목표·선택 이유·다음 행동을 한 줄씩 붙이기','실제로 사용한 사람에게 편했던 점과 막혔던 점을 하나씩 묻기','계속 쓸 방법 하나만 남기고 나머지는 조정하기'])
  ]);
  const weakness=doc('과하게 쓴 강점에 조절 장치 달기','보완 연습',`${s.excess}이 익숙한 장면인지 확인해 보세요. 성격을 고치려 하기보다 반복 상황에 작은 선택지를 더하는 연습입니다.`,basis(f),[
    sec('어떤 순간에 부담이 커질까',[`${f.day.stemKo}의 강점인 ${s.gift}은 상황에 따라 ${s.excess}으로 이어질 수 있습니다. 특히 ${s.trigger}를 돌아보세요. 이 장면이 실제로 반복될 때만 보완 대상으로 삼고, 맞지 않는 설명을 억지로 내 단점에 넣지 않아도 됩니다.`,`최근 한 번을 골라 “상황 → 내가 한 행동 → 상대의 반응 → 내가 원했던 결과” 순서로 적으면 고칠 대상을 성격 전체가 아닌 행동 한 개로 좁힐 수 있습니다.`]),
    sec('많은 상징에도 멈춤 기준',f.most.map(e=>`${e}가 많이 보이는 분포를 '${ELEMENT_STORIES[e].verb}'의 질문으로 읽을 때 살펴볼 장면은 ${ELEMENT_STORIES[e].excess}입니다. 개수만으로 이런 일이 생긴다고 판단하지 않습니다. 최근의 일정이나 대화에서 해당하는 장면이 있다면 ${ELEMENT_STORIES[e].small}부터 시작해 보세요.`)),
    sec('적은 상징은 다른 행동의 입구',[`가장 적은 ${f.least.join('·')}의 상징은 결핍을 채운다는 처방보다 평소 안 쓰던 접근을 빌리는 데 사용합니다. ${f.least.length>1?'여러 오행이 공동 최소이므로 전부 보완하려 하지 말고 오늘 상황에 맞는 하나만 선택해 보세요.':'해당하는 행동을 이미 잘한다면 더 보완할 필요가 없습니다.'}`, ...f.least.map(e=>`${e}의 연습은 '${ELEMENT_STORIES[e].low}'입니다. 시간과 노력이 작게 드는 장면에서 시험하고, 효과가 없으면 멈추거나 다른 방법으로 바꿔도 됩니다.`)]),
    sec('바로 쓸 수 있는 대체 문장',[s.repair,`말을 바꿔 볼 수 있다면 “${s.speech}”라고 시작해 보세요. 예를 들어 ${s.trigger}, 결론을 서두르거나 오래 숨기기 전에 이 문장으로 지금의 의도와 필요한 조건을 함께 밝히는 것입니다. 상대의 반응까지 내가 통제할 수는 없으니, 내가 선택한 표현과 범위에 집중해 보세요.`]),
    sec('일주일 뒤 확인할 기준',[`연습의 성공을 “한 번도 예전처럼 행동하지 않았다”로 잡으면 변화가 잘 보이지 않을 수 있습니다. 같은 장면에서 한 번이라도 멈춰 다른 선택을 했는지, 들인 노력에 비해 부담이 줄었는지를 확인해 보세요. ${f.season.caution} ${f.season.action}`],[s.practice,'반복된 상황 두 번에서 내가 선택한 말이나 행동 기록하기','효과가 있었던 한 가지를 남기고 부담만 커진 연습은 줄이기'])
  ]);
  const relations=doc('내 의도를 상대가 알아들을 말로','관계와 소통',`일간의 질문은 '${s.question}'입니다. 사주 상징과 선택한 소통 성향을 나누어 읽고, 실제 상대의 필요를 직접 확인해 보세요.`,basis(f,[f.mbti?`MBTI ${f.mbti}: 네 축의 선택 응답만 사용, 명식과 별개`:'MBTI 미선택: 성향 추정 없음']),[
    sec('좋은 의도와 전달된 말 사이',[`${s.gift}이 관계에서 도움이 될 때도 있지만, ${s.trigger}에는 ${s.excess}으로 전달될 여지가 있습니다. 나의 의도가 좋았다는 설명과 상대가 실제로 받은 느낌을 따로 들어 보세요. 상대가 다르게 받아들였다고 해서 어느 한쪽의 경험이 자동으로 틀리는 것은 아닙니다.`,`예를 들어 내가 빨리 해결하려던 조언이 상대에게는 말을 끝내기 전 판단으로 느껴질 수 있습니다. 먼저 “지금은 들어 주면 좋을까, 같이 방법을 찾아보면 좋을까?”라고 확인한 뒤 내 제안을 말해 보세요.`]),
    ...axisSections(f),
    sec('내 범위와 요청을 함께 말하기',[`“${s.speech}”는 상대를 바꾸라는 요구보다 나의 조건을 드러내는 출발점입니다. 가능하다고 답한 일도 조건이 달라지면 다시 의논할 수 있습니다. 도움을 준 횟수를 마음속 장부로 쌓기보다, 어렵기 시작한 시점에 가능한 범위를 알려 주세요.`,person.input.blood?`선택한 ${person.input.blood}형은 명식이나 성향 판단에 사용하지 않습니다. 재미 질문으로만 “요즘 내가 듣고 싶은 말은 무엇일까?”를 꺼내 보고, 혈액형 설명 대신 내 답을 상대에게 들려주세요.`:'서로 닮았다는 느낌이 들어도 원하는 도움까지 같다고 가정하지 마세요. 지금 필요한 것을 한 문장으로 물어보는 편이 오해를 줄이는 데 도움이 됩니다.'],['최근 오해 한 건에서 실제 들은 말과 내가 해석한 뜻을 구분하기','다음 대화에서 원하는 도움·가능한 범위·다시 이야기할 시점을 말하기'])
  ]);
  const work=doc('성과와 여유가 함께 남는 일의 방식','일과 돈의 습관',`${s.work}을 작은 역할로 시험하고, 시간과 비용이 실제로 어디에 쓰였는지 확인해 보세요. 직업 적성이나 재물운을 단정하는 풀이가 아닙니다.`,basis(f),[
    sec('직업명보다 작업의 기능',[`${s.work}은 어느 직업에도 일부 들어 있을 수 있습니다. 새로운 진로를 정하기 전에 현재 맡은 일 중 ${s.gift}을 활용할 작은 구간을 찾아보세요. 좋아하는 기능과 실제 잘 수행한 기능, 주변이 계속 맡기는 기능을 구분하면 내가 원하는 역할이 더 분명해집니다.`,`예를 들어 ${s.example}을 한 번 해 본 뒤 준비 시간, 결과의 사용 여부, 다음에도 하고 싶은지를 적어 보세요. 같은 기능이어도 자율성이나 협업 조건에 따라 만족감은 달라질 수 있습니다.`]),
    sec('착수와 마무리 사이의 규칙',[`일간의 질문을 실행으로 옮길 때는 ${s.finish}이 핵심입니다. ${s.excess}이 반복된다면 개인 의지보다 작업의 크기와 확인 시점을 먼저 바꿔 보세요. 큰 약속 하나를 오래 붙들기보다 작은 결과를 보여 주고 수정 범위를 정하는 방법이 맞는지 시험할 수 있습니다.`,`${f.season.why} 이 배경에서 ${f.season.action}${f.boundary?' 절기 경계일의 계절 설명은 임시값입니다.':''}`],['시작 전에 결과를 사용할 사람과 완료 기준 정하기','진행 중 한 번 확인할 시점 예약하기','끝낸 뒤 유지·반복에 드는 일도 작업 목록에 넣기']),
    sec('천간의 역할을 업무에 번역하기',f.godNames.map(g=>`${g}는 여기서 '${GOD_STORIES[g].focus}'로 번역했습니다. ${GOD_STORIES[g].task}를 업무에 적용해 보세요. ${GOD_STORIES[g].group}이라는 이름은 편한 역할을 탐색하는 분류이며, 승진·수입·성과가 따를 것이라는 예고가 아닙니다.`)),
    sec('지출은 상징보다 실제 기록으로',[...f.most.map(e=>`${e}의 '${ELEMENT_STORIES[e].resource}'를 생활 습관에 연결하면 이런 질문을 할 수 있습니다. ${ELEMENT_STORIES[e].money}`),`사주에서 보이는 재성은 돈을 많이 벌거나 잃을 징표로 사용하지 않습니다. 구매한 뒤 실제 쓴 횟수와 그때 필요했던 이유를 함께 확인해 보세요. 수입 규모나 투자 선택을 이 풀이에서 정하지 않고, 작고 되돌리기 쉬운 소비 습관만 돌아봅니다.`]),
    sec('일주일 동안 해 볼 작은 운영',[`이번 주에는 ${s.practice}를 업무나 생활비 관리 중 한 곳에만 적용해 보세요. 결과가 별로였다면 나에게 맞지 않는다는 결론 전에 범위가 너무 컸는지, 필요한 정보나 권한이 있었는지 확인하면 좋습니다. 일이 늘었다는 사실과 성과가 늘었다는 사실도 구분해 보세요.`],['반복해서 시간을 쓰는 일 한 가지 기록하기','한 번의 작은 지출이나 작업에서 선택 이유와 결과 비교하기','계속할 규칙 하나와 중단할 부담 하나 정하기'])
  ]);
  const [year,month,day]=parseDate(date);const birthday=person.solar;const age=year-birthday.year-((month<birthday.month||(month===birthday.month&&day<birthday.day))?1:0);const life=LIFE_STAGES.find(x=>age<x.max);
  const stages=doc(life.title,`만 ${age}세 · 생활 단계`,life.now,basis(f,[`기준일 ${date} · 변환된 양력 생일로 만 나이 계산`,'나이대별 생활 제안이며 대운·운세 전환 시점 계산이 아님']),[
    sec('지금의 역할을 먼저 확인하기',[`${life.now} 같은 나이라도 학생, 직장인, 돌봄을 맡은 사람, 잠시 쉬는 사람의 하루는 다릅니다. 결혼·취업·은퇴 같은 사건을 나이에 맞춰 전제하지 않고, 지금 내가 실제 맡고 있는 역할부터 적어 보세요.`,`이를테면 ${life.example}을 쓸 수 있습니다. 주변의 기대와 내 필요가 다르면 둘을 한 문장에 섞기보다 따로 적어야 무엇을 조정할지 보입니다.`]),
    sec('이미 가진 방식의 쓸모',[`${f.day.stemKo}${f.day.element.stem}의 ${s.gift}을 지금의 생활에 어디서 쓰고 있는지 찾아보세요. ${s.work}은 직장뿐 아니라 배움, 가사, 모임, 취미에서도 나타날 수 있습니다. 다른 사람의 성과와 비교하기 전에 내 상황에서 실제 도움이 된 장면을 하나 고르는 편이 좋습니다.`,`다만 ${s.excess}이 보인다면 더 잘하려고 힘을 보태기보다 역할을 줄이거나 방법을 조정해 보세요. 나이가 들면 자연히 해결될 문제로 남겨 두지 않고 작은 조건부터 바꿔 볼 수 있습니다.`]),
    sec('다음 단계를 위한 준비',[life.next,`여기서 다음 단계는 정해진 사건이나 운의 전환이 아닙니다. ${age<60?'다음 나이대로 갈 때도 유지하고 싶은 생활의 조건':'앞으로의 생활에서 이어 가고 싶은 조건'}을 스스로 고르는 준비입니다. 지금 ${s.finish}을 연습하면 현재의 경험을 다음 선택에 가져갈 기록이 됩니다.`]),
    sec('줄일 부담과 새로 둘 여백',[`${f.season.why} 생활 질문으로 옮기면 ${f.season.action} ${f.boundary?'이 배경은 출생 시각 확인 전까지 잠정적입니다. ':''}그와 별도로 ${f.least.join('·')}의 적은 개수는 다음 나이에 부족해질 능력을 뜻하지 않습니다. 다음 연습 중 지금 필요한 하나만 골라 보세요.`,...least.map(e=>e.low+'를 작은 활동에 적용해 볼 수 있습니다.')]),
    sec('이번 달과 다음 검토일',[`생활의 방향은 계획 한 번으로 고정할 필요가 없습니다. 이번 달에 가능한 범위를 작게 정하고, 실제로 해 본 뒤 유지할지 바꿀지 고르면 됩니다. 중요한 것은 미래의 내 모습에 점수를 매기는 것보다 오늘의 선택 이유를 남기는 일입니다.`],life.steps)
  ]);
  const annual=annualReading(f,date,annualPillar);
  return [summary,strength,weakness,relations,work,stages,annual];
}

function annualReading(f,date,pillar){
  const s=f.story;
  if(!pillar)return doc('올해의 방향을 직접 정해 보기',`${date.slice(0,4)} · 기준일 ${date}`,'입춘을 반영한 올해 년주 정보가 제공되지 않아 세운을 추정하지 않습니다. 지금의 생활에서 이어갈 것과 바꿀 것을 정하는 계획으로 읽어 주세요.',basis(f,['올해 년주 미제공: 연도 숫자로 간지를 임의 생성하지 않음']),[
    sec('먼저 현재의 장면 확인하기',[`올해라는 큰 단위로 나를 평가하기 전에 최근 한 달에서 잘 이어진 일과 부담이 커진 일을 하나씩 골라 보세요. ${s.gift}을 어디에서 썼는지, 쓸 기회가 없었다면 환경이나 역할에서 어떤 조건이 필요했는지도 살펴볼 수 있습니다.`,`예를 들면 ${s.example}과 비슷한 장면이 있었다면 결과뿐 아니라 준비와 마무리에 들인 시간도 돌아보세요.`]),
    sec('이어갈 일 하나',[`일간의 질문인 '${s.question}'을 기준으로 이미 도움이 된 방법을 고릅니다. 올해 목표를 계속 늘리기보다 반복 가능한 작은 규칙 하나를 남기는 편이 계획을 확인하기 쉽습니다. ${s.finish}을 실행의 기준으로 삼아 보세요.`]),
    sec('바꿔 볼 방식 하나',[`반복된 부담이 ${s.excess}과 닮았다면 ${s.repair} 다만 일간의 상징이 맞지 않으면 실제 기록에서 자주 나타난 상황을 우선합니다. 바꿀 수 있는 것은 나의 말, 작업 크기, 합의한 일정이며 모든 결과를 예측할 수는 없습니다.`]),
    sec('다음 검토일의 질문',[`계획이 그대로 지켜졌는지뿐 아니라 조건이 달라졌는지 확인해 보세요. 예정과 다른 선택을 했더라도 더 적절한 이유가 있었다면 계획을 수정하는 것이 자연스럽습니다. 올해 년주가 준비되더라도 그 상징은 이런 판단을 대신하지 않습니다.`],[s.practice,'한 달 뒤 유지할 행동과 바꿀 조건을 한 줄씩 확인하기'])
  ]);
  const idx=pillar.stemIdx??STEM_NAMES.indexOf(pillar.stemKo),e=pillar.element?.stem??ELEMENTS[Math.floor(idx/2)],g=tenGod(f.day.stemIdx,idx),gs=GOD_STORIES[g],r=elementRelation(f.day.element.stem,e),annualName=`${pillar.stemKo||STEM_NAMES[idx]}${pillar.branchKo||''}`;
  const focus={same:'자율성과 협력의 경계를 살피기',output:'생각을 사용할 수 있는 결과로 꺼내기',resource:'배움과 도움을 실제로 써 보기',control:'시간과 자원의 쓰임을 확인하기',pressure:'책임과 기준의 크기를 조정하기'}[r];
  return doc(`${annualName}년의 상징을 생활 계획으로`,`${date} · 입춘 기준 년주`,`${f.day.stemKo}${f.day.element.stem}과 올해 천간 ${pillar.stemKo||STEM_NAMES[idx]}${e}의 관계를 '${focus}'의 질문으로 읽었습니다. 사건의 예고보다 내가 선택할 연습에 초점을 맞춥니다.`,basis(f,[`제공된 현재 년주 ${annualName} · 년간과 일간의 십신 ${g}`,`${relationWords(f.day.element.stem,e)} · 지장간·대운 종합 없음`]),[
    sec('올해 천간과 나의 방향',[`일간을 기준으로 ${relationWords(f.day.element.stem,e)}이므로 '${focus}'를 주제로 잡았습니다. 올해 년간의 음양까지 비교하면 ${g}에 해당합니다. ${gs.why} 이는 관계를 분류하는 규칙이며 올해 특정 성격이 생기거나 사건이 발생한다는 뜻은 아닙니다.`,`생활에 옮기면 ${gs.gift}이 됩니다. '${s.gift}'이라는 나의 기본 질문과 함께 읽고, 지금 실제로 필요한 일에만 적용해 보세요.`]),
    sec('해 볼 만한 일과 작은 예시',[`${gs.task}를 올해 한 번의 작은 프로젝트에 넣어 보세요. 예를 들어 ${s.example}에서, 시작하기 전에 필요한 조건을 확인하고 끝난 뒤 실제로 무엇이 남았는지 보는 방식입니다. 제안이 지금 상황과 맞지 않으면 시도 규모를 줄이거나 다른 영역으로 옮길 수 있습니다.`,`올해 지지 ${pillar.branchKo||'정보 미제공'}는 년주 표시에 사용하며, 지지 하나로 사건이나 시기를 추가 예측하지 않습니다. 천간 관계만으로 전체 세운을 해석한 것처럼 확대하지 않습니다.`]),
    sec('지나치게 밀어붙이지 않기',[`${gs.risk}에는 목표의 크기와 합의한 범위를 다시 확인해 보세요. ${s.excess}이 함께 나타난다면 같은 방식으로 더 오래 버티기보다 ${s.repair} 연습의 부담이 이득보다 커지면 줄이거나 중단해도 됩니다.`,`현재의 관계·일정·자원은 달라질 수 있습니다. 한 해의 상징이 특정 선택을 강요하지 않으며, 이미 잘 쓰고 있는 방법을 버릴 이유도 되지 않습니다.`]),
    sec('계획을 확인하는 세 번의 질문',[`첫 단계에서는 “무엇을 해 보려는가”, 실행 뒤에는 “실제로 누가 어떻게 썼는가”, 다음 검토에서는 “다시 할 만한가”를 묻습니다. 월별 길흉 대신 내 실행과 피드백의 순서를 만들면 년주 설명도 확인 가능한 생활 질문으로 남습니다.`,`${f.boundary?'출생 년주·월주는 경계일의 임시값이지만, 이 카드의 십신 관계는 일간과 제공된 올해 년간을 직접 비교했습니다.':'출생 명식의 글자 개수가 올해 때문에 바뀌는 것은 아닙니다. 올해 카드의 관계는 원국과 별도로 비교한 질문입니다.'}`],['지금부터 한 달 동안 시험할 행동 하나 정하기','실행 뒤 도움 된 점과 비용이 든 점 기록하기','다음 한 달에 유지·축소·중단 중 하나 선택하기']),
    sec('나의 방식과 연결해 마무리',[`올해의 단어를 외우기보다 '${s.question}'라는 질문에 내 경험을 붙여 보세요. ${ELEMENT_STORIES[e].verb}이라는 올해 천간의 상징과 ${s.finish}이라는 실행 기준을 함께 사용하면, 넓은 목표를 오늘 할 수 있는 한 가지로 줄일 수 있습니다.`],[gs.task,s.practice])
  ]);
}

export function pairFeatures(a,b){
  const left=deriveFeatures(a),right=deriveFeatures(b);
  const x=left.day.branchIdx,y=right.day.branchIdx;
  const joins=[[0,1],[2,11],[3,10],[4,9],[5,8],[6,7]];
  const branch=x===y?'same':Math.abs(x-y)===6?'clash':joins.some(([i,j])=>(x===i&&y===j)||(x===j&&y===i))?'join':'different';
  return {left,right,direction:elementRelation(left.day.element.stem,right.day.element.stem),branch};
}

export function buildPairReading(a,b,{relation='연인',date=koreanDate()}={}){
  parseDate(date);
  if(!RELATION_STORIES[relation])throw new TypeError('관계는 연인·부부·친구·동료 중 하나여야 합니다.');
  const {left:l,right:r,direction,branch}=pairFeatures(a,b),context=RELATION_STORIES[relation];
  let an=a.input.name||'나',bn=b.input.name||'상대';if(an===bn){an+=' A';bn+=' B';}
  const labels={same:'같은 언어에 다른 경험을 더하는 사이',output:'아이디어를 다음 행동으로 잇는 사이',resource:'아이디어를 다음 행동으로 잇는 사이',control:'다른 기준으로 균형을 찾는 사이',pressure:'다른 기준으로 균형을 찾는 사이'};
  const flow=direction==='same'?`${an}와 ${bn}의 일간 오행은 모두 ${l.day.element.stem}입니다. 익숙한 질문을 공유한다는 상징으로 읽지만 같은 취향이나 같은 가치관이라고 가정하지는 않습니다.`:
    (direction==='output'||direction==='resource')?`${direction==='output'?an:bn}의 ${direction==='output'?l.day.element.stem:r.day.element.stem}가 ${direction==='output'?bn:an}의 ${direction==='output'?r.day.element.stem:l.day.element.stem}를 생하는 방향입니다. 한쪽의 준비가 다른 쪽의 표현이나 실행을 돕는 장면으로 풀어 볼 수 있습니다. 도움을 주는 역할을 한 사람에게 고정하지 않는 것이 핵심입니다.`:
    `${direction==='control'?an:bn}의 ${direction==='control'?l.day.element.stem:r.day.element.stem}가 ${direction==='control'?bn:an}의 ${direction==='control'?r.day.element.stem:l.day.element.stem}를 극하는 방향입니다. 여기서 극은 기준을 세우고 범위를 조정하는 상징으로 읽습니다. 누가 우위에 있거나 누가 상대를 통제해야 한다는 뜻은 아닙니다.`;
  const branchCopy={
    same:'일지가 같아 생활을 대하는 질문이 익숙할 수 있다는 상징으로 읽습니다. 말하지 않아도 알 것이라는 기대가 커질 때는 원하는 시간·거리·역할을 구체적으로 확인해 보세요. 익숙함이 실제 합의까지 대신하지는 않습니다.',
    clash:'두 일지가 서로 마주 보는 충 관계입니다. 이를 관계 실패의 예고로 쓰기보다 일상의 우선순위와 반응 속도가 다를 때 조율하는 질문으로 읽습니다. 급히 결정해야 하는 순간에도 결론과 감정의 확인을 따로 진행하면 대화의 매듭을 찾기 쉬워집니다.',
    join:'두 일지는 육합으로 분류됩니다. 연결되는 지점을 찾아 협력하는 상징으로 읽을 수 있지만, 잘 맞을 것이라는 기대 때문에 불편한 조건을 생략하지 않도록 해 보세요. 친밀함이 있어도 돈·시간·개인 공간의 기준은 직접 정하는 편이 좋습니다.',
    different:'두 일지에는 이번 풀이에서 확인하는 동일·육합·충 관계가 없습니다. 따라서 좋거나 나쁘다는 등급을 덧붙이지 않습니다. 반복되는 실제 생활 장면에서 편했던 조건과 불편했던 조건을 찾는 것이 두 사람만의 기준이 됩니다.'
  }[branch];
  const pairBasis=[`${an}: 일간 ${l.day.stemKo}${l.day.element.stem}, 일지 ${l.day.branchKo}`,`${bn}: 일간 ${r.day.stemKo}${r.day.element.stem}, 일지 ${r.day.branchKo}`,relationWords(l.day.element.stem,r.day.element.stem),`일지 관계: ${{same:'동일',join:'육합',clash:'충',different:'위 세 관계 없음'}[branch]} · 다른 합충형파해 전체를 종합한 판정 아님`,`${an}의 계산 범위: ${uncertainty(l)}`,`${bn}의 계산 범위: ${uncertainty(r)}`,`${relation}에 맞춘 자체 생활 제안 · 기준일 ${date} · 성패 확률·점수 없음`];
  const axes=AXES.map((axis,i)=>{
    if(!l.mbti||!r.mbti)return sec(axis.name,[`두 사람 모두 이 축을 선택한 상태가 아니므로 어느 쪽의 성향도 사주로 추정하지 않습니다. ${['말하면서 정리하는 편인지, 혼자 정리하고 돌아오는 편인지 물어보세요. 말할 시점을 합의하면 기다리는 사람의 불안도 줄일 수 있습니다.','실제 있었던 사례와 앞으로 원하는 방향을 하나씩 말해 보세요. 같은 문제를 이야기하는지부터 확인하는 연습입니다.','결정의 이유와 그 결정이 사람에게 주는 영향을 함께 꺼내 보세요. 어느 하나를 중요하지 않다고 지우지 않아도 됩니다.','확정해야 하는 시점과 그때까지 바꿀 수 있는 부분을 나누어 보세요. 결정이 늦어진다면 추가로 필요한 정보를 한 가지만 정합니다.'][i]}`]);
    return sec(axis.name,[`${an}의 ${l.mbti[i]}와 ${bn}의 ${r.mbti[i]}는 ${l.mbti[i]===r.mbti[i]?'같은 선택입니다. 선호가 비슷해도 오늘의 여유와 원하는 도움은 다를 수 있으니 직접 확인해 보세요.':'다른 선택입니다. 한쪽을 맞추려 하기보다 다음의 두 방식을 함께 사용할 자리를 만들어 보세요.'}`,`${an}에게: ${axis[l.mbti[i]]}`,`${bn}에게: ${axis[r.mbti[i]]}`]);
  });
  const overview=doc(labels[direction],`${relation} · 두 사람의 기본 그림`,`${an}의 '${l.story.gift}'과 ${bn}의 '${r.story.gift}'을 함께 읽었습니다. 닮은 점과 다른 점을 실제 만남의 장면에 연결해 보세요.`,pairBasis,[
    sec('서로에게서 발견할 수 있는 것',[`${an}의 중심 질문은 ${l.story.core}입니다. ${bn}의 질문은 ${r.story.core}입니다. ${l.day.stemIdx===r.day.stemIdx?'같은 일간이므로 비슷한 상황에 관심을 가질 수 있다는 출발점을 공유합니다. 다만 살아온 경험과 표현은 서로 다를 수 있습니다.':'서로의 질문이 다르면 혼자서는 지나친 조건을 상대가 먼저 발견하는 장면이 생길 수 있습니다.'}`,`예를 들어 ${context.example}을 떠올려 보세요. 이때 편한 사람의 방식을 기본값으로 두기보다 각자가 지키고 싶은 조건을 하나씩 듣는 것이 먼저입니다.`]),
    sec('오행의 방향으로 읽는 연결',[flow,`${relation} 관계에서는 ${context.shared}을 실제 목표로 삼아 보세요. 서로의 기여를 비교하기보다 이번 만남에서 필요한 역할을 정하고, 다음에는 바꿔 맡을 수 있는지 확인하면 좋습니다.`]),
    sec('일상의 거리와 리듬',[branchCopy,`${context.scene}을 놓고 의견이 달라진 한 번의 장면을 골라 “무엇을 원했는지, 어떤 방법을 제안했는지”를 따로 말해 보세요. 목적은 같고 방법만 달랐다면 조정할 수 있는 선택지가 더 많아집니다.`]),
    sec('편안함을 확인하는 질문',[`서로에게 “내가 해 주면 편한 행동 한 가지, 줄이면 좋은 행동 한 가지”를 물어보세요. 답이 예상과 다르더라도 바로 해명하기보다 언제 그렇게 느꼈는지 사례를 먼저 들어 봅니다. ${context.boundary}`],[`두 사람의 ${context.contract}을 짧게 적기`,context.trial,'한 번 시도한 뒤 편해진 점과 아직 어려운 점을 각각 하나씩 말하기'])
  ]);
  const strengths=doc('둘의 강점을 함께 쓰는 방법',`${relation} · 공동 강점`,`${context.label}을 중심으로 두 사람의 역할과 대화 방식을 구체적으로 정해 봅니다. 잘 맞는다는 느낌을 실제로 편한 약속으로 바꾸는 과정입니다.`,pairBasis,[
    sec('이번에는 누가 무엇을 맡을까',[`${an}는 ${l.story.work}을, ${bn}는 ${r.story.work}을 작은 역할로 시험할 수 있습니다. 이것은 고정 배치가 아니라 한 번 해 보고 바꿀 수 있는 제안입니다. 역할이 비슷하면 준비와 마무리를 번갈아 맡아 보고, 다르면 서로의 작업을 이해할 시간을 조금 남겨 보세요.`,`함께 결정한 일에서도 실제 시간과 비용이 한 사람에게 몰릴 수 있습니다. ${context.contract}을 확인하고, 필요한 도움을 먼저 요청할 수 있게 약속해 두세요.`]),
    ...axes,
    sec('작은 공동 경험으로 확인하기',[`${relation} 사이의 강점은 말보다 경험에서 확인하기 쉽습니다. ${context.example}처럼 부담이 작은 일 하나를 골라 보세요. 끝난 뒤 성공 여부만 평가하지 말고 각자가 편했던 과정과 다시 나누고 싶은 부담을 이야기해 봅니다.`,`${an}에게는 '${l.story.finish}', ${bn}에게는 '${r.story.finish}'이 점검 질문이 됩니다. 둘 다 모든 질문을 수행할 필요 없이 지금 상황에 도움 되는 것 하나씩만 선택하세요.`],[context.trial,'함께 정한 약속 중 실제로 지켜진 것 한 가지를 구체적으로 고마워하기','다음 번에 바꿀 역할이나 조건을 한 가지만 정하기'])
  ]);
  const conflict=doc('서로 다른 순간을 풀어 가는 대화',`${relation} · 갈등과 수습`,`${an}와 ${bn}의 의도가 좋은 경우에도 속도와 기준이 달라 부딪힐 수 있습니다. 반복 상황을 찾아 말과 약속을 바꾸는 순서로 읽어 보세요.`,pairBasis,[
    sec('두 사람의 부담 신호 알아보기',[`${an}는 ${l.story.trigger}, ${l.story.excess}과 비슷한 행동이 나오는지 확인해 볼 수 있습니다. ${bn}는 ${r.story.trigger}, ${r.story.excess}이 익숙한지 살펴보세요. 상대를 이 설명으로 규정하기보다 본인이 실제로 동의하는 장면만 골라 대화의 재료로 삼는 것이 좋습니다.`,`같은 날에 두 사람의 여유가 다를 수 있습니다. 지금 이야기할 수 없는 사람은 피하겠다는 말로 끝내기보다 언제 다시 이어갈지 제안하고, 기다리는 사람은 당장 답을 얻어야 할 부분을 하나로 줄여 보세요.`]),
    sec('충돌의 구조를 생활로 번역하기',[flow,branchCopy,`${context.scene}을 두고 “내 방식이 맞다”는 말이 반복된다면, 각자 피하고 싶은 불편을 말해 보세요. 마감을 놓치는 불편과 충분히 검토하지 못하는 불편은 동시에 존재할 수 있습니다. 두 조건을 모두 다루는 중간 단계를 정하면 됩니다.`]),
    sec('실제로 바꿔 말해 보기',[`${an}의 시작 문장: “${l.story.speech}”`,`${bn}의 시작 문장: “${r.story.speech}”`,`${relation} 상황에 맞춘 예시: ${context.repair} 이때 “항상”, “절대”처럼 사람 전체를 평가하는 말보다 이번에 일어난 행동과 필요한 조건을 말하면 논점을 좁히기 쉽습니다.`]),
    sec('수습을 끝까지 이어 가는 순서',[`불편했던 장면을 확인한 뒤에는 누구의 마음이 더 옳은지 결론 내리려 하기보다 다음에 바꿀 행동을 구체적으로 정해 보세요. 서로 다른 해석이 남아 있어도 같은 행동에 합의할 수 있습니다. ${context.boundary}`],['대화가 격해졌다면 잠깐 쉬고 다시 이야기할 시점 정하기','각자 실제 있었던 일과 느낀 점을 한 가지씩 말하기',`다음 한 번의 ${context.scene}에서 바꿀 행동 한 가지 합의하기`,'약속을 지키기 어려웠다면 이유와 조정할 조건을 다시 확인하기']),
    sec('해결되지 않았을 때의 여지',[`한 번의 대화로 모든 문제가 풀리지 않아도 됩니다. 반복되는 부담이 성향의 차이인지, 시간·역할·권한 같은 현실 조건 때문인지 구분해 보세요. ${context.trial}을 했는데도 한 사람에게 부담만 남는다면 약속의 크기를 줄이거나 다시 나눌 필요가 있습니다. 관계를 유지하기 위한 노력과 나의 경계를 지키는 선택은 함께 할 수 있습니다.`])
  ]);
  return [overview,strengths,conflict];
}
