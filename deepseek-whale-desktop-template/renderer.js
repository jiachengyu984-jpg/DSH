const $=s=>document.querySelector(s);let chats=[],active=null,busy=false,streamMessage=null,status={},prefs={},saveTimer;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function markdown(s){return String(s).split(/(\x60\x60\x60[\s\S]*?\x60\x60\x60)/g).map(part=>{if(part.startsWith('\x60\x60\x60'))return '<pre><code>'+escape(part.slice(3,-3).replace(/^[^\n]*\n/,''))+'</code></pre>';return escape(part).replace(/\x60([^\x60\n]+)\x60/g,'<code>$1</code>').replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>')}).join('')}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),2800)}
function persist(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>window.whale.saveHistory(chats).catch(()=>toast('保存失败，请检查磁盘空间')),200)}
function current(){return chats.find(c=>c.id===active)}
function sidebar(){const query=$('#search').value.trim().toLowerCase();$('#history').replaceChildren();$('#chat-count').textContent=chats.length;for(const c of chats.filter(c=>c.title.toLowerCase().includes(query))){const row=document.createElement('div');row.className='history-row'+(c.id===active?' active':'');const b=document.createElement('button');b.className='select-chat';b.textContent=c.title;b.title=c.title;b.onclick=()=>{if(busy){toast('请先停止当前回答');return}active=c.id;render();sidebar()};const d=document.createElement('button');d.className='delete-chat';d.textContent='×';d.title='删除对话';d.onclick=()=>{if(busy){toast('请先停止当前回答');return}if(!confirm('删除这条对话？此操作无法撤销。'))return;chats=chats.filter(x=>x.id!==c.id);if(active===c.id)active=null;persist();sidebar();render()};row.append(b,d);$('#history').append(row)}if(!chats.length)$('#history').innerHTML='<div class="empty-history">从一个好奇的问题开始。</div>'}
function renderMessage(m){const el=document.createElement('article');el.className='message '+m.role;el.dataset.id=m.id;
el.innerHTML='<div class="author">'+(m.role==='assistant'?'<img src="assets/whale-girl.png">鲸伴 · DeepSeek':'你')+'</div>'+(m.role==='assistant'?'<details '+(busy&&m===streamMessage&&!m.content?'open':'')+'><summary>思考过程</summary><div class="thinking"></div></details>':'')+'<div class="content"></div><div class="error"></div><div class="meta"></div>';
if(m.role==='assistant'){const actions=document.createElement('div');actions.className='message-actions';const copy=document.createElement('button');copy.textContent='复制';copy.onclick=()=>navigator.clipboard.writeText(m.content||'').then(()=>toast('已复制回答'));actions.append(copy);el.append(actions)}
updateMessage(el,m);return el}
function updateMessage(el,m){el.querySelector('.content').innerHTML=markdown(m.content||(busy&&m===streamMessage?'正在思考…':''));if(m.role==='assistant'){el.querySelector('.thinking').textContent=m.thinking||'';el.querySelector('details').hidden=!m.thinking;if(m.content)el.querySelector('details').open=false}el.querySelector('.error').textContent=m.error||'';el.querySelector('.meta').textContent=m.meta||''}
function render(){const c=current();$('#session-title').textContent=c?.title||'新对话';$('#welcome').classList.toggle('hidden',!!c?.messages.length);$('#messages').replaceChildren();for(const m of c?.messages||[])$('#messages').append(renderMessage(m))}
function scrollBottom(){const c=$('#conversation');c.scrollTop=c.scrollHeight}
function newChat(){if(busy){toast('请先停止当前回答');return}active=null;render();sidebar();$('#prompt').focus()}
function enter(){$('#splash').classList.add('hidden');$('#workspace').classList.remove('hidden');document.body.classList.add('entered');$('#prompt').focus()}
function showStatus(s){status=s;$('#splash-status').textContent=s.phase;$('#dot').classList.toggle('online',s.connected);$('#local-label').textContent=s.connected?'Ollama 已连接':'Ollama 未连接';const chosen=$('#model').value||prefs.model;$('#model').replaceChildren();for(const model of s.models){const o=document.createElement('option');o.value=model;o.textContent=model;$('#model').append(o)}if(s.models.includes(chosen))$('#model').value=chosen;$('#send').disabled=!busy&&(!s.connected||!s.models.length);$('#harness').title=s.harness?'Harness 工作台已就绪':s.harnessError||'Harness 工作台正在启动';$('#service-address').textContent=s.ollamaUrl||'';$('#data-directory').textContent=s.dataDir||''}
function setBusy(value){busy=value;$('#send').textContent=value?'■':'↑';$('#send').classList.toggle('busy',value);$('#model').disabled=value;$('#send').disabled=!value&&(!status.connected||!status.models.length);$('#generation-status').textContent=value?'鲸伴正在思考 · 点击方块停止':'Enter 发送 · Shift + Enter 换行'}
function send(){if(busy){window.whale.stop();return}const text=$('#prompt').value.trim();if(!text)return;if(!status.connected){toast('Ollama 未连接，请点击左下角重新连接');return}if(!$('#model').value){toast('没有可用模型');return}
let c=current();if(!c){c={id:crypto.randomUUID(),title:text.slice(0,22),messages:[],created:Date.now()};chats.unshift(c);active=c.id}
c.messages.push({id:crypto.randomUUID(),role:'user',content:text});const messages=c.messages.filter(m=>m.content&&!m.error).slice(-24).map(m=>({role:m.role,content:m.content}));
streamMessage={id:crypto.randomUUID(),role:'assistant',content:'',thinking:''};c.messages.push(streamMessage);$('#prompt').value='';setBusy(true);render();sidebar();persist();scrollBottom();window.whale.chat({model:$('#model').value,messages})}
let renderQueued=false;
window.whale.onChat(v=>{if(!streamMessage)return;if(v.content)streamMessage.content+=v.content;if(v.thinking)streamMessage.thinking+=v.thinking;if(v.error)streamMessage.error=v.error;if(v.done){if(v.source)streamMessage.meta=v.source;if(v.tokens)streamMessage.meta=v.tokens+' tokens'+(v.duration?' · '+(v.tokens/(v.duration/1e9)).toFixed(1)+' tokens/s':'');if(v.stopped)streamMessage.meta='已停止';setBusy(false);persist()}
if(!renderQueued){renderQueued=true;requestAnimationFrame(()=>{renderQueued=false;const near=$('#conversation').scrollHeight-$('#conversation').scrollTop-$('#conversation').clientHeight<150;const el=document.querySelector('[data-id="'+streamMessage.id+'"]');if(el)updateMessage(el,streamMessage);if(near)scrollBottom()})}
if(v.done)window.whale.saveHistory(chats)});
window.whale.onStatus(showStatus);
document.querySelectorAll('[data-window]').forEach(b=>b.onclick=()=>window.whale.window(b.dataset.window));
$('#enter').onclick=enter;$('#new-chat').onclick=newChat;$('#send').onclick=send;$('#search').oninput=sidebar;
$('#prompt').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();send()}});
document.addEventListener('keydown',e=>{if(e.ctrlKey&&e.key.toLowerCase()==='n'){e.preventDefault();enter();newChat()}if(e.key==='Enter'&&!$('#splash').classList.contains('hidden'))enter()});
document.querySelectorAll('[data-prompt]').forEach(b=>b.onclick=()=>{$('#prompt').value=b.dataset.prompt;$('#prompt').focus()});
$('#model').onchange=()=>window.whale.preferences({model:$('#model').value});
$('#refresh').onclick=async()=>{toast('正在重新连接…');showStatus(await window.whale.reconnect())};
$('#pet-toggle').onclick=async()=>toast(await window.whale.togglePet()?'鲸鱼娘已显示':'鲸鱼娘已隐藏，可再次点击召回');
$('#harness').onclick=()=>window.whale.harness();$('#settings-harness').onclick=()=>window.whale.harness();
$('#theme').onclick=()=>{document.body.classList.toggle('dark');window.whale.preferences({theme:document.body.classList.contains('dark')?'dark':'light'})};
$('#settings').onclick=()=>$('#settings-dialog').showModal();$('#settings-close').onclick=()=>$('#settings-dialog').close();
$('#show-splash').onclick=()=>{$('#settings-dialog').close();$('#workspace').classList.add('hidden');$('#splash').classList.remove('hidden');document.body.classList.remove('entered')};
$('#quit').onclick=()=>window.whale.window('quit');
$('#export').onclick=async()=>{const c=current();if(!c){toast('还没有可导出的对话');return}const text='# '+c.title+'\n\n'+c.messages.map(m=>'## '+(m.role==='user'?'你':'鲸伴')+'\n\n'+m.content).join('\n\n');if(await window.whale.export(text))toast('对话已导出')};
(async()=>{const init=await window.whale.init();prefs=init.prefs;document.body.classList.toggle('dark',prefs.theme==='dark');showStatus(init.status);chats=await window.whale.loadHistory();sidebar();render()})().catch(e=>toast('初始化失败：'+e.message));
