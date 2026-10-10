import assert from 'node:assert/strict';
import {calculateSaju} from '../vendor/ssaju.mjs';
import {currentFortune,calculateDaeun,buildFortuneReadings} from '../fortune.js';
const birth={year:1990,month:5,day:15};
function person(gender='남',time='14:30'){const r=calculateSaju({...birth,hour:14,minute:30});return {input:{birth:'1990-05-15',calendar:'solar',name:'가람',gender,time},solar:birth,details:r.pillarDetails,boundary:false};}
const now=new Date('2026-10-11T03:00:00Z'),c=currentFortune(now);
assert.equal(c.year.pillar.stemKo+c.year.pillar.branchKo,'병오');
assert.equal(c.year.cycleYear,2026);assert(c.month.start<=now&&c.month.end>now);
for(const kind of ['year','month','day']){
 const edge=c[kind].end,before=currentFortune(new Date(edge.getTime()-60000)),after=currentFortune(new Date(edge.getTime()+60000));
 assert.notEqual(before[kind].pillar.stem+before[kind].pillar.branch,after[kind].pillar.stem+after[kind].pillar.branch,`${kind} changes at its actual boundary`);
}
const jan=currentFortune(new Date('2026-01-01T03:00:00Z'));assert.equal(jan.year.cycleYear,2025);assert.equal(jan.year.pillar.stemKo+jan.year.pillar.branchKo,'을사');
const sameMonth=currentFortune(new Date(c.month.start.getTime()+60000));assert.equal(sameMonth.month.pillar.stem+c.month.pillar.branch,c.month.pillar.stem+c.month.pillar.branch);
const a=calculateDaeun(person(),now),b=calculateDaeun(person('여'),now);assert.equal(a.basis.direction,'forward');assert.equal(b.basis.direction,'backward');assert.notEqual(a.current.ganzhi,b.current.ganzhi);
for(const d of [a,b]){assert.equal(d.list.length,10);for(let i=1;i<10;i++){assert.equal(d.list[i].startAge-d.list[i-1].startAge,10);const direction=d.basis.direction==='forward'?1:-1;assert.equal((d.list[i].stemIdx-d.list[i-1].stemIdx+10)%10,(direction+10)%10);assert.equal((d.list[i].branchIdx-d.list[i-1].branchIdx+12)%12,(direction+12)%12);}}
assert.equal(calculateDaeun(person(''),now).missing,'gender');assert(calculateDaeun(person('남',''),now).approximate);const boundary=person('남','');boundary.boundary=true;assert.equal(calculateDaeun(boundary,now).missing,'boundaryTime');
const future=calculateDaeun(person(),new Date('2028-10-11T03:00:00Z'));assert.notEqual(a.current.ganzhi,future.current.ganzhi,'Current decade changes when the age interval changes');
const seen=[];
for(let day=1;day<=60;day++){
 const date=new Date(now.getTime()+day*86400000),flow=buildFortuneReadings(person(),{now:date});
 for(const key of ['daeun','year','month','day']){const doc=flow[key],text=JSON.stringify(doc);assert(!/undefined|NaN|\[object Object\]/.test(text));assert(doc.sections.length>=7);assert.equal(text,JSON.stringify(buildFortuneReadings(person(),{now:date})[key]));}
 seen.push(flow.day.kicker);
}
assert.equal(new Set(seen).size,60);
console.log(JSON.stringify({boundaryTransitions:['ipchun','solarMonth','KSTMidnight'],daeunDirections:true,tenDecades:true,missingInputs:true,sixtyDaysDeterministic:true,errors:0}));
