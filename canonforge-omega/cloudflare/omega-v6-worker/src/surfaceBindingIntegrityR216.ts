export const SURFACE_BINDING_INTEGRITY_RELEASE_R216 = "r216-live-surface-binding-integrity";

const STYLE = `<style id="omegaSurfaceBindingIntegrityR216Style">
html[data-omega-surface-binding="VERIFYING"],html[data-omega-surface-binding="WITHHELD"]{background:#05090d!important}
html[data-omega-surface-binding="VERIFYING"] body>*,html[data-omega-surface-binding="WITHHELD"] body>*{visibility:hidden!important;pointer-events:none!important}
html[data-omega-surface-binding="VERIFYING"] #omegaSurfaceBindingIntegrityR216,html[data-omega-surface-binding="WITHHELD"] #omegaSurfaceBindingIntegrityR216{visibility:visible!important;pointer-events:auto!important}
#omegaSurfaceBindingIntegrityR216{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:#05090df7;color:#edf8ff;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;padding:24px;box-sizing:border-box}
#omegaSurfaceBindingIntegrityR216[hidden]{display:none!important}
#omegaSurfaceBindingIntegrityR216 .omegaR216Card{width:min(680px,100%);border:1px solid #344755;border-radius:16px;background:#091119;box-shadow:0 24px 90px #000;padding:22px}
#omegaSurfaceBindingIntegrityR216 .omegaR216Title{font-size:15px;font-weight:800;letter-spacing:.08em;margin-bottom:9px}
#omegaSurfaceBindingIntegrityR216 .omegaR216State{font-size:12px;line-height:1.55;color:#b7cad6}
#omegaSurfaceBindingIntegrityR216 .omegaR216State strong{color:#f3fbff}
#omegaSurfaceBindingIntegrityR216 .omegaR216Diagnostic{margin-top:12px;padding:10px 12px;border:1px solid #4b3030;border-radius:10px;background:#170d0f;color:#ffd9d9;font-size:11px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}
#omegaSurfaceBindingIntegrityR216 button{margin-top:14px;border:1px solid #5a7485;border-radius:9px;background:#10202b;color:#effaff;padding:8px 12px;font:700 11px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;cursor:pointer}
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
overlay.innerHTML='<div class="omegaR216Card"><div class="omegaR216Title">OMEGA · LIVE BINDING INTERLOCK</div><div class="omegaR216State" id="omegaR216State"><strong>VERIFYING LIVE BINDINGS</strong><br>Controls remain withheld until the deployed runtime proves the R211 provenance aggregate and R205 whole-system health on this same origin.</div><div class="omegaR216Diagnostic" id="omegaR216Diagnostic" hidden></div><button id="omegaR216Retry" type="button" hidden>RETRY LIVE PROOF</button></div>';
document.body.appendChild(overlay);
const state=overlay.querySelector('#omegaR216State');
const diagnostic=overlay.querySelector('#omegaR216Diagnostic');
const retry=overlay.querySelector('#omegaR216Retry');
let admitted=false;
const block=(event)=>{if(admitted)return;if(overlay.contains(event.target))return;event.preventDefault();event.stopImmediatePropagation();};
for(const type of ['click','dblclick','pointerdown','pointerup','mousedown','mouseup','touchstart','touchend','submit'])document.addEventListener(type,block,true);
document.addEventListener('keydown',event=>{if(admitted)return;if(overlay.contains(event.target))return;event.preventDefault();event.stopImmediatePropagation();},true);
const bust=path=>path+(path.includes('?')?'&':'?')+'r216Proof='+Date.now()+'-'+Math.random().toString(16).slice(2);
async function read(path){const response=await fetch(bust(path),{method:'GET',cache:'no-store',headers:{accept:'application/json','x-omega-surface-proof':'r216'}});let body=null;try{body=await response.json();}catch{throw new Error(path+' returned non-JSON HTTP '+response.status);}if(!response.ok)throw new Error(path+' returned HTTP '+response.status);return body;}
function assert(condition,message){if(!condition)throw new Error(message);}
async function prove(){
  admitted=false;
  root.dataset.omegaSurfaceBinding='VERIFYING';
  retry.hidden=true;diagnostic.hidden=true;diagnostic.textContent='';
  state.innerHTML='<strong>VERIFYING LIVE BINDINGS</strong><br>R211 provenance + R205 whole-system health + exact deployment identity.';
  try{
    const [r211,r205]=await Promise.all([read('/api/system/r211/status'),read('/api/system/r205/health')]);
    assert(r211&&r211.schema==='OMEGA_OPERATIONAL_PROVENANCE_STATUS_R211','R211 status schema is not current.');
    assert(r211.ok===true,'R211 aggregate status.ok is not true.');
    assert(r205&&r205.schema==='OMEGA_WHOLE_SYSTEM_HEALTH_R205','R205 health schema is not current.');
    assert(r205.ok===true,'R205 whole-system health.ok is not true.');
    const r211Sha=typeof r211.canonicalGitSha==='string'?r211.canonicalGitSha:null;
    const r205Sha=typeof r205.canonicalGitSha==='string'?r205.canonicalGitSha:null;
    if(EXPECTED_SHA){assert(r211Sha===EXPECTED_SHA,'R211 deployment identity does not match the HTML deployment.');if(r205Sha)assert(r205Sha===EXPECTED_SHA,'R205 deployment identity does not match the HTML deployment.');}
    if(r211Sha&&r205Sha)assert(r211Sha===r205Sha,'R211/R205 deployment identities disagree.');
    admitted=true;
    root.dataset.omegaSurfaceBinding='VERIFIED';
    root.dataset.omegaSurfaceBindingSha=r211Sha||EXPECTED_SHA||'unbound-sha';
    overlay.hidden=true;
    window.dispatchEvent(new CustomEvent('omega:r216-surface-binding-verified',{detail:{release:'${SURFACE_BINDING_INTEGRITY_RELEASE_R216}',canonicalGitSha:r211Sha||EXPECTED_SHA||null}}));
  }catch(error){
    const message=error instanceof Error?error.message:String(error);
    root.dataset.omegaSurfaceBinding='WITHHELD';
    state.innerHTML='<strong>LIVE BINDING INCOMPLETE — CONTROLS WITHHELD</strong><br>This public surface is intentionally locked. No control is being represented as operational until its authoritative runtime chain is healthy again.';
    diagnostic.hidden=false;diagnostic.textContent=message;
    retry.hidden=false;
    window.dispatchEvent(new CustomEvent('omega:r216-surface-binding-withheld',{detail:{release:'${SURFACE_BINDING_INTEGRITY_RELEASE_R216}',reason:message}}));
  }
}
retry.addEventListener('click',prove);
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
  if (expectedCanonicalSha) headers.set("x-omega-canonical-git-sha", expectedCanonicalSha);
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
