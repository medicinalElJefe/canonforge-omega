export const UNIVERSAL_WORKSPACE_RELEASE_R193 = "r193-full-restoration-workspace";

const WORKSPACES = [
  ["FIELD", "/?app=Field", "F", "Living governed field"],
  ["CALCULUS", "/?app=Calculus&mode=dewey-calculus", "∂", "Trajectory / curvature / sensitivity"],
  ["MEMORY", "/?app=Memory", "M", "Continuity + scar graph"],
  ["SIMULATE", "/?app=Simulate", "S", "Create / branch / compare"],
  ["EARTH", "/?app=Earth", "E", "Observed Earth + derived layers"],
  ["ASSISTANT", "/?app=Assistant", "A", "Route-before-generation intelligence"],
  ["HYBRID", "/?app=Hybrid", "H", "Sovereign PC / execution"],
  ["PROOF", "/?app=Proof", "P", "Evidence / rollback"],
] as const;

const SYSTEMS = [
  ["STATE", "/workbench", "Canonical packet / state workbench"],
  ["RELATION", "/relations", "Relational graph and skin"],
  ["FORECAST", "/calibration", "Calibration / ablation / forecast proof"],
  ["CAPABILITIES", "/capabilities", "Capability genome / route inspector"],
  ["CORE", "/core", "Direct operational core"],
  ["SAI", "/sai", "SAI / B059 / hybrid intelligence"],
  ["COMPUTE", "/compute", "Reference + atlas computation"],
  ["VALIDATE", "/validate", "Validation fabric"],
  ["CROSS-RUNTIME", "/validate/cross-runtime", "Cross-runtime parity"],
  ["INDEPENDENT", "/validate/independent", "Independent solver validation"],
  ["CLOUDS", "/clouds", "172-node cloud federation"],
  ["WARP", "/warp", "Warp computation"],
  ["BUILD", "/warp/build", "Governed build candidates"],
  ["FEDERATION", "/federation", "Federated organ workspace"],
  ["EVOLUTION", "/evolution", "Governed development mesh"],
  ["TRUTH", "/truth", "Capability truth / acceptance"],
  ["CONVERGENCE", "/convergence", "Role-separated convergence"],
  ["FABRIC", "/fabric", "Universal surface fabric"],
  ["INSTRUMENT", "/instrument", "Whole cumulative instrument"],
] as const;

const MODES = [
  ["full-overall-canon", "FULL CANON", "constitutional synthesis + admissibility"],
  ["mode-188", "MODE 188", "prune / dispatch / contradiction audit"],
  ["unified-coherence", "COHERENCE", "relation consistency + contradiction"],
  ["forecast", "FORECAST", "bounded future alternatives"],
  ["full-sphere", "FULL SPHERE", "recursive multi-perspective shell"],
  ["relational-skin", "SKIN", "boundary / scar / continuity shaping"],
  ["dewey-calculus", "CALCULUS", "trajectory / curvature / sensitivity"],
  ["unified-recursion", "RECURSION", "parent-child continuity hierarchy"],
  ["deep-mother", "RECOVERY", "recoverability + continuity weighting"],
  ["high-father", "CONSTRAINT", "boundary + law weighting"],
  ["heavy-prune", "PRUNE", "constraint removal / simplification"],
  ["alpha", "ALPHA", "exploration / plasticity emphasis"],
  ["crimson", "CRIMSON", "construction / consequence emphasis"],
  ["no-nothing-truth", "TRUTH", "evidence / contradiction exposure"],
  ["guidance-field", "GUIDANCE", "bounded directional projection"],
] as const;

const style = `<style id="omegaUniversalWorkspaceR193Style">
:root{--r192h:0px!important;--r193rail:52px;--r193wide:304px;--r193bg:rgba(3,7,12,.965);--r193line:rgba(114,146,190,.24);--r193text:#e9f1fb;--r193muted:#8093aa}
html{scroll-padding-top:8px}body{padding-top:0!important;padding-left:var(--r193rail)!important;transition:padding-left .2s ease}.top{top:0!important}#omegaUniversalNavR192{display:none!important}
#omegaR193Rail{position:fixed;z-index:2147483640;inset:0 auto 0 0;width:var(--r193rail);display:flex;flex-direction:column;background:var(--r193bg);border-right:1px solid var(--r193line);backdrop-filter:blur(24px) saturate(1.15);box-shadow:16px 0 55px rgba(0,0,0,.28);overflow:hidden;transition:width .2s ease;color:var(--r193text);font:700 11px/1.2 Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
body.r193Expanded{padding-left:var(--r193wide)!important}body.r193Expanded #omegaR193Rail{width:var(--r193wide)}#omegaR193Rail *{box-sizing:border-box}#omegaR193Rail a{color:inherit;text-decoration:none}
.r193Head{height:54px;display:flex;align-items:center;gap:10px;flex:0 0 auto;border-bottom:1px solid var(--r193line);padding:7px}.r193Omega,.r193Toggle{width:38px;height:38px;display:grid;place-items:center;border:1px solid #38506e;border-radius:11px;background:#0a1420;color:#fff;cursor:pointer;flex:0 0 auto}.r193Omega{font-size:20px;font-weight:950}.r193HeadText{min-width:0;opacity:0;transition:opacity .12s}.r193HeadText b{display:block;letter-spacing:.12em}.r193HeadText small{display:block;margin-top:3px;color:var(--r193muted);white-space:nowrap}.r193Toggle{margin-left:auto;font-size:15px;display:none}
body.r193Expanded .r193HeadText{opacity:1}body.r193Expanded .r193Toggle{display:grid}
.r193Scroll{flex:1;overflow:auto;overflow-x:hidden;padding:7px;scrollbar-width:thin}.r193Section{margin:4px 0 11px}.r193SectionTitle{height:24px;display:flex;align-items:center;color:#60758e;font-size:8px;letter-spacing:.14em;padding:0 8px;white-space:nowrap;overflow:hidden}.r193SectionTitle span{opacity:0}body.r193Expanded .r193SectionTitle span{opacity:1}
.r193Item{height:40px;display:flex;align-items:center;gap:10px;border:1px solid transparent;border-radius:10px;padding:0 7px;margin:2px 0;color:#aab9cb!important;white-space:nowrap;overflow:hidden}.r193Item:hover,.r193Item.active{background:#101c2b;border-color:#314a68;color:#fff!important}.r193Icon{width:25px;height:25px;display:grid;place-items:center;flex:0 0 25px;border-radius:7px;background:#0c1723;color:#9cb2cb;font:850 10px ui-monospace,monospace}.r193Label{min-width:0;opacity:0}.r193Label b{display:block;font-size:10px;letter-spacing:.045em}.r193Label small{display:block;margin-top:2px;color:#6f849c;font-size:8px;font-weight:650;overflow:hidden;text-overflow:ellipsis}.r193Item:hover .r193Icon,.r193Item.active .r193Icon{background:#172b43;color:#fff}body.r193Expanded .r193Label{opacity:1}
.r193Mode{height:auto;min-height:42px}.r193Mode .r193Icon{font-size:8px}.r193Mode.active{box-shadow:inset 3px 0 #e2c36f}
.r193Shells{display:flex;gap:5px;padding:4px 3px 2px;opacity:0;pointer-events:none}body.r193Expanded .r193Shells{opacity:1;pointer-events:auto}.r193Shell{flex:1;border:1px solid #2b405c;border-radius:8px;background:#09131e;color:#94a9c0;padding:7px 4px;cursor:pointer;font:800 9px ui-monospace,monospace}.r193Shell:hover{background:#132239;color:white}
.r193Foot{flex:0 0 auto;padding:7px;border-top:1px solid var(--r193line)}.r193Status{display:grid;gap:4px}.r193StatusRow{height:28px;display:flex;align-items:center;gap:9px;padding:0 7px;border-radius:8px;background:#07111a;overflow:hidden}.r193Dot{width:7px;height:7px;border-radius:50%;background:#59697e;flex:0 0 auto}.r193Dot.ok{background:#58d893;box-shadow:0 0 13px rgba(88,216,147,.55)}.r193Dot.warn{background:#e5c667}.r193StatusRow span:last-child{opacity:0;white-space:nowrap;color:#91a4bb;font-size:8px}body.r193Expanded .r193StatusRow span:last-child{opacity:1}
#omegaR193Open{position:fixed;z-index:2147483641;left:7px;top:8px;width:38px;height:38px;border:1px solid #38506e;border-radius:11px;background:#0a1420;color:#fff;cursor:pointer;display:grid;place-items:center;font-weight:900}body:not(.r193Expanded) #omegaR193Open{display:grid}body.r193Expanded #omegaR193Open{display:none}
#omegaR193Palette{position:fixed;z-index:2147483645;inset:0;display:none;place-items:start center;padding:10vh 16px;background:rgba(0,2,5,.72);backdrop-filter:blur(14px)}#omegaR193Palette.open{display:grid}.r193PaletteBox{width:min(780px,100%);border:1px solid #38516f;border-radius:18px;background:#07101a;box-shadow:0 35px 120px #000c;overflow:hidden}.r193PaletteBox input{width:100%;border:0;border-bottom:1px solid #263c56;background:#0b1622;color:#fff;padding:16px 18px;outline:0;font:700 14px system-ui}.r193Results{padding:7px;max-height:62vh;overflow:auto}.r193Result{width:100%;display:flex;justify-content:space-between;gap:14px;border:0;border-radius:11px;background:transparent;color:#dce7f4;padding:11px 12px;text-align:left;cursor:pointer}.r193Result:hover,.r193Result.active{background:#122239}.r193Result small{color:#71869f}
.r193Shortcut{position:fixed;right:12px;bottom:12px;z-index:2147483630;border:1px solid #36506e;border-radius:11px;background:#09131f;color:#b7c7d9;padding:8px 10px;cursor:pointer;font:800 9px ui-monospace,monospace;box-shadow:0 12px 36px #0007}
@media(max-width:760px){:root{--r193rail:0px}body{padding-left:0!important;padding-top:46px!important}body.r193Expanded{padding-left:0!important}#omegaR193Rail{inset:0 0 auto 0;width:100%!important;height:46px;overflow:visible;border-right:0;border-bottom:1px solid var(--r193line)}.r193Head{height:46px;padding:4px 7px}.r193Omega{width:36px;height:36px}.r193HeadText{opacity:1;flex:1}.r193HeadText small{display:none}.r193Toggle{display:grid;width:36px;height:36px}.r193Scroll,.r193Foot{position:fixed;left:0;right:0;top:46px;bottom:0;background:rgba(3,7,12,.985);display:none}.r193Scroll{padding:10px 9px 100px;overflow:auto}.r193Foot{top:auto;height:92px;z-index:2;border-top:1px solid var(--r193line)}body.r193Expanded .r193Scroll,body.r193Expanded .r193Foot{display:block}.r193SectionTitle span,.r193Label,.r193StatusRow span:last-child{opacity:1}.r193Item{height:48px}.r193Shells{opacity:1;pointer-events:auto}.r193Shortcut{bottom:max(8px,env(safe-area-inset-bottom));right:8px}.top{top:46px!important}.nav{top:154px!important}}
@media(prefers-reduced-motion:reduce){body,#omegaR193Rail,.r193HeadText{transition:none!important}}
</style>`;

function item(label: string, href: string, icon: string, detail: string, extra = ""): string {
  return `<a class="r193Item ${extra}" href="${href}"><span class="r193Icon">${icon}</span><span class="r193Label"><b>${label}</b><small>${detail}</small></span></a>`;
}

function railMarkup(): string {
  const workspaces = WORKSPACES.map(([label, href, icon, detail]) => item(label, href, icon, detail)).join("");
  const systems = SYSTEMS.map(([label, href, detail], i) => item(label, href, String(i + 1).padStart(2, "0"), detail)).join("");
  const modes = MODES.map(([id, label, detail], i) => item(label, `/?app=Field&mode=${encodeURIComponent(id)}`, String(i + 1).padStart(2, "0"), detail, "r193Mode")).join("");
  return `<aside id="omegaR193Rail" aria-label="OMEGA complete system navigation"><div class="r193Head"><a class="r193Omega" href="/" aria-label="OMEGA home">Ω</a><div class="r193HeadText"><b>OMEGA V6</b><small>R193 · COMPLETE WORKSPACE</small></div><button class="r193Toggle" id="r193Collapse" aria-label="Collapse system rail">‹</button></div><div class="r193Scroll"><section class="r193Section"><div class="r193SectionTitle"><span>OPERATE</span></div>${workspaces}</section><section class="r193Section"><div class="r193SectionTitle"><span>SYSTEMS</span></div>${systems}</section><section class="r193Section"><div class="r193SectionTitle"><span>GOVERNED MODES</span></div>${modes}</section><section class="r193Section"><div class="r193SectionTitle"><span>ATLAS SHELL</span></div><div class="r193Shells"><button class="r193Shell" data-r193-shell="144">144</button><button class="r193Shell" data-r193-shell="1728">1,728</button><button class="r193Shell" data-r193-shell="20736">20,736</button></div></section></div><div class="r193Foot"><div class="r193Status"><div class="r193StatusRow"><span id="r193V6Dot" class="r193Dot"></span><span>V6 <b id="r193V6">PROBING</b></span></div><div class="r193StatusRow"><span id="r193GenesisDot" class="r193Dot"></span><span>GENESIS <b id="r193Genesis">PROBING</b></span></div><div class="r193StatusRow"><span id="r193PcDot" class="r193Dot"></span><span>PC <b id="r193Pc">UNPROVEN</b></span></div></div></div></aside><button id="omegaR193Open" aria-label="Open OMEGA system rail">Ω</button><button class="r193Shortcut" id="omegaR193Command">⌘K · COMMAND</button>`;
}

function paletteMarkup(): string {
  return `<div id="omegaR193Palette" aria-hidden="true"><div class="r193PaletteBox"><input id="r193Query" placeholder="Search workspaces, systems, modes…" autocomplete="off"><div class="r193Results" id="r193Results"></div></div></div>`;
}

const script = `<script id="omegaUniversalWorkspaceR193Runtime">(()=>{
const body=document.body,$=s=>document.querySelector(s),all=s=>Array.from(document.querySelectorAll(s));
const workspace=${JSON.stringify(WORKSPACES)};const systems=${JSON.stringify(SYSTEMS)};const modes=${JSON.stringify(MODES)};
const entries=[...workspace.map(x=>({label:x[0],href:x[1],detail:x[3],kind:'WORKSPACE'})),...systems.map(x=>({label:x[0],href:x[1],detail:x[2],kind:'SYSTEM'})),...modes.map(x=>({label:x[1],href:'/?app=Field&mode='+encodeURIComponent(x[0]),detail:x[2],kind:'MODE'}))];
function setExpanded(on){body.classList.toggle('r193Expanded',on);try{localStorage.setItem('omega_r193_expanded',on?'1':'0')}catch{}}
try{if(localStorage.getItem('omega_r193_expanded')==='1'&&innerWidth>760)setExpanded(true)}catch{}
$('#omegaR193Open')?.addEventListener('click',()=>setExpanded(true));$('#r193Collapse')?.addEventListener('click',()=>setExpanded(false));
function routeApp(name){const candidates=[...all('[data-dock-app]'),...all('[data-app]'),...all('[data-open-app]')];const el=candidates.find(x=>x.dataset.dockApp===name||x.dataset.app===name||x.dataset.openApp===name);if(el){el.click();return true}return false}
function applyShell(value){const buttons=[...all('[data-shell]'),...all('[data-omega-shell]')];const b=buttons.find(x=>String(x.dataset.shell||x.dataset.omegaShell)===String(value));if(b){b.click();return true}return false}
function applyMode(id){const b=all('[data-gma-mode]').find(x=>x.dataset.gmaMode===id);if(b){b.click();return true}return false}
function honorDeepLink(){if(location.pathname!=='/'&&location.pathname!=='')return;const p=new URLSearchParams(location.search),app=p.get('app'),mode=p.get('mode'),shell=p.get('shell');if(app)routeApp(app);if(mode&&!applyMode(mode)){let tries=0;const timer=setInterval(()=>{tries++;if(applyMode(mode)||tries>12)clearInterval(timer)},180)}if(shell&&!applyShell(shell)){let tries=0;const timer=setInterval(()=>{tries++;if(applyShell(shell)||tries>12)clearInterval(timer)},180)}}
honorDeepLink();
all('[data-r193-shell]').forEach(b=>b.addEventListener('click',()=>{const shell=b.dataset.r193Shell;if(location.pathname==='/'||location.pathname===''){routeApp('Field');applyShell(shell)}else location.href='/?app=Field&shell='+encodeURIComponent(shell)}));
function render(term=''){const q=term.trim().toLowerCase(),box=$('#r193Results');if(!box)return;const shown=entries.filter(x=>!q||[x.label,x.detail,x.kind].join(' ').toLowerCase().includes(q)).slice(0,40);box.innerHTML=shown.map((x,i)=>'<button class="r193Result'+(i===0?' active':'')+'" data-r193-href="'+x.href.replace(/&/g,'&amp;')+'"><span><b>'+x.label+'</b><br><small>'+x.detail+'</small></span><small>'+x.kind+'</small></button>').join('');all('[data-r193-href]').forEach(b=>b.onclick=()=>location.href=b.dataset.r193Href)}
function openPalette(){render('');const p=$('#omegaR193Palette');p?.classList.add('open');p?.setAttribute('aria-hidden','false');setTimeout(()=>$('#r193Query')?.focus(),0)}function closePalette(){const p=$('#omegaR193Palette');p?.classList.remove('open');p?.setAttribute('aria-hidden','true')}
$('#omegaR193Command')?.addEventListener('click',openPalette);$('#r193Query')?.addEventListener('input',e=>render(e.target.value));$('#omegaR193Palette')?.addEventListener('click',e=>{if(e.target.id==='omegaR193Palette')closePalette()});
addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openPalette()}if(e.key==='Escape'){closePalette();if(innerWidth<=760)setExpanded(false)}if(e.key==='Enter'&&$('#omegaR193Palette')?.classList.contains('open')){const hit=$('.r193Result.active')||$('.r193Result');if(hit)location.href=hit.dataset.r193Href}});
function markActive(){const here=location.pathname+location.search;all('#omegaR193Rail .r193Item').forEach(a=>{const u=new URL(a.href,location.origin);let on=false;if(location.pathname==='/'&&u.pathname==='/'&&u.search){const q=new URLSearchParams(location.search),t=new URLSearchParams(u.search);on=(!t.get('app')||q.get('app')===t.get('app'))&&(!t.get('mode')||q.get('mode')===t.get('mode'))}else on=u.pathname!=='/'&&(location.pathname===u.pathname||location.pathname.startsWith(u.pathname+'/'));a.classList.toggle('active',on)})}markActive();
async function j(path){try{const r=await fetch(path,{cache:'no-store',headers:{accept:'application/json'}});return r.ok?await r.json():null}catch{return null}}
async function status(){const edge=await j('/api/convergence/edge'),pc=edge?.topology?.sovereign_pc||{},v6=Boolean(edge?.topology?.v6?.edge?.reachable),gen=Boolean(edge?.topology?.genesis?.edge?.reachable);const v=$('#r193V6'),g=$('#r193Genesis'),p=$('#r193Pc');if(v)v.textContent=v6?'LIVE':'DEGRADED';if(g)g.textContent=gen?'LIVE':'DEGRADED';if(p)p.textContent=pc.pc_online?'ONLINE':pc.heartbeat_current?'HEARTBEAT':'UNPROVEN';$('#r193V6Dot')?.classList.toggle('ok',v6);$('#r193V6Dot')?.classList.toggle('warn',!v6);$('#r193GenesisDot')?.classList.toggle('ok',gen);$('#r193GenesisDot')?.classList.toggle('warn',!gen);$('#r193PcDot')?.classList.toggle('ok',Boolean(pc.pc_online));$('#r193PcDot')?.classList.toggle('warn',!pc.pc_online)}status();setInterval(status,20000);
})();</script>`;

function stripLegacyFloaters(html: string): string {
  return html.replace(/<a href="\/(?:capabilities|workbench|relations|memory|calibration)" style="position:fixed;right:14px;bottom:\d+px;z-index:9999">[^<]+<\/a>/g, "");
}

export async function enhanceUniversalWorkspaceR193(response: Response, pathname: string): Promise<Response> {
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;
  let html = await response.text();
  if (!/<body[\s>]/i.test(html) || html.includes('id="omegaR193Rail"')) return new Response(html, { status: response.status, statusText: response.statusText, headers: response.headers });
  html = stripLegacyFloaters(html);
  html = html.includes("</head>") ? html.replace("</head>", style + "</head>") : style + html;
  html = html.replace(/<body([^>]*)>/i, `<body$1>${railMarkup()}${paletteMarkup()}`);
  html = html.includes("</body>") ? html.replace("</body>", script + "</body>") : html + script;
  const headers = new Headers(response.headers);
  headers.set("cache-control", "no-store");
  headers.set("x-omega-workspace", UNIVERSAL_WORKSPACE_RELEASE_R193);
  headers.set("x-omega-workspace-path", pathname);
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
