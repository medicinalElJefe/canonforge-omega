import base, {OmegaGenesisState} from "./index.js";
import {MODES,MENUS,GATES,CAPABILITIES} from "./catalog.js";

export {OmegaGenesisState};

const V6_URL="https://omegav6.jeffdeweyeljefe.workers.dev";

async function probe(url){
  try{
    const response=await fetch(url,{headers:{accept:"application/json"}});
    const text=await response.text();
    let body=null;try{body=JSON.parse(text)}catch{body={error:"non_json_response",preview:text.slice(0,180)}}
    return{reachable:response.ok,status:response.status,body};
  }catch(error){return{reachable:false,status:0,error:String(error?.message||error)}}
}

async function convergenceManifest(env){
  const [v6Edge,v6Evolution]=await Promise.all([
    probe(V6_URL+"/_omega/health"),
    probe(V6_URL+"/api/convergence/edge")
  ]);
  return{
    schema:"OMEGA_RECURSIVE_CONVERGENCE_MANIFEST_V1",
    generated_at:new Date().toISOString(),
    runtime:{
      role:"GENESIS_DISCOVERY_EVOLUTION",
      canonical_branch:"omega-genesis-v1-full",
      public_url:"https://omega-genesis-v1.jeffdeweyeljefe.workers.dev/",
      build:env.BUILD_ID||"omega-genesis-v1",
      authority:"durable-object-canonical-for-genesis-state",
      private_corpus_embedded:false
    },
    peer:{
      role:"V6_CANONICAL_OPERATIONAL_RUNTIME",
      public_url:V6_URL+"/",
      edge:v6Edge,
      convergence_observer:v6Evolution,
      boundary:"peer reachability is observation only and cannot mutate either canonical state"
    },
    capability_genome:{
      capability_count:CAPABILITIES.length,
      menu_count:MENUS.length,
      mode_count:MODES.length,
      acceptance_gate_count:GATES.length,
      capability_ids:CAPABILITIES.map(x=>x.id||x.name||String(x)),
      modes:MODES,
      acceptance_gates:GATES
    },
    recursive_law:["OBSERVE","INVENTORY","RELATE","PRUNE","TRANSLATE","PROVE","PLAN","BUILD","TEST","VISUAL_ACCEPTANCE","ADVERSARIAL_VERIFY","PROMOTE_OR_REJECT","OBSERVE_RESULT","UPDATE_STRATEGY_MEMORY"],
    operator_roles:["ALPHA","BASE","CONSTRUCT","PRUNE","OMEGA"],
    donor_dispositions:["KEEP","BIND","REIMPLEMENT","PRUNE","QUARANTINE"],
    promotion_boundary:"Genesis discovers, recovers, evaluates and proposes bounded descendants. V6 operational promotion remains separately proof-gated.",
    dimensional_boundary:"144/1728/20736 are software/model/interface representation shells unless independently evidenced otherwise"
  };
}

export default{
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname==="/api/convergence/manifest"){
      return Response.json(await convergenceManifest(env),{headers:{"cache-control":"no-store","x-omega-authority":"genesis-convergence-observer"}});
    }
    if(url.pathname==="/_omega/convergence"){
      const manifest=await convergenceManifest(env);
      return Response.json({ok:Boolean(manifest.peer.edge.reachable),genesis:true,v6:manifest.peer.edge.reachable,capabilities:manifest.capability_genome.capability_count,build:manifest.runtime.build},{headers:{"cache-control":"no-store"}});
    }
    return base.fetch(request,env);
  }
};
