import base, {OmegaGenesisState} from "./index.js";
import {MODES,MENUS,GATES,CAPABILITIES} from "./catalog.js";

export {OmegaGenesisState};

const V6_URL="https://omegav6.jeffdeweyeljefe.workers.dev";
const LAW=["OBSERVE","INVENTORY","RELATE","PRUNE","TRANSLATE","PROVE","PLAN","BUILD","TEST","VISUAL_ACCEPTANCE","ADVERSARIAL_VERIFY","PROMOTE_OR_REJECT","OBSERVE_RESULT","UPDATE_STRATEGY_MEMORY"];
const OPERATOR_ROLES=["ALPHA","BASE","CONSTRUCT","PRUNE","OMEGA"];
const DONOR_DISPOSITIONS=["KEEP","BIND","REIMPLEMENT","PRUNE","QUARANTINE"];

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
    schema:"OMEGA_RECURSIVE_CONVERGENCE_MANIFEST_V2",
    runtime:{
      role:"GENESIS_DISCOVERY_EVOLUTION",
      canonical_branch:"omega-genesis-v1-full",
      public_url:"https://omega-genesis-v1.jeffdeweyeljefe.workers.dev/",
      build:env.BUILD_ID||"omega-genesis-v1",
      authority:"durable-object-canonical-for-genesis-state",
      private_corpus_embedded:false
    },
    peer_contract:{
      role:"V6_CANONICAL_OPERATIONAL_RUNTIME",
      public_url:V6_URL+"/",
      boundary:"manifest publication is observation metadata only and cannot mutate V6 or Genesis canonical state"
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
    promotion_boundary:"Genesis discovers, recovers, evaluates and proposes bounded descendants. V6 operational promotion remains separately proof-gated.",
    dimensional_boundary:"144/1728/20736 are software/model/interface representation shells unless independently evidenced otherwise"
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
    schema:"OMEGA_RECIPROCAL_CONVERGENCE_SNAPSHOT_V2",
    observed_at:new Date().toISOString(),
    ok:Boolean(v6Health.reachable),
    genesis_manifest:ownManifest,
    peer:{
      role:"V6_CANONICAL_OPERATIONAL_RUNTIME",
      health:v6Health,
      convergence:v6Convergence,
      boundary:"peer reachability is observation only; no remote canonical mutation is authorized"
    }
  };
}

export default{
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname==="/api/convergence/manifest"){
      return Response.json(await manifest(env),{headers:{"cache-control":"no-store","x-omega-authority":"genesis-convergence-manifest"}});
    }
    if(url.pathname==="/_omega/convergence"){
      return Response.json(await reciprocalSnapshot(env),{headers:{"cache-control":"no-store","x-omega-authority":"genesis-convergence-observer"}});
    }
    return base.fetch(request,env);
  }
};
