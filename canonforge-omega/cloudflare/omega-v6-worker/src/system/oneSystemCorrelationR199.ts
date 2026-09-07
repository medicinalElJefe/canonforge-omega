export const ONE_SYSTEM_CORRELATION_RELEASE_R199 = "r199-one-system-reconstitution";

export const OMEGA_MASTER_MENUS_R199 = [
  { id: "MENU-01", label: "LAUNCH", href: "/?app=Field", role: "Enter the living field and current canonical operation", domains: ["FIELD", "WORKSPACE", "CANON"], state: "BOUND" },
  { id: "MENU-02", label: "HOST INTAKE", href: "/?app=Hybrid", role: "Observe and bind cloud / PC / device execution authority", domains: ["HYBRID", "FIELD", "EARTH"], state: "BOUND" },
  { id: "MENU-03", label: "STATE MANIFOLD", href: "/workbench", role: "Canonical packet, relation, memory and scar state", domains: ["CANON", "FIELD", "MEMORY", "SKINS"], state: "BOUND" },
  { id: "MENU-04", label: "20,736 EXPAND", href: "/?app=Field&shell=20736", role: "Address-resolution expansion without claiming physical dimension", domains: ["CALCULUS", "MODES", "VISUAL"], state: "BOUND" },
  { id: "MENU-05", label: "RENDERER", href: "/?app=Field", role: "Project the current state through the shared living field membrane", domains: ["VISUAL", "SKINS", "EARTH"], state: "BOUND" },
  { id: "MENU-06", label: "TRAVERSAL", href: "/?app=Calculus&mode=mode-188", role: "Traverse state / scale / relation using governed motion and routing", domains: ["CALCULUS", "MODES", "MOTION", "SWARM"], state: "BOUND" },
  { id: "MENU-07", label: "FORECAST", href: "/?app=Field&mode=forecast", role: "Bounded alternatives with observation and proof separation", domains: ["COMPUTE", "CALCULUS", "MEMORY"], state: "BOUND" },
  { id: "MENU-08", label: "PROOF", href: "/?app=Proof", role: "Receipts, validation, rollback and admission state", domains: ["EVIDENCE", "VALIDATE", "CROSS_RUNTIME", "RCWA", "RECOVERY", "CANON"], state: "BOUND" },
  { id: "MENU-09", label: "AUDIO", href: "#", role: "Audio / signal operator family from the established one-system ledger", domains: ["AUDIO"], state: "RESTORE_REQUIRED" },
  { id: "MENU-10", label: "AI ASSIST", href: "/?app=Assistant", role: "AI + SAI route-before-generation intelligence", domains: ["SAI", "DISCOVERY"], state: "BOUND" },
  { id: "MENU-11", label: "RECOVERY", href: "/system?focus=recovery", role: "Scar-aware restoration, archive recovery and source patching", domains: ["RECOVERY", "PATCH", "MEMORY"], state: "BOUND" },
  { id: "MENU-12", label: "PACKAGING", href: "/warp/build", role: "Governed build, successor, federation and release candidate path", domains: ["BUILD", "SUCCESSOR", "FEDERATION", "CLOUD172"], state: "BOUND" },
] as const;

export const OMEGA_CORRELATION_INVARIANTS_R199 = {
  authority: "ONE_HOSTSTATE_ONE_CANONSTATE_ONE_RENDER_AUTHORITY",
  flow: "OPERATOR_TO_CONTROL_TO_RUNTIME_TO_STATE_TO_RENDER_TO_RECEIPT_TO_PROOF",
  continuity: "PARTITION_TO_EXCHANGE_TRANSFORM_TO_INVARIANT_CARRY_TO_SCAR_CARRY_TO_RECONTEXTUALIZE_REPARTITION",
  executionTruth: "DISCOVERED_TO_AUTHORIZED_TO_AVAILABLE_TO_INVOKED_TO_RETURNED_TO_VERIFIED",
  renderLaw: "LIVE_FIELD_MEMBRANE_NOT_DECORATIVE_GRAPHICS",
  antiDrift: [
    "NO_ORPHAN_FEATURE",
    "NO_SHADOW_STATE_AUTHORITY",
    "NO_SECONDARY_SEMANTIC_ENGINE",
    "NO_FEATURE_SPECIFIC_GLOBAL_NAVIGATION",
    "NO_UNPROVEN_EXECUTION_PROMOTION",
    "NO_PHYSICAL_DIMENSION_CLAIM_FROM_ATLAS_RESOLUTION",
  ],
  knownGap: "MENU_09_AUDIO_HAS_ARCHIVE_AUTHORITY_BUT_NO_ADMITTED_CANONICAL_CLOUD_SURFACE",
} as const;

const shellStyle = `<style id="omegaOneSystemCorrelationR199Style">
:root{--r199bar:46px;--r199line:rgba(118,151,194,.24);--r199bg:rgba(3,7,12,.96);--r199panel:#07111b;--r199text:#edf3fb;--r199muted:#8297ae}
html{scroll-padding-top:calc(var(--r199bar) + 8px)!important}body{padding-left:0!important;padding-top:var(--r199bar)!important}
#omegaUniversalNavR192,#omegaR193Rail,#omegaR193Open,#omegaR193Command,#omegaR193Palette{display:none!important}
body.r193Expanded{padding-left:0!important}.top{top:var(--r199bar)!important}.nav{top:auto!important}
#omegaOneSystemR199{position:fixed;z-index:2147483644;inset:0 0 auto 0;height:var(--r199bar);display:flex;align-items:center;gap:8px;padding:6px 9px;border-bottom:1px solid var(--r199line);background:var(--r199bg);backdrop-filter:blur(20px);box-shadow:0 10px 34px rgba(0,0,0,.28);color:var(--r199text);font:700 10px/1.15 Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
#omegaOneSystemR199 *{box-sizing:border-box}.r199MenuBtn,.r199Command,.r199Chip{height:34px;border:1px solid #334c69;border-radius:9px;background:#0a1521;color:inherit}.r199MenuBtn,.r199Command{cursor:pointer;font:inherit}.r199MenuBtn{width:38px;font-size:17px}.r199Brand{display:flex;align-items:center;gap:8px;min-width:0}.r199Brand strong{font-size:15px;letter-spacing:.08em}.r199Brand small{display:block;color:var(--r199muted);font-size:8px;white-space:nowrap}.r199Active{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#aebfd3;margin-left:6px}.r199Status{margin-left:auto;display:flex;gap:5px;min-width:0}.r199Chip{display:flex;align-items:center;gap:5px;padding:0 8px;color:#91a4bb;white-space:nowrap}.r199Dot{width:6px;height:6px;border-radius:50%;background:#637489}.r199Dot.ok{background:#58d893;box-shadow:0 0 10px rgba(88,216,147,.45)}.r199Dot.warn{background:#e4c366}.r199Dot.bad{background:#e47474}.r199Command{padding:0 10px;white-space:nowrap}
#omegaR199Shade{position:fixed;z-index:2147483641;inset:var(--r199bar) 0 0 0;background:rgba(0,2,5,.58);backdrop-filter:blur(6px);opacity:0;pointer-events:none;transition:opacity .16s ease}body.r199Open #omegaR199Shade{opacity:1;pointer-events:auto}
#omegaR199Drawer{position:fixed;z-index:2147483643;left:0;top:var(--r199bar);bottom:0;width:min(390px,94vw);transform:translateX(-102%);transition:transform .18s ease;background:var(--r199bg);border-right:1px solid var(--r199line);box-shadow:24px 0 70px rgba(0,0,0,.5);color:var(--r199text);font:700 10px/1.2 Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;display:flex;flex-direction:column}body.r199Open #omegaR199Drawer{transform:translateX(0)}
.r199DrawerHead{padding:14px 14px 10px;border-bottom:1px solid var(--r199line)}.r199DrawerHead b{display:block;font-size:13px;letter-spacing:.11em}.r199DrawerHead small{display:block;margin-top:5px;color:var(--r199muted);font-size:8px}.r199Menus{padding:9px;display:grid;gap:5px;overflow:auto}.r199Menu{display:grid;grid-template-columns:35px 1fr auto;gap:9px;align-items:center;min-height:49px;padding:7px 8px;border:1px solid transparent;border-radius:10px;color:#bac9da;text-decoration:none;background:transparent}.r199Menu:hover,.r199Menu.active{background:#101e2e;border-color:#324c6b;color:white}.r199No{width:30px;height:30px;display:grid;place-items:center;border-radius:8px;background:#0c1926;color:#92a8c0;font:850 9px ui-monospace,monospace}.r199Menu b{display:block;font-size:10px;letter-spacing:.04em}.r199Menu small{display:block;margin-top:3px;color:#71869d;font-size:8px;font-weight:600}.r199State{font:800 7px ui-monospace,monospace;color:#62d59a}.r199State.gap{color:#e5c46b}.r199DrawerFoot{margin-top:auto;border-top:1px solid var(--r199line);padding:10px 12px;color:#7f94ab;font:700 8px/1.45 ui-monospace,monospace}.r199Gap{display:none;margin:0 9px 9px;padding:10px;border:1px solid #685c32;border-radius:10px;background:#191709;color:#dfc974}.r199Gap.show{display:block}
#omegaR199Correlation{position:fixed;z-index:2147483646;inset:0;display:none;place-items:center;padding:18px;background:rgba(0,2,5,.76);backdrop-filter:blur(12px)}#omegaR199Correlation.open{display:grid}.r199CorrelationBox{width:min(920px,100%);max-height:86vh;overflow:auto;border:1px solid #39516f;border-radius:16px;background:#07111b;color:#eaf2fb;box-shadow:0 35px 120px #000c;padding:14px;font:700 10px/1.4 Inter,system-ui}.r199CorrelationBox header{display:flex;align-items:center;justify-content:space-between;gap:12px}.r199CorrelationBox h2{font-size:14px;margin:0;letter-spacing:.08em}.r199Close{border:1px solid #38516f;border-radius:8px;background:#0c1825;color:#fff;padding:8px 10px;cursor:pointer}.r199Flow{margin:12px 0;padding:10px;border:1px solid #2b435e;border-radius:10px;background:#091520;font:800 9px ui-monospace,monospace}.r199Matrix{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.r199MatrixRow{padding:9px;border:1px solid #273e58;border-radius:9px;background:#08131e}.r199MatrixRow b{display:block}.r199MatrixRow small{display:block;color:#8094aa;margin-top:4px}.r199MatrixRow code{display:block;color:#9eb4ca;margin-top:5px;white-space:normal;font-size:8px}
@media(max-width:760px){:root{--r199bar:44px}#omegaOneSystemR199{padding:5px 6px}.r199Brand small,.r199Chip span,.r199Active{display:none}.r199Brand strong{font-size:13px}.r199Chip{padding:0 7px}.r199Command{padding:0 8px}.r199Matrix{grid-template-columns:1fr}.top{top:var(--r199bar)!important}}
@media(prefers-reduced-motion:reduce){#omegaR199Drawer,#omegaR199Shade{transition:none!important}}
</style>`;

function esc(value: string): string {
  return value.replace(/[&<>\"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;" }[ch] || ch));
}

function menuMarkup(): string {
  return OMEGA_MASTER_MENUS_R199.map((menu, index) => `<a class="r199Menu" data-r199-menu="${menu.id}" data-r199-state="${menu.state}" href="${menu.href}"><span class="r199No">${String(index + 1).padStart(2, "0")}</span><span><b>${menu.label}</b><small>${esc(menu.role)}</small></span><span class="r199State ${menu.state === "BOUND" ? "" : "gap"}">${menu.state === "BOUND" ? "BOUND" : "RESTORE"}</span></a>`).join("");
}

function matrixMarkup(): string {
  return OMEGA_MASTER_MENUS_R199.map((menu) => `<div class="r199MatrixRow"><b>${menu.id} · ${menu.label}</b><small>${esc(menu.role)}</small><code>${menu.domains.join(" · ")}</code></div>`).join("");
}

const shellMarkup = `<div id="omegaOneSystemR199" data-r199-one-system="true"><button class="r199MenuBtn" id="r199MenuBtn" type="button" aria-label="Open OMEGA operator">Ω</button><div class="r199Brand"><div><strong>OMEGA · ONE SYSTEM</strong><small>STATE → RUNTIME → RENDER → RECEIPT → PROOF</small></div></div><div class="r199Active" id="r199Active">CORRELATING CURRENT DOMAIN</div><div class="r199Status"><div class="r199Chip"><i class="r199Dot" id="r199V6Dot"></i><span>V6</span></div><div class="r199Chip"><i class="r199Dot" id="r199PcDot"></i><span>PC</span></div><div class="r199Chip"><i class="r199Dot" id="r199ProofDot"></i><span>PROOF</span></div></div><button class="r199Command" id="r199CorrelationBtn" type="button">CORRELATION</button></div><div id="omegaR199Shade"></div><aside id="omegaR199Drawer" aria-label="OMEGA 12-function operator"><div class="r199DrawerHead"><b>12-FUNCTION OPERATOR</b><small>ONE AUTHORITY · ONE FIELD · DOMAIN PROJECTIONS, NOT SEPARATE APPLICATIONS</small></div><div class="r199Menus">${menuMarkup()}</div><div class="r199Gap" id="r199Gap">AUDIO is present in the established one-system ledger but does not yet have an admitted canonical cloud execution surface. It remains visible as a restoration obligation instead of being faked.</div><div class="r199DrawerFoot">ONE HOSTSTATE / ONE CANONSTATE / ONE RENDER AUTHORITY<br>RETURNED ≠ VERIFIED · PROOF CONTROLS ADMISSION</div></aside><div id="omegaR199Correlation"><div class="r199CorrelationBox"><header><h2>ONE-SYSTEM CORRELATION</h2><button class="r199Close" id="r199CorrelationClose" type="button">CLOSE</button></header><div class="r199Flow">OPERATOR → CONTROL → RUNTIME → STATE → RENDER → RECEIPT → PROOF → ADMISSION</div><div class="r199Matrix">${matrixMarkup()}</div></div></div>`;

const shellScript = `<script id="omegaOneSystemCorrelationR199Runtime">(()=>{
const body=document.body,$=s=>document.querySelector(s),all=s=>Array.from(document.querySelectorAll(s));if(!body||!$('#omegaOneSystemR199'))return;
const params=new URLSearchParams(location.search),app=(params.get('app')||'').toUpperCase(),path=location.pathname.toUpperCase();
const rules=[['MENU-02',app==='HYBRID'],['MENU-03',path.startsWith('/WORKBENCH')||path.startsWith('/RELATIONS')||app==='MEMORY'],['MENU-04',params.get('shell')==='20736'],['MENU-06',app==='CALCULUS'||params.get('mode')==='mode-188'],['MENU-07',params.get('mode')==='forecast'||path.startsWith('/CALIBRATION')],['MENU-08',app==='PROOF'||path.startsWith('/VALIDATE')||path==='/TRUTH'],['MENU-10',app==='ASSISTANT'||path.startsWith('/SAI')],['MENU-11',path.startsWith('/SYSTEM')&&params.get('focus')==='recovery'],['MENU-12',path.startsWith('/WARP/BUILD')],['MENU-01',app==='FIELD'||(!app&&path==='/')]];
const active=(rules.find(x=>x[1])||['MENU-01'])[0];all('.r199Menu').forEach(el=>el.classList.toggle('active',el.dataset.r199Menu===active));const activeEl=$('.r199Menu.active b');if(activeEl)$('#r199Active').textContent=activeEl.textContent;
const open=on=>{body.classList.toggle('r199Open',on);$('#r199MenuBtn')?.setAttribute('aria-expanded',String(on))};$('#r199MenuBtn')?.addEventListener('click',()=>open(!body.classList.contains('r199Open')));$('#omegaR199Shade')?.addEventListener('click',()=>open(false));document.addEventListener('keydown',e=>{if(e.key==='Escape'){open(false);$('#omegaR199Correlation')?.classList.remove('open')}});
all('.r199Menu[data-r199-state="RESTORE_REQUIRED"]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();$('#r199Gap')?.classList.add('show')}));
$('#r199CorrelationBtn')?.addEventListener('click',()=>$('#omegaR199Correlation')?.classList.add('open'));$('#r199CorrelationClose')?.addEventListener('click',()=>$('#omegaR199Correlation')?.classList.remove('open'));$('#omegaR199Correlation')?.addEventListener('click',e=>{if(e.target===e.currentTarget)e.currentTarget.classList.remove('open')});
function dot(id,state){const d=$(id);if(!d)return;d.className='r199Dot '+state}
async function probe(url,id,truth){try{const r=await fetch(url,{cache:'no-store',headers:{accept:'application/json'}});let d=null;try{d=await r.clone().json()}catch{}dot(id,r.ok&&(truth?truth(d):true)?'ok':r.status===503?'warn':'bad');return d}catch{dot(id,'bad');return null}}
probe('/truth','#r199V6Dot');probe('/api/heartbeat/status','#r199PcDot',d=>Boolean(d?.online||d?.authenticated||d?.pc_online||d?.status==='ONLINE')).then(d=>{if(!d)probe('/api/hybrid/status','#r199PcDot',x=>Boolean(x?.online||x?.authenticated||x?.pc_online||x?.status==='ONLINE'))});probe('/api/system/r195/restoration?limit=1','#r199ProofDot',d=>Boolean(d&&((d.residual?.unresolved===0)||(d.cohortProof?.ready>0))));
})();</script>`;

export async function reconstituteOneSystemR199(response: Response, _pathname: string): Promise<Response> {
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;
  let html = await response.text();
  if (!/<body[\s>]/i.test(html)) return new Response(html, { status: response.status, statusText: response.statusText, headers: response.headers });
  if (!html.includes('id="omegaOneSystemR199"')) {
    html = html.includes("</head>") ? html.replace("</head>", shellStyle + "</head>") : shellStyle + html;
    html = html.replace(/<body([^>]*)>/i, `<body$1>${shellMarkup}`);
    html = html.includes("</body>") ? html.replace("</body>", shellScript + "</body>") : html + shellScript;
  }
  const headers = new Headers(response.headers);
  headers.set("cache-control", "no-store");
  headers.set("x-omega-system-correlation", ONE_SYSTEM_CORRELATION_RELEASE_R199);
  headers.set("x-omega-render-authority", "one-system-hoststate-projection");
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
