const [baseArg,expectedVersionArg]=process.argv.slice(2);
if(!baseArg||!expectedVersionArg){
  console.error('usage: node scripts/verify_r192_live.mjs <base-url> <expected-worker-version-id>');
  process.exit(2);
}

const base=baseArg.replace(/\/$/,'');
const expectedVersion=String(expectedVersionArg).trim();
const CONTRACT='R192_SERVICE_BOUND_R1532_ATTESTED';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const attempts=Math.max(1,Math.min(40,Number(process.env.OMEGA_R192_PROBE_ATTEMPTS||20)));
const delayMs=Math.max(250,Math.min(10000,Number(process.env.OMEGA_R192_PROBE_DELAY_MS||1500)));

async function getJson(path){
  const sep=path.includes('?')?'&':'?';
  const url=base+path+sep+'omega_r192_probe='+Date.now()+'_'+Math.random().toString(16).slice(2);
  const response=await fetch(url,{headers:{accept:'application/json','cache-control':'no-cache','x-omega-probe':'r192-exact-version'}});
  const text=await response.text();
  let json=null;try{json=JSON.parse(text)}catch{}
  return{response,json,text,url};
}

async function getText(path){
  const sep=path.includes('?')?'&':'?';
  const url=base+path+sep+'omega_r192_probe='+Date.now()+'_'+Math.random().toString(16).slice(2);
  const response=await fetch(url,{headers:{'cache-control':'no-cache','x-omega-probe':'r192-exact-version'}});
  return{response,text:await response.text(),url};
}

function runtimeReady(json){
  return Boolean(json&&json.ok===true&&json.schema==='OMEGA_GENESIS_RUNTIME_ATTESTATION_R192'&&json.revision==='R192'&&json.runtimeContract===CONTRACT&&json.entrypoint==='src/convergence_r192.js'&&json.workerVersion?.id===expectedVersion&&json.expectedServices?.OMEGA_V6==='omegav6'&&json.expectedServices?.OMEGA_OPTICAL==='omega-optical-machine-r1532'&&json.opticalGeneration==='R153.2'&&json.canonicalMutation===false);
}

function fabricReady(fabric){
  if(!fabric||fabric.schema!=='OMEGA_GENESIS_SURFACE_FABRIC_OBSERVER_R191')return false;
  if(fabric.runtime_revision!=='R192'||fabric.runtime_contract!==CONTRACT||fabric.runtime_entrypoint!=='src/convergence_r192.js')return false;
  if(fabric.deployment_version_id!==expectedVersion||fabric.r192_contract_verified!==true)return false;
  if(fabric.machine_transport!=='CLOUDFLARE_SERVICE_BINDINGS')return false;
  if(JSON.stringify(fabric.required_bindings)!==JSON.stringify(['OMEGA_V6','OMEGA_OPTICAL']))return false;
  if(fabric.service_bindings_active!==true||fabric.ok!==true||fabric.canonical_fabric_ready!==true)return false;
  if(typeof fabric.canonical_git_sha!=='string'||fabric.canonical_git_sha.length!==40)return false;
  if(fabric.optical_machine_generation!=='R153.2'||fabric.optical_machine_authority!=='SCREEN_ONLY')return false;
  if(fabric.optical_machine_version!=='R153.2'||fabric.optical_tool_version!=='R153.2')return false;
  if(fabric.optical_adaptive_cycle!==true||fabric.optical_canonical_mutation!==false)return false;
  if(fabric.may_mutate_global_canon_state!==false||fabric.may_promote_v6!==false||fabric.may_claim_vercel_same_url_promotion!==false)return false;
  for(const key of ['fabric','canon','optical']){
    const item=fabric.observations?.[key];
    if(item?.transport!=='cloudflare_service_binding'||item?.reachable!==true)return false;
  }
  return true;
}

let last=null;
for(let attempt=1;attempt<=attempts;attempt++){
  try{
    const runtime=await getJson('/api/runtime/r192');
    const runtimeState=runtimeReady(runtime.json);
    if(!runtimeState){
      last={attempt,phase:'runtime_attestation',status:runtime.response.status,expectedVersion,observedVersion:runtime.json?.workerVersion?.id||null,contract:runtime.json?.runtimeContract||null,schema:runtime.json?.schema||null,bodyPrefix:runtime.text.slice(0,220).replace(/\s+/g,' ')};
    }else{
      const fabric=await getJson('/api/fabric/r191');
      if(!fabricReady(fabric.json)){
        last={attempt,phase:'fabric_contract',status:fabric.response.status,expectedVersion,observedVersion:fabric.json?.deployment_version_id||null,runtime:fabric.json?.runtime_revision||null,transport:fabric.json?.machine_transport||null,optical:fabric.json?.optical_machine_generation||fabric.json?.optical_machine||null,ok:fabric.json?.ok??null,bodyPrefix:fabric.text.slice(0,220).replace(/\s+/g,' ')};
      }else{
        const page=await getText('/');
        const pageReady=page.response.ok&&page.text.includes('omega-r191-genesis-bar')&&page.text.includes('GENESIS · PROPOSE')&&page.text.includes('Optical R153.2')&&page.text.includes('Canon remains OMEGA V6');
        if(pageReady){
          console.log('R192 LIVE VERIFIED',JSON.stringify({attempt,expectedVersion,runtimeVersion:runtime.json.workerVersion.id,contract:CONTRACT,canonicalGitSha:fabric.json.canonical_git_sha,optical:{generation:fabric.json.optical_machine_generation,authority:fabric.json.optical_machine_authority,machineVersion:fabric.json.optical_machine_version,toolVersion:fabric.json.optical_tool_version,adaptiveCycle:fabric.json.optical_adaptive_cycle,canonicalMutation:fabric.json.optical_canonical_mutation},transport:Object.fromEntries(Object.entries(fabric.json.observations).map(([k,v])=>[k,{transport:v.transport,reachable:v.reachable,status:v.status}]))}));
          process.exit(0);
        }
        last={attempt,phase:'operator_surface',status:page.response.status,expectedVersion,markers:{bar:page.text.includes('omega-r191-genesis-bar'),propose:page.text.includes('GENESIS · PROPOSE'),optical:page.text.includes('Optical R153.2'),canon:page.text.includes('Canon remains OMEGA V6')}};
      }
    }
  }catch(error){
    last={attempt,phase:'exception',expectedVersion,error:error?.message||String(error)};
  }
  console.log('R192 propagation wait',JSON.stringify(last));
  if(attempt<attempts)await sleep(delayMs);
}

console.error('R192 LIVE VERIFICATION EXHAUSTED',JSON.stringify(last));
process.exit(1);
