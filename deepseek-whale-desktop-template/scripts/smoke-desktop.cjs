// Runs a real Electron window against a local mock Ollama; no model download or API key.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),assert=require('node:assert/strict');
const {app,BrowserWindow,ipcMain}=require('electron');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'whale-desktop-smoke-'));
const configFile=path.join(tmp,'config.json');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
let sent=false,server;
const failure=e=>{console.error(e.stack||e);server?.close();app.exit(1)};
process.on('uncaughtException',failure);process.on('unhandledRejection',failure);
async function run(){
 server=http.createServer((req,res)=>{
  if(req.url==='/api/tags'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({models:[{name:'example-local-model'}]}));return}
  if(req.url!=='/api/chat'){res.writeHead(404);res.end();return}
  let raw='';req.on('data',c=>raw+=c);req.on('end',()=>{
   const body=JSON.parse(raw);assert.equal(body.model,'example-local-model');assert.equal(body.stream,true);assert(body.messages[0].content.includes('电脑当前日期'));sent=true;
   res.setHeader('Content-Type','application/x-ndjson');
   const line=JSON.stringify({message:{content:'这是模板的流式测试回答。',thinking:'正在检查本地接口。'}})+'\n';
   res.write(line.slice(0,17));setTimeout(()=>{res.write(line.slice(17));res.end(JSON.stringify({done:true,eval_count:8,eval_duration:1000000000})+'\n')},100);
  });
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 fs.writeFileSync(configFile,JSON.stringify({ollama:{baseUrl:`http://127.0.0.1:${server.address().port}`,autoStart:false},harness:{enabled:false}}));
 process.env.WHALE_CONFIG=configFile;process.env.WHALE_DATA_DIR=path.join(tmp,'data');
 // Keep test windows from stealing focus while preserving the actual renderer and IPC.
 BrowserWindow.prototype.show=function(){};BrowserWindow.prototype.showInactive=function(){};
 require('../main.cjs');await app.whenReady();
 let main,pet;
 for(let i=0;i<60;i++){
  const windows=BrowserWindow.getAllWindows();main=windows.find(w=>w.webContents.getURL().endsWith('/index.html'));pet=windows.find(w=>w.webContents.getURL().endsWith('/pet.html'));
  if(main&&pet&&!main.webContents.isLoading()&&!pet.webContents.isLoading())break;await delay(100);
 }
 assert(main&&pet,'Main and pet windows exist');
 const exec=s=>main.webContents.executeJavaScript(s);
 let init;for(let i=0;i<40;i++){init=await exec('window.whale.init()');if(init.status.connected)break;await delay(100)}
 assert(init.status.connected);assert.equal(init.status.harnessEnabled,false);assert.equal(init.prefs.petBalance,false);assert.equal(init.status.dataDir,path.join(tmp,'data'));
 assert.deepEqual(await exec('window.whale.loadHistory()'),[]);
 await exec(`document.querySelector('#enter').click();document.querySelector('#prompt').value='用一句话介绍模板。';document.querySelector('#send').click()`);
 for(let i=0;i<80;i++){if(sent&&await exec(`!document.querySelector('#send').classList.contains('busy')`))break;await delay(100)}
 assert(sent);assert.equal(await exec(`document.querySelector('.message.assistant .content').innerText`),'这是模板的流式测试回答。');
 await delay(300);const history=JSON.parse(fs.readFileSync(path.join(tmp,'data','chats.json'),'utf8'));assert.equal(history.length,1);
 assert.equal(await pet.webContents.executeJavaScript(`document.querySelector('#balance-card').hidden`),true);
 const before=pet.getBounds();await pet.webContents.executeJavaScript(`act('happy')`);await delay(100);assert.deepEqual(pet.getBounds(),before);
 console.log('PASS: fresh data, custom local endpoint, optional Harness, streaming response, persisted history, pet and fixed window size (mock model).');
 ipcMain.emit('window',{},'quit');server.close();
}
app.on('will-quit',()=>{server?.close();if(path.dirname(path.resolve(tmp))===path.resolve(os.tmpdir())&&path.basename(tmp).startsWith('whale-desktop-smoke-')){try{fs.rmSync(tmp,{recursive:true,force:true,maxRetries:3,retryDelay:100})}catch{}}});
run().catch(failure);
