
const $=s=>document.querySelector(s);
const defaultStart="2026-10-30";
let S={startDate:defaultStart,inp:{M:"",b:"",bt:"A",ht:"1",rope:""},done:{},notes:{},res:{}};
try{const x=JSON.parse(localStorage.getItem("cfsc")||"{}");S={...S,...x,inp:{...S.inp,...(x.inp||{})}}}catch(e){}
const save=()=>{try{localStorage.setItem("cfsc",JSON.stringify(S))}catch(e){}};
const esc=x=>String(x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const validDate=x=>typeof x=="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x+"T00:00:00Z"))&&new Date(x+"T00:00:00Z").toISOString().slice(0,10)==x;
const {build,ph,makeSessions,COOL}=window.SkillCycleProgram;
let ses=makeSessions(S.startDate);
const fmt=ms=>new Date(ms).toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short",timeZone:"UTC"});
const td=()=>{const n=new Date();return n.getFullYear()+"-"+String(n.getMonth()+1).padStart(2,"0")+"-"+String(n.getDate()).padStart(2,"0")};
function currentSession(){const i=ses.findIndex(s=>s.date>=td());return i<0?27:Math.max(0,i)}
let cur=currentSession();
let tab="t";
const tabs=[["t","Today"],["c","Calendar"],["i","Inputs"],["r","Results"]];
function nav(){$("#nv").innerHTML=tabs.map(([k,l])=>`<button class="${tab==k?"on":""}" data-k="${k}">${l}</button>`).join("");
 $("#nv").querySelectorAll("button").forEach(b=>b.onclick=()=>{tab=b.dataset.k;draw()});}
function draw(){nav();$("#tmw").style.display=tab=="t"?"":"none";window.scrollTo(0,0);({t:today,c:cal,i:inputs,r:results})[tab]()}
function testSlot(s){if(s.w>=3&&s.w<=12)return null;return["du","bmu","hsw","rope"][(s.w<3?s.w-1:s.w-13)*2+s.d]}
function testKey(slot,period,field){return`${period}-${slot}-${field}`}
function testInput(label,slot,period,field,type="text",hint=""){
 const key=testKey(slot,period,field),value=S.res[key]||"";
 return`<label>${label}${hint?`<small>${hint}</small>`:""}<input data-test="${field}" type="${type}" value="${esc(value)}" ${type=="number"?'inputmode="decimal" min="0"':''}></label>`;
}
function testEntry(s){
 const slot=testSlot(s);if(!slot)return"";
 const period=s.w<3?"baseline":"retest",title=period=="baseline"?"Baseline test result":"Retest result";
 let fields="";
 if(slot=="du")fields=`${testInput("Flight Simulator time or highest completed round","du",period,"score","text","Enter the time, or highest round completed.")}${testInput("Largest unbroken DU set · M","du",period,"max","number","This updates the DU target in Inputs.")}`;
 if(slot=="bmu")fields=`<label>Movement tested<small>Choose the same movement again at retest. This also sets your BMU training track.</small><select data-test="movement"><option value="">Choose movement</option>${[["pull-up","Pull-ups · Track A"],["chest-to-bar","Chest-to-bar · Track B"],["bar-muscle-up","Bar muscle-up · Track C"]].map(([v,l])=>`<option value="${v}" ${S.res[testKey("bmu",period,"movement")]==v?"selected":""}>${l}</option>`).join("")}</select></label>${testInput("Total reps in 5 minutes","bmu",period,"total","number")}${testInput("Largest unbroken set","bmu",period,"max","number")}`;
 if(slot=="hsw")fields=`<label>Current skill level<small>1: wall holds/wall walks · 2: freestanding hold · 3: controlled steps/walk. Updates the HSW track in Inputs.</small><select data-test="level"><option value="">Choose level</option>${[["1","Wall holds / wall walks"],["2","Freestanding hold"],["3","Handstand-walk steps"]].map(([v,l])=>`<option value="${v}" ${S.res[testKey("hsw",period,"level")]==v?"selected":""}>${l}</option>`).join("")}</select></label>${testInput("Best controlled hold, steps, or distance","hsw",period,"score","text","Record what you achieved at the selected level.")}`;
 if(slot=="rope")fields=`${testInput("10-climb time · seconds","rope",period,"time","number","Updates the rope target in Inputs.")}${testInput("Representative ascent split · seconds","rope",period,"ascent","number")}${testInput("Controlled descent split · seconds","rope",period,"descent","number")}`;
 return`<section class="card test-entry"><div class="section-kicker">${period=="baseline"?"Baseline":"Retest"} · Test-day log</div><h2>${title}</h2><p class="helper">Log it here while you train. These results save automatically and update the related Inputs.</p>${fields}</section>`;
}
function bindTestEntry(s){
 const slot=testSlot(s);if(!slot)return;
 const period=s.w<3?"baseline":"retest";
 document.querySelectorAll("[data-test]").forEach(el=>{
  const field=el.dataset.test,update=()=>{
   const value=el.value;
   S.res[testKey(slot,period,field)]=value;
   if(slot=="du"&&field=="max")S.inp.M=value;
   if(slot=="bmu"&&field=="movement"&&value)S.inp.bt={"pull-up":"A","chest-to-bar":"B","bar-muscle-up":"C"}[value]||S.inp.bt;
   if(slot=="hsw"&&field=="level"&&value)S.inp.ht=value;
   if(slot=="rope"&&field=="time")S.inp.rope=value;
   save();
  };
  el.addEventListener(el.tagName=="SELECT"?"change":"input",update);
 });
}
function today(){
 const s=ses[cur],x=build(s.w,s.d,S.inp),dn=S.done[s.id];
 $("#v").innerHTML=`<div class="session-heading"><div><div class="section-kicker">${ph(s.w)}</div><h1>${fmt(s.ms)} <span>· Week ${s.w}</span></h1><p>${x.focus}</p></div><div class="session-nav"><button id="pv" aria-label="Previous session" ${cur?"":"disabled"}>←</button><button id="nx" aria-label="Next session" ${cur<27?"":"disabled"}>→</button></div></div>
 ${dn?'<div class="status-banner">✓ Session complete</div>':""}
 <div class="card"><div class="lb" style="margin-top:0">Warm-up · 8 min</div><div class="tx">${x.warm}</div></div>
 ${x.bl.map(k=>`<div class="card"><div class="blk">${k.n}</div><div class="lb">Drills</div><div class="tx">${k.dr}</div><div class="lb">Main set</div><div class="tx main ${k.m[0]=="⚠"?"wn":""}">${k.m}</div><div class="lb">Strength / record</div><div class="tx">${k.ex}</div></div>`).join("")}
 ${testEntry(s)}
 <div class="card"><div class="lb" style="margin-top:0">Cooldown</div><div class="tx">${COOL}</div></div>
 <div class="card"><div class="lb" style="margin-top:0">Your result / notes</div><textarea id="nt" placeholder="Reps, times, band used, how it felt…"></textarea></div>
 <button class="p" id="dn">${dn?"Mark as not done":"Mark session done ✔"}</button>`;
 bindTestEntry(s);
 $("#nt").value=S.notes[s.id]||"";$("#nt").oninput=e=>{S.notes[s.id]=e.target.value;save()};
 $("#dn").onclick=()=>{S.done[s.id]=!S.done[s.id];save();today()};
 $("#pv").onclick=()=>{cur--;today();window.scrollTo(0,0)};$("#nx").onclick=()=>{cur++;today();window.scrollTo(0,0)};}
function cal(){let h="<h1>Calendar</h1>",lw=0;
 ses.forEach((s,i)=>{if(s.w!=lw){lw=s.w;h+=`<div class="wk">Week ${s.w} · ${ph(s.w)}</div>`}
  h+=`<div class="li ${i==cur?"cur":""} ${S.done[s.id]?"d":""}" data-i="${i}"><span><b>${fmt(s.ms)}</b> · ${build(s.w,s.d,S.inp).focus}</span><span>${S.done[s.id]?"✔":""}</span></div>`});
 $("#v").innerHTML=h;document.querySelectorAll(".li").forEach(e=>e.onclick=()=>{cur=+e.dataset.i;tab="t";draw()})}
function inputs(){const I=S.inp,f=(k,l,h,t="number")=>`<label>${l}<small>${h}</small><input data-k="${k}" type="${t}" inputmode="decimal" value="${esc(I[k])}"></label>`;
 $("#v").innerHTML=`<div class="page-heading"><div class="section-kicker">Athlete profile</div><h1>Inputs</h1><p>Test-day entries automatically update these targets and skill tracks.</p></div><div class="card">Choose the skill tracks that best match your current, repeatable ability. Sessions emphasize deliberate practice, full resets, and clean reps—not fatigue or max-rep sets.
 ${f("M","Double unders · M","Largest unbroken set in the Flight Simulator; updates DU targets")}
 <label>Bar muscle-up track<small>A: building pulling and kip basics · B: can do chest-to-bar but no BMU · C: can do BMUs; refine clean singles</small><select data-k="bt">${["A","B","C"].map(o=>`<option ${I.bt==o?"selected":""}>${o}</option>`).join("")}</select></label>
 <label>Handstand walk track<small>1: building wall alignment and balance · 2: can kick up and hold freestanding · 3: can take steps but wants a first/reliable walk</small><select data-k="ht">${[1,2,3].map(o=>`<option ${I.ht==o?"selected":""}>${o}</option>`).join("")}</select></label>
 ${f("rope","Rope test · total seconds","Time for 10 climbs, in seconds (e.g. 420)")}</div>
 <div class="card"><div class="section-kicker">Captured on test days</div><h2>Recorded results</h2><div class="test-summary">${[["du","Double unders"],["bmu","BMU / pull-ups"],["hsw","Handstand walk"],["rope","Rope climbs"]].map(([slot,label])=>`<div class="test-summary-row"><b>${label}</b><span><small>Baseline</small>${esc(resultText(slot,"baseline"))}</span><span><small>Retest</small>${esc(resultText(slot,"retest"))}</span></div>`).join("")}</div></div>
 <div class="card"><div class="section-kicker">Plan setup</div><h2>Schedule &amp; progress</h2><p class="helper">Choose the first training date. Progress saves in this browser when supported. Export a JSON file for a durable backup or to move progress to another phone.</p>
 <label>First session date<div class="date-input-wrap"><input id="startDate" type="date" value="${esc(validDate(S.startDate)?S.startDate:defaultStart)}"></div></label>
 <div class="sc" style="margin-top:10px"><button id="ex">Export progress</button><button id="im">Import progress</button></div>
 <input id="progressFile" type="file" accept=".json,application/json" hidden>
 <button id="pr" style="width:100%;margin-top:8px">Print this page</button>
 <small style="margin-top:10px">To use: save this HTML file to your phone and open it in a browser. It works offline. To move progress, send the HTML and exported JSON file, then import the JSON on the other phone. Importing replaces the progress currently in this browser.</small></div>`;
 document.querySelectorAll("[data-k]").forEach(e=>e.onchange=()=>{S.inp[e.dataset.k]=e.value;save()});
 $("#startDate").onchange=e=>{if(!validDate(e.target.value))return;S.startDate=e.target.value;ses=makeSessions(S.startDate);cur=currentSession();save();inputs()};
 $("#ex").onclick=()=>{const blob=new Blob([JSON.stringify(S,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="skill-cycle-progress.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 $("#im").onclick=()=>$("#progressFile").click();
 $("#progressFile").onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const x=JSON.parse(await file.text());if(!x||typeof x!="object"||Array.isArray(x)||!["startDate","inp","done","notes","res"].some(k=>k in x))throw Error();
  const clean={startDate:validDate(x.startDate)?x.startDate:defaultStart,inp:{M:"",b:"",bt:"A",ht:"1",rope:""},done:{},notes:{},res:{}};
  if(x.inp&&typeof x.inp=="object"){for(const k of["M","b","bt","ht","rope"])if(typeof x.inp[k]=="string")clean.inp[k]=x.inp[k];if(!["A","B","C"].includes(clean.inp.bt))clean.inp.bt="A";if(!["1","2","3"].includes(clean.inp.ht))clean.inp.ht="1"}
  for(const k of["done","notes","res"])if(x[k]&&typeof x[k]=="object"&&!Array.isArray(x[k]))for(const[key,val]of Object.entries(x[k])){const validKey=k=="res"?/^([br][0-3])$/.test(key)||/^(baseline|retest)-(du|bmu|hsw|rope)-(score|max|total|movement|level|time|ascent|descent)$/.test(key):/^(?:[1-9]|1[0-4])[FT]$/.test(key);if(validKey&&(k=="done"&&typeof val=="boolean"||k!="done"&&typeof val=="string"))clean[k][key]=val}
  S=clean;ses=makeSessions(S.startDate);cur=currentSession();save();draw()
 }catch(e){alert("That file isn't a valid Skill Cycle progress backup.")}finally{e.target.value=""}};
 $("#pr").onclick=()=>window.print()}
function resultText(slot,period){
 const read=field=>S.res[testKey(slot,period,field)]||"";
 if(slot=="du")return[read("score")&&`Score: ${read("score")}`,read("max")&&`Largest unbroken: ${read("max")}`].filter(Boolean).join(" · ")||"Not recorded";
 if(slot=="bmu"){const movement={"pull-up":"Pull-ups","chest-to-bar":"Chest-to-bar","bar-muscle-up":"Bar muscle-ups"}[read("movement")];return[movement,read("total")&&`${read("total")} total reps`,read("max")&&`${read("max")} unbroken`].filter(Boolean).join(" · ")||"Not recorded"}
 if(slot=="hsw"){const level={"1":"Wall holds / wall walks","2":"Freestanding hold","3":"Handstand-walk steps"}[read("level")];return[level,read("score")].filter(Boolean).join(" · ")||"Not recorded"}
 return[read("time")&&`${read("time")} s total`,read("ascent")&&`${read("ascent")} s ascent`,read("descent")&&`${read("descent")} s descent`].filter(Boolean).join(" · ")||"Not recorded";
}
function results(){const tests=[["du","Double unders · Flight Simulator","Improve time or add to the largest unbroken set"],["bmu","BMU / C2B / pull-up · AMRAP 5","Repeat the same movement and compare total / unbroken reps"],["hsw","Handstand walk skill check","Build a more controlled hold, shift, or walk"],["rope","Rope climbs · 10 climbs","Improve ascent rhythm while keeping descents controlled"]];
 $("#v").innerHTML=`<div class="page-heading"><div class="section-kicker">Progress check</div><h1>Test results</h1><p>Results are entered on the matching test-day session and saved here automatically.</p></div>`+tests.map(([slot,title,goal])=>`<div class="card result-card"><h2>${title}</h2><p class="helper">${goal}</p><div class="result-grid"><div><small>Baseline</small><strong>${esc(resultText(slot,"baseline"))}</strong></div><div><small>Retest</small><strong>${esc(resultText(slot,"retest"))}</strong></div></div></div>`).join("")}
let T={s:0,id:0};
function beep(){try{const a=new(window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator();o.connect(a.destination);o.frequency.value=880;o.start();o.stop(a.currentTime+.18);navigator.vibrate&&navigator.vibrate(150)}catch(e){}}
function tick(){const m=+$("#tmin").value||10;T.s++;if(T.s%60==0)beep();
 if(T.s>=m*60){stop();$("#tl").textContent="Done";return}paint()}
function paint(){const m=+$("#tmin").value||10,r=60-T.s%60;$("#tc").textContent=String(Math.floor(T.s/60)).padStart(2,"0")+":"+String(T.s%60).padStart(2,"0");$("#tl").textContent=`Minute ${Math.floor(T.s/60)+1} of ${m} · ${r}s left`}
function stop(){clearInterval(T.id);T.id=0;$("#tgo").textContent="Start"}
$("#tgo").onclick=()=>{if(T.id){stop()}else{if(!T.s)beep();T.id=setInterval(tick,1000);$("#tgo").textContent="Pause";paint()}};
$("#trs").onclick=()=>{stop();T.s=0;$("#tc").textContent="00:00";$("#tl").textContent="Ready"};
draw();
