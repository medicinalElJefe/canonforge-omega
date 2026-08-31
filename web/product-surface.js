const PRODUCT_NAME="OMEGA V6";
const EXPECTED_PRODUCT="OMEGA_V6";
const EXPECTED_AUTHORITY="OMEGA_GENESIS_CLOUD";
const q=s=>document.querySelector(s);
const qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

async function readJson(path){
  const response=await fetch(path,{cache:"no-store",credentials:"same-origin"});
  let data={};
  try{data=await response.json()}catch{data={error:"non_json_response"}}
  if(!response.ok)throw new Error(data.detail||data.error||`HTTP ${response.status}`);
  return data;
}

function normalizeCapabilities(data){
  if(Array.isArray(data))return data;
  for(const key of ["capabilities","rows","items"]){if(Array.isArray(data?.[key]))return data[key]}
  return [];
}

function installIdentity(){
  document.title="OMEGA V6 · Sovereign Computational Environment";
  const brand=q(".brand");
  if(brand){
    const strong=brand.querySelector("strong"),span=brand.querySelector("span");
    if(strong)strong.textContent="OMEGA";
    if(span)span.textContent="V6 · GENESIS CORE";
  }
  qa("small").filter(el=>el.textContent.trim()==="GENESIS FULL BUILD").forEach(el=>el.textContent="OMEGA V6 · LIVE SYSTEM");
  const topchips=q(".topchips");
  if(topchips&&!q("#productChip"))topchips.insertAdjacentHTML("afterbegin",'<span class="chip" id="productChip">V6 VERIFYING</span>');
  const capabilityLabel=qa(".stat-grid small").find(el=>el.textContent.trim().toLowerCase()==="capabilities");
  if(capabilityLabel){const value=capabilityLabel.parentElement?.querySelector("strong");if(value){value.id="liveCapabilityCount";value.textContent="—"}}
}

function installCss(){
  if(q("#omegaProductSurfaceCss"))return;
  const style=document.createElement("style");
  style.id="omegaProductSurfaceCss";
  style.textContent=`
    .product-truth-card{display:grid;gap:14px}.product-truth-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.product-truth-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.product-truth-grid>div{padding:11px;border:1px solid rgba(158,184,221,.15);border-radius:13px;background:rgba(5,10,17,.55)}.product-truth-grid small{display:block;margin-bottom:5px}.product-truth-grid strong{display:block;font-size:.86rem;overflow:hidden;text-overflow:ellipsis}.product-actions{display:flex;flex-wrap:wrap;gap:8px}.product-actions .btn{flex:0 1 auto}.product-boundary{font-size:.78rem;opacity:.7}.product-live-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#777;margin-right:6px}.product-live-dot.good{background:#6de0a1;box-shadow:0 0 14px rgba(109,224,161,.5)}.product-live-dot.bad{background:#f08080}.product-digest{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:.72rem;word-break:break-all}
    @media(max-width:900px){.product-truth-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:520px){.product-truth-grid{grid-template-columns:1fr}.product-actions{display:grid;grid-template-columns:1fr}.product-actions .btn{width:100%}}
  `;
  document.head.appendChild(style);
}

function installCard(){
  const cockpit=q('[data-view="cockpit"] .section-grid');
  if(!cockpit||q("#v6ProductTruthCard"))return;
  cockpit.insertAdjacentHTML("afterbegin",`<article class="card span2 product-truth-card" id="v6ProductTruthCard">
    <div class="product-truth-head"><div><small>OMEGA V6 · PRODUCT AUTHORITY</small><h2>Your system, one public surface</h2><p id="v6ProductSummary">Verifying V6, Genesis authority, proof and capability registry…</p></div><span class="tag" id="v6ProductState">VERIFYING</span></div>
    <div class="product-truth-grid">
      <div><small>PUBLIC PRODUCT</small><strong id="v6ProductName">OMEGA V6</strong></div>
      <div><small>CANONICAL AUTHORITY</small><strong id="v6Authority">—</strong></div>
      <div><small>CAPABILITIES</small><strong id="v6Capabilities">—</strong></div>
      <div><small>PROOF + REPLAY</small><strong id="v6Proof">—</strong></div>
    </div>
    <div><small>CANONICAL DIGEST</small><div class="product-digest" id="v6Digest">—</div></div>
    <div class="product-actions"><button class="btn primary" data-product-nav="host">Connect PC</button><button class="btn" data-product-nav="ai">Memory + AI</button><button class="btn" data-product-nav="render">Live Render</button><button class="btn" data-product-nav="world">Earth + Forecast</button><button class="btn" id="v6RefreshTruth">Refresh truth</button></div>
    <div class="product-boundary">V6 is the human-facing product. Genesis owns canonical state. Historical OmegaRuntime storage is preserved without mutation; no second canonical state is created.</div>
  </article>`);
}

function setChip(text,good=false){const chip=q("#productChip");if(chip){chip.textContent=text;chip.classList.toggle("good",good)}}
function setText(id,value){const el=q(id);if(el)el.textContent=String(value??"—")}

async function refreshTruth(){
  setChip("V6 VERIFYING",false);
  setText("#v6ProductState","VERIFYING");
  try{
    const [health,capData]=await Promise.all([readJson("/api/health"),readJson("/api/capabilities")]);
    const caps=normalizeCapabilities(capData);
    const digest=health?.canonical_digest||"";
    const proof=health?.proof?.valid===true;
    const replay=health?.replay?.valid===true&&health?.replay?.current_digest===digest;
    const identity=health?.product===EXPECTED_PRODUCT&&health?.canonical_authority===EXPECTED_AUTHORITY&&health?.authority_transport==="cloudflare-service-binding";
    const ok=health?.ok===true&&identity&&proof&&replay&&digest.length===64;
    const liveCount=caps.length||Number(capData?.capability_count||0)||0;
    setText("#v6Authority",health?.canonical_authority||health?.genesis?.authority||"UNVERIFIED");
    setText("#v6Capabilities",liveCount||"UNAVAILABLE");
    setText("#liveCapabilityCount",liveCount||"—");
    setText("#v6Proof",proof&&replay?"PASS · PASS":"DEGRADED");
    setText("#v6Digest",digest||"UNAVAILABLE");
    setText("#v6ProductState",ok?"LIVE":"DEGRADED");
    setText("#v6ProductSummary",ok?`${PRODUCT_NAME} is serving the governed interface over the proven Genesis canonical state.`:"Product identity or proof is degraded. Controls remain visible, but OMEGA will not claim canonical health until verification passes.");
    setChip(ok?`V6 LIVE · ${liveCount||"?"} CAPS`:"V6 DEGRADED",ok);
    document.documentElement.dataset.omegaProduct=ok?"live":"degraded";
  }catch(error){
    setText("#v6ProductState","OFFLINE / DEGRADED");
    setText("#v6ProductSummary",`Could not verify live V6 authority: ${String(error.message||error)}`);
    setText("#v6Proof","UNVERIFIED");
    setChip("V6 UNVERIFIED",false);
    document.documentElement.dataset.omegaProduct="unverified";
  }
}

function navigate(view){
  const button=qa("nav button").find(el=>el.dataset.view===view);
  if(button){button.click();setTimeout(()=>q(`[data-view="${view}"]`)?.scrollIntoView({block:"start",behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"}),0)}
}

function bind(){
  document.addEventListener("click",event=>{
    const nav=event.target.closest("[data-product-nav]");
    if(nav){event.preventDefault();navigate(nav.dataset.productNav)}
    if(event.target.closest("#v6RefreshTruth")){event.preventDefault();refreshTruth()}
  });
  window.addEventListener("online",refreshTruth);
  window.addEventListener("omega-cloud-heartbeat",()=>refreshTruth(),{passive:true});
}

function boot(){installIdentity();installCss();installCard();bind();refreshTruth()}
if(document.readyState==="loading")window.addEventListener("DOMContentLoaded",boot,{once:true});else boot();

window.OmegaProductSurface={refreshTruth,navigate};
