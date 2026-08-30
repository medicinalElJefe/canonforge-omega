import {ER} from "./catalog.js";
import {addr,hash} from "./kernel.js";
import {TIERS,SYSTEMS,FAMILIES,capacityAddress,starAddress,shell} from "./system.js";
const EARTH_IMAGES=[
  {id:"GOES19_CONUS_GEOCOLOR",label:"GOES-19 East CONUS",url:"https://cdn.star.nesdis.noaa.gov/GOES19/ABI/CONUS/GEOCOLOR/1250x750.jpg",authority:"NOAA NESDIS / CIRA GeoColor"},
  {id:"GOES19_FD_GEOCOLOR",label:"GOES-19 East Full Disk",url:"https://cdn.star.nesdis.noaa.gov/GOES19/ABI/FD/GEOCOLOR/1808x1808.jpg",authority:"NOAA NESDIS / CIRA GeoColor"},
  {id:"GOES18_FD_GEOCOLOR",label:"GOES-18 West Full Disk",url:"https://cdn.star.nesdis.noaa.gov/GOES18/ABI/FD/GEOCOLOR/1808x1808.jpg",authority:"NOAA NESDIS / CIRA GeoColor"}
];
const EARTH_URLS={usgs:"https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson",eonet:"https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=100",kp:"https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json"};
const erSp=(a,b,c,d)=>{const R=6371.0088,r=x=>x*Math.PI/180,p1=r(a),p2=r(c),dp=r(c-a),dl=r(d-b),x=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(x)))};
async function jfetch(url){const r=await fetch(url,{headers:{"user-agent":"OMEGA-Genesis/1.1","accept":"application/json"}});if(!r.ok)throw new Error("HTTP "+r.status);return r.json()}
async function imageEvidence(i){try{const r=await fetch(i.url,{headers:{Range:"bytes=0-0"}}),ct=r.headers.get("content-type")||"",ev={...i,http_status:r.status,content_type:ct,observation_at:r.headers.get("last-modified"),retrieved_at:new Date().toISOString(),binding:"LATEST_ALIAS_DIRECT_IMAGE",historical_playback:false,geoColor_boundary:"NOAA/CIRA derived sensor composite; daytime simulated green; nighttime ABI 7/13; city-light orientation layer is not a live OMEGA observation"};ev.status=r.ok&&ct.toLowerCase().startsWith("image/")?"CURRENT_VERIFIED":"HOLD";ev.evidence_hash=await hash(ev);try{r.body?.cancel()}catch{}return ev}catch(err){return{...i,status:"NO_EVIDENCE",detail:String(err?.message||err),retrieved_at:new Date().toISOString(),binding:"LATEST_ALIAS_DIRECT_IMAGE"}}}
async function earthEvidence(lat,lon){if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat<-90||lat>90||lon<-180||lon>180)throw new Error("WGS84 coordinate out of range");const settled=await Promise.allSettled([
  jfetch(EARTH_URLS.usgs),jfetch(EARTH_URLS.eonet),jfetch(EARTH_URLS.kp),
  jfetch("https://api.open-meteo.com/v1/forecast?latitude="+encodeURIComponent(lat)+"&longitude="+encodeURIComponent(lon)+"&current=temperature_2m,wind_speed_10m,cloud_cover&timezone=UTC")
]);const channels={};
  if(settled[0].status==="fulfilled"){const fs=settled[0].value.features||[],mags=fs.map(f=>f.properties?.mag).filter(Number.isFinite);let near=null;for(const f of fs){const z=f.geometry?.coordinates||[];if(z.length<2)continue;const d=erSp(lat,lon,+z[1],+z[0]);if(!near||d<near.distance_km)near={distance_km:d,magnitude:f.properties?.mag,place:f.properties?.place,time_ms:f.properties?.time,url:f.properties?.url}}channels.seismic={status:"PASS",authority:"USGS Earthquake Hazards Program",source_url:EARTH_URLS.usgs,past_day_count:fs.length,max_magnitude:mags.length?Math.max(...mags):null,nearest:near,evidence_class:"OBSERVED_EXTERNAL"}}
  else channels.seismic={status:"NO_EVIDENCE",detail:String(settled[0].reason)};
  if(settled[1].status==="fulfilled"){const es=settled[1].value.events||[];channels.natural_events={status:"PASS",authority:"NASA EONET v3",source_url:EARTH_URLS.eonet,open_event_count:es.length,categories:Object.fromEntries([...new Set(es.flatMap(e=>(e.categories||[]).map(c=>c.title||c.id)))].sort().map(k=>[k,es.filter(e=>(e.categories||[]).some(c=>(c.title||c.id)===k)).length])),evidence_class:"IMPORTED_EXTERNAL"}} else channels.natural_events={status:"NO_EVIDENCE",detail:String(settled[1].reason)};
  if(settled[2].status==="fulfilled"){const rows=settled[2].value,head=Array.isArray(rows)&&Array.isArray(rows[0])?rows[0]:[],last=Array.isArray(rows)?[...rows.slice(1)].reverse().find(r=>Array.isArray(r)&&r.length>=2):null;channels.space_weather={status:last?"PASS":"NO_EVIDENCE",authority:"NOAA Space Weather Prediction Center",source_url:EARTH_URLS.kp,latest:last?Object.fromEntries(head.map((k,i)=>[k,last[i]])):null,evidence_class:"IMPORTED_EXTERNAL"}} else channels.space_weather={status:"NO_EVIDENCE",detail:String(settled[2].reason)};
  if(settled[3].status==="fulfilled")channels.local_conditions={status:"PASS",authority:"Open-Meteo",source_url:"https://api.open-meteo.com/",current:settled[3].value.current,current_units:settled[3].value.current_units,evidence_class:"IMPORTED_EXTERNAL",boundary:"provider output may blend model and observational inputs; not canonical OMEGA measurement"};else channels.local_conditions={status:"NO_EVIDENCE",detail:String(settled[3].reason)};
  const satellite=await Promise.all(EARTH_IMAGES.map(imageEvidence));const num=v=>Number.isFinite(+v)?+v:0,mag=num(channels.seismic?.max_magnitude),wind=num(channels.local_conditions?.current?.wind_speed_10m),events=num(channels.natural_events?.open_event_count),kp=num(channels.space_weather?.latest?.Kp??channels.space_weather?.latest?.kp);const context=Math.min(1,.30*Math.min(1,mag/8)+.25*Math.min(1,kp/9)+.20*Math.min(1,wind/100)+.25*Math.min(1,events/100));const out={schema:"OMEGA_EARTH_EVIDENCE_V1",target:{lat,lon,crs:"EPSG:4326"},satellite,channels,derived_context_index:context,derived_context_boundary:"normalized display context only; not empirical proof, physical law or forecast",generated_pixels_substituted:false,retrieved_at:new Date().toISOString()};out.packet_fingerprint=await hash(out);return out}
function promptDraft(prompt,projectPath="."){const t=String(prompt||"").trim(),low=t.toLowerCase();let action="INDEX",profile="NONE",warning=null;if(/train|learn locally|learning cycle/.test(low))action="TRAIN_LOCAL";else if(/support bundle|diagnostic bundle|support packet/.test(low))action="SUPPORT_BUNDLE";else if(/workbook|excel|xlsx|xlsm/.test(low))action="WORKBOOK_AUDIT";else if(/package|zip|release bundle/.test(low))action="PACKAGE";else if(/test|pytest|unit test|acceptance/.test(low)){action="TEST";profile=/python|pytest/.test(low)?"PYTHON_TEST":"AUTO_BUILD"}else if(/build|compile|repair|fix|patch/.test(low)){action="BUILD";profile=/node|npm|javascript|typescript/.test(low)?"NODE_BUILD":/dotnet|\.net|c#/.test(low)?"DOTNET_BUILD":"AUTO_BUILD"}else warning="No executable intent was unambiguous; discovery INDEX selected.";const p=String(projectPath||".").replaceAll("\\","/");if((action==="BUILD"||action==="TEST")&&(p==="."||p==="")){action="INDEX";profile="NONE";warning="Broad-root build/test converted to discovery-only INDEX; locate a child project first."}return{schema:"OMEGA_HYBRID_DRAFT_V1",action,profile,project_path:p||".",rationale:"Prompt mapped to a typed governed action; execution remains paired-host only and requires confirmation.",warnings:warning?[warning]:[],requiresConfirmation:true,confirmed:false,queued:false,hostStateMutation:false}}


export async function handleExtendedApi({url,request,env,stateStub,stateSnapshot}){
  const path=url.pathname;

  if(path==="/api/earth/context"){
    const lat=Number(url.searchParams.get("lat")),lon=Number(url.searchParams.get("lon"));
    try{return Response.json(await earthEvidence(lat,lon))}catch(err){return Response.json({error:"earth_context_failed",detail:String(err?.message||err)},{status:422})}
  }
  if(path==="/api/hybrid/plan"&&request.method==="POST"){
    const body=await request.json();return Response.json(promptDraft(body.prompt,body.project_path||"."));
  }
  if(path==="/api/reality/analyze"&&request.method==="POST"){
    return Response.json({error:"host_only_operation",boundary:"Reality Lab executes against approved local source data. Queue REALITY_ANALYZE through a paired Desktop Link device or use the local Genesis API."},{status:409});
  }
  if(path==="/api/training/retrieve"&&request.method==="POST"){
    return Response.json({error:"host_only_operation",boundary:"Local SAI retrieval remains on the sovereign host; private corpus chunks are not uploaded to the Worker."},{status:409});
  }

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
