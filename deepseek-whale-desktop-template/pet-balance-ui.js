const card=document.querySelector('#balance-card'),amount=document.querySelector('#balance-amount'),note=document.querySelector('#balance-note'),refresh=document.querySelector('#balance-refresh');
function renderBalance(state){
 card.hidden=state.visible===false;refresh.disabled=!!state.refreshing;card.dataset.state=state.status;
 amount.textContent=Number.isFinite(state.amount)?new Intl.NumberFormat('zh-CN',{style:'currency',currency:state.currency||'CNY'}).format(state.amount):'—';
 const labels={waiting:'正在连接…',unconfigured:'待配置密钥 · 点齿轮设置',error:state.message||'暂时无法查询',stale:'暂未更新 · 显示上次余额',ok:'每分钟自动刷新'};
 note.textContent=state.refreshing?'正在刷新…':labels[state.status]||'等待查询';
 card.title=state.updatedAt?'更新于 '+new Date(state.updatedAt).toLocaleString('zh-CN')+'；关闭工作台仍可更新':note.textContent;
}
window.pet.onBalance(renderBalance);window.pet.balance().then(renderBalance);
refresh.addEventListener('click',()=>window.pet.refreshBalance().then(renderBalance));
document.querySelector('#balance-settings').addEventListener('click',()=>window.pet.workbench());
