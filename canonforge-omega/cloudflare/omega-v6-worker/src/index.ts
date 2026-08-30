export interface Env {
  SOVEREIGN_ORIGIN?: string;
  BUILD_ID?: string;
}

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>OMEGA V6 · Sovereign Runtime</title>
<style>
:root{color-scheme:dark;background:#07090e;color:#eef2ff;font:15px/1.45 Inter,system-ui,sans-serif}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(circle at 50% 25%,#182136 0,#0a0d15 38%,#050609 100%)}header{position:sticky;top:0;z-index:5;display:flex;gap:16px;align-items:center;padding:14px 18px;border-bottom:1px solid #263049;background:#090c13dd;backdrop-filter:blur(18px)}.brand{font-weight:800;letter-spacing:.12em}.badge{padding:4px 8px;border:1px solid #3c4868;border-radius:999px;color:#b9c5e4}.layout{display:grid;grid-template-columns:260px 1fr;min-height:calc(100vh - 58px)}nav{padding:18px;border-right:1px solid #222a3d}button{width:100%;margin:4px 0;padding:10px 12px;text-align:left;border:1px solid transparent;border-radius:10px;background:transparent;color:#dbe5ff;cursor:pointer}button:hover,button.active{background:#12192a;border-color:#2d3959}.main{padding:24px;max-width:1400px}.hero{display:grid;grid-template-columns:minmax(320px,620px) 1fr;gap:24px}.panel{background:#0d111bcc;border:1px solid #242e45;border-radius:18px;padding:18px;box-shadow:0 20px 70px #0008}.glyph{aspect-ratio:1;display:grid;place-items:center;position:relative;overflow:hidden;background:radial-gradient(circle,#1d2b45 0 2%,#0d1320 18%,transparent 19%),repeating-radial-gradient(circle,#18223a 0 1px,transparent 1px 38px)}.ring{position:absolute;border:1px solid #65759d;border-radius:50%;width:68%;height:68%;animation:spin 28s linear infinite}.ring:before,.ring:after{content:"";position:absolute;inset:14%;border:1px dashed #43506f;border-radius:50%}.ring:after{inset:30%;border-style:solid}.core{position:relative;z-index:2;width:112px;height:112px;border-radius:50%;display:grid;place-items:center;background:#10182a;border:1px solid #7181aa;box-shadow:0 0 35px #536caa55;font-weight:700}.phase{position:absolute;inset:7%;border-radius:50%;border:1px solid #313d5b}.phase i{position:absolute;left:50%;top:50%;width:8px;height:8px;margin:-4px;background:#d8e3ff;border-radius:50%;transform:rotate(calc(var(--i)*30deg)) translateY(-178px)}@keyframes spin{to{transform:rotate(360deg)}}.metricgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.metric{padding:14px;border:1px solid #242e45;border-radius:12px;background:#0a0e17}.value{font-size:1.45rem;font-weight:700}.small{color:#96a5c8;font-size:.85rem}.warn{color:#ffd78a}.ok{color:#90e6b5}.error{color:#ff9b9b}@media(max-width:850px){.layout{grid-template-columns:1fr}nav{border-right:0;border-bottom:1px solid #222a3d;display:flex;overflow:auto;padding:8px}nav button{min-width:max-content;width:auto}.hero{grid-template-columns:1fr}.main{padding:14px}.phase i{transform:rotate(calc(var(--i)*30deg)) translateY(-140px)}}
</style></head><body><header><div class="brand">OMEGA V6</div><span class="badge" id="status">connecting</span><span class="small" id="build"></span></header><div class="layout"><nav id="nav"></nav><main class="main"><section class="hero"><div class="panel glyph"><div class="ring"></div><div class="phase" id="phase"></div><div class="core"><span id="core">Ω</span></div></div><div><div class="panel"><h1>Sovereign State Instrument</h1><p class="small">Measured, derived, forecast and symbolic records remain explicitly separated. 144 / 1728 / 20,736 are software representation spaces, not physical dimensions.</p><div class="metricgrid" id="metrics"></div></div><div class="panel" style="margin-top:16px"><h2>Proof-bound runtime</h2><pre id="proof" style="white-space:pre-wrap;word-break:break-word;color:#b9c5e4"></pre></div></div></section></main></div>
<script>
const sections=['State','Mode 188','1728D Portal','20736D Atlas','Motion Relativity','Forecast','Proof Ledger','Hybrid Link','Corpus','Render','Quality'];
nav.innerHTML=sections.map((x,i)=>'<button class="'+(i===0?'active':'')+'">'+x+'</button>').join('');
phase.innerHTML=Array.from({length:12},(_,i)=>'<i style="--i:'+i+'"></i>').join('');
function metric(k,v,c=''){return '<div class="metric"><div class="small">'+k+'</div><div class="value '+c+'">'+v+'</div></div>'}
async function refresh(){try{const r=await fetch('/api/omega/state',{cache:'no-store'});if(!r.ok)throw new Error('host '+r.status);const d=await r.json();status.textContent='sovereign host linked';status.className='badge ok';build.textContent='state '+d.digest.slice(0,12);core.textContent='P'+String(d.state.address[1]).padStart(2,'0');metrics.innerHTML=metric('Mode 188',d.mode188.dispatch,d.mode188.dispatch==='STAY'?'ok':'warn')+metric('S',Number(d.mode188.ratio).toFixed(4))+metric('011 construct',Number(d.operator.construct_011).toFixed(4))+metric('01-1 prune',Number(d.operator.prune_01m1).toFixed(4))+metric('Address',d.state.address.join('·'))+metric('Evidence',d.state.evidence_class);const p=await fetch('/api/omega/proof?limit=4',{cache:'no-store'});proof.textContent=JSON.stringify(await p.json(),null,2)}catch(e){status.textContent='sovereign host unavailable';status.className='badge error';metrics.innerHTML=metric('Runtime','OFFLINE','error')+metric('Authority','No data fabricated');proof.textContent=String(e)}}
refresh();setInterval(refresh,5000);
</script></body></html>`;

function upstream(request: Request, env: Env): Request | null {
  if (!env.SOVEREIGN_ORIGIN) return null;
  const origin = env.SOVEREIGN_ORIGIN.replace(/\/$/, '');
  const incoming = new URL(request.url);
  const target = new URL(origin + incoming.pathname + incoming.search);
  const headers = new Headers(request.headers);
  headers.set('x-omega-public-gateway', 'cloudflare-worker');
  return new Request(target, { method: request.method, headers, body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body, redirect: 'manual' });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/_omega/health') {
      return Response.json({ ok: true, layer: 'public-interface', build: env.BUILD_ID || 'dev', sovereignConfigured: Boolean(env.SOVEREIGN_ORIGIN) });
    }
    if (url.pathname.startsWith('/api/')) {
      const proxy = upstream(request, env);
      if (!proxy) return Response.json({ error: 'sovereign_origin_not_configured', boundary: 'public gateway will not fabricate runtime state' }, { status: 503 });
      try {
        const response = await fetch(proxy);
        return new Response(response.body, { status: response.status, headers: response.headers });
      } catch (error) {
        return Response.json({ error: 'sovereign_host_unreachable', detail: String(error) }, { status: 502 });
      }
    }
    return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' } });
  }
};
