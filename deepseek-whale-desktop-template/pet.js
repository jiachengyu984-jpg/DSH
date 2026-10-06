const $=s=>document.querySelector(s);
const sprite=$('#sprite'),stage=$('#stage'),actor=$('#actor'),bubble=$('#bubble'),particles=$('#particles'),look=$('#look');
const poseLayers=[$('#pose-a'),$('#pose-b')],actions=window.PET_ACTIONS;
let poseLayer=0,pose=0,version=0,animation=null,bubbleTimer,clickTimer,idleTimer,timers=[],down=false,moved=false,start,lastAction='',lastMove=0;
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
function later(fn,ms){const id=setTimeout(fn,ms);timers.push(id);return id}
function setPose(index){
 if(index===pose)return;
 const next=1-poseLayer,el=poseLayers[next];
 el.style.backgroundPosition=((index%4)*100/3)+'% '+(index<4?0:100)+'%';
 el.classList.add('visible');poseLayers[poseLayer].classList.remove('visible');poseLayer=next;pose=index;stage.dataset.pose=String(index);
}
stage.dataset.pose='0';
function say(text){bubble.textContent=text;bubble.classList.add('show');clearTimeout(bubbleTimer);bubbleTimer=setTimeout(()=>bubble.classList.remove('show'),4800)}
function clearMotion(){
 version++;timers.forEach(clearTimeout);timers=[];animation?.cancel();animation=null;
 for(const el of particles.children)for(const a of el.getAnimations())a.cancel();
 particles.replaceChildren();stage.className='';stage.dataset.action='idle';actor.style.transform='';
}
function scheduleIdle(){
 clearTimeout(idleTimer);
 if(document.hidden||reduce.matches)return;
 idleTimer=setTimeout(()=>{if(!down&&stage.dataset.action==='idle')act(['curious','think','yawn'][Math.floor(Math.random()*3)],{quiet:true});else scheduleIdle()},26000+Math.random()*19000);
}
function reset(){clearMotion();setPose(0);scheduleIdle()}
const glyphs={spark:['✧','✦'],star:['✦','✧','·'],heart:['♥','♡'],blush:['·','♡'],music:['♪','♫'],question:['?'],thought:['·','·','✧'],surprise:['!','✧'],sleep:['z','Z','z'],rice:['✧','·']};
function burst(effect){
 if(reduce.matches)return;
 const symbols=glyphs[effect]||glyphs.spark,count=['question','surprise'].includes(effect)?2:effect==='sleep'?3:5;
 for(let i=0;i<count;i++){
  later(()=>{
   const el=document.createElement('span');el.className='particle '+effect;el.textContent=symbols[i%symbols.length];
   const angle=(i/(Math.max(1,count-1))-.5)*1.7;
   el.style.left=(effect==='sleep'?70:50+Math.sin(angle)*28)+'%';el.style.top=(effect==='rice'?55:25+Math.abs(angle)*12)+'%';
   particles.append(el);
   const flight=el.animate([{opacity:0,transform:'translate(0,5px) scale(.55)'},{offset:.2,opacity:.9,transform:'translate('+(Math.sin(angle)*6)+'px,-4px) scale(1)'},{opacity:0,transform:'translate('+(Math.sin(angle)*22)+'px,-32px) scale(.7)'}],{duration:effect==='sleep'?2100:1500,easing:'cubic-bezier(.2,.65,.3,1)',fill:'forwards'});
   flight.finished.then(()=>el.remove()).catch(()=>el.remove());
  },i*(effect==='sleep'?370:95));
 }
}
function act(name,options={}){
 if(!actions[name])name='greet';
 const spec=actions[name],from=getComputedStyle(actor).transform;
 clearTimeout(idleTimer);clearMotion();const id=version;
 stage.className='act-'+name;stage.dataset.action=name;lastAction=name;
 look.style.setProperty('--look-x','0px');look.style.setProperty('--look-y','0px');look.style.setProperty('--look-r','0deg');
 if(!options.quiet)say(spec.text);
 const duration=reduce.matches?700:spec.duration;
 for(const [t,index]of spec.poses)later(()=>{if(version===id)setPose(index)},t*duration);
 later(()=>{if(version===id)burst(spec.effect)},duration*.23);
 if(name==='sleep'&&!reduce.matches)later(()=>burst('sleep'),duration*.54);
 const frames=reduce.matches?[{opacity:.92},{opacity:1}]:spec.frames.map(f=>({...f}));
 if(!reduce.matches&&from!=='none')frames[0].transform=from;
 animation=actor.animate(frames,{duration,easing:'linear',fill:'none'});
 animation.finished.then(()=>{if(version!==id)return;clearMotion();setPose(0);scheduleIdle()}).catch(()=>{});
}
const clickActions=['greet','happy','heart','shy','nuzzle','curious','hop','surprise'];
function clickAction(){const choices=clickActions.filter(n=>n!==lastAction);act(choices[Math.floor(Math.random()*choices.length)])}
sprite.addEventListener('pointerdown',e=>{
 if(e.button!==0)return;
 clearTimeout(clickTimer);clearTimeout(idleTimer);down=true;moved=false;start={x:e.screenX,y:e.screenY};
 sprite.setPointerCapture(e.pointerId);window.pet.dragStart();
});
sprite.addEventListener('pointermove',e=>{
 if(down){
  const dx=e.screenX-start.x,dy=e.screenY-start.y;
  if(!moved&&Math.abs(dx)+Math.abs(dy)>4){moved=true;clearMotion();setPose(6);stage.className='dragging';stage.dataset.action='dragging'}
  if(moved){stage.style.setProperty('--drag-r',Math.max(-5,Math.min(5,dx*.07))+'deg');window.pet.drag()}
 }else if(stage.dataset.action==='idle'&&performance.now()-lastMove>70){
  lastMove=performance.now();const b=sprite.getBoundingClientRect(),x=(e.clientX-b.left)/b.width-.5,y=(e.clientY-b.top)/b.height-.5;
  look.style.setProperty('--look-x',(x*2)+'px');look.style.setProperty('--look-y',(y*1)+'px');look.style.setProperty('--look-r',(x*1.7)+'deg');
 }
});
sprite.addEventListener('pointerleave',()=>{look.style.setProperty('--look-x','0px');look.style.setProperty('--look-y','0px');look.style.setProperty('--look-r','0deg')});
function finish(){
 if(!down)return;down=false;window.pet.dragEnd();
 if(moved){clearMotion();setPose(0);animation=actor.animate([{transform:'translateY(-2%) rotate(-2deg)'},{offset:.45,transform:'translateY(.6%) rotate(1deg)'},{transform:'none'}],{duration:480,easing:'ease-out'});animation.finished.then(scheduleIdle).catch(()=>{})}
 else scheduleIdle();
}
sprite.addEventListener('pointerup',()=>{const click=down&&!moved;finish();if(click){clearTimeout(clickTimer);clickTimer=setTimeout(clickAction,300)}});
sprite.addEventListener('pointercancel',finish);sprite.addEventListener('lostpointercapture',finish);window.addEventListener('blur',finish);
sprite.addEventListener('dblclick',e=>{e.preventDefault();clearTimeout(clickTimer);if(!moved){reset();window.pet.open()}});
document.addEventListener('contextmenu',e=>{e.preventDefault();clearTimeout(clickTimer);finish();window.pet.menu()});
document.addEventListener('wheel',e=>{if(e.ctrlKey)e.preventDefault()},{passive:false});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(idleTimer);clearTimeout(clickTimer);clearMotion();setPose(0)}else scheduleIdle()});
window.pet.onMessage(say);window.pet.onAction(name=>{clearTimeout(clickTimer);act(name)});
say('新表情上线啦！点点我，或右键选动作～');stage.dataset.action='idle';scheduleIdle();

