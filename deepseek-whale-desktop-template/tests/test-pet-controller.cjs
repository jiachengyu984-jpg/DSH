const assert=require('node:assert/strict'),{EventEmitter}=require('events'),{createPetController}=require('../pet-controller.cjs');
let all=[],saved=0,cursor={x:200,y:200};
class FakeWindow extends EventEmitter{
constructor(b){super();this.b={x:b.x,y:b.y,width:b.width,height:b.height};this.shown=0;this.destroyed=false;this.webContents=new EventEmitter();this.webContents.setZoomFactor=()=>{};this.webContents.setVisualZoomLevelLimits=()=>Promise.resolve();}
isDestroyed(){return this.destroyed}loadFile(){}getBounds(){return {...this.b}}setBounds(b){this.b={...b}}setPosition(x,y){Object.assign(this.b,{x,y})}showInactive(){assert(!this.destroyed);this.shown++}hide(){}
}
const area={x:0,y:0,width:1280,height:720},prefs={pet:true,petSize:230},screen={getPrimaryDisplay:()=>({workArea:area}),getDisplayMatching:()=>({workArea:area}),getCursorScreenPoint:()=>cursor};
const p=createPetController({makeWindow:b=>{const w=new FakeWindow(b);all.push(w);return w},screen,prefs,savePrefs:()=>saved++});
const w=p.create();w.emit('ready-to-show');
for(let i=0;i<60;i++){const size=[180,290,230][i%3];assert(p.resize(size));assert.equal(p.window,w);assert.equal(w.b.width,size);assert.equal(w.b.height,size+70);assert(w.b.y+w.b.height<=720)}
assert.equal(all.length,1);assert.equal(p.resize(5000),false);assert.equal(prefs.petSize,230);
const ev={sender:w.webContents},before=w.getBounds();p.dragStart(ev);p.dragMove(ev);p.dragEnd(ev);assert.deepEqual(w.getBounds(),before);
p.dragStart(ev);cursor={x:-5000,y:-5000};p.dragMove(ev);p.dragEnd(ev);assert.equal(w.b.width,230);assert.equal(w.b.x,0);assert.equal(w.b.y,0);
for(let i=0;i<10;i++)p.toggle();assert.equal(all.length,1);
// Reproduce delayed callbacks from retired windows: these must not clear/show a replacement.
w.destroyed=true;const replacement=p.create();w.emit('closed');w.emit('ready-to-show');assert.equal(p.window,replacement);replacement.emit('ready-to-show');assert.equal(replacement.shown,1);
replacement.destroyed=true;replacement.emit('closed');assert.equal(p.window,null);p.dragStart(ev);p.dragMove(ev);p.dragEnd(ev);
console.log('PASS: 60 size changes, singleton, stale closed/ready callbacks, clicks, drag bounds, destroyed-window events.');

