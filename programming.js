(()=>{
const PROGRAM_START="2026-10-30";
const isValidDate=x=>typeof x=="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x+"T00:00:00Z"))&&new Date(x+"T00:00:00Z").toISOString().slice(0,10)==x;
const WF="2 min easy single unders\n2 rounds: 10 scap pull-ups · 10 band pull-aparts · 5 thoracic cat-cows\n2 × (20 s hollow + 20 s arch hold)\n2 × 15 pogo hops";
const WT="90 s wrist & finger prep\n2 min easy bike or row\n2 rounds: 5 pike push-ups · 10 shoulder dislocates · 20 s wall hollow hold · 10 scap pull-ups\n2 × 20 s dead hang";
const COOL="1 min lat stretch\n1 min wrist & forearm release";
const DUD="3 × :20 pogo jumps (no rope)\n2 × :30 fast singles (wrists only)";
// Weeks 1–2 and 13–14 are test/retest sessions; day 0 pairs DU + BMU, day 1 pairs HSW + rope.
const TS=[["Double unders","Test · Flight Simulator",DUD,"FLIGHT SIMULATOR for time\nUnbroken DU sets: 5-10-15...45-50-45...15-10-5\nRest as needed; if you trip, restart that set. Cap ≈ 8 min.","Record: time (or highest round completed). M = largest unbroken set → enter it in Inputs."],
["Bar muscle-ups","Test · BMU / C2B / pull-up AMRAP 5","Shoulder and wrist prep\n2 × 5 scapular pulls\n2 × 3 easy kip swings","AMRAP 5 min of ONE movement: bar muscle-ups, chest-to-bar pull-ups, or pull-ups. Choose the most advanced movement you can perform with controlled reps. Rest as needed; stop if technique breaks down.","Record total reps, largest unbroken set, and movement chosen. Repeat the same movement at retest.\nTrack A = building pulling and kip basics · B = can do chest-to-bar but no BMU · C = can do BMUs."],
["Handstand walk","Skill check · HSW readiness","Wrist and shoulder prep\n2 × :20 wall-facing holds\n3 controlled kick-ups; practice a safe exit","Not a max test: take 4–6 fresh attempts at your current level: stacked wall hold → controlled weight shift → freestanding balance → 1–3 deliberate steps.\nReset between attempts; stop if you cannot exit safely.","Record the best controlled hold, weight shift or steps/distance, plus which level felt repeatable. Repeat the same check at retest.\nTrack 1 = building wall alignment and balance · 2 = can kick up and hold freestanding · 3 = can take steps but wants a first/reliable walk."],
["Rope climbs","Test · 10 climbs for time","3 × foot-lock on the floor\n2 half-height climbs","10 rope climbs for time\nUse an efficient foot lock and stand tall on each reach. Descend hand-over-hand under control; do not slide, drop, or race the descent.","Record total time, rope height and technique. For one representative climb, note ascent and controlled-descent times separately." ]];
const BMU={
3:["1 · Bad Cheerleader Jump: 4 × 3. Jump and land in place; finish in a long line from hands to hips and create gentle forward momentum.","2 · Target Reach Swing: 4 × 3. From the jump, reach the feet toward a floor target and return to a controlled hollow/arch swing.","Use a low bar or keep feet close to the floor while learning the shapes. Land quietly; stop if grip or shoulder position slips."],
4:["1 · Bad Cheerleader Jump: 3 × 3, then 2 · Target Reach Swing: 3 × 3.","Aim each target reach at the same spot; keep the swing small and controlled rather than kicking hard.","Progress only when you can land and return to the start without losing shoulder control."],
5:["3 · Loading Position: 4 × 3. From the swing, pull the feet back into an arch; keep knees slightly bent and chest lifted.","Alternate Target Reach Swing → Loading Position for 4 × 2 smooth reps.","Build tension from the arch; avoid bending the elbows to turn this into an early pull."],
6:["3 · Loading Position: 3 × 3, then 4 · Air Chair Swing: 3 × 3.","In the air chair, look toward the bar and bring knees past 90° with a hip hinge; return to the loading arch under control.","Use a small range first. Keep shoulders active and stop before the kip becomes uncontrolled."],
7:["Deload: 1 · Bad Cheerleader Jump 2 × 3 and 2 · Target Reach Swing 2 × 3.","Easy hollow-to-arch shapes 2 × 3; omit fast or high-effort kips.","Keep the session comfortable; no turnover or max attempts."],
8:["4 · Air Chair Swing: 4 × 2, then 5 · Zombie Kick / Kipping Backslide: 3 × 2.","From the air chair, drive legs out quickly with straight arms and feel the body travel upward/back; reset after every rep.","Start with a small, safe kip. Do not yank on the bar or chase height with uncontrolled arching."],
9:["5 · Zombie Kick / Kipping Backslide: 4 × 2; pause and reset between reps.","6 · Wishing Well: 4 × 2 low-bar or box-supported transitions. Pull the bar toward the hips; once shoulders clear, look over the bar and finish in stable support.","Use the feet on a box or floor to control the transition. No resistance bands and no forced negatives."],
10:["Link 3 · Loading Position → 4 · Air Chair Swing → 5 · Zombie Kick: 4 × 2 deliberate sequences.","6 · Wishing Well: 4 × 1–2 supported transitions, finishing with a stable support and controlled step down.","Attempt an unassisted BMU only if the kip brings the chest high and the turnover is already controlled; otherwise keep the feet-supported version."],
11:["Link 1 · Bad Cheerleader Jump → 2 · Target Reach Swing → 3 · Loading Position: 3 × 2 sequences.","Link 4 · Air Chair Swing → 5 · Zombie Kick → 6 · Wishing Well: 3 × 1–2. Rest 90–120 s between attempts.","If a clean unassisted rep is within reach, take at most 3 fresh attempts; stop after a miss that changes mechanics."],
12:["Review all six positions for 1–2 crisp reps each; stop any drill that loses shape.","Take 3–5 fresh attempts at the best controlled level, with 90–120 s rest. A clean supported transition is a valid training result.","Record the highest clean step, whether the transition was foot-supported, and any unassisted BMU. No AMRAP."],
scale:{
A:"Track A: Keep feet on the floor/box for swings and the Wishing Well; use a low-bar version if the athlete cannot yet create a controlled kip. Build strict pulling separately with ring rows or strict pull-ups, leaving 2 reps in reserve.",
B:"Track B: Practice the full sequence; use box/foot support for the Wishing Well until the pull and turnover are controlled. No band-assisted BMUs.",
C:"Track C: Rehearse the six positions, then use a few crisp unassisted singles. Full reset and rest between reps; no linking or max set unless every rep stays clean."
}};
const BMU_PULLUPS={
3:"Banded pull-ups: 3 × 6",
4:"Banded pull-ups: 3 × 7",
5:"Banded pull-ups: 3 × 8",
6:"Banded pull-ups: 4 × 6",
7:"Deload: banded pull-ups 2 × 6, easy",
8:"Banded pull-ups: 4 × 7",
9:"Banded pull-ups: 4 × 8",
10:"Banded pull-ups: 3 × 6 with the next-thinner band, if Week 9 was clean; otherwise repeat 4 × 8",
11:"Banded pull-ups: 3 × 7 with the current band",
12:"Taper: banded pull-ups 2 × 6, easy"
};
const BMU_PULLUP_RULE="Strength add-on (about 6–8 min): use a band that leaves ~2 good reps in reserve; lower for 2–3 s and use a full, pain-free range. Complete every rep cleanly before advancing the next session. After 4 × 8, move to a thinner band and restart at 3 × 6; if you miss reps or lose control, repeat the target or use more assistance. Never train to failure. Record band/color and completed reps.";
const HSW={
1:{
3:["Wall-facing hold 4 × :20; practice a safe cartwheel exit","Wall weight shifts 3 × 4/side; keep elbows straight","Only use a wall and floor space you can exit safely."],
4:["Wall-facing hold 4 × :20–:30","Small shoulder weight shifts 4 × 4/side","Stop each set before the low back arches or shoulders soften."],
5:["Wall-facing hold 3 × :25; gently float one foot off the wall","Alternating toe pulls 4 × 3/side; pause for 1–2 s","Stay close to the wall; prioritize a stacked line."],
6:["Wall-facing hold 3 × :25; practice controlled heel pulls","Toe pulls 4 × 3; reset between reps","Do not chase a long hold if balance or shape is lost."],
7:["Deload: wall-facing hold 2 × :20","Easy weight shifts 2 × 3/side","No kick-up volume."],
8:["Wall-facing hold 3 × :20, then 3 calm kick-ups","Practice kick-up and safe exit 4 × 2","Use the wall as a safety net; no fatigued attempts."],
9:["Wall hold 2 × :20; 3 controlled kick-ups","Freestanding balance attempts 4 × 2; stop each at loss of control","Use small sets and full resets."],
10:["Wall toe pulls 3 × 3","4–6 kick-ups aiming for a brief stacked balance","A controlled exit counts as a successful attempt."],
11:["Wall-facing hold 2 × :20","4–6 kick-ups; if balanced, try one deliberate hand step","Keep attempts separate; return to wall drills if form slips."],
12:["Easy wall hold 2 × :15","4 fresh balance attempts; try a step only if stable","Record best hold, weight shift or step."]
},
2:{
3:["Wall-facing line 3 × :20; practice safe exits","Kick-up to a brief freestanding hold 4 × 2","Reset fully between attempts."],
4:["Toe pulls at wall 4 × 3; pause just off the wall","Kick-up and hold 4 × 2; aim for a quiet, stacked entry","Return to the wall if kick-ups become uncontrolled."],
5:["Toe pulls 3 × 3; add alternating heel pulls if controlled","Freestanding hold attempts 5 × 1; cap each at :10","End each attempt before over-balancing."],
6:["Wall balance drill 3 × 3 controlled toe/heel pulls","Kick-up to hold 5 × 1; practice small fingertip corrections","No walking attempts until the entry and exit are repeatable."],
7:["Deload: easy wall line 2 × :20","Freestanding hold 3 × 1, comfortable effort","No max holds."],
8:["Toe/heel pulls 3 × 3","5 balance attempts; add one small weight shift only when stable","Reset to standing between attempts."],
9:["Wall shift drill 2 × 4/side","5 attempts: hold, shift weight to one hand, return to two","Keep the free hand close to the floor; no rushed reach."],
10:["Kick-up practice 3 × 1","4–6 attempts at one controlled hand step, then safely exit","If balance is inconsistent, continue holds and shifts instead."],
11:["Easy balance drill 2 × 2","4–6 attempts at 1–3 deliberate steps; full reset","End the set when steps become uncontrolled."],
12:["Easy wall line 2 × :15","4 fresh attempts to hold, shift or take steps","Record best controlled hold and steps/distance."]
},
3:{
3:["Wall toe pulls 3 × 3; keep entries consistent","5 attempts at 1–2 deliberate steps, then reset","Quality and safe exits matter more than distance."],
4:["Kick-up and balance 3 × 1","5 attempts at 1–3 steps with full rest","Use a clear lane and stop before fatigue."],
5:["Wall balance drill 2 × 3","5 attempts: travel 1–3 controlled steps, reset each time","Keep a consistent start and finish position."],
6:["Kick-up rehearsal 2 × 1","4–6 attempts at the longest clean short walk; rest 60–90 s","Do not turn this into repeated distance conditioning."],
7:["Deload: easy wall hold 2 × :15","3 easy short-walk attempts","Stop well before fatigue."],
8:["Balance entry 2 × 1","5 attempts at a clean 2–4 step walk","Reset after every attempt; keep steps small."],
9:["Wall toe pulls 2 × 3","4–6 attempts at 2–5 deliberate steps","Only extend a walk when balance remains controlled."],
10:["Easy kick-up 2 × 1","5 attempts at a repeatable short walk; full rest","Record successful controlled steps, not total practice steps."],
11:["Balance entry 2 × 1","4–6 attempts to link steps into a short walk","Stop when the line or hand placement breaks down."],
12:["Easy balance entry 2 × 1","4 fresh attempts at best walk distance","Record longest controlled walk and number of clean attempts."]
}};
const HSW_WALL={
3:"Shoulder-capacity add-on: 2 × 2 partial wall walks to a comfortable height; step down under control.",
5:"Shoulder-capacity add-on: 3 × 2 wall walks to a comfortable height; rest 60–90 s.",
8:"Shoulder-capacity add-on: 3 × 2 wall walks; keep the same smooth, controlled descent.",
10:"Shoulder-capacity add-on: 3 × 3 wall walks only if every rep stays smooth; otherwise do 3 × 2."
};
const ROPE={
3:["Foot-lock practice 3 × 3 from the floor or low height. Clamp, stand tall, then reach; avoid extra re-grips.","4 × 1 climb to halfway at a smooth pace. Descend hand-over-hand with legs controlling the slide; never drop.","Record one ascent time and one controlled-descent time. Use the same rope and foot lock when possible."],
4:["Foot-lock practice 3 × 3; aim for one secure clamp and full stand on each cycle.","4 × 1 climb to halfway; rest 60–90 s. Keep the ascent rhythm smooth and the descent deliberate.","A cycle is clamp → stand → reach/re-grip. Avoid pulling hand-over-hand without standing."],
5:["Foot-lock practice 3 × 2, then 2 easy half climbs.","4 × 1 full climb at a repeatable pace; controlled hand-over-hand descent.","Record ascent and descent separately; do not speed up the descent."],
6:["Foot-lock practice 2 × 3; focus on a consistent clamp and stand.","5 × 1 full climb, rest 90 s. Aim for consistent ascent times without rushing the lock; descend hand-over-hand under control.","If ascent time improves but descent control worsens, slow down and prioritize safe lowering."],
7:["Deload: easy foot-lock practice 2 × 2.","3 × 1 half climb at easy effort; descend slowly hand-over-hand.","No timed efforts. Leave grip and shoulders fresh."],
8:["Foot-lock practice 2 × 2; rehearse clamp → stand → reach.","5 × 1 full climb, rest 90 s. Count efficient stand/reach cycles and avoid unnecessary re-grips.","Record ascent time and cycle count for one climb; keep descent controlled."],
9:["Foot-lock practice 2 × 2.","4 × 1 full climb at the fastest repeatable clean rhythm; rest 2 min. Descend hand-over-hand under control, using the legs to manage friction.","Compare ascent cycle count with Week 8. No sprinting or sliding down."],
10:["Foot-lock practice 2 × 2; focus on the same foot placement each rep.","5 × 1 full climb, rest 90–120 s. Keep ascent times consistent across reps; descend under control.","If cycle rate or foot lock gets sloppy, end the set rather than forcing speed."],
11:["Easy foot-lock rehearsal 2 × 2.","4 × 1 full climb; aim for a smooth ascent with fewer unnecessary re-grips than Week 8.","Record ascent and descent splits; the descent stays controlled, not raced."],
12:["Easy foot-lock rehearsal 2 × 2.","3 × 1 full climb at a crisp but controlled pace; deliberate hand-over-hand descent.","Taper: no max-speed efforts. Record the cleanest ascent rhythm and descent."]
};
const NM="⚠ Enter M in Inputs after the double-under test";
const ph=w=>w<3?"Baseline test":w<7?"Foundation":w==7?"Deload":w<12?"Build":w==12?"Taper":"Retest";
function build(w,d,I){
 const M=+I.M,q=p=>Math.max(3,Math.round(M*p));
 if(w<3||w>12){const x=TS[(w<3?w-1:w-13)*2+d];return{focus:(w>12?"Retest · ":"Test · ")+x[0],warm:d?WT:WF,bl:[{n:x[1],dr:x[2],m:x[3],ex:x[4]+(w>12?"\nCompare with your baseline in Results.":"")}]}}
 if(!d){
  const du={3:()=>`EMOM 10: ${q(.5)} unbroken DU each minute (50% of M)`,4:()=>`EMOM 10: ${q(.55)} DU each minute (55% of M)`,5:()=>`EMOM 12: ${q(.55)} DU each minute (55% of M)`,6:()=>`EMOM 12: ${q(.6)} DU each minute (60% of M)`,7:()=>`Deload: 6 sets of ${q(.4)} DU (40% of M)\nRest 45 s`,8:()=>`5 sets of ${q(.7)} DU (70% of M), rest 30 s\nThen 1 max-effort set: note how many`,9:()=>`Ladder for time: 10-20-30… up to ${Math.max(10,Math.round(M*.7/10)*10)} and back down (≈70% of M)\nUnbroken sets, rest as needed`,10:()=>`EMOM 10: ${q(.75)} DU (75% of M)\nThen 3 × :20 crisp singles`,11:()=>`Mini Flight Simulator for time: 5-10-15… up to ${Math.max(10,Math.round(M*.8/5)*5)} and back down (≈80% of M)`,12:()=>`Taper: 3 sets of ${q(.7)} DU (70% of M), rest 1 min`}[w];
  const [bdr,bm,bex]=BMU[w],bmScale=BMU.scale[I.bt]||BMU.scale.A,bmPullups=BMU_PULLUPS[w];
  return{focus:"Double unders + Bar muscle-ups",warm:WF,bl:[
   {n:"1 · Double unders (12 min)",dr:DUD,m:!M?NM:M<10?"Low-M plan: 6 rounds of 10 singles + 2–3 DU attempts + 10 singles. Goal: string 5+.":du(),ex:"Rest days: 3–5 min easy DU on 2–3 days"},
   {n:"2 · Bar muscle-up skill + strength (18 min)",dr:bdr,m:bm,ex:bex+"\n"+bmScale+"\n\n"+bmPullups+"\n"+BMU_PULLUP_RULE}]}}
 const [rdr,rm,rex]=ROPE[w];
 const [hdr,hm,hex]=(HSW[I.ht]||HSW[1])[w],wallWork=HSW_WALL[w]||"";
 return{focus:"Handstand walk + Rope climbs",warm:WT,bl:[
  {n:"1 · Handstand walk skill (14 min)",dr:hdr,m:hm,ex:hex+(wallWork?"\n"+wallWork:"")},
  {n:"2 · Rope climbs (14 min)",dr:rdr,m:rm,ex:rex}]}}
function makeSessions(startDate){const ses=[],start=isValidDate(startDate)?startDate:PROGRAM_START,[y,m,d]=start.split("-").map(Number),base=Date.UTC(y,m-1,d);
 for(let w=1;w<=14;w++)for(const d of[0,1]){const ms=base+864e5*(7*(w-1)+4*d);ses.push({w,d,ms,date:new Date(ms).toISOString().slice(0,10),id:w+(d?"T":"F")})}
 return ses}
window.SkillCycleProgram = { build, ph, makeSessions, COOL };
})();
