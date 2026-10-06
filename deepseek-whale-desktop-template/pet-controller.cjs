const path = require('node:path');
const SIZES = [180,230,290];
function createPetController({makeWindow,screen,prefs,savePrefs}) {
  let current=null,drag=null;
  function valid(w){return w&&!w.isDestroyed();}
  function bounds(size,position){
    const primary=screen.getPrimaryDisplay().workArea;
    let x=Number(position?.x),y=Number(position?.y);
    if(!Number.isFinite(x)||!Number.isFinite(y)){x=primary.x+primary.width-size-36;y=primary.y+primary.height-size-80;}
    const area=screen.getDisplayMatching({x:Math.round(x),y:Math.round(y),width:size,height:size+70}).workArea;
    return {width:size,height:size+70,x:Math.round(Math.max(area.x,Math.min(x,area.x+area.width-size))),y:Math.round(Math.max(area.y,Math.min(y,area.y+area.height-size-70)))};
  }
  function create(){
    if(valid(current))return current;
    const size=SIZES.includes(prefs.petSize)?prefs.petSize:230;prefs.petSize=size;
    const w=makeWindow({...bounds(size,prefs.petPosition),frame:false,transparent:true,resizable:false,maximizable:false,fullscreenable:false,minimizable:false,skipTaskbar:true,alwaysOnTop:true,hasShadow:false,show:false});
    current=w;
    w.webContents.setZoomFactor(1);
    w.webContents.setVisualZoomLevelLimits(1,1).catch(()=>{});
    w.webContents.on('before-input-event',(event,input)=>{if((input.control||input.meta)&&['+','-','=','0','Add','Subtract'].includes(input.key))event.preventDefault();});
    w.loadFile(path.join(__dirname,'pet.html'));
    w.once('ready-to-show',()=>{if(current===w&&valid(w)&&prefs.pet)w.showInactive();});
    // A retired window can report closed after its replacement has been created.
    w.on('closed',()=>{if(current===w){current=null;drag=null;}});
    return w;
  }
  function resize(size){
    if(!SIZES.includes(size))return false;
    prefs.petSize=size;drag=null;
    const w=create(),old=w.getBounds();
    // Keep the feet anchored; resize the existing window instead of replacing it.
    const next=bounds(size,{x:old.x+(old.width-size)/2,y:old.y+old.height-(size+70)});
    w.setBounds(next,false);w.webContents.setZoomFactor(1);
    prefs.petPosition={x:next.x,y:next.y};savePrefs();return true;
  }
  function toggle(){prefs.pet=!prefs.pet;savePrefs();const w=create();prefs.pet?w.showInactive():w.hide();return prefs.pet;}
  function owns(event){return valid(current)&&event?.sender===current.webContents;}
  function dragStart(event){if(!owns(event))return;drag={window:current,cursor:screen.getCursorScreenPoint(),bounds:current.getBounds()};}
  function dragMove(event){
    if(!owns(event)||!drag||drag.window!==current)return;
    const cursor=screen.getCursorScreenPoint();
    if(Math.abs(cursor.x-drag.cursor.x)+Math.abs(cursor.y-drag.cursor.y)<4)return;
    const next=bounds(prefs.petSize,{x:drag.bounds.x+cursor.x-drag.cursor.x,y:drag.bounds.y+cursor.y-drag.cursor.y});
    current.setBounds(next,false);
  }
  function dragEnd(event){if(!owns(event))return;drag=null;const b=current.getBounds();prefs.petPosition={x:b.x,y:b.y};savePrefs();}
  return {create,resize,toggle,dragStart,dragMove,dragEnd,get window(){return valid(current)?current:null;}};
}
module.exports={createPetController,SIZES};

