import base, {OmegaGenesisState} from "./index.js";
import {MODES,MENUS,GATES,CAPABILITIES} from "./catalog.js";

export {OmegaGenesisState};

const V6_URL="https://omegav6.jeffdeweyeljefe.workers.dev";
const LAW=["OBSERVE","INVENTORY","RELATE","PRUNE","TRANSLATE","PROVE","PLAN","BUILD","TEST","VISUAL_ACCEPTANCE","ADVERSARIAL_VERIFY","PROMOTE_OR_REJECT","OBSERVE_RESULT","UPDATE_STRATEGY_MEMORY"];
const OPERATOR_ROLES=["ALPHA","BASE","CONSTRUCT","PRUNE","OMEGA"];
const DONOR_DISPOSITIONS=["KEEP","BIND","REIMPLEMENT","PRUNE","QUARANTINE"];
const VISUAL_BOUNDARY="Genesis live phase rendering is a discovery/evolution visualization channel only. Text/chat output remains separate. Animation, phase, symmetry/asymmetry and 144/1728/20736/12^n projection depth do not mutate state or create empirical evidence.";

function canonical(value){
  if(Array.isArray(value))return "["+value.map(canonical).join(",")+"]";
  if(value&&typeof value==="object")return "{"+Object.keys(value).sort().map(k=>JSON.stringify(k)+":"+canonical(value[k])).join(",")+"}";
  return JSON.stringify(value);
}
async function digest(value){
  const bytes=new TextEncoder().encode(canonical(value));
  const out=await crypto.subtle.digest("SHA-256",bytes);
  return [...new Uint8Array(out)].map(v=>v.toString(16).padStart(2,"0")).join("");
}
async function probe(url){
  try{
    const response=await fetch(url,{headers:{accept:"application/json"}});
    const text=await response.text();
    let body=null;
    try{body=JSON.parse(text)}catch{body={error:"non_json_response",preview:text.slice(0,180)}}
    return{reachable:response.ok,status:response.status,body};
  }catch(error){
    return{reachable:false,status:0,error:String(error?.message||error)};
  }
}
async function manifest(env){
  const core={
    schema:"OMEGA_RECURSIVE_CONVERGENCE_MANIFEST_V3",
    authority_contract:"OMEGA_ROLE_SEPARATED_CONVERGENCE_V1",
    runtime:{
      role:"GENESIS_DISCOVERY_EVOLUTION_AUTHORITY",
      canonical_branch:"omega-genesis-v1-full",
      public_url:"https://omega-genesis-v1.jeffdeweyeljefe.workers.dev/",
      build:env.BUILD_ID||"omega-genesis-v1",
      authority:"durable-object-canonical-for-genesis-internal-state-only",
      operational_release_authority:false,
      private_corpus_embedded:false
    },
    public_product:{
      role:"V6_CANONICAL_OPERATIONAL_RUNTIME",
      public_url:V6_URL+"/",
      release_authority:"omega-v6-full-convergence",
      genesis_transport:"cloudflare-service-binding-observation",
      state_rule:"Genesis discovery, archive recovery, evidence and candidate evolution cannot mutate or promote V6 operational state. V6 owns its operational/release lifecycle.",
      genesis_may_deploy_v6:false
    },
    capability_genome:{
      capability_count:CAPABILITIES.length,
      menu_count:MENUS.length,
      mode_count:MODES.length,
      acceptance_gate_count:GATES.length,
      capability_ids:CAPABILITIES.map(x=>x.id||x.name||String(x)),
      capabilities:CAPABILITIES,
      modes:MODES,
      acceptance_gates:GATES
    },
    recursive_law:LAW,
    operator_roles:OPERATOR_ROLES,
    donor_dispositions:DONOR_DISPOSITIONS,
    promotion_boundary:"Genesis may discover, recover, test and propose bounded candidates. OMEGA V6 remains the canonical operational/release authority and promotes through its own exact-head verification workflow.",
    authority_boundary:"Genesis internal Durable Object state is not V6 operational state. Reciprocal convergence is observational and proposal-oriented; it does not grant cross-runtime mutation authority.",
    dimensional_boundary:"144/1728/20736 and larger 12^n spaces are software/model/interface representation shells unless independently evidenced otherwise"
  };
  return{...core,manifest_digest:await digest(core)};
}
async function reciprocalSnapshot(env){
  const [ownManifest,v6Health,v6Convergence]=await Promise.all([
    manifest(env),
    probe(V6_URL+"/_omega/health"),
    probe(V6_URL+"/api/convergence/edge")
  ]);
  return{
    schema:"OMEGA_RECIPROCAL_CONVERGENCE_SNAPSHOT_V3",
    observed_at:new Date().toISOString(),
    ok:Boolean(v6Health.reachable&&v6Convergence.reachable),
    genesis_manifest:ownManifest,
    peer:{
      role:"V6_CANONICAL_OPERATIONAL_RUNTIME",
      health:v6Health,
      convergence:v6Convergence,
      boundary:"peer observation cannot mutate Genesis internal state or V6 operational/release state"
    }
  };
}
async function injectVisual(response){
  const type=response.headers.get("content-type")||"";
  if(!type.includes("text/html"))return response;
  let html=await response.text();
  if(!html.includes("live-phase-visual.js"))html=html.replace("</body>",'<script src="/live-phase-visual.js" defer></script></body>');
  const headers=new Headers(response.headers);
  headers.set("cache-control","no-store");
  headers.set("x-omega-visual-channel","genesis-live-phase-separated-from-chat");
  headers.set("x-omega-visual-boundary",VISUAL_BOUNDARY);
  return new Response(html,{status:response.status,headers});
}

export default{
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname==="/api/convergence/manifest"){
      return Response.json(await manifest(env),{headers:{"cache-control":"no-store","x-omega-authority":"genesis-discovery-evolution-manifest"}});
    }
    if(url.pathname==="/_omega/convergence"){
      return Response.json(await reciprocalSnapshot(env),{headers:{"cache-control":"no-store","x-omega-authority":"genesis-convergence-observer"}});
    }
    const eligibleVisual=request.method==="GET"&&!url.pathname.startsWith("/api/")&&!url.pathname.startsWith("/_omega/")&&!url.pathname.startsWith("/host/");
    if(!eligibleVisual)return base.fetch(request,env);
    return injectVisual(await base.fetch(request,env));
  }
};
