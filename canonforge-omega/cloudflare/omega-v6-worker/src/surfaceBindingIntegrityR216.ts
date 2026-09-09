import { enhanceFinalSurfaceContractR223 } from "./surfaceContractR223";

export const SURFACE_BINDING_INTEGRITY_RELEASE_R216 = "r216-live-surface-binding-integrity";
export const CAPABILITY_SCOPED_BINDING_R223 = "r223-capability-scoped-admission";

const STYLE = `<style id="omegaSurfaceBindingIntegrityR216Style">
html[data-omega-surface-binding="VERIFYING"],html[data-omega-surface-binding="WITHHELD"]{background:#05090d!important}
html[data-omega-surface-binding="VERIFYING"] body>*,html[data-omega-surface-binding="WITHHELD"] body>*{visibility:hidden!important;pointer-events:none!important}
html[data-omega-surface-binding="VERIFYING"] #omegaSurfaceBindingIntegrityR216,html[data-omega-surface-binding="WITHHELD"] #omegaSurfaceBindingIntegrityR216{visibility:visible!important;pointer-events:auto!important}
#omegaSurfaceBindingIntegrityR216{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:#05090df7;color:#edf8ff;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;padding:24px;box-sizing:border-box}
#omegaSurfaceBindingIntegrityR216[hidden]{display:none!important}
#omegaSurfaceBindingIntegrityR216 .omegaR216Card{width:min(720px,100%);border:1px solid #344755;border-radius:16px;background:#091119;box-shadow:0 24px 90px #000;padding:22px}
#omegaSurfaceBindingIntegrityR216 .omegaR216Title{font-size:15px;font-weight:800;letter-spacing:.08em;margin-bottom:9px}
#omegaSurfaceBindingIntegrityR216 .omegaR216State{font-size:12px;line-height:1.55;color:#b7cad6}
#omegaSurfaceBindingIntegrityR216 .omegaR216State strong{color:#f3fbff}
#omegaSurfaceBindingIntegrityR216 .omegaR216Diagnostic{margin-top:12px;padding:10px 12px;border:1px solid #4b3030;border-radius:10px;background:#170d0f;color:#ffd9d9;font-size:11px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}
#omegaSurfaceBindingIntegrityR216 button{margin-top:14px;border:1px solid #5a7485;border-radius:9px;background:#10202b;color:#effaff;padding:8px 12px;font:700 11px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;cursor:pointer}
a[data-omega-capability-state]{position:relative}a[data-omega-capability-state]::after{content:"";display:inline-block;width:5px;height:5px;margin-left:6px;border-radius:50%;vertical-align:middle;background:#6f8090}a[data-omega-capability-state^="AVAILABLE"]::after,a[data-omega-capability-state*="READY"]::after,a[data-omega-capability-state*="PRESENT"]::after,a[data-omega-capability-state*="ACTIVE"]::after{background:#63d99b;box-shadow:0 0 7px #63d99b88}a[data-omega-capability-state^="DEGRADED"]::after,a[data-omega-capability-state*="REQUIRED"]::after,a[data-omega-capability-state*="BLOCKED"]::after{background:#d8b75d;box-shadow:0 0 7px #d8b75d66}[data-omega-capability][aria-disabled="true"]{opacity:.55!important;cursor:not-allowed!important}
</style>`;

function runtimeScript(expectedCanonicalSha: string | null): string {
  return `<script id="omegaSurfaceBindingIntegrityR216Runtime">(()=>{
'use strict';
if(document.documentElement.dataset.omegaSurfaceBindingR216)return;
document.documentElement.dataset.omegaSurfaceBindingR216='r216';
const EXPECTED_SHA=${JSON.stringify(expectedCanonicalSha)};
const root=document.documentElement;
root.dataset.omegaSurfaceBinding='VERIFYING';
const overlay=document.createElement('section');
overlay.id='omegaSurfaceBindingIntegrityR216';
overlay.setAttribute('role','status');
overlay.setAttribute('aria-live','polite');
overlay.innerHTML='<div class="omegaR216Card"><div class="omegaR216Title">OMEGA · LIVE BINDING INTERLOCK</div><div class="omegaR216State" id="omegaR216State"><strong>VERIFYING EXACT CORE</strong><br>The shell remains withheld only until exact deployment identity and local-core contracts are proven. External organs are admitted independently after the shell opens.</div><div class="omegaR216Diagnostic" id="omegaR216Diagnostic" hidden></div><button id="omegaR216Retry" type="button" hidden>RETRY CORE PROOF</button></div>';
document.body.appendChild(overlay);
const state=overlay.querySelector('#omegaR216State');
const diagnostic=overlay.querySelector('#omegaR216Diagnostic');
const retry=overlay.querySelector('#omegaR216Retry');
let admitted=false;
const block=(event)=>{if(admitted)return;if(overlay.contains(event.target))return;event.preventDefault();event.stopImmediatePropagation();};
for(const type of ['click','dblclick','pointerdown','pointerup','mousedown','mouseup','touchstart','touchend','submit'])document.addEventListener(type,block,true);
document.addEventListener('keydown',event=>{if(admitted)return;if(overlay.contains(event.target))return;event.preventDefault();event.stopImmediatePropagation();},true);
const bust=path=>path+(path.includes('?')?'&':'?')+'r216Proof='+Date.now()+'-'+Math.random().toString(16).slice(2);
async function read(path){const response=await fetch(bust(path),{method:'GET',cache:'no-store',headers:{accept:'application/json','x-omega-surface-proof':'r216-r223'}});let body=null;try{body=await response.json();}catch{throw new Error(path+' returned non-JSON HTTP '+response.status);}if(!response.ok)throw new Error(path+' returned HTTP '+response.status+' '+String(body?.code||body?.state||''));return body;}
function assert(condition,message){if(!condition)throw new Error(message);}
const routeCapability=new Map([
 ['/?app=Field','NAVIGATION'],['/?app=Calculus&mode=dewey-calculus','LOCAL_COMPUTE'],['/?app=Memory','NAVIGATION'],['/?app=Simulate','LOCAL_COMPUTE'],['/?app=Earth','EARTH'],['/?app=Assistant','INTELLIGENCE'],['/?app=Hybrid','HYBRID'],['/?app=Proof','PROOF'],
 ['/workbench','NAVIGATION'],['/relations','NAVIGATION'],['/calibration','LOCAL_COMPUTE'],['/capabilities','PROOF'],['/core','NAVIGATION'],['/sai','INTELLIGENCE'],['/compute','LOCAL_COMPUTE'],['/validate','VALIDATION'],['/validate/cross-runtime','VALIDATION'],['/validate/independent','NATIVE_RCWA'],['/clouds','NAVIGATION'],['/warp','LOCAL_COMPUTE'],['/warp/build','SELF_BUILD'],['/federation','NAVIGATION'],['/evolution','SELF_BUILD'],['/truth','PROOF'],['/convergence','NAVIGATION'],['/fabric','NAVIGATION'],['/instrument','PROOF'],['/system','PROOF']
]);
function hrefKey(a){try{const u=new URL(a.href,location.href);return u.pathname+(u.search||'')}catch{return''}}
function applyCapabilityPacket(packet){
  const states=new Map((packet?.capabilities||[]).map(row=>[row.id,row]));
  root.dataset.omegaCapabilityScope='r223';
  for(const row of states.values())root.dataset['omegaCapability'+String(row.id).replace(/[^A-Za-z0-9]/g,'')]=String(row.state||'UNKNOWN');
  for(const a of document.querySelectorAll('a[href]')){
    const group=routeCapability.get(hrefKey(a));if(!group)continue;const row=states.get(group);if(!row)continue;
    a.dataset.omegaCapability=group;a.dataset.omegaCapabilityState=String(row.state||'UNKNOWN');
    const base=(a.title||'').replace(/ · CAPABILITY .*/, '');a.title=base+' · CAPABILITY '+group+' · '+String(row.state||'UNKNOWN');
  }
  for(const el of document.querySelectorAll('[data-omega-capability]')){
    if(el.tagName==='A')continue;const group=el.dataset.omegaCapability,row=states.get(group);if(!row)continue;el.dataset.omegaCapabilityState=String(row.state||'UNKNOWN');
    if('disabled' in el)el.disabled=!row.ready;el.setAttribute('aria-disabled',row.ready?'false':'true');
  }
  window.dispatchEvent(new CustomEvent('omega:r223-capability-state',{detail:packet}));
}
async function refreshCapabilities(){try{const packet=await read('/api/surface/r223/capability-state');applyCapabilityPacket(packet);}catch(error){root.dataset.omegaCapabilityRefresh='DEGRADED';window.dispatchEvent(new CustomEvent('omega:r223-capability-state-unavailable',{detail:{reason:error instanceof Error?error.message:String(error)}}));}}
async function prove(){
  admitted=false;root.dataset.omegaSurfaceBinding='VERIFYING';retry.hidden=true;diagnostic.hidden=true;diagnostic.textContent='';
  state.innerHTML='<strong>VERIFYING EXACT CORE</strong><br>Exact R217/R190 deployment identity plus local Workspace, Compute and Validation contracts.';
  try{
    const core=await read('/api/surface/r223/core');
    assert(core&&core.schema==='OMEGA_CAPABILITY_SCOPED_ADMISSION_R223','R223 core admission schema is not current.');
    assert(core.identityReady===true,'Exact deployment identity is not proven.');
    assert(core.localCoreReady===true&&core.shellReady===true,'Local core is not ready.');
    const sha=typeof core.canonicalGitSha==='string'?core.canonicalGitSha:null;
    if(EXPECTED_SHA)assert(sha===EXPECTED_SHA,'R223 core deployment identity does not match the HTML deployment.');
    admitted=true;root.dataset.omegaSurfaceBinding='VERIFIED_CORE';root.dataset.omegaSurfaceBindingSha=sha||EXPECTED_SHA||'unbound-sha';overlay.hidden=true;
    window.dispatchEvent(new CustomEvent('omega:r216-surface-binding-verified',{detail:{release:'${SURFACE_BINDING_INTEGRITY_RELEASE_R216}',successor:'${CAPABILITY_SCOPED_BINDING_R223}',canonicalGitSha:sha||EXPECTED_SHA||null,scope:'LOCAL_CORE_PLUS_CAPABILITY_SCOPED_EXTERNAL'}}));
    refreshCapabilities();
  }catch(error){
    const message=error instanceof Error?error.message:String(error);root.dataset.omegaSurfaceBinding='WITHHELD';
    state.innerHTML='<strong>CORE BINDING INCOMPLETE — SHELL WITHHELD</strong><br>Identity or local-core integrity is not proven. External source/device outages alone do not trigger this global interlock.';
    diagnostic.hidden=false;diagnostic.textContent=message;retry.hidden=false;
    window.dispatchEvent(new CustomEvent('omega:r216-surface-binding-withheld',{detail:{release:'${SURFACE_BINDING_INTEGRITY_RELEASE_R216}',successor:'${CAPABILITY_SCOPED_BINDING_R223}',reason:message}}));
  }
}
retry.addEventListener('click',prove);
window.addEventListener('focus',()=>{if(admitted)refreshCapabilities()},{passive:true});
prove();
})();</script>`;
}

export async function enhanceSurfaceBindingIntegrityR216(response: Response, expectedCanonicalSha: string | null = null): Promise<Response> {
  if (!(response.headers.get("content-type") || "").includes("text/html")) return response;
  let html = await response.text();
  if (!html.includes('id="omegaSurfaceBindingIntegrityR216Runtime"')) {
    html = html.includes("</head>") ? html.replace("</head>", STYLE + "</head>") : STYLE + html;
    const script = runtimeScript(expectedCanonicalSha);
    html = html.includes("</body>") ? html.replace("</body>", script + "</body>") : html + script;
  }
  const headers = new Headers(response.headers);
  headers.set("cache-control", "no-store");
  headers.set("x-omega-surface-binding-integrity", SURFACE_BINDING_INTEGRITY_RELEASE_R216);
  headers.set("x-omega-capability-admission", CAPABILITY_SCOPED_BINDING_R223);
  if (expectedCanonicalSha) headers.set("x-omega-canonical-git-sha", expectedCanonicalSha);
  const bound = new Response(html, { status: response.status, statusText: response.statusText, headers });
  return enhanceFinalSurfaceContractR223(bound);
}
