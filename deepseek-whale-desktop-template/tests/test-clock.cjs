const assert=require('node:assert/strict');
const {localClock,clockAnswer,prepareMessages}=require('../chat-context.cjs');
const clock=localClock(new Date('2026-09-28T08:16:00Z'),'Asia/Shanghai');
assert.equal(clock.date,'2026-09-28');assert.equal(clock.weekday,'星期一');assert.equal(clock.time,'16:16:00');
for(const q of ['今天几号？','今天是几号','几天是几号》','请问今天是星期几？','现在是几月几日？']){
  assert.equal(clockAnswer(q,clock),'今天是2026年9月28日，星期一。',q);
}
assert.match(clockAnswer('现在几点了？',clock),/16:16:00/);
assert.equal(clockAnswer('明天几号',clock),'明天是2026年9月29日，星期二。');
for(const q of ['今天几号？另外帮我写首诗','解释“今天几号”的语法','2025年10月7日是星期几','今天股市怎样'])assert.equal(clockAnswer(q,clock),null,q);
const rollover=localClock(new Date('2026-12-31T16:00:00Z'),'Asia/Shanghai');assert.equal(rollover.date,'2027-01-01');assert.equal(rollover.yesterday.date,'2026-12-31');
assert.equal(localClock(new Date('2026-09-28T00:30:00Z'),'America/Los_Angeles').date,'2026-09-27');
const leap=localClock(new Date('2028-03-01T00:00:00Z'),'UTC');assert.equal(leap.yesterday.date,'2028-02-29');
const messages=[{role:'system',content:'stale client prompt'},{role:'user',content:'今天几号'},{role:'assistant',content:'今天是2025年10月7日'},{role:'user',content:'今天日期和昨天日期分别是什么？'}];
const fresh=prepareMessages(messages,clock);assert.match(fresh[0].content,/2026-09-28/);assert.match(fresh.at(-1).content,/2026-09-28/);assert.equal(messages.at(-1).content,'今天日期和昨天日期分别是什么？');assert.equal(fresh.filter(m=>m.role==='system').length,1);
console.log('Clock regression tests passed: real-time facts, exact date queries, no broad interception, timezones, leap day, stale history.');

