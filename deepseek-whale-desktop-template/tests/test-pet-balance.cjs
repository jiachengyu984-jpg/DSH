const {test}=require('node:test'),assert=require('node:assert/strict'),http=require('http');const {createBalanceMonitor}=require('../pet-balance.cjs');
test('desktop balance: cookie authentication, zero balance, stale data and missing credentials',async()=>{
 let authCount=0,requireLogin=false,payload={ok:true,totalBalance:0,currency:'CNY',updatedAt:new Date().toISOString()},pluginMissing=false;
 const server=http.createServer((req,res)=>{
  if(req.url==='/?token=test-launch'){authCount++;res.writeHead(303,{'Set-Cookie':'dsh-auth-test=test-session; HttpOnly','Location':'/'});res.end();return}
  if(req.headers.cookie!=='dsh-auth-test=test-session'||requireLogin){requireLogin=false;res.writeHead(401);res.end();return}
  if(pluginMissing){res.writeHead(404);res.end();return}
  assert.match(req.url,/^\/dsh-whale\/balance.json/);res.setHeader('Content-Type','application/json');res.end(JSON.stringify(payload));
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let address=`http://127.0.0.1:${server.address().port}/?token=test-launch`;const seen=[];const monitor=createBalanceMonitor({getUrl:()=>address,onChange:s=>seen.push(s)});
 try{
  await monitor.refresh();assert.equal(monitor.snapshot().amount,0);assert.equal(monitor.snapshot().status,'ok');assert.equal(authCount,1);
  payload={ok:true,totalBalance:12.34,currency:'CNY'};await monitor.refresh();assert.equal(authCount,1);assert.equal(monitor.snapshot().amount,12.34);
  requireLogin=true;await monitor.refresh();assert.equal(authCount,2);assert.equal(monitor.snapshot().status,'ok');
  payload={ok:false,transient:true,error:'temporary failure'};await monitor.refresh();assert.equal(monitor.snapshot().status,'stale');assert.equal(monitor.snapshot().amount,12.34);
  payload={ok:false,code:'NO_KEY',error:'未配置 DEEPSEEK_API_KEY'};await monitor.refresh();assert.equal(monitor.snapshot().status,'unconfigured');assert.equal(monitor.snapshot().amount,undefined);
  payload={ok:true,totalBalance:null};await monitor.refresh();assert.equal(monitor.snapshot().status,'error');
  pluginMissing=true;await monitor.refresh();assert.match(monitor.snapshot().message,/启用/);
  address=null;await monitor.refresh();assert.equal(monitor.snapshot().status,'waiting');
  address='http://example.com/?token=test';await monitor.refresh();assert.equal(monitor.snapshot().status,'error');
  assert(!JSON.stringify(seen).includes('test-session'));assert(!JSON.stringify(seen).includes('test-launch'));
 }finally{monitor.stop();await new Promise(r=>server.close(r))}
});
