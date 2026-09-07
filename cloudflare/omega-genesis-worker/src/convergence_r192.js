import base,{OmegaGenesisState} from "./convergence.js";

export {OmegaGenesisState};

export const R192_REVISION="R192";
export const R192_SCHEMA="OMEGA_GENESIS_RUNTIME_ATTESTATION_R192";
export const R192_CONTRACT="R192_SERVICE_BOUND_R1532_ATTESTED";
export const R192_V6_SERVICE="omegav6";
export const R192_OPTICAL_SERVICE="omega-optical-machine-r1532";
export const R192_OPTICAL_GENERATION="R153.2";

function versionMetadata(env){
  const m=env?.CF_VERSION_METADATA||null;
  return m?{
    id:String(m.id||""),
    tag:m.tag?String(m.tag):null,
    timestamp:m.timestamp?String(m.timestamp):null
  }:null;
}

export function runtimeAttestationR192(env={}){
  const metadata=versionMetadata(env);
  return{
    ok:Boolean(metadata?.id),
    schema:R192_SCHEMA,
    revision:R192_REVISION,
    runtimeContract:env?.GENESIS_RUNTIME_CONTRACT||R192_CONTRACT,
    entrypoint:"src/convergence_r192.js",
    workerVersion:metadata,
    expectedServices:{OMEGA_V6:R192_V6_SERVICE,OMEGA_OPTICAL:R192_OPTICAL_SERVICE},
    opticalGeneration:R192_OPTICAL_GENERATION,
    authority:"GENESIS_DISCOVERY_EVOLUTION_RUNTIME_ATTESTATION_ONLY",
    canonicalMutation:false,
    truthBoundary:"R192 attests the exact deployed Genesis Worker version and expected service-binding generation. Version visibility is deployment identity evidence only; it does not prove peer reachability, returned execution, PC-online state, RCWA/FDTD/FEM validity, fabrication or measurement evidence, Vercel write authority, or CanonState admission."
  };
}

async function enrichFabricR192(response,env){
  const type=response.headers.get("content-type")||"";
  if(!type.includes("application/json"))return response;
  const body=await response.clone().json().catch(()=>null);
  if(!body||body.schema!=="OMEGA_GENESIS_SURFACE_FABRIC_OBSERVER_R191")return response;
  const attestation=runtimeAttestationR192(env);
  const currentContract=body.machine_transport==="CLOUDFLARE_SERVICE_BINDINGS"&&
    body.optical_machine_generation===R192_OPTICAL_GENERATION&&
    body.optical_machine_authority==="SCREEN_ONLY"&&
    body.optical_machine_version===R192_OPTICAL_GENERATION&&
    body.optical_tool_version===R192_OPTICAL_GENERATION&&
    body.optical_adaptive_cycle===true&&
    body.optical_canonical_mutation===false;
  const payload={
    ...body,
    runtime_revision:R192_REVISION,
    runtime_contract:attestation.runtimeContract,
    runtime_entrypoint:attestation.entrypoint,
    deployment_version_id:attestation.workerVersion?.id||null,
    deployment_version:attestation.workerVersion,
    expected_service_identities:attestation.expectedServices,
    r192_contract_verified:currentContract&&attestation.ok,
    ok:Boolean(body.ok&&currentContract&&attestation.ok),
    r192_truth_boundary:attestation.truthBoundary
  };
  const headers=new Headers(response.headers);
  headers.set("cache-control","no-store");
  headers.set("x-omega-genesis-runtime",R192_REVISION);
  headers.set("x-omega-runtime-contract",attestation.runtimeContract);
  if(attestation.workerVersion?.id)headers.set("x-omega-worker-version",attestation.workerVersion.id);
  return new Response(JSON.stringify(payload),{status:response.status,statusText:response.statusText,headers});
}

export default{
  async fetch(request,env,ctx){
    const url=new URL(request.url);
    if(url.pathname==="/api/runtime/r192"||url.pathname==="/_omega/runtime/r192"){
      const payload=runtimeAttestationR192(env);
      return Response.json(payload,{status:payload.ok?200:503,headers:{
        "cache-control":"no-store",
        "x-omega-genesis-runtime":R192_REVISION,
        "x-omega-runtime-contract":payload.runtimeContract,
        ...(payload.workerVersion?.id?{"x-omega-worker-version":payload.workerVersion.id}:{})
      }});
    }
    const response=await base.fetch(request,env,ctx);
    if(url.pathname==="/api/fabric/r191"||url.pathname==="/_omega/fabric/r191")return enrichFabricR192(response,env);
    return response;
  }
};
