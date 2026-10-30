
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
function today(){
 const s=ses[cur],x=build(s.w,s.d,S.inp),dn=S.done[s.id];
 $("#v").innerHTML=`<div class="row"><button id="pv" ${cur?"":"disabled"}>←</button><h1 style="margin:0;text-align:center">${fmt(s.ms)} · Week ${s.w}</h1><button id="nx" ${cur<27?"":"disabled"}>→</button></div>
 <div style="margin:10px 0"><span class="chip">${ph(s.w)}</span><span class="chip">${x.focus}</span>${dn?'<span class="chip">✔ done</span>':""}</div>
 <div class="card"><div class="lb" style="margin-top:0">Warm-up · 8 min</div><div class="tx">${x.warm}</div></div>
 ${x.bl.map(k=>`<div class="card"><div class="blk">${k.n}</div><div class="lb">Drills</div><div class="tx">${k.dr}</div><div class="lb">Main set</div><div class="tx main ${k.m[0]=="⚠"?"wn":""}">${k.m}</div><div class="lb">Strength / record</div><div class="tx">${k.ex}</div></div>`).join("")}
 <div class="card"><div class="lb" style="margin-top:0">Cooldown</div><div class="tx">${COOL}</div></div>
 <div class="card"><div class="lb" style="margin-top:0">Your result / notes</div><textarea id="nt" placeholder="Reps, times, band used, how it felt…"></textarea></div>
 <button class="p" id="dn">${dn?"Mark as not done":"Mark session done ✔"}</button>`;
 $("#nt").value=S.notes[s.id]||"";$("#nt").oninput=e=>{S.notes[s.id]=e.target.value;save()};
 $("#dn").onclick=()=>{S.done[s.id]=!S.done[s.id];save();today()};
 $("#pv").onclick=()=>{cur--;today();window.scrollTo(0,0)};$("#nx").onclick=()=>{cur++;today();window.scrollTo(0,0)};}
function cal(){let h="<h1>Calendar</h1>",lw=0;
 ses.forEach((s,i)=>{if(s.w!=lw){lw=s.w;h+=`<div class="wk">Week ${s.w} · ${ph(s.w)}</div>`}
  h+=`<div class="li ${i==cur?"cur":""} ${S.done[s.id]?"d":""}" data-i="${i}"><span><b>${fmt(s.ms)}</b> · ${build(s.w,s.d,S.inp).focus}</span><span>${S.done[s.id]?"✔":""}</span></div>`});
 $("#v").innerHTML=h;document.querySelectorAll(".li").forEach(e=>e.onclick=()=>{cur=+e.dataset.i;tab="t";draw()})}
function inputs(){const I=S.inp,f=(k,l,h,t="number")=>`<label>${l}<small>${h}</small><input data-k="${k}" type="${t}" inputmode="decimal" value="${esc(I[k])}"></label>`;
 $("#v").innerHTML=`<h1>Inputs</h1><div class="card">Choose the skill tracks that best match your current, repeatable ability. Sessions emphasize deliberate practice, full resets, and clean reps—not fatigue or max-rep sets.
 ${f("M","Double unders · M","Largest unbroken set in the Flight Simulator; updates DU targets")}
 <label>Bar muscle-up track<small>A: building pulling and kip basics · B: can do chest-to-bar but no BMU · C: can do BMUs; refine clean singles</small><select data-k="bt">${["A","B","C"].map(o=>`<option ${I.bt==o?"selected":""}>${o}</option>`).join("")}</select></label>
 <label>Handstand walk track<small>1: building wall alignment and balance · 2: can kick up and hold freestanding · 3: can take steps but wants a first/reliable walk</small><select data-k="ht">${[1,2,3].map(o=>`<option ${I.ht==o?"selected":""}>${o}</option>`).join("")}</select></label>
 ${f("rope","Rope test · total seconds","Time for 10 climbs, in seconds (e.g. 420)")}</div>
 <div class="card"><b>Plan setup &amp; progress</b><small>Choose the first training date. The page saves progress in this browser when supported. Export the JSON file for a durable backup or to move progress to another phone.</small>
 <label>First session date<input id="startDate" type="date" value="${esc(validDate(S.startDate)?S.startDate:defaultStart)}"></label>
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
  for(const k of["done","notes","res"])if(x[k]&&typeof x[k]=="object"&&!Array.isArray(x[k]))for(const[key,val]of Object.entries(x[k]))if(/^(?:[1-9]|1[0-4])[FT]$/.test(key)||k=="res"&&/^([br][0-3])$/.test(key)){if(k=="done"&&typeof val=="boolean"||k!="done"&&typeof val=="string")clean[k][key]=val}
  S=clean;ses=makeSessions(S.startDate);cur=currentSession();save();draw()
 }catch(e){alert("That file isn't a valid Skill Cycle progress backup.")}finally{e.target.value=""}};
 $("#pr").onclick=()=>window.print()}
function results(){const n=["Double unders · Flight Simulator","BMU / C2B / pull-up · AMRAP 5","Handstand walk skill check","Rope climbs · 10 for time"],g=["Beat your time or add 10+ to M","Repeat the same movement as baseline; compare total reps and largest unbroken set","Record best controlled hold, weight shift or walk; aim for cleaner/repeatable steps","−15–20% time"];
 $("#v").innerHTML="<h1>Test results</h1>"+n.map((t,i)=>`<div class="card"><b>${t}</b><small>Goal: ${g[i]}</small><label>Baseline<input data-r="b${i}" value="${esc(S.res["b"+i]||"")}"></label><label>Retest<input data-r="r${i}" value="${esc(S.res["r"+i]||"")}"></label></div>`).join("");
 document.querySelectorAll("[data-r]").forEach(e=>e.oninput=()=>{S.res[e.dataset.r]=e.value;save()})}
let T={s:0,id:0};
function beep(){try{const a=new(window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator();o.connect(a.destination);o.frequency.value=880;o.start();o.stop(a.currentTime+.18);navigator.vibrate&&navigator.vibrate(150)}catch(e){}}
function tick(){const m=+$("#tmin").value||10;T.s++;if(T.s%60==0)beep();
 if(T.s>=m*60){stop();$("#tl").textContent="Done";return}paint()}
function paint(){const m=+$("#tmin").value||10,r=60-T.s%60;$("#tc").textContent=String(Math.floor(T.s/60)).padStart(2,"0")+":"+String(T.s%60).padStart(2,"0");$("#tl").textContent=`Minute ${Math.floor(T.s/60)+1} of ${m} · ${r}s left`}
function stop(){clearInterval(T.id);T.id=0;$("#tgo").textContent="Start"}
$("#tgo").onclick=()=>{if(T.id){stop()}else{if(!T.s)beep();T.id=setInterval(tick,1000);$("#tgo").textContent="Pause";paint()}};
$("#trs").onclick=()=>{stop();T.s=0;$("#tc").textContent="00:00";$("#tl").textContent="Ready"};
draw();
