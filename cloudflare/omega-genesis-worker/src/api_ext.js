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
  if(path==="/api/recovery/rollback"&&request.method==="POST"){
    return Response.json({
      error:"cloud_recovery_boundary",
      boundary:"append-only rollback is implemented by the sovereign local runtime; hosted rollback remains locked until cloud recovery receipts are enabled"
    },{status:409});
  }
  return null;
}
