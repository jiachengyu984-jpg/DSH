const {localClock,clockAnswer,prepareMessages}=require('./chat-context.cjs');
const {app,BrowserWindow,ipcMain,Menu,Tray,nativeImage,screen,shell,dialog}=require('electron');
const fs=require('fs'),path=require('path'),http=require('http'),{spawn}=require('child_process');
const ROOT=__dirname;
const {loadConfig}=require('./app-config.cjs');
let config;
try { config=loadConfig({root:ROOT,appData:app.getPath('appData')}); }
catch(error){dialog.showErrorBox('鲸伴配置错误',error.message);app.exit(1);return;}
const DATA=config.dataDir;fs.mkdirSync(DATA,{recursive:true});
app.setPath('userData',path.join(DATA,'electron'));app.setName('DeepSeek · 鲸伴模板');app.setAppUserModelId('DeepSeek.Whale.Template');
const icon=path.join(ROOT,'assets','whale-girl.png');
let main,workbench,tray,harnessProcess,harnessURL,request,quitting=false;
let status={phase:'正在唤醒本地模型…',connected:false,models:[],harness:false,harnessEnabled:config.harness.enabled,harnessError:config.harness.enabled?'':'未启用（可选功能）',ollamaUrl:config.ollama.baseUrl,dataDir:DATA};
const configPath=path.join(DATA,'preferences.json');
let prefs={pet:true,petBalance:config.harness.enabled,petSize:230,theme:'light',model:config.ollama.model};
try{Object.assign(prefs,JSON.parse(fs.readFileSync(configPath,'utf8')))}catch{}
function savePrefs(){fs.writeFileSync(configPath,JSON.stringify(prefs,null,2))}
const {createPetController,SIZES}=require('./pet-controller.cjs');
const pets=createPetController({makeWindow:options=>secureWindow(options,'pet-preload.cjs'),screen,prefs,savePrefs});
function broadcast(channel,data){for(const w of [main,pets.window])if(w&&!w.isDestroyed())w.webContents.send(channel,data)}
const {createBalanceMonitor}=require('./pet-balance.cjs');
const balance=createBalanceMonitor({getUrl:()=>harnessURL,onChange:value=>broadcast('pet-balance',{...value,visible:prefs.petBalance!==false})});
function balanceSnapshot(){return {...balance.snapshot(),visible:prefs.petBalance!==false}}
function toggleBalance(){prefs.petBalance=prefs.petBalance===false;savePrefs();if(prefs.petBalance)balance.start();else balance.stop();broadcast('pet-balance',balanceSnapshot())}
function updateStatus(patch){Object.assign(status,patch);broadcast('status',status)}
function jsonRequest(route,body,timeout=6000){return new Promise((resolve,reject)=>{
const r=http.request(new URL(route,config.ollama.baseUrl),{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{}},res=>{let data='';res.setEncoding('utf8');res.on('data',c=>data+=c);res.on('end',()=>{try{const obj=JSON.parse(data);if(res.statusCode>=400)throw Error(obj.error||data);resolve(obj)}catch(e){reject(e)}})});
r.on('error',reject);r.setTimeout(timeout,()=>r.destroy(Error('Ollama 连接超时')));r.end(body?JSON.stringify(body):undefined)})}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function connectOllama(){
try{await jsonRequest('/api/tags')}catch{if(config.ollama.autoStart){const out=fs.openSync(path.join(DATA,'ollama.log'),'a');const child=spawn(config.ollama.executable,['serve'],{windowsHide:true,detached:true,env:{...process.env,OLLAMA_HOST:new URL(config.ollama.baseUrl).host},stdio:['ignore',out,out]});child.on('error',e=>updateStatus({phase:'Ollama 启动失败：'+e.message}));child.unref();fs.closeSync(out)}}
for(let i=0;i<35;i++){try{const result=await jsonRequest('/api/tags');const models=result.models.map(m=>m.name);if(!models.includes(prefs.model))prefs.model=models.find(x=>x.includes('deepseek'))||models[0]||'';updateStatus({connected:true,models,phase:models.length?'本地模型已就绪 · '+prefs.model:'Ollama 已连接，但没有已安装模型'});return}catch{await delay(700)}}
updateStatus({connected:false,phase:'Ollama 未连接。请启动 Ollama 后点击重新连接。'})}
// Harness is optional; the template never assumes a pre-existing personal installation.
function startHarness(){
 if(!config.harness.enabled)return;
 const h=config.harness;
 if(!h.cliPath||!fs.existsSync(h.cliPath)){updateStatus({harnessError:'请在 config.local.json 中填写有效的 harness.cliPath'});return}
 if(h.patchPath&&!fs.existsSync(h.patchPath)){updateStatus({harnessError:'harness.patchPath 指向的文件不存在'});return}
 fs.mkdirSync(h.workspace,{recursive:true});
 const args=[h.cliPath,'web'];if(h.patchPath)args.push('--patch',h.patchPath);args.push('--no-open','--host','127.0.0.1','--port','0');
 const child=spawn(h.nodePath,args,{cwd:h.workspace,windowsHide:true,env:{...process.env,DSH_TELEMETRY_DISABLED:'1'}});harnessProcess=child;
 let captured='';
 // Do not persist launch tokens or server output. Keep only a short in-memory buffer.
 child.stdout.on('data',b=>{captured=(captured+b.toString()).slice(-12000);const match=captured.match(/http:\/\/(?:127\.0\.0\.1|localhost):\d+\/\?token=[\w-]+/);if(match){harnessURL=match[0];updateStatus({harness:true,harnessError:''});if(prefs.petBalance!==false)balance.start()}});
 child.stderr.on('data',()=>{});
 child.on('error',()=>updateStatus({harnessError:'Harness 启动失败，请检查 Node.js 与 CLI 路径'}));
 child.on('exit',()=>{if(harnessProcess!==child)return;harnessURL=null;balance.stop();broadcast('pet-balance',balanceSnapshot());updateStatus({harness:false,harnessError:'Harness 已退出，请检查配置后重新启动应用'});harnessProcess=null});
}
function secureWindow(options,preload='preload.cjs'){
const w=new BrowserWindow({...options,icon,webPreferences:{preload:path.join(ROOT,preload),contextIsolation:true,nodeIntegration:false,sandbox:true}});
w.webContents.setWindowOpenHandler(({url})=>{if(/^https?:\/\//.test(url))shell.openExternal(url);return{action:'deny'}});
w.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith('file://'))event.preventDefault()});return w}
function showMain(){if(!main||main.isDestroyed())return;main.show();if(main.isMinimized())main.restore();main.focus()}
function createPet(){return pets.create()}
function togglePet(){return pets.toggle()}
function openWorkbench(){
if(!harnessURL){dialog.showMessageBox(main,{message:config.harness.enabled?'Harness 工作台未就绪':'Harness 是可选功能',detail:status.harnessError||'请稍后再试；安装配置见 docs/HARNESS.md。本地聊天可以独立使用。'});return}
if(workbench&&!workbench.isDestroyed()){workbench.show();workbench.focus();return}
workbench=new BrowserWindow({width:1250,height:840,minWidth:850,minHeight:600,title:'DeepSeek Harness · 本地工作台',icon,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}});
workbench.setMenuBarVisibility(false);const origin=new URL(harnessURL).origin;
workbench.webContents.setWindowOpenHandler(({url})=>{if(/^https?:\/\//.test(url))shell.openExternal(url);return{action:'deny'}});
workbench.webContents.on('will-navigate',(event,url)=>{if(new URL(url).origin!==origin)event.preventDefault()});workbench.loadURL(harnessURL);workbench.on('closed',()=>workbench=null)}
function petMenu(){Menu.buildFromTemplate([
{label:'打开聊天',click:showMain},{label:'Harness 工作台',click:openWorkbench},{label:'小动作',submenu:Object.entries(require('./pet-actions.js')).map(([action,spec])=>({label:spec.label,click:()=>broadcast('pet-action',action)}))},
{label:'桌宠大小',submenu:SIZES.map(size=>({label:size===180?'小':size===230?'中':'大',type:'radio',checked:prefs.petSize===size,click:()=>pets.resize(size)}))},
{label:'显示账户余额',enabled:config.harness.enabled,type:'checkbox',checked:prefs.petBalance!==false,click:toggleBalance},{label:'刷新账户余额',enabled:config.harness.enabled,click:()=>balance.refresh(true)},{label:'余额与密钥设置',click:openWorkbench},{type:'separator'},{label:'隐藏桌宠',click:togglePet},{type:'separator'},{label:'退出鲸伴',click:()=>{quitting=true;app.quit()}}]).popup({window:pets.window||main})}
if(!app.requestSingleInstanceLock())app.quit();else{
app.on('second-instance',showMain);app.whenReady().then(()=>{
Menu.setApplicationMenu(null);main=secureWindow({width:1190,height:800,minWidth:860,minHeight:620,frame:false,backgroundColor:'#02060b',show:false});
main.loadFile(path.join(ROOT,'index.html'));main.once('ready-to-show',()=>main.show());main.on('close',e=>{if(!quitting){e.preventDefault();main.hide();if(prefs.pet)pets.window?.showInactive()}});
createPet();tray=new Tray(nativeImage.createFromPath(icon).resize({width:32,height:32}));tray.setToolTip('DeepSeek · 鲸伴');
tray.setContextMenu(Menu.buildFromTemplate([{label:'打开鲸伴',click:showMain},{label:'Harness 工作台',click:openWorkbench},{label:'显示 / 隐藏鲸鱼娘',click:togglePet},{type:'separator'},{label:'退出',click:()=>{quitting=true;app.quit()}}]));tray.on('double-click',showMain);
connectOllama();startHarness()})}
ipcMain.handle('init',()=>({status,prefs}));ipcMain.handle('reconnect',async()=>{await connectOllama();return status});
ipcMain.handle('preferences',(_e,value)=>{for(const key of ['model','theme'])if(typeof value[key]==='string')prefs[key]=value[key];savePrefs();return prefs});
ipcMain.handle('pet-toggle',togglePet);ipcMain.handle('history-load',()=>{try{return JSON.parse(fs.readFileSync(path.join(DATA,'chats.json'),'utf8'))}catch{return[]}});
ipcMain.handle('history-save',(_e,value)=>{const target=path.join(DATA,'chats.json');fs.writeFileSync(target+'.tmp',JSON.stringify(value));fs.renameSync(target+'.tmp',target);return true});
ipcMain.handle('export',async(_e,text)=>{const result=await dialog.showSaveDialog(main,{defaultPath:'鲸伴对话.md',filters:[{name:'Markdown',extensions:['md']}]});if(!result.canceled){fs.writeFileSync(result.filePath,text,'utf8');return true}return false});
ipcMain.on('window',(_e,action)=>{if(action==='min')main.minimize();if(action==='max')main.isMaximized()?main.unmaximize():main.maximize();if(action==='close')main.close();if(action==='quit'){quitting=true;app.quit()}});
ipcMain.handle('pet-balance-get',()=>balanceSnapshot());ipcMain.handle('pet-balance-refresh',async()=>{await balance.refresh(true);return balanceSnapshot()});
ipcMain.on('harness',openWorkbench);ipcMain.on('pet-menu',petMenu);ipcMain.on('pet-open',showMain);
ipcMain.on('pet-drag-start',e=>pets.dragStart(e));
ipcMain.on('pet-drag',e=>pets.dragMove(e));
ipcMain.on('pet-drag-end',e=>pets.dragEnd(e));
ipcMain.on('chat-stop',()=>{request?.destroy();request=null});
ipcMain.on('chat',(event,payload)=>{
if(request)return;if(!payload||!Array.isArray(payload.messages)||payload.messages.some(m=>!m||typeof m.content!=='string'||!['user','assistant'].includes(m.role))){event.sender.send('chat-event',{error:'消息格式不正确',done:true});return}
const clock=localClock();
const lastUser=payload.messages.findLast(m=>m.role==='user');
const localAnswer=lastUser&&clockAnswer(lastUser.content,clock);
if(localAnswer){event.sender.send('chat-event',{content:localAnswer});event.sender.send('chat-event',{done:true,source:'电脑系统时间 · '+clock.timeZone});return}
if(!status.models.includes(payload.model)){event.sender.send('chat-event',{error:'请选择已安装的模型',done:true});return}
const body={model:payload.model,messages:prepareMessages(payload.messages,clock),stream:true,keep_alive:'10m',options:{num_ctx:8192,num_predict:4096,temperature:0.65}};
let done=false;const send=value=>{if(!event.sender.isDestroyed())event.sender.send('chat-event',value)};
const finish=extra=>{if(done)return;done=true;if(request===req)request=null;send({done:true,...extra});broadcast('pet-message',extra?.error?'连接遇到问题，打开聊天看看吧。':extra?.stopped?'好的，先停下来～':'想好啦，回答已经准备好了～')};
const req=http.request(new URL('/api/chat',config.ollama.baseUrl),{method:'POST',headers:{'Content-Type':'application/json'}},res=>{
let buffer='';res.setEncoding('utf8');res.on('data',chunk=>{buffer+=chunk;let split;while((split=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,split);buffer=buffer.slice(split+1);if(!line.trim())continue;try{const v=JSON.parse(line);if(v.error){finish({error:v.error});req.destroy();return}send({content:v.message?.content||'',thinking:v.message?.thinking||''});if(v.done)finish({tokens:v.eval_count,duration:v.eval_duration})}catch{finish({error:'模型返回的数据格式不正确'});req.destroy()}}});
res.on('end',()=>{if(buffer.trim())try{const v=JSON.parse(buffer);if(v.error){finish({error:v.error});return}send({content:v.message?.content||'',thinking:v.message?.thinking||''})}catch{}finish()});res.on('error',e=>finish({error:e.message}))});
request=req;req.on('error',e=>finish({error:e.message}));req.on('close',()=>finish({stopped:true}));req.setTimeout(180000,()=>req.destroy(Error('模型响应超时，请重试')));req.end(JSON.stringify(body));broadcast('pet-message','让我认真想一想…')});
app.on('before-quit',()=>{quitting=true;balance.stop();request?.destroy();harnessProcess?.kill()});app.on('window-all-closed',()=>{if(quitting)app.quit()});

