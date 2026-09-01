import { enhanceCapabilityViewRestoration } from "./capabilityViewRestoration";
import { enhanceArchiveRecoveredWorkstation } from "./archiveRecoveredWorkstation";
import { enhanceVirtualLatticeDisplay } from "./virtualLatticeDisplay";
import { enhanceLivePhaseVisual } from "./livePhaseVisual";

export const SPATIAL_COMMAND_CORE_BOUNDARY = "R135 keeps navigation separate from visualization and chat. Every launch target resolves to an existing governed route. The compact switcher is navigation only; live visual computation is rendered by the archive workstation + virtual lattice + phase renderer, and chat/text output remains a separate channel.";

const routes = [
  ["FIELD","Field","/?view=Field"],
  ["CALCULUS","Calculus","/?view=Calculus"],
  ["MEMORY","Memory","/?view=Memory"],
  ["SIMULATE","Simulate","/?view=Simulate"],
  ["EARTH","Earth","/?view=Earth"],
  ["INTELLIGENCE","Intelligence","/?view=Assistant"],
  ["SOVEREIGN","Sovereign","/?view=Hybrid"],
  ["PROOF","Proof","/?view=Proof"],
  ["CORE","Core","/core"],
  ["RELATIONS","Relations","/relations"],
  ["EVOLUTION","Evolution","/evolution"],
  ["CONVERGENCE","Convergence","/convergence"],
];

const style=`<style id="omegaSpatialCommandCoreStyle">
#omegaSpatialCore{position:sticky;top:72px;z-index:44;margin:0 0 12px;border:1px solid rgba(126,159,205,.22);border-radius:16px;background:rgba(4,9,15,.88);backdrop-filter:blur(20px);box-shadow:0 15px 46px #0007;overflow:hidden}.oscBar{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;padding:8px 10px}.oscIdentity{display:flex;gap:8px;align-items:center;white-space:nowrap}.oscMark{width:28px;height:28px;border-radius:50%;border:1px solid #486789;background:radial-gradient(circle,#17314d,#07111b 67%);box-shadow:0 0 22px rgba(93,145,210,.18)}.oscIdentity b{font-size:.7rem;letter-spacing:.12em}.oscIdentity small{display:block;color:#71849c;font-size:.52rem;letter-spacing:.08em}.oscViews{display:flex;gap:5px;min-width:0;overflow:auto;scrollbar-width:none}.oscViews::-webkit-scrollbar{display:none}.oscView{flex:0 0 auto;border:1px solid #2d435e;border-radius:999px;background:#08121d;color:#9eb0c5;padding:6px 8px;text-decoration:none;font:750 9px/1 ui-monospace,monospace;letter-spacing:.035em}.oscView:hover,.oscView:focus-visible{border-color:#7598c4;color:#fff;outline:none}.oscStatus{display:flex;align-items:center;gap:6px;color:#7489a2;font:700 9px ui-monospace,monospace;white-space:nowrap}.oscDot{width:7px;height:7px;border-radius:50%;background:#6f7f92}.oscDot.good{background:#42cb7c;box-shadow:0 0 12px rgba(66,203,124,.5)}.oscDot.warn{background:#e6bd4e}.oscMore{border:1px solid #334d6c;border-radius:999px;background:#09131f;color:#c4d0df;padding:6px 8px;cursor:pointer;font:750 9px ui-monospace,monospace}.oscDrawer{display:none;padding:9px 10px 10px;border-top:1px solid #203249}.oscDrawer.open{display:block}.oscDrawerGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}.oscDrawer a{border:1px solid #263c57;border-radius:11px;background:#07111b;color:#9db0c8;padding:9px;text-decoration:none;font-size:.67rem}.oscDrawer a b{display:block;color:#eef5ff;font-size:.7rem;margin-bottom:3px}.oscDrawer p{grid-column:1/-1;margin:4px 2px 0;color:#687b93;font:9px/1.45 ui-monospace,monospace}.oscLegacyPhrase{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}
@media(max-width:850px){#omegaSpatialCore{top:104px}.oscBar{grid-template-columns:auto minmax(0,1fr)}.oscStatus{display:none}.oscIdentity small{display:none}.oscDrawerGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.oscIdentity b{display:none}.oscViews .oscView:nth-child(n+7){display:none}.oscDrawerGrid{grid-template-columns:1fr 1fr}}
</style>`;

function markup(){const primary=routes.slice(0,8).map(r=>`<a class="oscView" href="${r[2]}">${r[0]}</a>`).join("");const all=routes.map(r=>`<a href="${r[2]}"><b>${r[0]}</b>${r[1]}</a>`).join("");return `<section id="omegaSpatialCore" aria-label="OMEGA compact workspace switcher"><span class="oscLegacyPhrase">One living system. Many working views.</span><div class="oscBar"><div class="oscIdentity"><span class="oscMark"></span><span><b>OMEGA</b><small>ONE PACKET · MANY LENSES</small></span></div><nav class="oscViews" aria-label="Primary workspaces">${primary}</nav><div class="oscStatus"><span id="oscDot" class="oscDot"></span><span id="oscAuthority">OBSERVING</span><button id="oscMore" class="oscMore" type="button">VIEWS</button></div></div><div class="oscDrawer" id="oscDrawer"><div class="oscDrawerGrid">${all}<p>${SPATIAL_COMMAND_CORE_BOUNDARY}</p></div></div></section>`}

const runtime=`<script id="omegaSpatialCommandCoreRuntime">(()=>{const core=document.querySelector('#omegaSpatialCore');if(!core)return;const drawer=core.querySelector('#oscDrawer'),more=core.querySelector('#oscMore'),dot=core.querySelector('#oscDot'),authority=core.querySelector('#oscAuthority');if(more)more.onclick=()=>drawer?.classList.toggle('open');async function refresh(){try{const r=await fetch('/api/convergence/edge',{cache:'no-store'}),d=await r.json(),ok=Boolean(d?.convergence?.authority_contract_ready);dot.className='oscDot '+(ok?'good':'warn');authority.textContent=ok?'V6 OPERATIONAL':'PROOF INCOMPLETE'}catch{dot.className='oscDot warn';authority.textContent='EDGE OBSERVING'}}refresh();setInterval(refresh,5000)})();</script>`;

async function compactNavigation(response:Response):Promise<Response>{const type=response.headers.get('content-type')||'';if(!type.includes('text/html'))return response;let html=await response.text();if(!html.includes('OMEGA V6')||html.includes('omegaSpatialCommandCoreStyle'))return new Response(html,{status:response.status,headers:response.headers});html=html.replace('</head>',style+'</head>');const target=html.includes('<main class="work">')?'<main class="work">':html.includes('<main class="wrap">')?'<main class="wrap">':'<body>';html=html.replace(target,target+markup());html=html.replace('</body>',runtime+'</body>');return new Response(html,{status:response.status,headers:response.headers});}

export async function enhanceSpatialCommandCore(response:Response):Promise<Response>{let out=await compactNavigation(response);out=await enhanceCapabilityViewRestoration(out);out=await enhanceArchiveRecoveredWorkstation(out);out=await enhanceVirtualLatticeDisplay(out);return enhanceLivePhaseVisual(out);}
