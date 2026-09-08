import { EVIDENCE_PLANE_RELEASE_R194 } from "../evidencePlaneR194";
import { reconstituteOneSystemR199, ONE_SYSTEM_CORRELATION_RELEASE_R199 } from "./oneSystemCorrelationR199";
import { correlateOneSystemTruthStripR199 } from "./oneSystemTruthStripR199";
import { enhanceOneSystemOperatorSurfaceR199 } from "./oneSystemOperatorSurfaceR199";
import { enhanceMissionSurfaceR200 } from "./missionSurfaceR200";

export const ONE_SYSTEM_NAVIGATION_RELEASE_R195 = "r195-drive-corpus-one-system";
export const NAVIGATION_POLISH_RELEASE_R214 = "r214-submenu-navigation-polish";

const residualStyle = `<style id="omegaResidualRestorationR195Style">
#r195ResidualCard{grid-column:1/-1}.r195ResidualHead{display:flex;justify-content:space-between;gap:12px;align-items:flex-end;flex-wrap:wrap}.r195ResidualMetrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}.r195ResidualMetric{padding:10px;border:1px solid var(--l,#2b4058);border-radius:9px;background:#07111a}.r195ResidualMetric b{display:block;font-size:22px}.r195ResidualRows{display:grid;gap:6px;max-height:420px;overflow:auto}.r195ResidualRow{display:grid;grid-template-columns:minmax(160px,1.5fr) minmax(180px,1fr) minmax(140px,.8fr);gap:8px;padding:9px;border:1px solid var(--l,#2b4058);border-radius:9px;background:#071019}.r195ResidualRow code{font-size:10px;white-space:normal}.r195ResidualState{font-weight:800}.r195ResidualState[data-severity="5"]{color:#ff8585}.r195ResidualState[data-severity="4"]{color:#e7c96e}.r195ResidualState[data-severity="3"]{color:#8bd8ff}@media(max-width:850px){.r195ResidualMetrics{grid-template-columns:1fr 1fr}.r195ResidualRow{grid-template-columns:1fr}}
</style>`;

const residualScript = `<script id="omegaResidualRestorationR195Runtime">(()=>{
if(location.pathname!='/system'&&location.pathname!='/system/')return;const grid=document.querySelector('.grid');if(!grid||document.getElementById('r195ResidualCard'))return;
grid.insertAdjacentHTML('beforeend','<div id="r195ResidualCard" class="card full"><div class="r195ResidualHead"><div><b>RESIDUAL RESTORATION / WEAKEST-LINK QUEUE</b><div class="muted">Artifact-level admission remains separate from menu-cohort reachability.</div></div><button class="btn" id="r195ResidualRefresh">REFRESH PROOF</button></div><div class="r195ResidualMetrics"><div class="r195ResidualMetric"><span class="muted">Artifacts</span><b id="r195ResidualTotal">—</b></div><div class="r195ResidualMetric"><span class="muted">Individually verified</span><b id="r195ResidualVerified">—</b></div><div class="r195ResidualMetric"><span class="muted">Unresolved</span><b id="r195ResidualOpen">—</b></div><div class="r195ResidualMetric"><span class="muted">Cohorts ready</span><b id="r195ResidualCohorts">—</b></div></div><div id="r195ResidualSummary" class="muted">Probing 12 master menu cohorts…</div><div id="r195ResidualRows" class="r195ResidualRows"></div></div>');
const card=document.getElementById('r195ResidualCard');if(!card)return;const esc=v=>String(v??'');
async function loadResidual(){const summary=document.getElementById('r195ResidualSummary'),rows=document.getElementById('r195ResidualRows');summary.textContent='Probing 12 master menu cohorts…';try{const r=await fetch('/api/system/r195/restoration?limit=24',{cache:'no-store',headers:{accept:'application/json'}}),d=await r.json();document.getElementById('r195ResidualTotal').textContent=String(d.totalArtifacts??'—');document.getElementById('r195ResidualVerified').textContent=String(d.individuallyVerifiedArtifacts??'—');document.getElementById('r195ResidualOpen').textContent=String(d.residual?.unresolved??'—');document.getElementById('r195ResidualCohorts').textContent=String(d.cohortProof?.ready??'—')+'/'+String(d.cohortProof?.total??'—');summary.textContent=(d.individuallyVerifiedBoundary||'')+' Admission: '+(d.admissionSequence||[]).join(' → ');rows.textContent='';for(const item of d.residual?.weakestFirst||[]){const el=document.createElement('div');el.className='r195ResidualRow';const a=document.createElement('div'),b=document.createElement('div'),c=document.createElement('div');const title=document.createElement('b');title.textContent=esc(item.id)+' · '+esc(item.artifact||item.family);const detail=document.createElement('div');detail.className='muted';detail.textContent=esc(item.family)+' · '+esc(item.menuId);a.append(title,detail);const state=document.createElement('div');state.className='r195ResidualState';state.dataset.severity=String(item.severity??'');state.textContent=esc(item.state);const cohort=document.createElement('div');cohort.className='muted';cohort.textContent=item.cohort?esc(item.cohort.proofClass)+' · '+(item.cohort.bodyOk?'COHORT READY':'COHORT DEGRADED'):'NO PROOF COHORT';b.append(state,cohort);const code=document.createElement('code');code.textContent=(item.requiredEvidence||[]).join(' → ');c.append(code);el.append(a,b,c);rows.appendChild(el)}}catch(e){summary.textContent='Residual planner unavailable: '+String(e);rows.textContent=''}}
document.getElementById('r195ResidualRefresh')?.addEventListener('click',loadResidual);loadResidual();})();</script>`;

const navigationPolishStyle = `<style id="omegaNavigationPolishR214Style">
#omegaR214ControlMenu{margin:6px 0 8px;border:1px solid rgba(116,149,190,.18);border-radius:11px;background:rgba(7,15,24,.58);overflow:hidden}#omegaR214ControlMenu summary{list-style:none;height:38px;display:flex;align-items:center;gap:10px;padding:0 7px;cursor:pointer;color:#9fb1c5;user-select:none}#omegaR214ControlMenu summary::-webkit-details-marker{display:none}.r214SubIcon{width:25px;height:25px;display:grid;place-items:center;flex:0 0 25px;border-radius:7px;background:#0c1723;border:1px solid rgba(135,159,189,.14);font:850 9px ui-monospace,monospace}.r214SubLabel{min-width:0;opacity:0}.r214SubLabel b{display:block;font-size:10px;letter-spacing:.055em}.r214SubLabel small{display:block;margin-top:2px;color:#6f849c;font-size:8px}.r214Chevron{margin-left:auto;opacity:0;transition:transform .15s ease}#omegaR214ControlMenu[open] .r214Chevron{transform:rotate(90deg)}body.r193Expanded .r214SubLabel,body.r193Expanded .r214Chevron{opacity:1}.r214SubLinks{display:none;padding:0 6px 7px 36px;gap:3px}#omegaR214ControlMenu[open] .r214SubLinks{display:grid}.r214SubLink{min-height:31px;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 8px;border:1px solid transparent;border-radius:8px;color:#91a5bc!important;text-decoration:none;font-size:9px;letter-spacing:.045em}.r214SubLink:hover,.r214SubLink.current{background:#132235;border-color:#314a68;color:#fff!important}.r214SubLink span:last-child{font:800 8px ui-monospace,monospace;color:#667c95}.r214SubLink.current span:last-child{color:#d9bd6c}@media(max-width:760px){#omegaR214ControlMenu summary{height:46px}.r214SubLabel,.r214Chevron{opacity:1}.r214SubLinks{padding-left:42px}.r214SubLink{min-height:38px;font-size:10px}}@media(prefers-reduced-motion:reduce){.r214Chevron{transition:none!important}}
</style>`;

function controlSubmenuMarkup(pathname: string): string {
  const active = pathname === "/system" || pathname === "/truth" || pathname === "/instrument" || pathname === "/convergence" || pathname === "/evolution";
  return `<details id="omegaR214ControlMenu" data-r214-navigation="${NAVIGATION_POLISH_RELEASE_R214}"${active ? " open" : ""}><summary aria-label="Open advanced system controls"><span class="r214SubIcon">CTL</span><span class="r214SubLabel"><b>CONTROL DECK</b><small>operator · proof · bridge · development</small></span><span class="r214Chevron">›</span></summary><div class="r214SubLinks"><a class="r214SubLink" href="/system"><span>ONE SYSTEM</span><span>R195+</span></a><a class="r214SubLink" href="/truth"><span>TRUTH / ACCEPTANCE</span><span>PROOF</span></a><a class="r214SubLink" href="/instrument"><span>WHOLE INSTRUMENT</span><span>VIEW</span></a><a class="r214SubLink" href="/convergence"><span>CONVERGENCE</span><span>HOST</span></a><a class="r214SubLink" href="/evolution"><span>EVOLUTION / BUILD</span><span>DEV</span></a><a class="r214SubLink" href="/?app=Earth"><span>EARTH NOW</span><span>OBS</span></a><a class="r214SubLink" href="/?app=Hybrid"><span>HYBRID / PC</span><span>EXEC</span></a><a class="r214SubLink" href="/?app=Proof"><span>PROOF WORKSPACE</span><span>LEDGER</span></a></div></details>`;
}

const navigationPolishScript = `<script id="omegaNavigationPolishR214Runtime">(()=>{const menu=document.getElementById('omegaR214ControlMenu');if(!menu)return;const links=Array.from(menu.querySelectorAll('.r214SubLink'));const here=new URL(location.href);let matched=false;for(const link of links){const u=new URL(link.href,location.origin);const pathMatch=u.pathname==='/'?here.pathname==='/':here.pathname===u.pathname||here.pathname.startsWith(u.pathname+'/');const appMatch=!u.searchParams.get('app')||here.searchParams.get('app')===u.searchParams.get('app');const on=pathMatch&&appMatch;if(on){link.classList.add('current');link.setAttribute('aria-current','page');matched=true}}if(matched)menu.open=true;menu.addEventListener('toggle',()=>{if(menu.open&&innerWidth>760&&!document.body.classList.contains('r193Expanded')){document.body.classList.add('r193Expanded');try{localStorage.setItem('omega_r193_expanded','1')}catch{}}});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.open&&!document.getElementById('omegaR193Palette')?.classList.contains('open'))menu.open=false})})();</script>`;

export async function enhanceOneSystemNavigationR195(response: Response, pathname: string): Promise<Response> {
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;
  let html = await response.text();

  if (html.includes('id="omegaR193Rail"') && !html.includes('data-r195-one-system="true"')) {
    const active = pathname === "/system" || pathname.startsWith("/system/") ? " active" : "";
    const item = `<a data-r195-one-system="true" data-predecessor="${EVIDENCE_PLANE_RELEASE_R194}" class="r193Item${active}" href="/system"><span class="r193Icon">Ω1</span><span class="r193Label"><b>ONE SYSTEM</b><small>Drive corpus · calculus · execution state · proof</small></span></a>`;
    html = html.replace('<section class="r193Section"><div class="r193SectionTitle"><span>SYSTEMS</span></div>', `<section class="r193Section"><div class="r193SectionTitle"><span>SYSTEMS</span></div>${item}`);
  }

  if (html.includes('id="omegaR193Rail"') && !html.includes('id="omegaR214ControlMenu"')) {
    const marker = '<section class="r193Section"><div class="r193SectionTitle"><span>GOVERNED MODES</span></div>';
    const advanced = `<section class="r193Section" data-r214-section="advanced"><div class="r193SectionTitle"><span>ADVANCED CONTROL</span></div>${controlSubmenuMarkup(pathname)}</section>`;
    html = html.replace(marker, `${advanced}${marker}`);
    html = html.includes("</head>") ? html.replace("</head>", navigationPolishStyle + "</head>") : navigationPolishStyle + html;
    html = html.includes("</body>") ? html.replace("</body>", navigationPolishScript + "</body>") : html + navigationPolishScript;
  }

  const active = pathname === "/system" || pathname.startsWith("/system/");
  if (active && !html.includes('id="omegaResidualRestorationR195Runtime"')) {
    html = html.includes("</head>") ? html.replace("</head>", residualStyle + "</head>") : residualStyle + html;
    html = html.includes("</body>") ? html.replace("</body>", residualScript + "</body>") : html + residualScript;
  }

  const headers = new Headers(response.headers);
  headers.set("cache-control", "no-store");
  headers.set("x-omega-one-system", ONE_SYSTEM_NAVIGATION_RELEASE_R195);
  headers.set("x-omega-one-system-correlation", ONE_SYSTEM_CORRELATION_RELEASE_R199);
  headers.set("x-omega-navigation-polish", NAVIGATION_POLISH_RELEASE_R214);
  const preserved = new Response(html, { status: response.status, statusText: response.statusText, headers });
  const reconstituted = await reconstituteOneSystemR199(preserved, pathname);
  const correlated = await correlateOneSystemTruthStripR199(reconstituted);
  const operated = await enhanceOneSystemOperatorSurfaceR199(correlated);
  return enhanceMissionSurfaceR200(operated);
}