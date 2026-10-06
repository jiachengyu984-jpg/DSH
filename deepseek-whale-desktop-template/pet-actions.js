// Pose IDs are atlas cells: wave, joy, shy, heart, yawn, sleep, think, rice.
(function(root){
const f=(offset,x=0,y=0,r=0,sx=1,sy=1)=>({offset,transform:'translate('+x+'%,'+y+'%) rotate('+r+'deg) scale('+sx+','+sy+')',easing:'cubic-bezier(.33,0,.2,1)'});
const neutral=f(0),end=f(1);
const actions={
greet:{label:'挥手打招呼',text:'在呢！很高兴见到你～',duration:2100,poses:[[0,0]],effect:'spark',frames:[neutral,f(.12,0,1,-2,1.015,.985),f(.28,0,-2,4),f(.45,0,-1,-3),f(.62,0,-1,2),f(.82,0,0,-.5),end]},
happy:{label:'开心欢呼',text:'好耶！今天也元气满满！',duration:2200,poses:[[0,0],[.14,1],[.86,0]],effect:'star',frames:[neutral,f(.12,0,2,0,1.025,.96),f(.3,0,-9,-2,.985,1.035),f(.48,0,1,1,1.025,.97),f(.64,0,-4,2),f(.8,0,.5,-1),end]},
hop:{label:'弹跳两下',text:'嘿咻——再跳一下！',duration:1800,poses:[[0,0],[.17,1],[.85,0]],effect:'spark',frames:[neutral,f(.13,0,2,0,1.025,.95),f(.32,0,-10,-2,.99,1.025),f(.5,0,1.6,1,1.03,.96),f(.68,0,-5,2),f(.83,0,.6,-1,1.01,.99),end]},
dance:{label:'轻快小舞步',text:'哒、哒哒～跟我一起晃晃！',duration:3300,poses:[[0,0],[.18,1],[.53,0],[.67,1],[.92,0]],effect:'music',frames:[neutral,f(.1,-2,1,-2),f(.23,-4,-3,-5),f(.36,0,0,1),f(.49,4,-3,5),f(.61,0,1,-1),f(.74,-3,-2,-3),f(.87,2,-1,2),end]},
spin:{label:'俏皮转身',text:'转个身，把好心情带回来～',duration:2000,poses:[[0,0],[.4,1],[.86,0]],effect:'star',frames:[neutral,f(.12,-2,1,-4),{offset:.33,transform:'translate(0%,-4%) rotate(-4deg) rotateY(65deg)',easing:'ease-in-out'},{offset:.58,transform:'translate(2%,-5%) rotate(3deg) rotateY(310deg)',easing:'ease-out'},{offset:.76,transform:'translate(0%,1%) rotate(2deg) rotateY(360deg) scale(1.02,.98)',easing:'ease-out'},{offset:1,transform:'rotateY(360deg)',easing:'ease-out'}]},
shy:{label:'害羞躲躲',text:'这样看着我，会有点不好意思啦…',duration:3100,poses:[[0,0],[.18,2],[.88,0]],effect:'blush',frames:[neutral,f(.2,0,1,-3,.98,.98),f(.42,-1,2,-5,.97,.98),f(.57,.5,2,-3,.98,.98),f(.77,0,1,-2,.99,.99),end]},
heart:{label:'送你一颗心',text:'给你一颗小小的心 ♥',duration:3000,poses:[[0,0],[.18,3],[.9,0]],effect:'heart',frames:[neutral,f(.15,0,1,0,1.01,.98),f(.34,0,-3,-1,1.025,1.025),f(.56,0,-2,1,1.015,1.015),f(.78,0,-1,-.5),end]},
nuzzle:{label:'撒娇贴贴',text:'就靠一小会儿，好不好？',duration:3100,poses:[[0,0],[.18,2],[.5,3],[.89,0]],effect:'heart',frames:[neutral,f(.2,-3,1,-6),f(.4,-4,0,-8),f(.56,-2,-1,-4),f(.7,2,0,4),f(.87,1,0,2),end]},
curious:{label:'歪头好奇',text:'嗯？让我也看看！',duration:2600,poses:[[0,0],[.14,6],[.89,0]],effect:'question',frames:[neutral,f(.22,-1,-1,-8),f(.44,-1,-1,-8),f(.66,1,-1,4),f(.82,0,0,1),end]},
think:{label:'认真思考',text:'唔… 灵感马上就来。',duration:3800,poses:[[0,0],[.12,6],[.87,0]],effect:'thought',frames:[neutral,f(.18,0,-1,-4),f(.42,0,-1,-4),f(.57,0,0,2),f(.74,0,-2,-2),end]},
surprise:{label:'小小惊讶',text:'诶？被你发现啦！',duration:1800,poses:[[0,0],[.1,1],[.57,6],[.88,0]],effect:'surprise',frames:[neutral,f(.1,0,1,0,1.025,.97),f(.24,0,-6,-3,.975,1.025),f(.44,0,1,2,1.02,.98),f(.64,0,-1,-1),end]},
stretch:{label:'伸个懒腰',text:'伸——个懒腰！继续陪你～',duration:3300,poses:[[0,0],[.15,1],[.7,4],[.9,0]],effect:'spark',frames:[neutral,f(.2,0,-2,-2,.985,1.035),f(.43,0,-3,3,.98,1.04),f(.62,0,-1,-2,.99,1.02),f(.76,0,1,1,1.02,.98),end]},
yawn:{label:'打哈欠',text:'哈啊… 不是无聊，是有点困啦。',duration:3600,poses:[[0,0],[.13,4],[.68,5],[.91,0]],effect:'sleep',frames:[neutral,f(.22,0,-1,-3,.99,1.02),f(.43,0,-2,-5,.99,1.025),f(.68,0,1,-3),f(.84,0,.5,-1),end]},
feed:{label:'开饭啦',text:'啊呜… 嗯！还是白饭最香！',duration:3500,poses:[[0,0],[.12,7],[.89,0]],effect:'rice',frames:[neutral,f(.16,0,1,-2),f(.28,0,2,1,1.01,.99),f(.4,0,0,-1),f(.52,0,1.3,1,1.008,.995),f(.65,0,0,-1),f(.78,0,-2,2),end]},
sleep:{label:'抱手打盹',text:'小鲸鱼充电中… 点我就醒啦。',duration:9000,poses:[[0,0],[.06,4],[.21,5],[.95,0]],effect:'sleep',frames:[neutral,f(.16,0,1,-3),f(.28,0,2,-5,.995,.99),f(.43,0,1,-4,1,1.005),f(.58,0,2,-5,.995,.99),f(.73,0,1,-4,1,1.005),f(.89,0,1,-3),end]}
};
if(typeof module==='object'&&module.exports)module.exports=actions;else root.PET_ACTIONS=actions;
})(globalThis);

