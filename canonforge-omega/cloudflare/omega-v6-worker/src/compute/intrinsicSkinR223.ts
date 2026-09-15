export const R223_SCHEMA = "OMEGA_INTRINSIC_SKIN_COMPUTE_R223";
export const R223_SKINS = [12, 144, 1728, 20736, 248832] as const;
const BOUNDARY = "R223 atlas levels are computational address-resolution skins, not literal physical dimensions. Candidate learning cannot mutate Canon without proof/promotion authority.";

type Decision = "STAY" | "TURN" | "ESCALATE" | "PRUNE";

function json(value: unknown, status=200): Response {
  return new Response(JSON.stringify(value, null, 2), {status, headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","access-control-allow-origin":"*"}});
}
function finite(v: unknown, name: string): number { const n=Number(v); if(!Number.isFinite(n)) throw new Error(`${name} must be finite`); return n; }
function skinIndex(skin:number):number { const i=(R223_SKINS as readonly number[]).indexOf(skin); if(i<0) throw new Error("unsupported skin"); return i; }

export function intrinsicSkinManifest(){ return {
  ok:true, schema:R223_SCHEMA, revision:"R223", skins:[...R223_SKINS],
  coordinate:["address","skin","frame","evolution","orientation","historyPath"],
  edgeFamilies:["relation","skin","time/evolution"], decisions:["STAY","TURN","ESCALATE","PRUNE"],
  learningLoop:["OBSERVE","ADDRESS","PROJECT","RELATE","GEOMETRY","MOTION","PREDICT","COMPARE","RESIDUAL","CROSS_SKIN","LEARN_CANDIDATE","REPLAY","FALSIFY","PROVE","PROMOTE"],
  physicalDimensionClaim:false, canonicalMutation:false, boundary:BOUNDARY
}; }

export function decideSkin(body:any){
  const skin=Number(body.skin), i=skinIndex(skin), residual=finite(body.stateResidual ?? body.state_residual ?? 0,"stateResidual"), q=finite(body.crossSkinQ ?? body.cross_skin_q ?? 0,"crossSkinQ"), eps=finite(body.epsilon ?? .05,"epsilon"), gain=finite(body.marginalGain ?? body.marginal_gain ?? 1,"marginalGain"), floor=finite(body.gainFloor ?? body.gain_floor ?? .01,"gainFloor"), burden=finite(body.burden ?? 0,"burden");
  if(Math.min(residual,q,eps,gain,floor,burden)<0) throw new Error("resolution metrics must be non-negative");
  let decision:Decision="STAY", nextSkin=skin, reason="current skin is sufficient";
  if(residual>eps || q>eps){ if(i<R223_SKINS.length-1){decision="ESCALATE";nextSkin=R223_SKINS[i+1];reason="unresolved residual/contradiction";} else {decision="TURN";reason="resolution ceiling reached; change frame/model/operator";} }
  else if(gain<floor && i>0){decision="PRUNE";nextSkin=R223_SKINS[i-1];reason="finer skin adds insufficient marginal information";}
  return {ok:true,schema:R223_SCHEMA,currentSkin:skin,decision,nextSkin,stateResidual:residual,crossSkinQ:q,marginalGain:gain,burden,canonicalMutation:false,physicalDimensionClaim:false,reason,boundary:BOUNDARY};
}

export async function handleIntrinsicSkinR223(request:Request):Promise<Response|null>{
  const url=new URL(request.url);
  if(url.pathname==="/api/compute/r223/manifest"){
    if(request.method!=="GET") return json({ok:false,error:"METHOD_NOT_ALLOWED"},405);
    return json(intrinsicSkinManifest());
  }
  if(url.pathname==="/api/compute/r223/resolution"){
    if(request.method!=="POST") return json({ok:false,error:"METHOD_NOT_ALLOWED"},405);
    try{return json(decideSkin(await request.json()));}catch(error){return json({ok:false,schema:R223_SCHEMA,error:error instanceof Error?error.message:String(error),canonicalMutation:false},400);}
  }
  return null;
}
