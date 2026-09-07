import { EVIDENCE_PLANE_RELEASE_R194 } from "../evidencePlaneR194";
import { reconstituteOneSystemR199, ONE_SYSTEM_CORRELATION_RELEASE_R199 } from "./oneSystemCorrelationR199";
import { correlateOneSystemTruthStripR199 } from "./oneSystemTruthStripR199";
import { enhanceOneSystemOperatorSurfaceR199 } from "./oneSystemOperatorSurfaceR199";
import { enhanceMissionSurfaceR200 } from "./missionSurfaceR200";

export const ONE_SYSTEM_NAVIGATION_RELEASE_R195 = "r195-drive-corpus-one-system";

const residualStyle = `<style id="omegaResidualRestorationR195Style">
#r195ResidualCard{grid-column:1/-1}.r195ResidualHead{display:flex;justify-content:space-between;gap:12px;align-items:flex-end;flex-wrap:wrap}.r195ResidualMetrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}.r195ResidualMetric{padding:10px;border:1px solid var(--l,#2b4058);border-radius:9px;background:#07111a}.r195ResidualMetric b{display:block;font-size:22px}.r195ResidualRows{display:grid;gap:6px;max-height:420px;overflow:auto}.r195ResidualRow{display:grid;grid-template-columns:minmax(160px,1.5fr) minmax(180px,1fr) minmax(140px,.8fr);gap:8px;padding:9px;border:1px solid var(--l,#2b4058);border-radius:9px;background:#071019}.r195ResidualRow code{font-size:10px;white-space:normal}.r195ResidualState{font-weight:800}.r195ResidualState[data-severity="5"]{color:#ff8585}.r195ResidualState[data-severity="4"]{color:#e7c96e}.r195ResidualState[data-severity="3"]{color:#8bd8ff}@media(max-width:850px){.r195ResidualMetrics{grid-template-columns:1fr 1fr}.r195ResidualRow{grid-template-columns:1fr}}
</style>`;

const residualScript = `<script id="omegaResidualRestorationR195Runtime">(()=>{
if(location.pathname!='/system'&&location.pathname!='/system/')return;const grid=document.querySelector('.grid');if(!grid||document.getElementById('r195ResidualCard'))return;
const card=document.createElement('div');card.id='r195ResidualCard';card.className='card full';card.innerHTML='<div class="r195ResidualHead"><div><b>RESIDUAL RESTORATION / WEAKEST-LINK QUEUE</b><div class="muted">Artifact-level admission remains separate from menu-cohort reachability.</div></div><button class="btn" id="r195ResidualRefresh">REFRESH PROOF</button></div><div class="r195ResidualMetrics"><div class="r195ResidualMetric"><span class="muted">Artifacts</span><b id="r195ResidualTotal">—</b></div><div class="r195ResidualMetric"><span class="muted">Individually verified</span><b id="r195ResidualVerified">—</b></div><div class="r195ResidualMetric"><span class="muted">Unresolved</span><b id="r195ResidualOpen">—</b></div><div class="r195ResidualMetric"><span class="muted">Cohorts ready</span><b id="r195ResidualCohorts">—</b></div></div><div id="r195ResidualSummary" class="muted">Probing 12 master menu cohorts…</div><div id="r195ResidualRows" class="r195ResidualRows"></div>';
grid.appendChild(card);const esc=v=>String(v??'');
async function loadResidual(){const summary=document.getElementById('r195ResidualSummary'),rows=document.getElementById('r195ResidualRows');summary.textContent='Probing 12 master menu cohorts…';try{const r=await fetch('/api/system/r195/restoration?limit=24',{cache:'no-store',headers:{accept:'application/json'}}),d=await r.json();document.getElementById('r195ResidualTotal').textContent=String(d.totalArtifacts??'—');document.getElementById('r195ResidualVerified').textContent=String(d.individuallyVerifiedArtifacts??'—');document.getElementById('r195ResidualOpen').textContent=String(d.residual?.unresolved??'—');document.getElementById('r195ResidualCohorts').textContent=String(d.cohortProof?.ready??'—')+'/'+String(d.cohortProof?.total??'—');summary.textContent=(d.individuallyVerifiedBoundary||'')+' Admission: '+(d.admissionSequence||[]).join(' → ');rows.textContent='';for(const item of d.residual?.weakestFirst||[]){const el=document.createElement('div');el.className='r195ResidualRow';const a=document.createElement('div'),b=document.createElement('div'),c=document.createElement('div');const title=document.createElement('b');title.textContent=esc(item.id)+' · '+esc(item.artifact||item.family);const detail=document.createElement('div');detail.className='muted';detail.textContent=esc(item.family)+' · '+esc(item.menuId);a.append(title,detail);const state=document.createElement('div');state.className='r195ResidualState';state.dataset.severity=String(item.severity??'');state.textContent=esc(item.state);const cohort=document.createElement('div');cohort.className='muted';cohort.textContent=item.cohort?esc(item.cohort.proofClass)+' · '+(item.cohort.bodyOk?'COHORT READY':'COHORT DEGRADED'):'NO PROOF COHORT';b.append(state,cohort);const code=document.createElement('code');code.textContent=(item.requiredEvidence||[]).join(' → ');c.append(code);el.append(a,b,c);rows.appendChild(el)}}catch(e){summary.textContent='Residual planner unavailable: '+String(e);rows.textContent=''}}
document.getElementById('r195ResidualRefresh')?.addEventListener('click',loadResidual);loadResidual();})();</script>`;

export async function enhanceOneSystemNavigationR195(response: Response, pathname: string): Promise<Response> {
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;
  let html = await response.text();

  if (html.includes('id="omegaR193Rail"') && !html.includes('data-r195-one-system="true"')) {
    const active = pathname === "/system" || pathname.startsWith("/system/") ? " active" : "";
    const item = `<a data-r195-one-system="true" data-predecessor="${EVIDENCE_PLANE_RELEASE_R194}" class="r193Item${active}" href="/system"><span class="r193Icon">Ω1</span><span class="r193Label"><b>ONE SYSTEM</b><small>Drive corpus · calculus · execution state · proof</small></span></a>`;
    html = html.replace('<section class="r193Section"><div class="r193SectionTitle"><span>SYSTEMS</span></div>', `<section class="r193Section"><div class="r193SectionTitle"><span>SYSTEMS</span></div>${item}`);
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
  const preserved = new Response(html, { status: response.status, statusText: response.statusText, headers });
  const reconstituted = await reconstituteOneSystemR199(preserved, pathname);
  const correlated = await correlateOneSystemTruthStripR199(reconstituted);
  const operated = await enhanceOneSystemOperatorSurfaceR199(correlated);
  return enhanceMissionSurfaceR200(operated);
}