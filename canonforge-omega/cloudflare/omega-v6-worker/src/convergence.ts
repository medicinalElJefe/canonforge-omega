import base, { type Env } from "./index";
import { enhanceHdLaunchNavigation } from "./launchHdNavigation";
export { OmegaRuntime } from "./omegaRuntime";

const GENESIS = "https://omega-genesis-v1.jeffdeweyeljefe.workers.dev";

async function jsonFrom(response: Response): Promise<any> {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { ok: false, error: "non_json_response", status: response.status, body_preview: text.slice(0, 240) }; }
}

async function probe(url: string): Promise<any> {
  try {
    const response = await fetch(url, { headers: { accept: "application/json" } });
    const body = await jsonFrom(response);
    return { reachable: response.ok, status: response.status, body };
  } catch (error) {
    return { reachable: false, status: 0, error: String(error) };
  }
}

async function baseProbe(request: Request, env: Env, path: string): Promise<any> {
  try {
    const u = new URL(request.url); u.pathname = path; u.search = "";
    const response = await base.fetch(new Request(u.toString(), { method: "GET", headers: { accept: "application/json" } }), env);
    const body = await jsonFrom(response);
    return { reachable: response.ok, status: response.status, body };
  } catch (error) {
    return { reachable: false, status: 0, error: String(error) };
  }
}

async function convergenceSnapshot(request: Request, env: Env) {
  const [v6Edge, v6Hybrid, v6Development, genesisEdge, genesisHealth, genesisManifest, genesisCapabilities, genesisModes] = await Promise.all([
    baseProbe(request, env, "/_omega/health"),
    baseProbe(request, env, "/api/hybrid/status"),
    baseProbe(request, env, "/api/development/status"),
    probe(`${GENESIS}/_omega/health`),
    probe(`${GENESIS}/api/health`),
    probe(`${GENESIS}/api/convergence/manifest`),
    probe(`${GENESIS}/api/capabilities`),
    probe(`${GENESIS}/api/mode?id=ALL_MODES`),
  ]);
  const hb = v6Hybrid.body || {};
  const dev = v6Development.body || {};
  const caps = genesisCapabilities.body || {};
  const manifest = genesisManifest.body || {};
  const genome = manifest.capability_genome || {};
  return {
    ok: Boolean(v6Edge.reachable && genesisEdge.reachable),
    timestamp: new Date().toISOString(),
    topology: {
      v6: { role: "canonical operational runtime", url: "https://omegav6.jeffdeweyeljefe.workers.dev/", edge: v6Edge },
      genesis: { role: "discovery / archive recovery / candidate evolution", url: `${GENESIS}/`, edge: genesisEdge, health: genesisHealth },
      sovereign_pc: {
        role: "authenticated bounded high-compute executor",
        state: hb.state || "UNPROVEN",
        pc_online: Boolean(hb.pcOnline || hb.pc_online || hb.nativeExecutionClaimed),
        heartbeat_current: Boolean(hb.heartbeatCurrent),
        heartbeat_age_seconds: hb.heartbeatAgeSeconds ?? hb.heartbeat_age_seconds ?? null,
        sequence: hb.proof?.sequence ?? null,
        agent_id: hb.proof?.agent_id ?? null,
      },
    },
    development: {
      mode: dev.mode || dev.development?.mode || "UNKNOWN",
      active_job: dev.active_job || dev.development?.active_job || null,
      recent_jobs: (dev.recent_jobs || dev.development?.recent_jobs || []).slice(-8),
      validation_sequence: dev.validation_sequence || dev.development?.validation_sequence || [],
    },
    genesis: {
      capability_count: genome.capability_count ?? caps.count ?? (Array.isArray(caps.capabilities) ? caps.capabilities.length : null),
      acceptance_gates: genome.acceptance_gates || caps.acceptance_gates || [],
      menus: caps.menus || [],
      all_modes: genesisModes.body?.result || genesisModes.body || null,
      manifest: {
        reachable: genesisManifest.reachable,
        status: genesisManifest.status,
        schema: manifest.schema || null,
        digest: manifest.manifest_digest || null,
        capability_ids: genome.capability_ids || [],
        mode_count: genome.mode_count ?? null,
        promotion_boundary: manifest.promotion_boundary || null,
        dimensional_boundary: manifest.dimensional_boundary || null,
      },
    },
    convergence: {
      law: ["OBSERVE","INVENTORY","RELATE","PRUNE","TRANSLATE","PROVE","PLAN","BUILD","TEST","VISUAL_ACCEPTANCE","ADVERSARIAL_VERIFY","PROMOTE_OR_REJECT","OBSERVE_RESULT","UPDATE_STRATEGY_MEMORY"],
      operator_roles: ["ALPHA","BASE","CONSTRUCT","PRUNE","OMEGA"],
      donor_dispositions: ["KEEP","BIND","REIMPLEMENT","PRUNE","QUARANTINE"],
      dimensional_boundary: "144/1728/20736 are software/model/interface representation shells, not physical-dimension claims",
      promotion_boundary: "Genesis proposes and proves bounded candidates; V6 remains canonical operational authority; production promotion is separate from self-build execution.",
      reciprocal_manifest_ready: Boolean(genesisManifest.reachable && manifest.schema === "OMEGA_RECURSIVE_CONVERGENCE_MANIFEST_V2" && manifest.manifest_digest),
      genesis_manifest_digest: manifest.manifest_digest || null,
    },
  };
}

const page = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OMEGA · Unified Evolution</title><style>
:root{color-scheme:dark;--bg:#05070b;--panel:#0b111b;--line:#26354d;--text:#f4f7ff;--muted:#93a3ba;--a:#9b6cff;--b:#e6bd4e;--c:#ef625f;--p:#4f8fff;--o:#42cb7c;font:15px/1.45 Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 50% -20%,#1a2841,#080c13 35%,#05070b 70%);color:var(--text);min-height:100vh}.top{position:sticky;top:0;z-index:20;display:flex;justify-content:space-between;gap:20px;align-items:center;padding:15px 20px;background:#05070bdd;border-bottom:1px solid #202b3d;backdrop-filter:blur(18px)}a{color:inherit;text-decoration:none}.brand{font-weight:900;letter-spacing:.14em}.pill{border:1px solid #33435f;border-radius:999px;padding:7px 11px;background:#0b121c}.wrap{max-width:1500px;margin:auto;padding:18px}.hero{display:grid;grid-template-columns:1.3fr .7fr;gap:16px}.card{border:1px solid var(--line);background:linear-gradient(180deg,#0e1622ee,#080d15ee);border-radius:20px;padding:18px;box-shadow:0 30px 80px #0006}.ey{font-size:.72rem;letter-spacing:.13em;text-transform:uppercase;color:#7f90aa}h1{font-size:clamp(2rem,5vw,4.5rem);line-height:.94;margin:8px 0 12px;letter-spacing:-.04em}.muted{color:var(--muted)}.mesh{position:relative;height:520px;overflow:hidden;padding:0}.mesh canvas{width:100%;height:100%;display:block}.hud{position:absolute;inset:16px;pointer-events:none}.nodes{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px}.node{border:1px solid var(--line);border-radius:16px;padding:15px;background:#09111a}.node b{font-size:1.08rem}.ok{color:var(--o)}.bad{color:var(--c)}.warn{color:var(--b)}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px}.sequence{display:flex;gap:7px;flex-wrap:wrap}.phase{border:1px solid #2d3d56;border-radius:999px;padding:7px 10px;background:#0b121b;font-size:.78rem}.roles{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.role{height:84px;border-radius:15px;border:1px solid #31415d;display:flex;align-items:end;padding:10px;font-weight:800;background:#0b121b}.role[data-r=ALPHA]{box-shadow:inset 0 -18px 45px #9b6cff35}.role[data-r=BASE]{box-shadow:inset 0 -18px 45px #e6bd4e35}.role[data-r=CONSTRUCT]{box-shadow:inset 0 -18px 45px #ef625f35}.role[data-r=PRUNE]{box-shadow:inset 0 -18px 45px #4f8fff35}.role[data-r=OMEGA]{box-shadow:inset 0 -18px 45px #42cb7c35}.job{display:grid;grid-template-columns:150px 1fr auto;gap:10px;padding:10px 0;border-bottom:1px solid #202c3e}.job:last-child{border:0}.footer{margin:18px 0 36px;color:#7f90a9;font-size:.82rem}pre{white-space:pre-wrap;word-break:break-word;max-height:280px;overflow:auto;font-size:.76rem;color:#a9b6c9}@media(max-width:900px){.hero,.grid{grid-template-columns:1fr}.nodes{grid-template-columns:1fr}.roles{grid-template-columns:1fr 1fr}.mesh{height:430px}.job{grid-template-columns:1fr}.top{align-items:flex-start;flex-wrap:wrap}}
</style></head><body><header class="top"><a class="brand" href="/">OMEGA V6</a><div><span class="pill" id="meshState">CONVERGENCE PROBING</span> <a class="pill" href="https://omega-genesis-v1.jeffdeweyeljefe.workers.dev/">GENESIS ↗</a></div></header><main class="wrap"><section class="hero"><div class="card"><div class="ey">Unified recursive convergence</div><h1>Evolution is now a visible system.</h1><p class="muted">V6, Genesis and the authenticated sovereign PC are separate roles sharing one governed development loop. Genesis discovers and proves. V6 remains operational authority. The PC executes bounded high-compute work only after heartbeat proof.</p><div class="roles"><div class="role" data-r="ALPHA">ALPHA</div><div class="role" data-r="BASE">BASE</div><div class="role" data-r="CONSTRUCT">CONSTRUCT</div><div class="role" data-r="PRUNE">PRUNE</div><div class="role" data-r="OMEGA">OMEGA</div></div></div><div class="card"><div class="ey">Current enacted work</div><h2 id="activeKind">Waiting for proof…</h2><p class="muted" id="activeReason">Loading development state.</p><div id="pcState" class="pill">PC UNPROVEN</div><p class="muted" id="heartbeat"></p><div class="ey">Genesis capability genome</div><h2 id="capCount">—</h2><p class="muted">registered capabilities under acceptance gates</p><div class="ey">Manifest proof</div><p class="muted" id="manifestDigest">waiting for reciprocal manifest</p></div></section><section class="card mesh" style="margin-top:16px"><canvas id="mesh"></canvas><div class="hud"><span class="pill">V6 ⇄ GENESIS ⇄ SOVEREIGN PC</span></div></section><section class="nodes"><div class="node"><div class="ey">V6</div><b id="v6Status">PROBING</b><p class="muted">Canonical operational state, user interaction, release authority.</p></div><div class="node"><div class="ey">GENESIS</div><b id="genStatus">PROBING</b><p class="muted">Archive recovery, candidate generation, bounded experimentation.</p></div><div class="node"><div class="ey">SOVEREIGN PC</div><b id="pcStatus">PROBING</b><p class="muted">Authenticated heartbeat + allow-listed compute execution.</p></div></section><section class="grid"><div class="card"><div class="ey">Recursive law</div><div id="law" class="sequence"></div><div class="ey" style="margin-top:16px">Recent governed work</div><div id="jobs"></div></div><div class="card"><div class="ey">Proof / boundaries</div><pre id="proof">Loading convergence evidence…</pre></div></section><div class="footer">This workspace visualizes software/model state and evidence. Representation shells and derived modes are not physical-dimension claims. No runtime is labeled online without direct proof.</div></main><script>
const q=s=>document.querySelector(s);let snap=null,phase=0;async function load(){try{let r=await fetch('/api/convergence/edge',{cache:'no-store'}),d=await r.json();snap=d;q('#meshState').textContent=d.ok?'MESH CONNECTED':'MESH DEGRADED';q('#meshState').className='pill '+(d.ok?'ok':'warn');let v=d.topology.v6.edge.reachable,g=d.topology.genesis.edge.reachable,p=d.topology.sovereign_pc.pc_online;q('#v6Status').textContent=v?'EDGE REACHABLE':'EDGE DEGRADED';q('#v6Status').className=v?'ok':'bad';q('#genStatus').textContent=g?'EDGE REACHABLE':'EDGE DEGRADED';q('#genStatus').className=g?'ok':'bad';q('#pcStatus').textContent=p?'PC ONLINE':d.topology.sovereign_pc.heartbeat_current?'HEARTBEAT CURRENT':'PC NOT PROVEN';q('#pcStatus').className=p?'ok':'warn';q('#pcState').textContent=q('#pcStatus').textContent;q('#heartbeat').textContent='heartbeat age '+(d.topology.sovereign_pc.heartbeat_age_seconds??'—')+'s · sequence '+(d.topology.sovereign_pc.sequence??'—');q('#capCount').textContent=d.genesis.capability_count??'—';let md=d.genesis.manifest?.digest||null;q('#manifestDigest').textContent=md?'digest '+md.slice(0,16)+'… · '+String(d.genesis.manifest.schema||'manifest'):'manifest unavailable / not yet promoted';let a=d.development.active_job;q('#activeKind').textContent=a?a.kind:'IDLE / NEXT CYCLE';q('#activeReason').textContent=a?a.reason:'No active governed job reported.';q('#law').innerHTML=d.convergence.law.map(x=>'<span class="phase">'+x+'</span>').join('');let jobs=(d.development.recent_jobs||[]).slice().reverse().slice(0,7);q('#jobs').innerHTML=jobs.length?jobs.map(j=>'<div class="job"><b>'+String(j.kind||'job')+'</b><span class="muted">'+String(j.reason||'')+'</span><span>'+String(j.state||'')+'</span></div>').join(''):'<p class="muted">No recent governed jobs reported.</p>';q('#proof').textContent=JSON.stringify(d,null,2)}catch(e){q('#meshState').textContent='MESH UNREACHABLE';q('#proof').textContent=String(e)}}
function fit(c){let d=Math.min(devicePixelRatio||1,2),r=c.getBoundingClientRect();c.width=Math.max(1,r.width*d);c.height=Math.max(1,r.height*d);return[c.getContext('2d'),c.width,c.height]};function draw(){let c=q('#mesh'),[x,w,h]=fit(c);x.clearRect(0,0,w,h);let bg=x.createRadialGradient(w*.5,h*.5,0,w*.5,h*.5,Math.max(w,h)*.7);bg.addColorStop(0,'#101c2d');bg.addColorStop(1,'#05080d');x.fillStyle=bg;x.fillRect(0,0,w,h);let nodes=[{n:'V6',x:w*.2,y:h*.52,c:'#42cb7c'},{n:'GENESIS',x:w*.5,y:h*.34,c:'#9b6cff'},{n:'PC',x:w*.8,y:h*.58,c:'#e6bd4e'}];for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){let a=nodes[i],b=nodes[j],grad=x.createLinearGradient(a.x,a.y,b.x,b.y);grad.addColorStop(0,a.c+'88');grad.addColorStop(1,b.c+'88');x.strokeStyle=grad;x.lineWidth=2;x.beginPath();x.moveTo(a.x,a.y);x.bezierCurveTo(w*.5,a.y-60,w*.5,b.y+60,b.x,b.y);x.stroke();for(let k=0;k<3;k++){let t=((phase*.003+k/3+i*.17+j*.11)%1),mx=(1-t)*(1-t)*a.x+2*(1-t)*t*w*.5+t*t*b.x,my=(1-t)*(1-t)*a.y+2*(1-t)*t*((a.y+b.y)/2)+t*t*b.y;x.fillStyle=k%2?a.c:b.c;x.beginPath();x.arc(mx,my,4,0,Math.PI*2);x.fill()}}nodes.forEach((n,i)=>{let live=snap?(i===0?snap.topology.v6.edge.reachable:i===1?snap.topology.genesis.edge.reachable:snap.topology.sovereign_pc.pc_online):false,r=Math.min(w,h)*.09;x.fillStyle=n.c+(live?'35':'18');x.beginPath();x.arc(n.x,n.y,r*1.7,0,Math.PI*2);x.fill();x.strokeStyle=n.c;x.lineWidth=live?4:1.5;x.beginPath();x.arc(n.x,n.y,r,0,Math.PI*2);x.stroke();x.fillStyle='#f4f7ff';x.textAlign='center';x.font='800 '+Math.max(15,r*.25)+'px system-ui';x.fillText(n.n,n.x,n.y+5)});phase++;requestAnimationFrame(draw)}load();setInterval(load,5000);draw();
</script></body></html>`;

async function injectEvolutionLink(response: Response): Promise<Response> {
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;
  const text = await response.text();
  if (!text.includes('id="nav"') || text.includes('href="/evolution"')) return new Response(text, { status: response.status, headers: response.headers });
  const injected = text.replace('</aside>', '<div class="group"><h4>Evolve</h4><a class="navbtn" href="/evolution"><span>Evolution Mesh</span><span>∞</span></a></div></aside>');
  return new Response(injected, { status: response.status, headers: response.headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/convergence/edge") return Response.json(await convergenceSnapshot(request, env), { headers: { "cache-control": "no-store", "x-omega-authority": "convergence-observer" } });
    if (url.pathname === "/evolution" || url.pathname === "/evolution/") return new Response(page, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache", "x-omega-authority": "public-interface-only" } });
    const response = await base.fetch(request, env);
    return enhanceHdLaunchNavigation(await injectEvolutionLink(response), url.pathname);
  }
};
