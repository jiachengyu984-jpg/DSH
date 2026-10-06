const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('whale',{
init:()=>ipcRenderer.invoke('init'),reconnect:()=>ipcRenderer.invoke('reconnect'),
preferences:v=>ipcRenderer.invoke('preferences',v),togglePet:()=>ipcRenderer.invoke('pet-toggle'),
loadHistory:()=>ipcRenderer.invoke('history-load'),saveHistory:v=>ipcRenderer.invoke('history-save',v),
export:v=>ipcRenderer.invoke('export',v),window:a=>ipcRenderer.send('window',a),harness:()=>ipcRenderer.send('harness'),
chat:p=>ipcRenderer.send('chat',p),stop:()=>ipcRenderer.send('chat-stop'),
onStatus:fn=>ipcRenderer.on('status',(_e,v)=>fn(v)),onChat:fn=>ipcRenderer.on('chat-event',(_e,v)=>fn(v))});
