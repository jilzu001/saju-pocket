// Internal rule/content QA. This is not external expert review or a validity
// claim for divination. Run with: node verification/reading-audit.mjs
import assert from 'node:assert/strict';
import { calculateSaju } from '../vendor/ssaju.mjs';
import KoreanCalendar from '../vendor/korean-calendar.mjs';
import { elements, stems } from '../content.js';
import * as reading from '../reading.js';

const { buildPersonalReading, buildPairReading } = reading;
const DATE = '2026-10-11';
const cases = [];
const failures = [];
const statistics = { personalSets: 0, pairSets: 0, personalMinChars: Infinity, pairMinChars: Infinity };
function check(name, run) {
  try { run(); cases.push(name); }
  catch (error) { failures.push({ name, message: error.message }); }
}
const textOf = doc => [doc.title, doc.kicker, doc.summary, ...doc.basis,
  ...doc.sections.flatMap(section => [section.title, ...section.paragraphs, ...(section.steps || [])])].join('\n');
const proseOf = doc => [doc.summary, ...doc.sections.flatMap(section => [...section.paragraphs, ...(section.steps || [])])];
const clone = value => structuredClone(value);

// ReadPerson-compatible fixture creation uses the vendored engine, including
// the same noon provisional chart followed by actual hour-pillar exclusion.
// Its purpose is to test the independent reading layer, not replace UI tests.
function person(birth, time = '', extra = {}) {
  const input = { name: '검수인', birth, calendar: 'solar', time, mbti: '', blood: '', ...extra };
  let [year, month, day] = birth.split('-').map(Number);
  if (input.calendar === 'lunar') {
    const calendar = new KoreanCalendar();
    assert(calendar.setLunarDate(year, month, day, !!input.leap), 'invalid lunar test fixture');
    ({ year, month, day } = calendar.getSolarCalendar());
  }
  const [hour, minute] = time ? time.split(':').map(Number) : [12, 0];
  const args = { year, month, day, hour, minute, calendar: 'solar', timezone: 'Asia/Seoul', applyLocalMeanTime: false };
  const result = calculateSaju(args);
  const details = clone(result.pillarDetails);
  if (!time) delete details.hour;
  const counts = Object.fromEntries(elements.map(element => [element, 0]));
  for (const pillar of Object.values(details)) {
    counts[pillar.element.stem]++;
    counts[pillar.element.branch]++;
  }
  const dominant = elements.reduce((a, b) => counts[b] > counts[a] ? b : a);
  const weakest = elements.reduce((a, b) => counts[b] < counts[a] ? b : a);
  let boundary = false;
  if (!time) {
    const first = calculateSaju({ ...args, hour: 0, minute: 0 });
    const last = calculateSaju({ ...args, hour: 23, minute: 59 });
    boundary = first.pillars.year !== last.pillars.year || first.pillars.month !== last.pillars.month;
  }
  return { input, solar: { year, month, day }, details, counts, dominant, weakest,
    stem: stems[details.day.stemIdx], boundary };
}
function annualPillar(date = DATE, time = '12:00') {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  return calculateSaju({ year, month, day, hour, minute, timezone: 'Asia/Seoul', applyLocalMeanTime: false }).pillarDetails.year;
}
const options = { date: DATE, annualPillar: annualPillar() };
function validateDocs(docs, count, kind) {
  assert(Array.isArray(docs), `${kind}: document array required`);
  assert.equal(docs.length, count, `${kind}: incorrect tab count`);
  assert.equal(new Set(docs.map(doc => doc.title)).size, count, `${kind}: duplicate tab titles`);
  for (const [index, doc] of docs.entries()) {
    const label = `${kind}[${index}]`;
    for (const key of ['title', 'kicker', 'summary']) assert.equal(typeof doc[key], 'string', `${label}.${key}`);
    assert(doc.title.trim() && doc.kicker.trim() && doc.summary.trim(), `${label}: empty header`);
    assert(Array.isArray(doc.basis) && doc.basis.length, `${label}: actual basis required`);
    assert(doc.basis.every(value => typeof value === 'string' && value.trim()), `${label}: empty basis`);
    assert(Array.isArray(doc.sections) && doc.sections.length >= 3, `${label}: at least three substantive sections`);
    assert.equal(new Set(doc.sections.map(section => section.title)).size, doc.sections.length, `${label}: duplicate sections`);
    for (const section of doc.sections) {
      assert(typeof section.title === 'string' && section.title.trim(), `${label}: empty section title`);
      assert(Array.isArray(section.paragraphs) && section.paragraphs.length, `${label}: paragraphs required`);
      assert(section.paragraphs.every(value => typeof value === 'string' && value.trim()), `${label}: empty paragraph`);
      if (section.steps) assert(Array.isArray(section.steps) && section.steps.every(value => typeof value === 'string' && value.trim()), `${label}: invalid steps`);
    }
    const prose = proseOf(doc);
    const length = prose.join('').replace(/\s/g, '').length;
    assert(length >= 450, `${label}: substantive prose only ${length} chars`);
    assert(new Set(prose).size / prose.length >= 0.9, `${label}: repeated paragraph padding`);
    assert(!/(?:undefined|\bNaN\b|\[object Object\]|\$\{)/.test(textOf(doc)), `${label}: unresolved generated value`);
    statistics[`${kind}MinChars`] = Math.min(statistics[`${kind}MinChars`], length);
  }
  statistics[`${kind}Sets`]++;
}

const representative = [
  ['1962-01-01', ''], ['1962-02-04', '06:00'], ['1970-12-31', '23:59'],
  ['1987-05-10', '01:30'], ['1987-10-11', '03:30'], ['1988-05-08', '03:30'],
  ['1988-10-09', '01:30'], ['1990-05-15', '14:30'], ['1992-11-03', ''],
  ['2000-02-29', '00:00'], ['2004-02-04', ''], ['2010-06-21', '12:00'],
  ['2020-02-29', '23:59'], ['2026-02-04', ''], ['2026-10-11', ''],
].map(([birth, time]) => person(birth, time));
check('Public module contract', () => {
  assert.equal(typeof buildPersonalReading, 'function');
  assert.equal(typeof buildPairReading, 'function');
});
check('Real birthday schema, substance, determinism, input immutability', () => {
  for (const input of representative) {
    const before = clone(input);
    const first = buildPersonalReading(input, options);
    validateDocs(first, 7, 'personal');
    assert.deepEqual(buildPersonalReading(input, options), first, 'same input changes output');
    assert.deepEqual(input, before, 'generator mutates source person');
  }
});
check('Korean lunar conversion feeds the same reading as the equivalent solar date', () => {
  const lunar = person('2026-01-01', '', { calendar: 'lunar', leap: false });
  const solar = person('2026-02-17');
  assert.deepEqual(lunar.solar, solar.solar);
  assert.deepEqual(buildPersonalReading(lunar, options), buildPersonalReading(solar, options));
});
check('Three relation contexts generate concrete independent documents', () => {
  for (const relation of ['연인', '친구', '동료']) {
    const a = representative[7], b = representative[8];
    const before = [clone(a), clone(b)];
    const docs = buildPairReading(a, b, { relation, date: DATE });
    validateDocs(docs, 3, 'pair');
    assert.deepEqual([a, b], before, 'pair generator mutates source people');
    assert(textOf(docs[1]).includes(relation), `missing ${relation} context`);
  }
});

// Independent expectation tables keep the audit independent of the generator's
// implementation and explicitly cover the yin/yang reversal for all ten stems.
const GOD_MATRIX = [
  '비견 겁재 식신 상관 편재 정재 편관 정관 편인 정인',
  '겁재 비견 상관 식신 정재 편재 정관 편관 정인 편인',
  '편인 정인 비견 겁재 식신 상관 편재 정재 편관 정관',
  '정인 편인 겁재 비견 상관 식신 정재 편재 정관 편관',
  '편관 정관 편인 정인 비견 겁재 식신 상관 편재 정재',
  '정관 편관 정인 편인 겁재 비견 상관 식신 정재 편재',
  '편재 정재 편관 정관 편인 정인 비견 겁재 식신 상관',
  '정재 편재 정관 편관 정인 편인 겁재 비견 상관 식신',
  '식신 상관 편재 정재 편관 정관 편인 정인 비견 겁재',
  '상관 식신 정재 편재 정관 편관 정인 편인 겁재 비견',
].map(row => row.split(' '));
check('All 100 ten-god stem combinations including yin/yang', () => {
  assert.equal(typeof reading.tenGod, 'function');
  for (let day = 0; day < 10; day++) for (let target = 0; target < 10; target++) {
    assert.equal(reading.tenGod(day, target), GOD_MATRIX[day][target], `${stems[day][0]} → ${stems[target][0]}`);
  }
});
check('All 25 element directions and their reciprocal relationships', () => {
  assert.equal(typeof reading.elementRelation, 'function');
  const expected = [
    ['same', 'output', 'control', 'pressure', 'resource'],
    ['resource', 'same', 'output', 'control', 'pressure'],
    ['pressure', 'resource', 'same', 'output', 'control'],
    ['control', 'pressure', 'resource', 'same', 'output'],
    ['output', 'control', 'pressure', 'resource', 'same'],
  ];
  for (let from = 0; from < 5; from++) for (let to = 0; to < 5; to++) {
    assert.equal(reading.elementRelation(elements[from], elements[to]), expected[from][to], `${elements[from]} → ${elements[to]}`);
  }
});
check('Unknown hour excludes its count and visible ten-god contribution', () => {
  assert.equal(typeof reading.deriveFeatures, 'function');
  for (const birth of ['1962-01-01', '1990-05-15', '2000-02-29', '2026-02-04']) {
    for (const time of ['', '00:00', '12:00', '23:59']) {
      const p = person(birth, time), features = reading.deriveFeatures(p);
      assert.equal(Object.values(features.counts).reduce((a, b) => a + b, 0), time ? 8 : 6);
      assert.equal(features.visibleGods.length, time ? 3 : 2);
      const keys = time ? ['year', 'month', 'hour'] : ['year', 'month'];
      const expected = keys.map(key => GOD_MATRIX[p.details.day.stemIdx][p.details[key].stemIdx]).sort();
      assert.deepEqual(features.visibleGods.map(value => value.name).sort(), expected);
    }
  }
});
function* compositions(total, length = 5, previous = []) {
  if (length === 1) { yield [...previous, total]; return; }
  for (let value = 0; value <= total; value++) yield* compositions(total - value, length - 1, [...previous, value]);
}
check('All 705 six/eight-letter count distributions retain every maximum/minimum tie', () => {
  let count = 0;
  for (const total of [6, 8]) for (const values of compositions(total)) {
    // Deliberately isolated count fixtures test tie-selection semantics; they
    // are not presented as 705 attainable birth charts.
    const p = clone(representative[7]);
    p.counts = Object.fromEntries(elements.map((element, index) => [element, values[index]]));
    // Generator deliberately recounts visible pillars rather than trusting
    // cached counts. Feed these isolated distributions at that input boundary.
    const slots=elements.flatMap((element,index)=>Array(values[index]).fill(element));
    const keys=total===8?['year','month','day','hour']:['year','month','day'];
    p.input.time=total===8?'14:30':'';
    if(total===6)delete p.details.hour;
    keys.forEach((key,index)=>{p.details[key].element={stem:slots[index*2],branch:slots[index*2+1]};});
    const features = reading.deriveFeatures(p);
    assert.deepEqual(features.most, elements.filter(element => p.counts[element] === Math.max(...values)));
    assert.deepEqual(features.least, elements.filter(element => p.counts[element] === Math.min(...values)));
    count++;
  }
  assert.equal(count, 705);
});
check('Legacy arbitrary dominant/weakest fields do not change a reading', () => {
  for (const original of representative.slice(0, 5)) {
    const changed = clone(original);
    changed.dominant = '무효'; changed.weakest = '무효';
    assert.deepEqual(buildPersonalReading(changed, options), buildPersonalReading(original, options));
  }
});

check('Pair direction reverses with names; branch classification stays symmetric',()=>{
  const inverse={same:'same',output:'resource',resource:'output',control:'pressure',pressure:'control'};
  for(const a of representative)for(const b of representative){
    const ab=reading.pairFeatures(a,b),ba=reading.pairFeatures(b,a);
    assert.equal(ab.direction,inverse[ba.direction]);assert.equal(ab.branch,ba.branch);
  }
  for(let x=0;x<12;x++)for(let y=0;y<12;y++){
    const a=clone(representative[7]),b=clone(representative[8]);a.details.day.branchIdx=x;b.details.day.branchIdx=y;
    const result=reading.pairFeatures(a,b).branch;
    assert.equal(result,reading.pairFeatures(b,a).branch);
    if(x===y)assert.equal(result,'same');else if(Math.abs(x-y)===6)assert.equal(result,'clash');
  }
});
check('MBTI choices and blood do not change calculated features or unrelated documents',()=>{
  const a=clone(representative[7]);const initial=buildPersonalReading(a,options);
  for(const i of ['I','E'])for(const s of ['S','N'])for(const t of ['T','F'])for(const j of ['J','P']){
    const b=clone(a);b.input.mbti=i+s+t+j;b.input.blood='AB';const docs=buildPersonalReading(b,options);
    for(const k of [0,1,2,4,5,6])assert.deepEqual(docs[k],initial[k]);
    assert(textOf(docs[3]).includes(b.input.mbti[0]+'를 선택'));
    assert.deepEqual(reading.deriveFeatures(b).counts,reading.deriveFeatures(a).counts);
  }
});
check('Unknown-time boundary and birth-based age remain visible',()=>{
  const a=person('2026-02-04');assert(a.boundary);
  assert(buildPersonalReading(a,options).every(d=>d.basis.some(s=>s.includes('임시'))));
  const b=person('1992-11-03');
  assert(buildPersonalReading(b,{...options,date:'2026-11-02'})[5].kicker.includes('33세'));
  assert(buildPersonalReading(b,{...options,date:'2026-11-03'})[5].kicker.includes('34세'));
});

for (const result of failures) console.error(`FAIL ${result.name}: ${result.message}`);
console.log(JSON.stringify({ kind: 'internal rule/content QA', passed: cases.length, failed: failures.length,
  cases, statistics, failures }, null, 2));
if (failures.length) process.exitCode = 1;
