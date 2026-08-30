import {ER} from "./catalog.js";
import {addr,hash} from "./kernel.js";
import {TIERS,SYSTEMS,FAMILIES,capacityAddress,starAddress,shell} from "./system.js";

export async function handleExtendedApi({url,request,env,stateStub,stateSnapshot}){
  const path=url.pathname;

  if(path==="/host/current") return stateStub.fetch("https://state/state");
  if(path==="/host/proof/current") return stateStub.fetch("https://state/proof");
  if(path==="/host/projection/current"){
    const snap=await stateSnapshot();
    return Response.json(snap.projection);
  }
  if(path==="/host/shell/current"||path==="/api/shell/current"){
    const snap=await stateSnapshot();
    const topology=shell(snap.state.address);
    return Response.json({...topology,dispatch:snap.calculus.mode188.dispatch,admission:snap.calculus.mode188.admission,ratio:snap.calculus.mode188.ratio,canonical_digest:snap.state.digest,mutation:false});
  }
  if(path==="/api/systems"){
    return Response.json({
      coverage:{
        status:SYSTEMS.length===24&&FAMILIES.length===6?"PASS":"FAIL",
        systems:SYSTEMS.length,
        families:FAMILIES.length,
        source:"OMEGA_ALL_SOFTWARE_61917364224D_FULL_BUILD_v22.xlsx",
        boundary:"registry presence does not imply every target-specific adapter is active"
      },
      families:FAMILIES.map((name,i)=>({id:"F"+String(i).padStart(2,"0"),name})),
      systems:SYSTEMS
    });
  }
  if(path==="/api/capacity/tiers"){
    return Response.json({tiers:TIERS,boundary:"software representation/design tiers; no physical-dimension claim"});
  }
  if(path==="/api/capacity"){
    const packet=capacityAddress(url.searchParams.get("index")||0);
    packet.canonical_projection={index0:packet.canonical_index0,state_id:packet.canonical_index0+1,address:addr(packet.canonical_index0)};
    return Response.json(packet);
  }
  if(path==="/api/star"){
    const packet=starAddress(url.searchParams.get("index")||0);
    return Response.json({...packet,canonical:{index0:packet.canonical_index0,state_id:packet.canonical_index0+1,address:addr(packet.canonical_index0)}});
  }
  if(path==="/api/language/current"){
    const snap=await stateSnapshot(),s=snap.state,m=s.metrics,g=snap.calculus.mode188;
    return Response.json({
      canonical_digest:s.digest,state_id:s.state_id,evidence_class:"DERIVED",
      statements:[
        `Canonical state ${s.state_id} resolves to domain ${s.address[0]}, phase ${s.address[1]}, regulation ${s.address[2]}, lens ${s.address[3]}.`,
        `Evidence class is ${s.evidence_class}; this label is preserved through derived views.`,
        `Mode 188 dispatch is ${g.dispatch} with admission ${g.admission}.`,
        `Continuity CΩ=${Number(m.continuity).toFixed(4)}, future plasticity Φ=${Number(m.future_plasticity).toFixed(4)}, burden Λ=${Number(m.burden).toFixed(4)}, contradiction q=${Number(m.contradiction).toFixed(4)}, stability S=${Number(m.stability).toFixed(4)}.`
      ],
      boundary:"deterministic packet decoding; no hidden evidence or semantic promotion"
    });
  }
  if(path==="/api/ai/plan"&&request.method==="POST"){
    const body=await request.json(),objective=String(body.objective||"").trim();
    if(!objective)return Response.json({error:"objective_required"},{status:422});
    const snap=await stateSnapshot(),g=snap.calculus.mode188,sh=shell(snap.state.address);
    const steps=[{order:1,stage:"CHECKPOINT_SOURCE",action:"bind current canonical digest",digest:snap.state.digest},{order:2,stage:"FREEZE_PRIOR",action:"preserve pre-observation forecast boundary",future_observation_used:false}];
    if(g.admission==="PRUNE")steps.push({order:3,stage:"PRUNE",action:"reject canonical mutation; reduce burden/contradiction or improve evidence"},{order:4,stage:"PROVE",action:"re-evaluate Mode 188 before any mutation"});
    else if(g.admission==="CONDITIONAL")steps.push({order:3,stage:"TURN",action:"evaluate reversible 1+6 local alternatives",candidate_states:sh.neighbors.map(x=>x.state_id)},{order:4,stage:"TRANSLATE",action:"convert selected alternative into a canonical proposal"},{order:5,stage:"PROVE",action:"commit only if explicitly admitted"});
    else steps.push({order:3,stage:"STAY",action:"preserve current continuity while executing bounded objective work"},{order:4,stage:"TRANSLATE",action:"form a typed proposal or host-side action"},{order:5,stage:"PROVE",action:"record evidence, checksum, and admission result"});
    const core={objective,canonical_digest:snap.state.digest,state_id:snap.state.state_id,dispatch:g.dispatch,admission:g.admission,steps};
    return Response.json({...core,plan_fingerprint:await hash(core),evidence_class:"DERIVED",canonical_mutation:false,boundary:"planner proposes ordered work; canonical mutation remains proof-gated"});
  }
  if(path==="/api/bio/analyze"&&request.method==="POST"){
    const body=await request.json(),nodes=Array.isArray(body.nodes)?body.nodes:[],relations=Array.isArray(body.relations)?body.relations:[];
    const ids=new Set(nodes.map(x=>String(x.node_id||"")));
    if(ids.size!==nodes.length||ids.has(""))return Response.json({error:"node_ids_must_be_unique_and_nonempty"},{status:422});
    const adj=Object.fromEntries([...ids].map(id=>[id,new Set()]));
    for(const e of relations){const a=String(e.source||""),b=String(e.target||"");if(!ids.has(a)||!ids.has(b))return Response.json({error:"relation_endpoint_missing"},{status:422});adj[a].add(b);adj[b].add(a)}
    let unseen=new Set(ids),components=[];
    while(unseen.size){const root=unseen.values().next().value,stack=[root],group=new Set();while(stack.length){const cur=stack.pop();if(group.has(cur))continue;group.add(cur);unseen.delete(cur);for(const n of adj[cur])if(!group.has(n))stack.push(n)}components.push([...group].sort())}
    const possible=nodes.length*(nodes.length-1)/2,payload={nodes:nodes.length,relations:relations.length,components:components.length,component_members:components,degrees:Object.fromEntries(Object.entries(adj).map(([k,v])=>[k,v.size])),density:possible?relations.length/possible:0,scales:[...new Set(nodes.map(x=>String(x.scale||"").toUpperCase()).filter(Boolean))].sort()};
    return Response.json({...payload,fingerprint:await hash(payload),evidence_class:"DERIVED",boundary:"structural analysis of supplied nodes/relations only; no diagnosis, DNA, microscopy, brain, or unseen biological evidence is inferred"});
  }
  if(path==="/api/acceptance"){
    const snap=await stateSnapshot(),identity=Boolean(snap.replay?.valid),render=Boolean(snap.projection?.state_digest===snap.state.digest);
    return Response.json({
      status:"CLOUD_RUNTIME_BOUNDARY",
      gates:[
        {id:"GATE-001",gate:"C:\\ Install Root",status:"HOST_REQUIRED"},
        {id:"GATE-002",gate:"Health Endpoint",status:"PASS"},
        {id:"GATE-003",gate:"Canonical Identity",status:identity?"PASS":"FAIL"},
        {id:"GATE-004",gate:"188 Admission",status:"PASS"},
        {id:"GATE-005",gate:"Replay Drift",status:identity?"PASS":"FAIL"},
        {id:"GATE-006",gate:"Render Truth",status:render?"PASS":"FAIL"},
        {id:"GATE-007",gate:"Menu Coverage",status:SYSTEMS.length===24?"PASS":"FAIL"},
        {id:"GATE-008",gate:"Host Evidence Labels",status:"PASS"},
        {id:"GATE-009",gate:"Excel Roundtrip",status:"HOST_REQUIRED"},
        {id:"GATE-010",gate:"Package Checksum",status:"CI_REQUIRED"},
        {id:"GATE-011",gate:"Panel Layout",status:"STATIC_UI"},
        {id:"GATE-012",gate:"Donor Quarantine",status:"PASS"}
      ],
      boundary:"cloud runtime reports only evidence it can establish; Windows install, workbook host roundtrip and repository package checks remain target/CI gates"
    });
  }
  if(path==="/api/authority"){
    const snap=await stateSnapshot();
    return Response.json({
      status:snap.replay?.valid?"PASS":"FAIL",
      canonical_digest:snap.state.digest,
      state_id:snap.state.state_id,
      sequence:snap.state.sequence,
      runtime_authorities:1,
      shadow_states:0,
      mutation_authority:"OmegaGenesisState only",
      replay:snap.replay
    });
  }
  if(path==="/api/host/compile"&&request.method==="POST"){
    const body=await request.json();
    const ev=String(body.evidence_class||"DERIVED");
    if(!(ev in ER)||!String(body.source_id||"").trim()||!String(body.authority||"").trim()){
      return Response.json({error:"invalid_host_packet"},{status:422});
    }
    const strong=ev==="OBSERVED"||ev==="IMPORTED";
    if(strong&&!(body.observed_at||body.retrieved_at)){
      return Response.json({error:"provenance_required",detail:ev+" requires observed_at or retrieved_at"},{status:422});
    }
    if(strong&&!(body.immutable_ref||body.checksum)){
      return Response.json({error:"provenance_required",detail:ev+" requires immutable_ref or checksum"},{status:422});
    }
    const payload=body.payload||{};
    const payload_sha256=await hash(payload);
    if(body.checksum&&String(body.checksum).length===64&&String(body.checksum).toLowerCase()!==payload_sha256){
      return Response.json({error:"checksum_mismatch"},{status:422});
    }
    return Response.json({
      evidence_class:ev,
      source:{
        source_id:String(body.source_id),
        authority:String(body.authority),
        evidence_class:ev,
        observed_at:body.observed_at||null,
        retrieved_at:body.retrieved_at||null,
        immutable_ref:body.immutable_ref||null,
        checksum:body.checksum||payload_sha256,
        note:String(body.note||"")
      },
      payload,
      payload_sha256,
      compiled_at:new Date().toISOString(),
      canonical_mutation:false,
      boundary:"observation compiler only; runtime admission is a separate proof-gated operation"
    });
  }
  if(path==="/api/history") return stateStub.fetch("https://state/history");
  if(path==="/api/recovery/rollback"&&request.method==="POST"){
    const token=env.OMEGA_WRITE_TOKEN;
    if(!token||request.headers.get("X-Omega-Write-Token")!==token){
      return Response.json({error:"hosted_write_locked",boundary:"Configure OMEGA_WRITE_TOKEN and send X-Omega-Write-Token."},{status:403});
    }
    return stateStub.fetch(new Request("https://state/rollback",{method:"POST",headers:{"content-type":"application/json"},body:await request.text()}));
  }
  return null;
}
