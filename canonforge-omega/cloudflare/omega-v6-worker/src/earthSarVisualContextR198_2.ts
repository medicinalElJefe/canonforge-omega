export const EARTH_SAR_VISUAL_CONTEXT_R198_2 = "r198.2-nasa-gibs-true-color-context";

const style = `<style id="omegaSarVisualContextR198_2Style">
#omegaEarthTruthLayers[data-sar1981="1"] .sar1981Overlay{isolation:isolate}
#omegaEarthTruthLayers[data-sar1981="1"] #sar1982EarthContext{position:absolute;inset:0;z-index:0;width:100%;height:100%;object-fit:fill;display:block;filter:saturate(.84) brightness(.58) contrast(1.08);opacity:.94;transition:opacity .18s ease;background:#061018}
#omegaEarthTruthLayers[data-sar1981="1"] #sar1982EarthContext[data-off="1"]{opacity:0}
#omegaEarthTruthLayers[data-sar1981="1"] #sar1981Canvas{position:relative;z-index:1;mix-blend-mode:screen}
#omegaEarthTruthLayers[data-sar1981="1"] .sar1981Hud{z-index:4}
#omegaEarthTruthLayers[data-sar1981="1"] .sar1982ContextToggle{border:1px solid #3b6475;border-radius:999px;background:#071620dd;color:#d4e2e8;padding:6px 8px;font:800 .55rem ui-monospace,monospace;cursor:pointer;backdrop-filter:blur(8px)}
#omegaEarthTruthLayers[data-sar1981="1"] .sar1982ContextToggle[data-on="1"]{background:#17313c;border-color:#6595aa;color:#fff}
#omegaEarthTruthLayers[data-sar1981="1"] .sar1982ContextProof{margin-top:6px;padding:6px 8px;border:1px solid #254151;border-radius:9px;background:#06131b;color:#7893a1;font:700 .52rem/1.4 ui-monospace,monospace}
@media(max-width:620px){#omegaEarthTruthLayers[data-sar1981="1"] #sar1982EarthContext{filter:saturate(.80) brightness(.52) contrast(1.06)}#omegaEarthTruthLayers[data-sar1981="1"] .sar1982ContextProof{font-size:.49rem}}
</style>`;

const script = `<script id="omegaSarVisualContextR198_2Runtime">(()=>{
const root=document.querySelector('#omegaEarthTruthLayers[data-sar1981="1"]');if(!root||root.dataset.sar1982==='1')return;root.dataset.sar1982='1';
const overlay=root.querySelector('.sar1981Overlay'),canvas=root.querySelector('#sar1981Canvas'),hud=root.querySelector('.sar1981HudGroup'),controls=root.querySelector('.sar1981Controls'),ledger=root.querySelector('.sar1981Ledger');if(!overlay||!canvas||!hud||!controls)return;
const img=document.createElement('img');img.id='sar1982EarthContext';img.alt='NASA GIBS VIIRS true-color optical Earth context';img.decoding='async';img.loading='eager';img.referrerPolicy='no-referrer';overlay.insertBefore(img,canvas);
const badge=document.createElement('span');badge.className='sar1981Badge optional';badge.id='sar1982ContextBadge';badge.textContent='NASA GIBS · OPTICAL CONTEXT';hud.appendChild(badge);
const toggle=document.createElement('button');toggle.type='button';toggle.className='sar1982ContextToggle';toggle.dataset.on='1';toggle.textContent='EARTH CONTEXT · ON';controls.insertBefore(toggle,controls.lastElementChild);
const proof=document.createElement('div');proof.id='sar1982ContextProof';proof.className='sar1982ContextProof';proof.textContent='OPTICAL CONTEXT · NASA GIBS · VIIRS true color · EPSG:4326 · awaiting available acquisition date · separate from SAR measurement';if(ledger)ledger.appendChild(proof);
let enabled=true,loadedDate=null,attempt=0;const maxAttempts=8;
const isoDay=offset=>{const d=new Date(Date.now()-offset*86400000);return d.toISOString().slice(0,10)};
const wms=date=>'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=VIIRS_SNPP_CorrectedReflectance_TrueColor&STYLES=&FORMAT=image%2Fjpeg&TRANSPARENT=false&SRS=EPSG%3A4326&BBOX=-180,-90,180,90&WIDTH=1024&HEIGHT=512&TIME='+encodeURIComponent(date);
function updateProof(state){const date=loadedDate||'WITHHELD';badge.textContent=state==='ready'?'NASA VIIRS · '+date+' · OPTICAL':state==='loading'?'NASA GIBS · LOADING CONTEXT':'NASA CONTEXT · UNAVAILABLE';badge.className='sar1981Badge optional '+(state==='ready'?'ok':'warn');if(proof)proof.textContent='OPTICAL_CONTEXT / NASA_GIBS / VIIRS_SNPP_CORRECTED_REFLECTANCE_TRUE_COLOR / EPSG:4326 / acquisition_date='+date+' / display_role=CONTEXT_ONLY / SAR_MEASUREMENT=SEPARATE / INFERENCE=WITHHELD';}
function tryDate(){if(attempt>=maxAttempts){img.removeAttribute('src');loadedDate=null;updateProof('failed');return}const date=isoDay(attempt+1),src=wms(date);attempt++;updateProof('loading');const probe=new Image();probe.decoding='async';probe.referrerPolicy='no-referrer';probe.onload=()=>{loadedDate=date;img.src=src;img.dataset.sourceDate=date;updateProof('ready')};probe.onerror=()=>tryDate();probe.src=src;}
toggle.addEventListener('click',()=>{enabled=!enabled;img.dataset.off=enabled?'0':'1';toggle.dataset.on=enabled?'1':'0';toggle.textContent='EARTH CONTEXT · '+(enabled?'ON':'OFF')});
tryDate();
})();</script>`;

export async function enhanceEarthSarVisualContextR198_2(response: Response, requestUrl: string): Promise<Response> {
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;
  const url = new URL(requestUrl);
  const app = (url.searchParams.get("app") || "").toLowerCase();
  const earthRoute = app === "earth" || url.pathname === "/earth" || url.pathname.startsWith("/earth/");
  let html = await response.text();
  if (!earthRoute || !html.includes("omegaSarIntegratedR198_1Runtime")) {
    return new Response(html, { status: response.status, statusText: response.statusText, headers: response.headers });
  }
  if (html.includes("omegaSarVisualContextR198_2Runtime")) {
    return new Response(html, { status: response.status, statusText: response.statusText, headers: response.headers });
  }
  html = html.includes("</head>") ? html.replace("</head>", style + "</head>") : style + html;
  html = html.includes("</body>") ? html.replace("</body>", script + "</body>") : html + script;
  const headers = new Headers(response.headers);
  headers.set("cache-control", "no-store");
  headers.set("x-omega-earth-context", EARTH_SAR_VISUAL_CONTEXT_R198_2);
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
