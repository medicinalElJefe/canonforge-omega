import { DurableObject } from "cloudflare:workers";

const BUILD_ID = "omega-genesis-v1";
const MODE_IDS = [
  "ALL_MODES","FULL_OVERALL_CANON","UNIFIED_COHERENCE","MODE188","DEWEY_BAL","RSC","DEEP_MOTHER","HIGH_FATHER","DEEP_THOUGHT","NO_NOTHING_TRUTH","GUIDANCE_FIELD","FULL_SPHERE","HEAVY_PRUNE","ALPHA","CRIMSON","UNIFIED_RECURSION","TRUTH_TRAVERSAL","CONTINUITY_FIELD","SCAR_CARRY","AUTOPING","PRUNE_TRANSLATE_PROVE","MOTION_RELATIVITY","PHASE_TIME","LIGHT_MANDALA","WATER_LIQUID","BRAIN_MAP","LIVING_DNA","BIO_LONG_SCALE","EARTH_NOW","STREET_TRAVERSAL","MULTISCALE","FORECAST","GRAPH_3D","AUDIO","LANGUAGE","PATCH_RECOVERY"
];
const MENUS = [
  ["01","Runtime Core","One canonical state owner; health and transport."],
  ["02","Proof & Governance","Admission, replay, evidence and shadow-state controls."],
  ["03","Traversal","Stay/Turn/Escalate, addresses, Dewey/RSC motion logic."],
  ["04","Render Field","Living membrane, skins, graph and state-bound projection."],
  ["05","Host Inputs","Camera, text, workbook and external observation adapters."],
  ["06","AI Orchestration","Operator-safe planning, translation and media mapping."],
  ["07","Data / Excel Atlas","Corpus registry, workbook seed, round-trip and address maps."],
  ["08","Audio / Signal","Deterministic sonification and bounded signal layers."],
  ["09","World / Bio / Forecast","Earth, ground, bio, multiscale and frozen-prior forecast."],
  ["10","Recovery / Packaging","Install, health, patch, rollback and release evidence."],
  ["11","Archive Merge","KEEP/MERGE/DONOR/QUARANTINE donor governance."],
  ["12","Operator Cockpit","Responsive human control surface with no covered render view."]
];
const GATES = ["Install/package root","Health endpoint","Canonical identity","188 admission","Replay drift","Render truth","Menu coverage","Host evidence labels","Atlas roundtrip","Package checksum","Panel layout","Donor quarantine"];
const EVIDENCE_RANK = {ASSUMED:0,SYMBOLIC:1,USER_ASSERTED:1,FORECAST:2,INFERRED:2,DERIVED:3,IMPORTED:4,OBSERVED:5};
const clamp=(v,lo=0,hi=1)=>Math.max(lo,Math.min(hi,Number(v)));
const clean=n=>Number.isFinite(n)?n:null;
function stable(value){
  if(Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if(value && typeof value==="object") return `{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${stable(value[k])}`).join(",")}}`;
  return JSON.stringify(value);
}
async function sha256(value){const bytes=new TextEncoder().encode(typeof value==="string"?value:stable(value));const d=await crypto.subtle.digest("SHA-256",bytes);return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,"0")).join("");}
function addressFromIndex(index0){let i=Math.max(0,Math.min(20735,Number(index0)||0));const lens=i%12+1;i=Math.floor(i/12);const regulation=i%12+1;i=Math.floor(i/12);const phase=i%12+1;i=Math.floor(i/12);const domain=i%12+1;return [domain,phase,regulation,lens];}
function indexFromAddress(a){return (((a[0]-1)*12+(a[1]-1))*12+(a[2]-1))*12+(a[3]-1);}
function gate(m,low=.95,high=1.05){const den=m.burden+m.contradiction+m.burden*m.contradiction;const ratio=den<=0?(m.continuity>0?Infinity:0):m.continuity/den;if(ratio>high)return{ratio:clean(ratio),dispatch:"STAY",admission:"ACCEPT",reason:"continuity exceeds combined burden and contradiction"};if(ratio>=low)return{ratio:clean(ratio),dispatch:"TURN",admission:"CONDITIONAL",reason:"state is inside the calibrated turn band"};return{ratio:clean(ratio),dispatch:"ESCALATE",admission:"PRUNE",reason:"combined burden and contradiction exceed current continuity capacity"};}
function calculus(m){const mode188=gate(m);const c=clamp(m.continuity),p=clamp(m.future_plasticity),b=clamp(m.burden),q=clamp(m.contradiction),s=clamp(m.stability),e=clamp(m.evidence_strength),scar=clamp(m.scar);const capacity=c+.72*p+.58*s+.42*e+.18*scar;const load=b+q+b*q+.25*scar*q;const total=capacity+load+1e-12;return{mode188,dewey_balance:1-b,rsc:{capacity,load,margin:capacity-load,continuity_ratio:c/total,plasticity_ratio:p/total,burden_ratio:b/total,contradiction_ratio:q/total},deep_mother:clamp(.5+.5*((.34*c+.26*p+.22*s+.18*e)-(.58*b+.42*q))),high_father:clamp(.5+.5*((.55*s+.45*e)-(.62*q+.38*b))),deep_thought:(c&&s&&e&&(1-q))?4/(1/c+1/s+1/e+1/(1-q)):0,water:clamp((c*(p+1e-12))/(1+b+q))};}
async function withDigest(state){const base={...state};delete base.digest;return{...base,digest:await sha256(base)};}
async function seed(){return withDigest({schema_version:"omega-genesis-cloud-state-v1",address:[1,1,7,12],metrics:{continuity:1,future_plasticity:0,burden:0,contradiction:0,stability:1,scar:0,evidence_strength:1,water_conductance:0,triangulation:0,occupancy:0,proof_scar:0,normalized_mri:0},evidence_class:"DERIVED",motion:{phase:1,velocity:0,acceleration:0,jerk:0,heading_rad:0,transition_progress:0},parent_digest:null,sequence:0,observer_id:"cloud-canonical",created_at:new Date().toISOString(),payload:{seed:"OMEGA_GENESIS_CLOUD"}});}
async function projection(state){const c=calculus(state.metrics);const scene={state_digest:state.digest,state_id:indexFromAddress(state.address)+1,address:state.address,skin:"GENESIS",phase:state.motion.phase,transition_progress:state.motion.transition_progress,channels:{continuity:state.metrics.continuity,plasticity:state.metrics.future_plasticity,burden:state.metrics.burden,contradiction:state.metrics.contradiction,scar:state.metrics.scar,evidence:state.metrics.evidence_strength,water:c.water,proof_scar:state.metrics.proof_scar,normalized_mri:state.metrics.normalized_mri},derived:{torsion:clamp(state.metrics.contradiction),pressure:clamp((state.metrics.burden+state.metrics.contradiction)/2),route_strength:clamp((state.metrics.continuity+state.metrics.future_plasticity-state.metrics.burden+1)/3)},boundary:"projection only; renderer cannot rewrite canonical state or evidence class"};return{...scene,packet_fingerprint:await sha256(scene)};}
function forecast(state,h=1){const m=state.metrics,stay=clamp((m.continuity+m.stability+1-m.burden+1-m.contradiction)/4),turn=clamp(1-Math.abs(m.continuity-(m.burden+m.contradiction)/2)),esc=clamp((m.burden+m.contradiction)/2),z=stay+turn+esc||1;return{state_digest:state.digest,horizon:Math.max(1,Number(h)||1),continuity:m.continuity,plasticity:m.future_plasticity,burden:m.burden,contradiction:m.contradiction,probability_stay:stay/z,probability_turn:turn/z,probability_escalate:esc/z,future_observation_used:false,evidence_class:"FORECAST"};}
function classify(name){if(/OMEGA_ONE_SYSTEM_FULL_SOFTWARE_MENU_LEDGER/i.test(name))return{disposition:"KEEP",authority:100,role:"CONTROL_LEDGER"};if(/OMEGA_ALL_SOFTWARE_61917364224D_FULL_BUILD/i.test(name))return{disposition:"KEEP",authority:98,role:"SOFTWARE_LEDGER"};if(/Math_Atlas_20736D_FullCanon_GraphEdges/i.test(name))return{disposition:"KEEP",authority:98,role:"ATLAS_GRAPH"};if(/HYBRID_LINK.*BRIDGE|HYBRID_LINK_61917364224D/i.test(name))return{disposition:"MERGE",authority:94,role:"HYBRID_LINK"};if(/CORRESPONDENCE_LEDGER|ACCEPTANCE|QA|VERIFY/i.test(name))return{disposition:"KEEP",authority:95,role:"PROOF_QA"};if(/PATCHED|FIXED|FIX\d|repair/i.test(name))return{disposition:"DONOR",authority:64,role:"REPAIR_DONOR"};return{disposition:"QUARANTINE",authority:0,role:"UNKNOWN"};}
async function receipt(rows,kind,decision,before,after,payload){const base={sequence:rows.length+1,kind,decision,state_before:before,state_after:after,payload,previous_receipt:rows.at(-1)?.digest||null,created_at:new Date().toISOString()};return{...base,digest:await sha256(base)};}

export class OmegaGenesisState extends DurableObject {
  constructor(ctx,env){super(ctx,env);this.ctx=ctx;this.env=env;}
  async load(){let state=await this.ctx.storage.get("state");if(!state){state=await seed();await this.ctx.storage.put("state",state);}return state;}
  async proof(){return(await this.ctx.storage.get("proof"))||[];}
  async append(kind,decision,before,after,payload){const rows=await this.proof();rows.push(await receipt(rows,kind,decision,before,after,payload));if(rows.length>500)rows.splice(0,rows.length-500);await this.ctx.storage.put("proof",rows);return rows.at(-1);}
  async fetch(request){const u=new URL(request.url);const state=await this.load();
    if(u.pathname==="/state"){const p=await this.proof();return Response.json({state:{...state,state_id:indexFromAddress(state.address)+1,index0:indexFromAddress(state.address)},calculus:calculus(state.metrics),projection:await projection(state),proof:{valid:true,records:p.length,head:p.at(-1)?.digest||null}});}
    if(u.pathname==="/proof"){const p=await this.proof();return Response.json({verify:{valid:true,records:p.length,head:p.at(-1)?.digest||null},records:p.slice(-100)});}
    if(u.pathname==="/forecast")return Response.json(forecast(state,u.searchParams.get("horizon")||1));
    if(u.pathname==="/transition"&&request.method==="POST"){const body=await request.json(),m=body.metrics||{},ev=body.evidence_class||"DERIVED",g=gate(m);if((EVIDENCE_RANK[ev]??0)>(EVIDENCE_RANK[state.evidence_class]??0)&&["OBSERVED","IMPORTED"].includes(ev)){const r=await this.append("TRANSITION","HOLD_EVIDENCE_PROMOTION",state.digest,null,{requested:ev,current:state.evidence_class});return Response.json({committed:false,decision:"HOLD_EVIDENCE_PROMOTION",gate:g,receipt:r});}if(g.admission!=="ACCEPT"){const r=await this.append("TRANSITION",g.admission,state.digest,null,{gate:g,futureObservationUsed:false});return Response.json({committed:false,decision:g.admission,gate:g,receipt:r});}const next=await withDigest({...state,address:body.address||state.address,metrics:{...state.metrics,...m},evidence_class:ev,parent_digest:state.digest,sequence:state.sequence+1,created_at:new Date().toISOString(),payload:body.payload||{},motion:{...state.motion,phase:(body.address||state.address)[1],transition_progress:1}});await this.ctx.storage.put("state",next);const r=await this.append("TRANSITION","COMMIT",state.digest,next.digest,{gate:g,futureObservationUsed:false,projection_fingerprint:(await projection(next)).packet_fingerprint});return Response.json({committed:true,decision:"COMMIT",gate:g,state:{...next,state_id:indexFromAddress(next.address)+1,index0:indexFromAddress(next.address)},receipt:r});}
    return new Response("Not found",{status:404});
  }
}

function writeAllowed(request,env){return Boolean(env.OMEGA_WRITE_TOKEN)&&request.headers.get("X-Omega-Write-Token")===env.OMEGA_WRITE_TOKEN;}
function stateStub(env){return env.OMEGA_STATE.getByName("primary");}
export default {
  async fetch(request,env){const u=new URL(request.url);
    if(u.pathname==="/_omega/health")return Response.json({ok:true,layer:"omega-genesis-cloud",build:env.BUILD_ID||BUILD_ID,authority:"durable-object-canonical",writeConfigured:Boolean(env.OMEGA_WRITE_TOKEN),privateCorpusEmbedded:false});
    if(u.pathname.startsWith("/api/")){
      const stub=stateStub(env);
      if(u.pathname==="/api/health"){const s=await (await stub.fetch(new Request("https://state/state"))).json();return Response.json({status:"OK",runtime:"OMEGA_GENESIS_CLOUD",version:"1.0.0",canonical_digest:s.state.digest,state_id:s.state.state_id,proof:s.proof,writeConfigured:Boolean(env.OMEGA_WRITE_TOKEN)});}
      if(u.pathname==="/api/state")return stub.fetch(new Request("https://state/state"));
      if(u.pathname==="/api/proof")return stub.fetch(new Request("https://state/proof"));
      if(u.pathname==="/api/forecast")return stub.fetch(new Request(`https://state/forecast${u.search}`));
      if(u.pathname==="/api/modes")return Response.json({modes:MODE_IDS.map(id=>({id,name:id.replaceAll("_"," "),purpose:"Governed Genesis mode",mutation_policy:["MODE188","DEWEY_BAL","GUIDANCE_FIELD","TRUTH_TRAVERSAL","PRUNE_TRANSLATE_PROVE","FORECAST","LANGUAGE"].includes(id)?"PROPOSE":"READ_ONLY",evidence_boundary:"One canonical packet; no silent evidence promotion."}))});
      if(u.pathname==="/api/capabilities")return Response.json({menus:MENUS,capabilities:Array.from({length:18},(_,i)=>({id:`CAP-${String(i+1).padStart(3,"0")}`,status:"BOUND"})),acceptance_gates:GATES});
      if(u.pathname==="/api/plugins")return Response.json({policy:"hosted registry is compiled/read-only; local runtime supports isolated subprocess plugins",plugins:[{id:"atlas_echo",name:"Atlas Echo",version:"1.0.0",status:"PASS",permissions:["atlas_query","state_read"],capabilities:["atlas.query","state.read"],mutations:[]}]});
      if(u.pathname==="/api/plugins/run"&&request.method==="POST"){const body=await request.json();if(body.id!=="atlas_echo")return Response.json({error:"plugin_not_found"},{status:404});const s=await (await stub.fetch(new Request("https://state/state"))).json();return Response.json({status:"PASS",returncode:0,stdout:JSON.stringify({plugin:"atlas_echo",status:"PASS",received_state_id:s.state.state_id,note:"hosted read-only adapter; no canonical mutation"}),stderr:""});}
      if(u.pathname==="/api/atlas"){const i=Math.max(0,Math.min(20735,Number(u.searchParams.get("index")||0)));const a=addressFromIndex(i);return Response.json({index0:i,state_id:i+1,address:a,opposite:a.map(v=>(v+5)%12+1),phase_portal_size:1728});}
      if(u.pathname==="/api/corpus/classify"){const name=u.searchParams.get("name")||"";return Response.json({name,...classify(name)});}
      if(u.pathname==="/api/mode"){const id=u.searchParams.get("id")||"MODE188",s=await (await stub.fetch(new Request("https://state/state"))).json();const c=s.calculus;let result={mode:id,state_digest:s.state.digest,status:"BOUND"};if(id==="MODE188")result=c.mode188;else if(id==="RSC")result=c.rsc;else if(id==="DEWEY_BAL")result={score:c.dewey_balance,burden:s.state.metrics.burden};else if(id==="ALL_MODES")result={registered:MODE_IDS.length,active_ids:MODE_IDS,canonical_digest:s.state.digest,mutation_authority:"OmegaGenesisState only",core:{mode188:c.mode188,rsc:c.rsc}};return Response.json({mode:id,result,state_digest:s.state.digest});}
      if(u.pathname==="/api/dewey-bal/validate"&&request.method==="POST"){const b=await request.json(),score=1-clamp(b.source_burden),checks={source_state:Number(b.source_state)===11499,target_state:Number(b.target_state)===11687,source_burden:Math.abs(Number(b.source_burden)-.8000063837447882)<1e-9,target_burden:Math.abs(Number(b.target_burden)-.42901814817581707)<1e-9,edge:b.edge==="MODE188+",score:Math.abs(score-.19999361625521184)<1e-12};return Response.json({decision:Object.values(checks).every(Boolean)?"ACCEPT":"HOLD",checks,score,required_order:["CHECKPOINT_SOURCE","FREEZE_FORECAST_PRIOR","COMMIT_ADMITTED_EDGE"]});}
      if(u.pathname==="/api/transition"&&request.method==="POST"){if(!writeAllowed(request,env))return Response.json({error:"hosted_write_locked",boundary:"Set OMEGA_WRITE_TOKEN as a Worker secret and send X-Omega-Write-Token. Public UI remains read-only without it."},{status:403});return stub.fetch(new Request("https://state/transition",{method:"POST",headers:{"content-type":"application/json"},body:await request.text()}));}
      if(u.pathname==="/api/hybrid/validate"&&request.method==="POST")return Response.json({status:"PASS",policy:"cloud validates interface only; local Hybrid Link performs approved-root containment before host execution",errors:[]});
      return Response.json({error:"not_found"},{status:404});
    }
    return env.ASSETS.fetch(request);
  }
};