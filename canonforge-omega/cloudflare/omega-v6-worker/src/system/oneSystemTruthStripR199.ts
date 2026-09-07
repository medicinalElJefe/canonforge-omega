export const ONE_SYSTEM_TRUTH_STRIP_R199 = "r199-correlated-runtime-proof-strip";

const truthScript = `<script id="omegaOneSystemTruthStripR199Runtime">(()=>{
const q=s=>document.querySelector(s);if(!q('#omegaOneSystemR199'))return;
function set(id,state,title){const el=q(id);if(!el)return;el.className='r199Dot '+state;if(title)el.parentElement?.setAttribute('title',title)}
async function load(){
  try{
    const r=await fetch('/api/convergence/edge',{cache:'no-store',headers:{accept:'application/json'}}),d=await r.json();
    const v6=d?.topology?.v6?.edge||{},pc=d?.topology?.sovereign_pc||{},c=d?.convergence||{},m=d?.genesis?.manifest||{};
    set('#r199V6Dot',r.ok&&v6.reachable?'ok':'bad',v6.reachable?'V6 canonical runtime reachable':'V6 canonical runtime not proven reachable');
    const pcOnline=Boolean(pc.pc_online),heartbeat=Boolean(pc.heartbeat_current);
    set('#r199PcDot',pcOnline?'ok':heartbeat?'warn':'bad',pcOnline?'PC ONLINE · authenticated heartbeat current':heartbeat?'Authenticated heartbeat current · PC admission incomplete':'PC UNPROVEN · no current authenticated heartbeat');
    const roleProof=Boolean(d?.ok&&c.reciprocal_manifest_ready&&c.authority_contract_ready&&m.digest&&c.genesis_manifest_digest===m.digest);
    let residualProof=false,residualTitle='';
    try{const rr=await fetch('/api/system/r195/restoration?limit=1',{cache:'no-store',headers:{accept:'application/json'}}),rd=await rr.json();residualProof=Boolean(rr.ok&&((rd?.residual?.unresolved===0)||(Number(rd?.cohortProof?.ready||0)>0)));residualTitle=' · restoration '+String(rd?.cohortProof?.ready??0)+'/'+String(rd?.cohortProof?.total??0)+' cohorts'}catch{}
    set('#r199ProofDot',roleProof&&residualProof?'ok':roleProof||residualProof?'warn':'bad',(roleProof?'role contract proven':'role contract incomplete')+residualTitle);
  }catch(e){set('#r199V6Dot','bad','Convergence proof unavailable');set('#r199PcDot','bad','Hybrid proof unavailable');set('#r199ProofDot','bad','Proof packet unavailable')}
}
load();setInterval(load,5000);
})();</script>`;

export async function correlateOneSystemTruthStripR199(response: Response): Promise<Response> {
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html')) return response;
  let html=await response.text();
  if(!html.includes('id="omegaOneSystemR199"')||html.includes('id="omegaOneSystemTruthStripR199Runtime"')) return new Response(html,{status:response.status,statusText:response.statusText,headers:response.headers});
  html=html.includes('</body>')?html.replace('</body>',truthScript+'</body>'):html+truthScript;
  const headers=new Headers(response.headers);headers.set('cache-control','no-store');headers.set('x-omega-truth-strip',ONE_SYSTEM_TRUTH_STRIP_R199);
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}
