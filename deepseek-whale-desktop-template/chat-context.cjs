// Runtime facts belong to the desktop client, not to model training data.
function localClock(now = new Date(), timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(now);
  const p = Object.fromEntries(parts.map(v=>[v.type,v.value]));
  const date = p.year+'-'+p.month+'-'+p.day;
  const weekday = new Intl.DateTimeFormat('zh-CN',{timeZone,weekday:'long'}).format(now);
  const time = p.hour+':'+p.minute+':'+p.second;
  function day(offset) {
    const d = new Date(Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day)+offset));
    return {date:d.toISOString().slice(0,10),label:d.getUTCFullYear()+'年'+(d.getUTCMonth()+1)+'月'+d.getUTCDate()+'日',weekday:['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][d.getUTCDay()]};
  }
  return {date,weekday,time,timeZone,today:day(0),yesterday:day(-1),tomorrow:day(1)};
}
function clockAnswer(text, clock) {
  // Only complete, simple clock questions. Compound/general questions still go to the model.
  const q=String(text).trim().replace(/[\s，,。.!！?？》>~～]/g,'').replace(/^(请问|告诉我|你知道)/,'').replace(/(吗|呀|呢|啊)$/,'');
  if (/^(今天|几天|今日|现在)(是)?(几号|多少号|几月几号|几月几日|什么日期|哪一天|星期几|周几|日期是什么)$/.test(q)||/^(今天的日期|今日日期|当前日期|今天日期)$/.test(q))
    return '今天是'+clock.today.label+'，'+clock.today.weekday+'。';
  if (/^(现在|当前)(是)?(几点|几点了|几点钟|什么时间|时间是多少)$/.test(q))
    return '现在是 '+clock.time+'（'+clock.timeZone+'），'+clock.today.label+'，'+clock.weekday+'。';
  const relative=q.match(/^(昨天|明天)(是)?(几号|多少号|几月几号|几月几日|星期几|周几)$/);
  if(relative){const d=relative[1]==='昨天'?clock.yesterday:clock.tomorrow;return relative[1]+'是'+d.label+'，'+d.weekday+'。'}
  return null;
}
function prepareMessages(messages, clock) {
  const facts='电脑当前日期：'+clock.today.label+'（'+clock.date+'），'+clock.weekday+'；时间：'+clock.time+'；时区：'+clock.timeZone+'。昨天：'+clock.yesterday.date+'；明天：'+clock.tomorrow.date+'。';
  const system='你是鲸伴，一个本地 DeepSeek 助手。默认使用中文，直接、准确地解决问题，避免不必要的卖萌和套话。'+
    '以下是应用在本次请求时从电脑系统时钟读取的事实，优先于训练知识和历史回答中的日期：'+facts+
    '历史回答可能错误，不要为错误辩护。不知道或缺少证据就明确说明；不得编造实时新闻、天气、节假日安排或查询结果。'+
    '当前是本地聊天模式，应用提供了系统时间，但没有联网、文件或终端工具。不要声称已上网、读取文件或执行操作。';
  const history=messages.filter(m=>['user','assistant'].includes(m.role)).map(m=>({role:m.role,content:String(m.content)}));
  // R1 models can underweight a system message. Repeat clock evidence beside the latest question.
  const last=history.findLastIndex(m=>m.role==='user');
  if(last>=0)history[last].content='【应用提供的实时环境；不要沿用历史中冲突的日期】\n'+facts+'\n【用户消息】\n'+history[last].content;
  return [{role:'system',content:system},...history];
}
module.exports={localClock,clockAnswer,prepareMessages};

