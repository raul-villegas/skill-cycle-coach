
const $=s=>document.querySelector(s);
const defaultStart="2026-10-30";
let S={startDate:defaultStart,inp:{M:"",b:"",bt:"A",ht:"1",rope:""},done:{},notes:{},res:{}};
try{const x=JSON.parse(localStorage.getItem("cfsc")||"{}");S={...S,...x,inp:{...S.inp,...(x.inp||{})}}}catch(e){}
const save=()=>{try{localStorage.setItem("cfsc",JSON.stringify(S))}catch(e){}};
const esc=x=>String(x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const validDate=x=>typeof x=="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x+"T00:00:00Z"))&&new Date(x+"T00:00:00Z").toISOString().slice(0,10)==x;
function cleanPlan(x){
 if(!x||typeof x!="object"||Array.isArray(x)||x.format!="skill-cycle-plan"||x.version!==1||!x.sessions||typeof x.sessions!="object"||Array.isArray(x.sessions))return null;
 const sessions={};
 for(const[id,s]of Object.entries(x.sessions)){
  if(!/^(?:[1-9]|1[0-4])[FT]$/.test(id)||!s||typeof s!="object"||Array.isArray(s)||typeof s.focus!="string"||s.focus.length>300||typeof s.warm!="string"||s.warm.length>5000||typeof s.cool!="string"||s.cool.length>2000||!Array.isArray(s.bl)||s.bl.length<1||s.bl.length>4)return null;
  const bl=[];
  for(const b of s.bl){
   if(!b||typeof b!="object"||Array.isArray(b)||typeof b.n!="string"||b.n.length>300||typeof b.dr!="string"||b.dr.length>5000||typeof b.m!="string"||b.m.length>5000||typeof b.ex!="string"||b.ex.length>5000)return null;
   bl.push({n:b.n,dr:b.dr,m:b.m,ex:b.ex});
  }
  sessions[id]={focus:s.focus,warm:s.warm,cool:s.cool,bl};
 }
 return sessions;
}
const {build,ph,makeSessions,COOL}=window.SkillCycleProgram;
let P={};
try{const stored=localStorage.getItem("cfsc-plan");if(stored){const clean=cleanPlan(JSON.parse(stored));if(clean)P=clean}}catch(e){console.error("Could not load the saved training plan.",e)}
let localPlan=P;
const cloudConfig=window.SkillCycleSupabaseConfig||{};
let cloud=null;
try{if(cloudConfig.url&&cloudConfig.anonKey&&window.supabase?.createClient)cloud=window.supabase.createClient(cloudConfig.url,cloudConfig.anonKey)}catch(e){console.error("Supabase configuration is invalid.",e)}
let cloudUser=null,cloudProfile=null,cloudMessage="",linkCode="",athleteRows=[],activeAthleteId=null,remotePlanMode=false,liveChannel=null,relationshipChannel=null,remoteSaveTimer=0;
const savePlanLocal=()=>{if(remotePlanMode)return;localPlan=P;try{localStorage.setItem("cfsc-plan",JSON.stringify({format:"skill-cycle-plan",version:1,sessions:P}))}catch(e){console.error("Could not save the training plan locally.",e)}};
async function syncRemotePlan(athleteId,userId,sessions){
 try{
  const{error}=await cloud.from("training_plans").upsert({athlete_id:athleteId,sessions,updated_by:userId},{onConflict:"athlete_id"});
  cloudMessage=error?`Plan sync failed: ${error.message}`:"Plan synced";
  if(error)console.error("Could not sync the training plan.",error);
 }catch(error){cloudMessage="Could not sync the training plan.";console.error(cloudMessage,error)}
 if(cloudUser?.id==userId&&activeAthleteId==athleteId){const status=$("#planSyncStatus");if(status)status.textContent=cloudMessage}
}
const savePlan=()=>{
 savePlanLocal();
 if(!cloud||!cloudUser||!remotePlanMode||!activeAthleteId)return;
 clearTimeout(remoteSaveTimer);
 const athleteId=activeAthleteId,userId=cloudUser.id,sessions=JSON.parse(JSON.stringify(P));
 remoteSaveTimer=setTimeout(async()=>{
  remoteSaveTimer=0;
  if(!cloudUser||cloudUser.id!=userId||activeAthleteId!=athleteId||!remotePlanMode)return;
  await syncRemotePlan(athleteId,userId,sessions);
 },500);
};
async function flushRemotePlan(){
 if(!remoteSaveTimer||!cloudUser||!activeAthleteId||!remotePlanMode)return;
 clearTimeout(remoteSaveTimer);remoteSaveTimer=0;
 await syncRemotePlan(activeAthleteId,cloudUser.id,JSON.parse(JSON.stringify(P)));
}
let ses=makeSessions(S.startDate);
const inputDate=x=>{const[y,m,d]=x.split("-");return`${m}/${d}/${y}`};
const fmt=ms=>new Date(ms).toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short",timeZone:"UTC"});
const td=()=>{const n=new Date();return n.getFullYear()+"-"+String(n.getMonth()+1).padStart(2,"0")+"-"+String(n.getDate()).padStart(2,"0")};
function currentSession(){const i=ses.findIndex(s=>s.date>=td());return i<0?27:Math.max(0,i)}
let cur=currentSession();
let tab="t",coachWeek=3,coachDay=0;
const tabs=[["t","Today"],["c","Calendar"],["i","Inputs"],["r","Results"],["u","Resources"],["h","Coach"],["a","Account"]];
let menuOpen=false;
let authMode="signin",authDraft={email:"",password:"",name:"",role:"athlete"};
function nav(){
 const links=tabs.filter(([key])=>key!="h"||!(cloudUser&&cloudProfile?.role=="athlete"));
 $("#nv").innerHTML=links.map(([key,label])=>`<button class="menu-link ${tab==key?"on":""}" data-k="${key}" ${tab==key?'aria-current="page"':""}>${label}${tab==key?'<span aria-hidden="true">✓</span>':""}</button>`).join("");
 $("#nv").classList.toggle("open",menuOpen);
 $("#nv").setAttribute("aria-hidden",String(!menuOpen));
 $("#menuToggle").setAttribute("aria-expanded",String(menuOpen));
 $("#menuToggle").setAttribute("aria-label",menuOpen?"Close navigation menu":"Open navigation menu");
 $("#menuToggle").classList.toggle("open",menuOpen);
 $("#nv").querySelectorAll("[data-k]").forEach(button=>button.onclick=()=>{tab=button.dataset.k;menuOpen=false;draw()});
}
$("#menuToggle").onclick=()=>{menuOpen=!menuOpen;nav()};
document.addEventListener("click",event=>{if(menuOpen&&!$("#nv").contains(event.target)&&!$("#menuToggle").contains(event.target)){menuOpen=false;nav()}});
document.addEventListener("keydown",event=>{if(event.key=="Escape"&&menuOpen){menuOpen=false;nav();$("#menuToggle").focus()}});
function draw(){if(cloudUser&&cloudProfile?.role=="athlete"&&tab=="h")tab="t";nav();$("#tmw").style.display=tab=="t"?"":"none";window.scrollTo(0,0);({t:today,c:cal,i:inputs,r:results,u:resources,h:coach,a:account})[tab]()}
function resources(){
 const groups=[
  {title:"Double unders",description:"Build timing, relaxed wrists, and consistent rope rhythm.",items:[
   ["Pogo jumps and single-under rhythm","double under progression pogo jumps single unders"],
   ["Wrist-driven rope technique","double unders wrist rotation rope technique"],
   ["Single-to-double-under progression","double under beginner progression single unders"]
  ]},
  {title:"Bar muscle-up foundations",description:"Practice controlled kip shapes and supported transitions before attempting full reps.",items:[
   ["Hollow and arch kip swing","bar muscle up hollow arch kip swing drill"],
   ["Target reach and loading-position drills","bar muscle up target reach loading position drill"],
   ["Box-supported turnover (Wishing Well)","bar muscle up box supported wishing well turnover drill"],
   ["Pull-up and chest-to-bar progressions","strict pull up chest to bar progression"]
  ]},
  {title:"Handstand balance and walking",description:"Prioritize a safe exit, stacked alignment, and small controlled shifts.",items:[
   ["Wall-facing handstand line and toe pulls","wall facing handstand hold toe pull drill"],
   ["Handstand weight shifts","handstand wall weight shift drill straight arms"],
   ["Kick-up control and safe exits","handstand kick up safe cartwheel exit beginner"],
   ["First controlled handstand steps","handstand walking beginner controlled steps drill"]
  ]},
  {title:"Rope climbs",description:"Learn an efficient foot lock and controlled hand-over-hand descent.",items:[
   ["Foot-lock technique","rope climb foot lock technique tutorial"],
   ["Clamp, stand, and reach","rope climb clamp stand reach technique"],
   ["Controlled rope-climb descent","rope climb controlled descent hand over hand"]
  ]}
 ];
 $("#v").innerHTML=`<div class="page-heading"><div class="section-kicker">Movement library</div><h1>Resources</h1><p>Quick video searches for the skills and drills used in this plan. Links open YouTube results in a new tab; choose coaching that matches your level and equipment.</p></div>${groups.map(group=>`<section class="card resource-group"><div class="section-kicker">Skill guide</div><h2>${group.title}</h2><p class="helper">${group.description}</p><div class="resource-links">${group.items.map(([label,query])=>`<a href="https://www.youtube.com/results?search_query=${encodeURIComponent(query)}" target="_blank" rel="noopener noreferrer">${label}<span aria-hidden="true">↗</span></a>`).join("")}</div></section>`).join("")}`;
}
function workout(s){
 const base=build(s.w,s.d,S.inp),override=P[s.id];
 if(!override)return{...base,cool:COOL};
 return{...base,...override};
}
function stopPlanSubscription(){
 clearTimeout(remoteSaveTimer);remoteSaveTimer=0;
 if(liveChannel){cloud.removeChannel(liveChannel);liveChannel=null}
}
function stopRelationshipSubscription(){
 if(relationshipChannel){cloud.removeChannel(relationshipChannel);relationshipChannel=null}
}
async function refreshCoachAthletes(){
 if(!cloudUser||cloudProfile?.role!="coach")return;
 const{data:links,error:linkError}=await cloud.from("coach_athletes").select("athlete_id").eq("coach_id",cloudUser.id);
 if(linkError){cloudMessage=`Could not load linked athletes: ${linkError.message}`;if(tab=="a")account();return}
 const ids=(links||[]).map(row=>row.athlete_id);
 if(ids.length){
  const{data:names,error:nameError}=await cloud.from("profiles").select("user_id,display_name").in("user_id",ids);
  if(nameError){cloudMessage=`Could not load athlete names: ${nameError.message}`;if(tab=="a")account();return}
  athleteRows=(names||[]).map(row=>({id:row.user_id,name:row.display_name||`Athlete ${row.user_id.slice(0,8)}`}));
 }else athleteRows=[];
 if(activeAthleteId&&!athleteRows.some(row=>row.id==activeAthleteId)){activeAthleteId=null;remotePlanMode=false;stopPlanSubscription()}
 if(!activeAthleteId&&athleteRows.length==1)await loadRemotePlan(athleteRows[0].id);
 if(tab=="a")account();else if(tab=="h")coach();
}
async function loadRemotePlan(athleteId){
 await flushRemotePlan();
 activeAthleteId=athleteId;remotePlanMode=true;stopPlanSubscription();
 const{data,error}=await cloud.from("training_plans").select("sessions").eq("athlete_id",athleteId).maybeSingle();
 if(error){cloudMessage=`Could not load shared plan: ${error.message}`;remotePlanMode=false;return}
 P=data?.sessions&&cleanPlan({format:"skill-cycle-plan",version:1,sessions:data.sessions})||{};
 liveChannel=cloud.channel(`training-plan-${athleteId}`).on("postgres_changes",{event:"*",schema:"public",table:"training_plans",filter:`athlete_id=eq.${athleteId}`},payload=>{
  const previous=JSON.stringify(P);
  if(payload.eventType=="DELETE")P={};
  else{const shared=payload.new?.sessions;P=shared&&cleanPlan({format:"skill-cycle-plan",version:1,sessions:shared})||{}}
  if(previous==JSON.stringify(P))return;
  if(tab=="t"||tab=="c"||tab=="h")draw();
 }).subscribe();
 cloudMessage="Shared plan connected";
}
async function handleCloudSession(session){
 const accountChanged=cloudUser?.id!=session?.user?.id;
 if(cloudUser&&accountChanged)await flushRemotePlan();
 if(cloudUser&&accountChanged)P=localPlan;
 cloudUser=session?.user||null;cloudProfile=null;athleteRows=[];activeAthleteId=null;remotePlanMode=false;linkCode="";stopPlanSubscription();stopRelationshipSubscription();
 if(!cloudUser){draw();return}
 const{data:profile,error}=await cloud.from("profiles").select("role,display_name").eq("user_id",cloudUser.id).maybeSingle();
 if(error||!profile){cloudMessage=error?`Could not load account: ${error.message}`:"Account profile is not ready yet. Confirm your email, then sign in again.";draw();return}
 cloudProfile=profile;cloudMessage="";
 if(profile.role=="coach"){
  await refreshCoachAthletes();
  relationshipChannel=cloud.channel(`coach-links-${cloudUser.id}`).on("postgres_changes",{event:"*",schema:"public",table:"coach_athletes",filter:`coach_id=eq.${cloudUser.id}`},()=>refreshCoachAthletes()).subscribe();
 }else{
  const{data:link,error:linkError}=await cloud.from("coach_athletes").select("coach_id").eq("athlete_id",cloudUser.id).maybeSingle();
  if(linkError){cloudMessage=`Could not load coach link: ${linkError.message}`;draw();return}
  if(link)await loadRemotePlan(cloudUser.id);
 }
 draw();
}
async function initializeCloud(){
 if(!cloud)return;
 const{data:{session},error}=await cloud.auth.getSession();
 if(error){cloudMessage=`Authentication error: ${error.message}`;draw();return}
 await handleCloudSession(session);
 cloud.auth.onAuthStateChange((_event,nextSession)=>{if(nextSession?.user?.id==cloudUser?.id)return;setTimeout(()=>handleCloudSession(nextSession),0)});
}
function account(){
 if(!cloud){
  $("#v").innerHTML=`<div class="page-heading"><div class="section-kicker">Account &amp; sync</div><h1>Accounts</h1><p>Sign-in and live syncing aren’t configured yet. Add the Supabase project URL and public anon key to <code>supabase-config.js</code>, then run <code>supabase-schema.sql</code> in the project’s SQL editor. Local coach edits and file export/import still work.</p></div>`;
  return;
 }
 if(!cloudUser){
  const signingUp=authMode=="signup";
  $("#v").innerHTML=`<div class="page-heading"><div class="section-kicker">Account &amp; sync</div><h1>${signingUp?"Create your account":"Welcome back"}</h1><p>${signingUp?"Create an account to connect with your coach and access your shared plan.":"Sign in to access your training plan and account."}</p></div>
  <div class="card auth-card"><div class="auth-switch" role="group" aria-label="Account action"><button type="button" class="${signingUp?"":"selected"}" data-auth-mode="signin" aria-pressed="${!signingUp}">Sign in</button><button type="button" class="${signingUp?"selected":""}" data-auth-mode="signup" aria-pressed="${signingUp}">Create account</button></div>
  <form id="authForm" novalidate>
  <label>Email address<input id="authEmail" type="email" autocomplete="email" inputmode="email" autocapitalize="none" spellcheck="false" value="${esc(authDraft.email)}" required></label>
  <label>Password<div class="password-field"><input id="authPassword" type="password" autocomplete="${signingUp?"new-password":"current-password"}" minlength="${signingUp?8:1}" value="${esc(authDraft.password)}" required><button id="togglePassword" type="button" aria-label="Show password" aria-pressed="false">Show</button></div>${signingUp?'<small>Use at least 8 characters.</small>':""}</label>
  ${signingUp?`<div class="auth-signup-fields"><label>Name <span class="optional">(optional)</span><input id="authName" type="text" maxlength="80" autocomplete="name" value="${esc(authDraft.name)}"></label><label>Account type<select id="authRole"><option value="athlete" ${authDraft.role=="athlete"?"selected":""}>Athlete</option><option value="coach" ${authDraft.role=="coach"?"selected":""}>Coach</option></select><small id="roleHint">${authDraft.role=="coach"?"Create and share training plans with athletes.":"Follow your training plan and connect with your coach."}</small></label></div>`:""}
  <button class="p auth-submit" id="authSubmit" type="submit">${signingUp?"Create account":"Sign in"}</button></form>
  <p id="authMessage" class="auth-message ${cloudMessage?"visible":""}" role="status" aria-live="polite">${esc(cloudMessage)}</p></div>`;
  const rememberDraft=()=>{authDraft.email=$("#authEmail").value;authDraft.password=$("#authPassword").value;if($("#authName"))authDraft.name=$("#authName").value;if($("#authRole"))authDraft.role=$("#authRole").value};
  $("#authForm").oninput=rememberDraft;
  $("#authForm").onchange=rememberDraft;
  $("#v").querySelectorAll("[data-auth-mode]").forEach(button=>button.onclick=()=>{rememberDraft();authMode=button.dataset.authMode;cloudMessage="";account()});
  $("#togglePassword").onclick=()=>{const input=$("#authPassword"),shown=input.type=="text";input.type=shown?"password":"text";$("#togglePassword").textContent=shown?"Show":"Hide";$("#togglePassword").setAttribute("aria-label",shown?"Show password":"Hide password");$("#togglePassword").setAttribute("aria-pressed",String(!shown))};
  if($("#authRole"))$("#authRole").onchange=()=>{rememberDraft();$("#roleHint").textContent=authDraft.role=="coach"?"Create and share training plans with athletes.":"Follow your training plan and connect with your coach."};
  $("#authForm").onsubmit=async event=>{
   event.preventDefault();rememberDraft();
   if(!$("#authForm").reportValidity())return;
   const submit=$("#authSubmit"),message=$("#authMessage");submit.disabled=true;submit.textContent=signingUp?"Creating account…":"Signing in…";message.textContent="";message.classList.remove("visible","success");
   try{
    if(signingUp){
     const{data,error}=await cloud.auth.signUp({email:authDraft.email.trim(),password:authDraft.password,options:{emailRedirectTo:window.location.origin+window.location.pathname,data:{role:authDraft.role,display_name:authDraft.name.trim()}}});
     if(error)throw error;
     cloudMessage=data.session?"Account created.":"Check your email to confirm your account, then return here to sign in.";
     if(data.session)authDraft.password="";
    }else{
     const{error}=await cloud.auth.signInWithPassword({email:authDraft.email.trim(),password:authDraft.password});
     if(error)throw error;
     cloudMessage="";authDraft.password="";$("#authPassword").value="";
    }
    if(cloudMessage){message.textContent=cloudMessage;message.classList.add("visible","success")}
   }catch(error){cloudMessage=error.message||"Unable to complete your request.";message.textContent=cloudMessage;message.classList.add("visible")}
   finally{submit.disabled=false;submit.textContent=signingUp?"Create account":"Sign in"}
  };
  return;
 }
 if(!cloudProfile){
  $("#v").innerHTML=`<div class="page-heading"><div class="section-kicker">Account &amp; sync</div><h1>Account unavailable</h1><p>${esc(cloudMessage||"Your account profile could not be loaded.")}</p><button id="signOut">Sign out</button></div>`;
  $("#signOut").onclick=()=>cloud.auth.signOut();
  return;
 }
 const identity=cloudProfile.display_name||cloudUser.email;
 let rolePanel="";
 if(cloudProfile.role=="coach"){
  rolePanel=`<div class="card"><h2>Link an athlete</h2><p class="helper">Create a one-time code. The athlete enters it from their account within 30 minutes.</p><button id="createLinkCode">Create athlete link code</button>${linkCode?`<p class="link-code">${esc(linkCode)}</p>`:""}
  <h2 class="linked-heading">Linked athlete</h2>${athleteRows.length?`<label>Select athlete<select id="linkedAthlete"><option value="">Choose athlete</option>${athleteRows.map(row=>`<option value="${row.id}" ${row.id==activeAthleteId?"selected":""}>${esc(row.name)}</option>`).join("")}</select></label>`:"<p>No athletes linked yet.</p>"}</div>`;
 }else{
  const linked=remotePlanMode;
  rolePanel=`<div class="card">${linked?`<p>Your coach is linked. Their plan updates live while you’re online.</p><button id="unlinkCoach">Unlink coach</button>`:`<h2>Connect to your coach</h2><p class="helper">Ask your coach for a one-time code, then enter it here. A code expires after 30 minutes.</p><label>Coach link code<input id="coachCode" autocomplete="off" maxlength="32"></label><button id="redeemCode">Connect coach</button>`}</div>`;
 }
 $("#v").innerHTML=`<div class="page-heading"><div class="section-kicker">Account &amp; sync</div><h1>${esc(identity)}</h1><p>Signed in as ${cloudProfile.role}. Athlete training plans sync live; workout progress remains on this device.</p></div>${rolePanel}<div class="card"><p class="helper">${esc(cloudMessage)}</p><button id="signOut">Sign out</button></div>`;
 $("#signOut").onclick=async()=>{await flushRemotePlan();const{error}=await cloud.auth.signOut();if(error){cloudMessage=error.message;account()}};
 if(cloudProfile.role=="coach"){
  $("#createLinkCode").onclick=async()=>{const{data,error}=await cloud.rpc("create_coach_link_code");if(error)cloudMessage=error.message;else{linkCode=data;cloudMessage="Share this code with one athlete. It can only be used once."}account()};
  if($("#linkedAthlete"))  $("#linkedAthlete").onchange=async e=>{if(!e.target.value){await flushRemotePlan();activeAthleteId=null;remotePlanMode=false;stopPlanSubscription();coach();return}await loadRemotePlan(e.target.value);coach()};
 }else if(remotePlanMode){
  $("#unlinkCoach").onclick=async()=>{const{error}=await cloud.from("coach_athletes").delete().eq("athlete_id",cloudUser.id);if(error)cloudMessage=error.message;else{remotePlanMode=false;activeAthleteId=null;stopPlanSubscription();cloudMessage="Coach unlinked."}account()};
 }else{
  $("#redeemCode").onclick=async()=>{const{error}=await cloud.rpc("redeem_coach_link_code",{p_code:$("#coachCode").value.trim()});if(error){cloudMessage=error.message;account();return}await handleCloudSession({user:cloudUser})};
 }
}
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
 const s=ses[cur],x=workout(s),dn=S.done[s.id];
 $("#v").innerHTML=`<div class="session-heading"><div><div class="section-kicker">${ph(s.w)}</div><h1>${fmt(s.ms)} <span>· Week ${s.w}</span></h1><p>${esc(x.focus)}</p></div><div class="session-nav"><button id="pv" aria-label="Previous session" ${cur?"":"disabled"}>←</button><button id="nx" aria-label="Next session" ${cur<27?"":"disabled"}>→</button></div></div>
 ${dn?'<div class="status-banner">✓ Session complete</div>':""}
 <div class="card"><div class="lb" style="margin-top:0">Warm-up · 8 min</div><div class="tx">${esc(x.warm)}</div></div>
 ${x.bl.map(k=>`<div class="card"><div class="blk">${esc(k.n)}</div><div class="lb">Drills</div><div class="tx">${esc(k.dr)}</div><div class="lb">Main set</div><div class="tx main ${k.m[0]=="⚠"?"wn":""}">${esc(k.m)}</div><div class="lb">Strength / record</div><div class="tx">${esc(k.ex)}</div></div>`).join("")}
 ${testEntry(s)}
 <div class="card"><div class="lb" style="margin-top:0">Cooldown</div><div class="tx">${esc(x.cool)}</div></div>
 <div class="card"><div class="lb" style="margin-top:0">Your result / notes</div><textarea id="nt" placeholder="Reps, times, band used, how it felt…"></textarea></div>
 <button class="p" id="dn">${dn?"Mark as not done":"Mark session done ✔"}</button>`;
 bindTestEntry(s);
 $("#nt").value=S.notes[s.id]||"";$("#nt").oninput=e=>{S.notes[s.id]=e.target.value;save()};
 $("#dn").onclick=()=>{S.done[s.id]=!S.done[s.id];save();today()};
 $("#pv").onclick=()=>{cur--;today();window.scrollTo(0,0)};$("#nx").onclick=()=>{cur++;today();window.scrollTo(0,0)};}
function cal(){let h="<h1>Calendar</h1>",lw=0;
 ses.forEach((s,i)=>{if(s.w!=lw){lw=s.w;h+=`<div class="wk">Week ${s.w} · ${ph(s.w)}</div>`}
  h+=`<div class="li ${i==cur?"cur":""} ${S.done[s.id]?"d":""}" data-i="${i}"><span><b>${fmt(s.ms)}</b> · ${esc(workout(s).focus)}</span><span>${S.done[s.id]?"✔":""}</span></div>`});
 $("#v").innerHTML=h;document.querySelectorAll(".li").forEach(e=>e.onclick=()=>{cur=+e.dataset.i;tab="t";draw()})}
function coach(){
 const id=coachWeek+(coachDay?"T":"F"),x=workout({w:coachWeek,d:coachDay,id});
 if(cloudUser&&cloudProfile?.role=="athlete"){
  $("#v").innerHTML=`<div class="page-heading"><div class="section-kicker">Coach</div><h1>Shared training plan</h1><p>Your coach can edit this plan. Changes appear here live when you’re online. Use the Account tab to connect or manage your coach link.</p></div>`;
  return;
 }
 if(cloudUser&&cloudProfile?.role=="coach"&&!activeAthleteId){
  $("#v").innerHTML=`<div class="page-heading"><div class="section-kicker">Coach</div><h1>Choose an athlete</h1><p>Create a link code or select a linked athlete in the Account tab before editing their plan.</p></div>`;
  return;
 }
 if(cloudUser&&cloudProfile?.role=="coach"&&!remotePlanMode){
  $("#v").innerHTML=`<div class="page-heading"><div class="section-kicker">Coach</div><h1>Plan unavailable</h1><p>${esc(cloudMessage||"Select a linked athlete to load their shared plan.")}</p></div>`;
  return;
 }
 const area=(key,label,value)=>{const max=key=="focus"||key.endsWith(".n")?300:key=="cool"?2000:5000;return`<label>${label}<textarea data-coach="${key}" maxlength="${max}">${esc(value)}</textarea></label>`};
 const intro=cloudUser?`Editing the shared plan for ${esc(athleteRows.find(row=>row.id==activeAthleteId)?.name||"the selected athlete")}. Updates sync live; athlete progress stays private.`:"Edit any session, then export a plan file for the athlete to import here. Plan files do not include athlete progress. This editor is stored in this browser and is not protected by an account.";
 $("#v").innerHTML=`<div class="page-heading"><div class="section-kicker">${cloudUser?"Coach account":"Local coach mode"}</div><h1>Training plan editor</h1><p>${intro}</p>${cloudMessage?`<p class="helper">${esc(cloudMessage)}</p>`:""}</div>
 ${cloudUser&&athleteRows.length>1?`<div class="card"><label>Editing athlete<select id="coachAthlete">${athleteRows.map(row=>`<option value="${row.id}" ${row.id==activeAthleteId?"selected":""}>${esc(row.name)}</option>`).join("")}</select></label></div>`:""}
 <div class="card"><label>Week<select id="coachWeek">${Array.from({length:14},(_,i)=>i+1).map(w=>`<option value="${w}" ${w==coachWeek?"selected":""}>Week ${w}</option>`).join("")}</select></label>
 <label>Session<select id="coachDay"><option value="0" ${coachDay==0?"selected":""}>Session 1 · Double unders + BMU</option><option value="1" ${coachDay==1?"selected":""}>Session 2 · Handstand walk + rope</option></select></label>
 ${area("focus","Session focus",x.focus)}${area("warm","Warm-up",x.warm)}${x.bl.map((b,i)=>`<section class="coach-block"><h2>Training block ${i+1}</h2>${area(`bl.${i}.n`,"Block title",b.n)}${area(`bl.${i}.dr`,"Drills",b.dr)}${area(`bl.${i}.m`,"Main set",b.m)}${area(`bl.${i}.ex`,"Strength / record",b.ex)}<button type="button" class="coach-remove" data-remove="${i}" ${x.bl.length<=1?"disabled":""}>Remove block</button></section>`).join("")}
 <button type="button" id="coachAdd" ${x.bl.length>=4?"disabled":""}>Add training block</button>
 ${area("cool","Cooldown",x.cool)}
 ${cloudUser?`<p id="planSyncStatus" class="helper">${esc(cloudMessage||"Edits save automatically and sync live.")}</p>`:`<div class="sc coach-actions"><button id="planExport">Export plan</button><button id="planImport">Import plan</button></div>`}
 <input id="planFile" type="file" accept=".json,application/json" hidden>
 <button id="planReset" class="coach-reset">Reset this session to the default plan</button></div>`;
 $("#coachWeek").onchange=e=>{coachWeek=+e.target.value;coach()};
 $("#coachDay").onchange=e=>{coachDay=+e.target.value;coach()};
 if($("#coachAthlete"))$("#coachAthlete").onchange=async e=>{await loadRemotePlan(e.target.value);coach()};
 document.querySelectorAll("[data-coach]").forEach(el=>el.oninput=()=>{
  const plan=P[id]||{focus:x.focus,warm:x.warm,cool:x.cool,bl:x.bl.map(b=>({...b}))};
  const[key,...rest]=el.dataset.coach.split(".");
  if(key=="bl")plan.bl[+rest[0]][rest[1]]=el.value;else plan[key]=el.value;
  P[id]=plan;savePlan();
 });
 $("#coachAdd").onclick=()=>{if(x.bl.length>=4)return;const plan=P[id]||{focus:x.focus,warm:x.warm,cool:x.cool,bl:x.bl.map(b=>({...b}))};plan.bl.push({n:"New training block",dr:"",m:"",ex:""});P[id]=plan;savePlan();coach()};
 document.querySelectorAll("[data-remove]").forEach(el=>el.onclick=()=>{
  if(x.bl.length<=1)return;const plan=P[id]||{focus:x.focus,warm:x.warm,cool:x.cool,bl:x.bl.map(b=>({...b}))};plan.bl.splice(+el.dataset.remove,1);P[id]=plan;savePlan();coach()
 });
 $("#planReset").onclick=()=>{if(!P[id])return;if(confirm("Reset this session's edits to the default training plan?")){delete P[id];savePlan();coach()}};
 if($("#planExport"))$("#planExport").onclick=()=>{const blob=new Blob([JSON.stringify({format:"skill-cycle-plan",version:1,sessions:P},null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="skill-cycle-training-plan.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 if($("#planImport"))$("#planImport").onclick=()=>$("#planFile").click();
 $("#planFile").onchange=async e=>{
  const file=e.target.files[0];if(!file)return;
  try{const imported=cleanPlan(JSON.parse(await file.text()));if(!imported)throw Error("Invalid plan format");if(!confirm("Importing replaces the training plan currently stored in this browser. Athlete progress is not changed."))return;P=imported;savePlan();coach()}
  catch(e){alert("That file isn't a valid Skill Cycle training plan.")}
  finally{e.target.value=""}
 };
}
function inputs(){const I=S.inp,f=(k,l,h,t="number")=>`<label>${l}<small>${h}</small><input data-k="${k}" type="${t}" inputmode="decimal" value="${esc(I[k])}"></label>`;
 $("#v").innerHTML=`<div class="page-heading"><div class="section-kicker">Athlete profile</div><h1>Inputs</h1><p>Test-day entries automatically update these targets and skill tracks.</p></div><div class="card">Choose the skill tracks that best match your current, repeatable ability. Sessions emphasize deliberate practice, full resets, and clean reps—not fatigue or max-rep sets.
 ${f("M","Double unders · M","Largest unbroken set in the Flight Simulator; updates DU targets")}
 <label>Bar muscle-up track<small>A: building pulling and kip basics · B: can do chest-to-bar but no BMU · C: can do BMUs; refine clean singles</small><select data-k="bt">${["A","B","C"].map(o=>`<option ${I.bt==o?"selected":""}>${o}</option>`).join("")}</select></label>
 <label>Handstand walk track<small>1: building wall alignment and balance · 2: can kick up and hold freestanding · 3: can take steps but wants a first/reliable walk</small><select data-k="ht">${[1,2,3].map(o=>`<option ${I.ht==o?"selected":""}>${o}</option>`).join("")}</select></label>
 ${f("rope","Rope test · total seconds","Time for 10 climbs, in seconds (e.g. 420)")}</div>
 <div class="card"><div class="section-kicker">Captured on test days</div><h2>Recorded results</h2><div class="test-summary">${[["du","Double unders"],["bmu","BMU / pull-ups"],["hsw","Handstand walk"],["rope","Rope climbs"]].map(([slot,label])=>`<div class="test-summary-row"><b>${label}</b><span><small>Baseline</small>${esc(resultText(slot,"baseline"))}</span><span><small>Retest</small>${esc(resultText(slot,"retest"))}</span></div>`).join("")}</div></div>
 <div class="card"><div class="section-kicker">Plan setup</div><h2>Schedule &amp; progress</h2><p class="helper">Choose the first training date. Progress saves in this browser when supported. Export a JSON file for a durable backup or to move progress to another phone.</p>
 <label>First session date<div class="date-input-wrap"><span aria-hidden="true">${inputDate(validDate(S.startDate)?S.startDate:defaultStart)}</span><input id="startDate" type="date" aria-label="First session date" value="${esc(validDate(S.startDate)?S.startDate:defaultStart)}"></div></label>
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
initializeCloud().catch(error=>{console.error("Could not initialize Supabase.",error);cloudMessage="Could not connect to Supabase.";if(tab=="a")account()});
