export const UNIFIED_WORKSPACE_ACCEPTANCE_BOUNDARY = "R162 exposes the established governed instruments through the single OmegaEnvironmentShell navigation authority. It does not create a second state, renderer, route, heartbeat, deployment, Earth-evidence, or proof authority; specialized workspaces remain read-only or simulation-bounded according to their existing contracts.";

const style = `<style id="omegaUnifiedWorkspaceAcceptanceStyle">
#omegaEnvironmentDeck .oesWorkspaces{scroll-snap-type:x proximity;overscroll-behavior-x:contain}
#omegaEnvironmentDeck .oesWorkspace{scroll-snap-align:start;min-height:40px}
#omegaEnvironmentDeck .oesWorkspace[data-oes-special="true"]{border-style:dashed}
html.omega-acceptance-instrument-active #omegaRootSovereignField{display:none!important}
html.omega-acceptance-instrument-active .surface.app.active{display:none!important}
html.omega-acceptance-instrument-active #omegaCalcInstrument,
html.omega-acceptance-instrument-active #omegaMemoryContinuity,
html.omega-acceptance-instrument-active #omegaCreateSimulate{position:relative;z-index:2}
@media(max-width:760px){#omegaEnvironmentDeck .oesWorkspaces{gap:4px;padding-bottom:2px}#omegaEnvironmentDeck .oesWorkspace{min-height:44px;padding:8px 11px;font-size:9px}}
</style>`;

const runtime = `<script id="omegaUnifiedWorkspaceAcceptanceRuntime">(()=>{if(window.__omegaUnifiedWorkspaceAcceptance)return;window.__omegaUnifiedWorkspaceAcceptance=true;const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)],nav=q('#omegaEnvironmentDeck .oesWorkspaces');if(!nav)return;const special=[['Calculus','CALCULUS','Field'],['Memory','MEMORY','Earth'],['Create','CREATE / SIMULATE','Assistant'],['Build','BUILD / EVOLUTION','Proof']];function insert(name,label,beforeApp){if(nav.querySelector('[data-oes-workspace="'+name+'"]'))return;const b=document.createElement('button');b.className='oesWorkspace';b.dataset.oesWorkspace=name;b.dataset.oesSpecial='true';b.textContent=label;b.setAttribute('aria-label','Open '+label+' workspace');const before=nav.querySelector('[data-oes-app="'+beforeApp+'"]');if(before)nav.insertBefore(b,before);else nav.appendChild(b)}insert('Calculus','CALCULUS','Earth');insert('Memory','MEMORY','Assistant');insert('Create','CREATE / SIMULATE','Hybrid');insert('Build','BUILD / EVOLUTION','Proof');function canonicalName(view){const v=String(view||'').toLowerCase();if(v==='calculus')return'Calculus';if(v==='memory')return'Memory';if(v==='create'||v==='simulate'||v==='create/simulate')return'Create';if(v==='build'||v==='evolution'||v==='build/evolution')return'Build';return''}function mark(name){qa('#omegaEnvironmentDeck .oesWorkspace').forEach(b=>{const key=b.dataset.oesWorkspace||b.dataset.oesApp||'';const aliases={Assistant:'Intelligence',Hybrid:'Sovereign'};b.classList.toggle('active',key===name||aliases[key]===name)});const specialActive=['Calculus','Memory','Create'].includes(name);document.documentElement.classList.toggle('omega-acceptance-instrument-active',specialActive);if(name){document.body.dataset.omegaWorkspace=name==='Create'?'Create/Simulate':name;document.documentElement.dataset.omegaPrimaryWorkspace=name.toLowerCase()}}function openSpecial(name){const u=new URL(location.href);u.pathname='/';u.searchParams.set('view',name);location.assign(u.toString())}qa('[data-oes-workspace]').forEach(b=>b.addEventListener('click',()=>openSpecial(b.dataset.oesWorkspace||'')));qa('[data-oes-app]').forEach(b=>b.addEventListener('click',()=>{document.documentElement.classList.remove('omega-acceptance-instrument-active');delete document.body.dataset.omegaWorkspace}));const current=canonicalName(new URLSearchParams(location.search).get('view'));if(current)mark(current);else{const active=q('.navbtn.active[data-app]')?.dataset.app||'Field';mark(active==='Assistant'?'Intelligence':active==='Hybrid'?'Sovereign':active)}document.documentElement.dataset.omegaWorkspaceAcceptance='r162';})();</script>`;

export async function enhanceUnifiedWorkspaceAcceptance(response:Response):Promise<Response>{
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html'))return response;
  let html=await response.text();
  if(!html.includes('OMEGA V6')||html.includes('omegaUnifiedWorkspaceAcceptanceRuntime'))return new Response(html,{status:response.status,statusText:response.statusText,headers:response.headers});
  html=html.replace('</head>',style+'</head>');
  html=html.replace('</body>',runtime+'</body>');
  return new Response(html,{status:response.status,statusText:response.statusText,headers:response.headers});
}
