const http=require('http');
function request(url,headers={}){
 return new Promise((resolve,reject)=>{
  const req=http.get(url,{headers},res=>{let body='';res.setEncoding('utf8');res.on('data',chunk=>{body+=chunk;if(body.length>262144)req.destroy(Error('response too large'))});res.on('error',reject);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body}))});
  req.setTimeout(30000,()=>req.destroy(Error('timeout')));req.on('error',reject);
 });
}
function createBalanceMonitor({getUrl,onChange,interval=60000}){
 let state={status:'waiting'},cookie='',owner='',timer=null,pending=null,lastRequest=0,generation=0;
 const publish=value=>{state=value;onChange({...state});return state};
 function endpoint(){const raw=getUrl();if(!raw)return null;const url=new URL(raw);if(url.protocol!=='http:'||!['127.0.0.1','localhost'].includes(url.hostname)||url.pathname!=='/'||!url.searchParams.get('token'))throw Error('invalid host');return url}
 async function read(url,force){
  if(!cookie){const login=await request(url);if(login.status!==303)throw Error('login failed');cookie=(login.headers['set-cookie']||[]).filter(x=>x.startsWith('dsh-auth-')).map(x=>x.split(';')[0]).join('; ');if(!cookie)throw Error('no cookie')}
  const route=new URL('/dsh-whale/balance.json'+(force?'?refresh=1':''),url);
  let result=await request(route,{Cookie:cookie});
  if(result.status===401){cookie='';const login=await request(url);cookie=(login.headers['set-cookie']||[]).filter(x=>x.startsWith('dsh-auth-')).map(x=>x.split(';')[0]).join('; ');if(login.status!==303||!cookie)throw Error('login failed');result=await request(route,{Cookie:cookie})}
  if(result.status===404)return {ok:false,code:'PLUGIN_MISSING'};
  if(result.status!==200)throw Error('service failed');return JSON.parse(result.body);
 }
 async function refresh(force=false){
  if(pending)return pending;
  if(force&&Date.now()-lastRequest<5000&&state.status!=='waiting')return state;
  let url;try{url=endpoint()}catch{return publish({status:'error',message:'本地服务地址无效'})}
  if(!url){cookie='';owner='';return publish({status:'waiting'})}
  if(owner!==url.href){owner=url.href;cookie='';state={status:'waiting'}}
  const turn=generation,previous=state;lastRequest=Date.now();publish({...state,refreshing:true});
  pending=(async()=>{try{
   const result=await read(url,force);if(turn!==generation)return state;
   const value=result.totalBalance;
   if(result.ok&&(typeof value==='number'||typeof value==='string'&&value.trim()!=='')&&Number.isFinite(Number(value))){
    return publish({status:result.stale?'stale':'ok',amount:Number(value),currency:result.currency==='USD'?'USD':'CNY',updatedAt:typeof result.updatedAt==='string'?result.updatedAt:new Date().toISOString(),refreshing:false});
   }
   if(result.code==='PLUGIN_MISSING')return publish({status:'error',message:'请在工作台启用小鲸鱼记账'});
   if(/未配置|没有.*key|没有.*密钥/i.test(String(result.error||''))||['NO_KEY','MISSING_KEY','NO_CREDENTIAL'].includes(result.code))return publish({status:'unconfigured'});
   if(result.transient&&Number.isFinite(previous.amount))return publish({...previous,status:'stale',refreshing:false});
   return publish({status:'error',message:'余额查询失败，请在工作台检查密钥或连接'});
  }catch{
   if(turn!==generation)return state;
   return publish(Number.isFinite(previous.amount)?{...previous,status:'stale',refreshing:false}:{status:'error',message:'暂时无法连接余额服务'});
  }finally{pending=null}})();return pending;
 }
 function start(){if(!timer){timer=setInterval(()=>refresh(),interval);timer.unref?.()}return refresh()}
 function stop(){clearInterval(timer);timer=null;generation++;cookie='';owner='';state={status:'waiting'}}
 return {start,stop,refresh,snapshot:()=>({...state})};
}
module.exports={createBalanceMonitor};
