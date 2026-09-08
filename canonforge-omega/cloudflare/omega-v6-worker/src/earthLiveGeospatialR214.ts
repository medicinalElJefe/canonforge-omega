export const EARTH_LIVE_GEOSPATIAL_R214 = "r214-live-source-backed-geospatial-earth";

const USGS = {
  hour: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson",
  day: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson",
  week: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson",
  month: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson",
} as const;
const EONET = "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=200";
const SWPC_KP = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json";
const SWPC_SCALES = "https://services.swpc.noaa.gov/products/noaa-scales.json";

const json = (value: unknown, status = 200) => new Response(JSON.stringify(value, null, 2), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-omega-earth-live": EARTH_LIVE_GEOSPATIAL_R214 },
});

async function fetchJson(url: string, timeoutMs = 10000): Promise<any> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const response = await fetch(url, { headers: { accept: "application/json", "user-agent": "OMEGA-R214-Earth-Truth/1.0" }, signal: ctrl.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally { clearTimeout(timer); }
}

const finite = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};
const iso = (value: unknown): string | null => {
  const n = Number(value), t = Number.isFinite(n) ? n : Date.parse(String(value ?? ""));
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
};

function normalizeQuakes(feed: any) {
  const features = Array.isArray(feed?.features) ? feed.features : [];
  return features.flatMap((feature: any) => {
    const c = feature?.geometry?.coordinates, p = feature?.properties || {};
    if (!Array.isArray(c) || c.length < 2) return [];
    const lon = finite(c[0]), lat = finite(c[1]), depth = finite(c[2]);
    if (lon == null || lat == null || lon < -180 || lon > 180 || lat < -90 || lat > 90) return [];
    return [{
      id: String(feature.id || p.code || "unknown"),
      longitude: lon, latitude: lat, depth_km: depth,
      magnitude: finite(p.mag), place: p.place ? String(p.place) : null,
      time: iso(p.time), updated: iso(p.updated), felt: finite(p.felt), cdi: finite(p.cdi), mmi: finite(p.mmi),
      significance: finite(p.sig), alert: p.alert ? String(p.alert) : null, tsunami: Boolean(p.tsunami),
      network: p.net ? String(p.net) : null, event_type: p.type ? String(p.type) : "earthquake",
      detail: p.detail ? String(p.detail) : null, source_url: p.url ? String(p.url) : null,
      evidence_class: "OBSERVED_SOURCE", coordinate_authority: "USGS_EVENT_GEOMETRY", temporal_authority: "USGS_EVENT_TIME",
    }];
  });
}

function normalizeEonet(feed: any) {
  const events = Array.isArray(feed?.events) ? feed.events : [];
  const out: any[] = [];
  for (const event of events) {
    const geometry = Array.isArray(event?.geometry) ? event.geometry : [];
    const latest = geometry.at(-1), coords = latest?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2 || typeof coords[0] !== "number" || typeof coords[1] !== "number") continue;
    const lon = finite(coords[0]), lat = finite(coords[1]);
    if (lon == null || lat == null || lon < -180 || lon > 180 || lat < -90 || lat > 90) continue;
    out.push({
      id: String(event.id || "unknown"), title: String(event.title || event.id || "Natural event"),
      longitude: lon, latitude: lat, time: latest?.date ? String(latest.date) : null,
      geometry_type: String(latest?.type || "Point"),
      categories: (Array.isArray(event.categories) ? event.categories : []).map((x: any) => ({ id: String(x?.id || ""), title: String(x?.title || "") })),
      sources: (Array.isArray(event.sources) ? event.sources : []).map((x: any) => ({ id: String(x?.id || ""), url: String(x?.url || "") })),
      evidence_class: "OBSERVED_SOURCE", coordinate_authority: "NASA_EONET_EVENT_GEOMETRY",
    });
  }
  return out;
}

function normalizeKp(rows: any) {
  if (!Array.isArray(rows) || rows.length < 2) return [];
  const header = rows[0].map((x: unknown) => String(x));
  return rows.slice(1).flatMap((row: any[]) => {
    if (!Array.isArray(row)) return [];
    const record: Record<string, unknown> = {};
    header.forEach((key: string, index: number) => record[key] = row[index]);
    const time = String(record.time_tag ?? record.Time ?? row[0] ?? "");
    const kp = finite(record.Kp ?? record.kp ?? row[1]);
    if (kp == null) return [];
    return [{ time, kp, source: "NOAA_SWPC", evidence_class: "OBSERVED_SOURCE" }];
  });
}

export async function handleEarthLiveGeospatialR214(request: Request): Promise<Response | null> {
  const url = new URL(request.url), path = url.pathname.replace(/\/$/, "");
  if (!path.startsWith("/api/earth/live/r214/")) return null;
  if (request.method !== "GET") return json({ ok: false, code: "METHOD_NOT_ALLOWED", allowed: ["GET"] }, 405);

  if (path.endsWith("/seismic")) {
    const requested = String(url.searchParams.get("window") || "day") as keyof typeof USGS;
    const window = requested in USGS ? requested : "day";
    try {
      const raw = await fetchJson(USGS[window]);
      const events = normalizeQuakes(raw);
      return json({
        ok: true, build: EARTH_LIVE_GEOSPATIAL_R214, generated_at: new Date().toISOString(), source_generated_at: iso(raw?.metadata?.generated),
        source: { authority: "USGS", product: "Real-time GeoJSON Summary Feed", url: USGS[window], window, count_reported: finite(raw?.metadata?.count) },
        observed_count: events.length, events,
        truth_boundary: { observed: "Coordinates, depth, magnitude and event time are returned from the USGS real-time feed.", derived: "Projection, filtering, density and screen position are DERIVED_FRAMEWORK_MATH.", withheld: "No seismic wavefront, ground motion field, local shaking or causal propagation is fabricated from epicenter metadata." },
      });
    } catch (error) {
      return json({ ok: false, build: EARTH_LIVE_GEOSPATIAL_R214, source: "USGS", error: String(error), events: [], substituted_data: false }, 502);
    }
  }

  if (path.endsWith("/events")) {
    try {
      const raw = await fetchJson(EONET);
      const events = normalizeEonet(raw);
      return json({ ok: true, build: EARTH_LIVE_GEOSPATIAL_R214, generated_at: new Date().toISOString(), source: { authority: "NASA_EONET", url: EONET }, observed_count: events.length, events, truth_boundary: "Only the latest source geometry supplied by NASA EONET is plotted; category styling and projection are derived." });
    } catch (error) {
      return json({ ok: false, build: EARTH_LIVE_GEOSPATIAL_R214, source: "NASA_EONET", error: String(error), events: [], substituted_data: false }, 502);
    }
  }

  if (path.endsWith("/space")) {
    try {
      const [kpRaw, scales] = await Promise.all([fetchJson(SWPC_KP), fetchJson(SWPC_SCALES)]);
      const kp = normalizeKp(kpRaw);
      return json({
        ok: true, build: EARTH_LIVE_GEOSPATIAL_R214, generated_at: new Date().toISOString(),
        source: { authority: "NOAA_SWPC", kp_url: SWPC_KP, scales_url: SWPC_SCALES },
        latest_kp: kp.at(-1) || null, kp: kp.slice(-32), noaa_scales: scales,
        truth_boundary: "Space-weather values are NOAA SWPC observations/products. They are global context and are not converted into invented terrestrial event coordinates.",
      });
    } catch (error) {
      return json({ ok: false, build: EARTH_LIVE_GEOSPATIAL_R214, source: "NOAA_SWPC", error: String(error), substituted_data: false }, 502);
    }
  }

  if (path.endsWith("/sources")) {
    return json({
      ok: true, build: EARTH_LIVE_GEOSPATIAL_R214,
      sources: [
        { id: "usgs-seismic", authority: "USGS", cadence: "feed-updated-continuously", coordinate_authority: true, routes: Object.values(USGS) },
        { id: "nasa-eonet", authority: "NASA EONET", coordinate_authority: true, route: EONET },
        { id: "noaa-swpc", authority: "NOAA SWPC", coordinate_authority: false, routes: [SWPC_KP, SWPC_SCALES] },
        { id: "nasa-gibs", authority: "NASA GIBS", role: "optical context", layer: "VIIRS_SNPP_CorrectedReflectance_TrueColor", projection: "EPSG:4326" },
      ],
      boundary: "R214 replaces synthetic Earth event dots with current public source records. A missing source leaves the corresponding layer empty/degraded rather than substituting animation.",
    });
  }

  return json({ ok: false, code: "NOT_FOUND", paths: ["/api/earth/live/r214/seismic", "/api/earth/live/r214/events", "/api/earth/live/r214/space", "/api/earth/live/r214/sources"] }, 404);
}

const STYLE = String.raw`<style id="omegaEarthLiveR214Style">
[data-view="Earth"] .canvasWrap{background:#02070b}[data-view="Earth"] #earthCanvas{visibility:hidden!important}
#earth214Viewport{position:absolute;inset:0;overflow:hidden;background:#02070b;touch-action:none;isolation:isolate}
#earth214Context{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:fill;transform-origin:0 0;z-index:0;filter:saturate(.92) brightness(.72) contrast(1.05)}
#earth214Canvas{position:absolute;inset:0;width:100%;height:100%;z-index:1}.earth214Hud{position:absolute;z-index:3;left:10px;right:10px;top:10px;display:flex;gap:7px;justify-content:space-between;pointer-events:none}.earth214Hud span{border:1px solid #365568;border-radius:999px;background:#041019e8;padding:6px 9px;font:800 .58rem ui-monospace,monospace;backdrop-filter:blur(9px)}
.earth214Tools{position:absolute;z-index:4;left:10px;right:10px;bottom:10px;display:flex;gap:6px;flex-wrap:wrap;align-items:center}.earth214Tools button,.earth214Tools select{border:1px solid #3b596c;border-radius:999px;background:#071620e8;padding:7px 9px;color:#dbe9ef;font:800 .58rem ui-monospace,monospace}.earth214Tools button{cursor:pointer}.earth214Tools button[data-on="1"]{background:#173142;border-color:#6a9bad}.earth214Tools .grow{margin-left:auto}
#earth214Ledger{margin-top:12px;border-top:1px solid #29394c;padding-top:11px}.earth214Metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.earth214Metric{border:1px solid #29394b;border-radius:11px;background:#08121b;padding:9px}.earth214Metric small{display:block;color:#778b9d;font-size:.53rem;letter-spacing:.08em}.earth214Metric b{display:block;margin-top:3px;font:850 .75rem ui-monospace,monospace}.earth214Selected{margin-top:8px;border:1px solid #2b4052;border-radius:11px;background:#07131b;padding:10px;min-height:70px}.earth214Selected b{font-size:.72rem}.earth214Selected p{margin:4px 0 0;color:#8ea3b1;font-size:.62rem;line-height:1.45}.earth214Proof{white-space:pre-wrap;max-height:230px;overflow:auto;font:9px/1.45 ui-monospace,monospace;color:#8ea6b5}.earth214Boundary{margin-top:7px;color:#708897;font-size:.56rem;line-height:1.45}
[data-view="Earth"] .earthControls .layer::after{display:block;margin-top:2px;font-size:.48rem;color:#82a0b1}[data-view="Earth"] .earthControls [data-layer="weather"]::after{content:"NASA GIBS"}[data-view="Earth"] .earthControls [data-layer="seismic"]::after{content:"USGS LIVE"}[data-view="Earth"] .earthControls [data-layer="events"]::after{content:"NASA EONET"}[data-view="Earth"] .earthControls [data-layer="space"]::after{content:"NOAA SWPC"}[data-view="Earth"] .earthControls [data-layer="derived"]::after{content:"DERIVED ONLY"}
@media(max-width:620px){.earth214Hud span.optional{display:none}.earth214Tools{left:6px;right:6px;bottom:6px}.earth214Tools .grow{margin-left:0}.earth214Metrics{grid-template-columns:1fr}}
</style>`;

const SCRIPT = String.raw`<script id="omegaEarthLiveR214Runtime">(()=>{
const section=document.querySelector('[data-view="Earth"]');if(!section||section.dataset.earth214==='1')return;section.dataset.earth214='1';
const q=s=>section.querySelector(s),qa=s=>Array.from(section.querySelectorAll(s)),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const wrap=q('.canvasWrap'),old=q('#earthCanvas'),side=q('.panel');if(!wrap||!old||!side)return;
const vp=document.createElement('div');vp.id='earth214Viewport';vp.innerHTML='<img id="earth214Context" alt="NASA GIBS VIIRS true-color Earth context"><canvas id="earth214Canvas"></canvas><div class="earth214Hud"><span id="earth214Source">SOURCE · INITIALIZING</span><span class="optional" id="earth214Truth">OBSERVED SOURCE COORDINATES</span></div><div class="earth214Tools"><select id="earth214Window"><option value="hour">1 HOUR</option><option value="day" selected>24 HOURS</option><option value="week">7 DAYS</option><option value="month">30 DAYS</option></select><button id="earth214ContextToggle" data-on="1">OPTICAL CONTEXT</button><button id="earth214Reset">RESET VIEW</button><button id="earth214Refresh" class="grow">REFRESH LIVE SOURCE</button></div>';wrap.appendChild(vp);
const ledger=document.createElement('div');ledger.id='earth214Ledger';ledger.innerHTML='<div class="eyebrow">R214 · LIVE SOURCE GEOSPATIAL TRUTH</div><div class="earth214Metrics"><div class="earth214Metric"><small>LAYER</small><b id="earth214Layer">SEISMIC</b></div><div class="earth214Metric"><small>OBSERVED RECORDS</small><b id="earth214Count">0</b></div><div class="earth214Metric"><small>SOURCE AGE</small><b id="earth214Age">—</b></div><div class="earth214Metric"><small>VIEW</small><b id="earth214View">1.00×</b></div></div><div class="earth214Selected" id="earth214Selected"><b>No source record selected.</b><p>Choose an observed point for its returned source metadata.</p></div><details style="margin-top:8px"><summary class="eyebrow">Source / projection proof</summary><pre class="earth214Proof" id="earth214Proof">Loading.</pre></details><div class="earth214Boundary">Observed locations come only from USGS or NASA EONET source geometry. NASA GIBS is optical context. NOAA SWPC is global space-weather context. Pan/zoom, filtering and density are derived display math. No earthquake propagation, shaking field, weather field or terrestrial space-weather coordinate is fabricated.</div>';
side.appendChild(ledger);
let layer='seismic',data=null,hits=[],selected=null,zoom=1,panX=0,panY=0,drag=false,lx=0,ly=0,contextOn=true,contextDate=null,ctxAttempt=1,busy=false;
const colors={seismic:'#ff765f',events:'#e6bd4e',derived:'#a67cff'};
const img=q('#earth214Context'),canvas=q('#earth214Canvas');
function fit(){const r=canvas.getBoundingClientRect(),D=Math.min(2,devicePixelRatio||1),x=canvas.getContext('2d');canvas.width=Math.max(1,Math.round(r.width*D));canvas.height=Math.max(1,Math.round(r.height*D));x.setTransform(D,0,0,D,0,0);return{x,W:r.width,H:r.height}}
function xy(lon,lat,W,H){return[((Number(lon)+180)/360*W)*zoom+panX,((90-Number(lat))/180*H)*zoom+panY]}
function setImageTransform(){img.style.transform='translate('+panX+'px,'+panY+'px) scale('+zoom+')';q('#earth214View').textContent=zoom.toFixed(2)+'×'}
function draw(){const f=fit(),x=f.x,W=f.W,H=f.H;x.clearRect(0,0,W,H);hits=[];x.strokeStyle='rgba(210,230,236,.16)';x.lineWidth=1;for(let lon=-180;lon<=180;lon+=30){const p=xy(lon,0,W,H)[0];x.beginPath();x.moveTo(p,panY);x.lineTo(p,H*zoom+panY);x.stroke()}for(let lat=-60;lat<=60;lat+=30){const p=xy(0,lat,W,H)[1];x.beginPath();x.moveTo(panX,p);x.lineTo(W*zoom+panX,p);x.stroke()}
const rows=Array.isArray(data?.events)?data.events:[];if(layer==='seismic'||layer==='events'){for(const e of rows){const p=xy(e.longitude,e.latitude,W,H),mag=Number(e.magnitude);const rr=layer==='seismic'?Math.max(3,Math.min(12,3+(Number.isFinite(mag)?Math.max(0,mag):0)*1.25)):5;x.beginPath();x.arc(p[0],p[1],rr,0,Math.PI*2);x.fillStyle=colors[layer]+'bb';x.fill();x.strokeStyle=selected?.id===e.id?'#fff':colors[layer];x.lineWidth=selected?.id===e.id?2.2:1;x.stroke();hits.push({e,x:p[0],y:p[1],r:rr+4})}}
if(layer==='derived'){const source=Array.isArray(data?.events)?data.events:[],bins=new Map();for(const e of source){const bx=Math.floor((e.longitude+180)/15),by=Math.floor((e.latitude+90)/15),k=bx+':'+by;bins.set(k,(bins.get(k)||0)+1)}for(const [k,n] of bins){const parts=k.split(':').map(Number),lon=parts[0]*15-172.5,lat=parts[1]*15-82.5,p=xy(lon,lat,W,H),rr=Math.min(30,4+Math.sqrt(n)*4);x.beginPath();x.arc(p[0],p[1],rr,0,Math.PI*2);x.fillStyle='rgba(166,124,255,.18)';x.fill();x.strokeStyle='rgba(166,124,255,.65)';x.stroke()}}
}
function wms(day){return 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=VIIRS_SNPP_CorrectedReflectance_TrueColor&STYLES=&FORMAT=image%2Fjpeg&TRANSPARENT=false&SRS=EPSG%3A4326&BBOX=-180,-90,180,90&WIDTH=1440&HEIGHT=720&TIME='+encodeURIComponent(day)}
function tryContext(){if(ctxAttempt>8){q('#earth214Source').textContent='NASA GIBS CONTEXT UNAVAILABLE';return}const d=new Date(Date.now()-ctxAttempt*86400000).toISOString().slice(0,10),probe=new Image();probe.referrerPolicy='no-referrer';probe.onload=()=>{contextDate=d;img.src=wms(d);setImageTransform();renderProof()};probe.onerror=()=>{ctxAttempt++;tryContext()};probe.src=wms(d)}tryContext();
function ageText(iso){const t=Date.parse(iso||'');if(!Number.isFinite(t))return'—';const s=Math.max(0,Math.round((Date.now()-t)/1000));return s<120?s+'s':s<7200?Math.round(s/60)+'m':Math.round(s/3600)+'h'}
function renderSelected(){if(!selected){q('#earth214Selected').innerHTML='<b>No source record selected.</b><p>Select a plotted observed record. Empty source response stays empty.</p>';return}if(layer==='seismic')q('#earth214Selected').innerHTML='<b>USGS · '+esc(selected.id)+' · M '+esc(selected.magnitude??'unreported')+'</b><p>'+esc(selected.place||'place unreported')+' · '+esc(selected.time||'time unreported')+' · depth '+esc(selected.depth_km==null?'unreported':selected.depth_km+' km')+' · significance '+esc(selected.significance??'—')+' · felt '+esc(selected.felt??'—')+' · MMI '+esc(selected.mmi??'—')+'.</p>';else q('#earth214Selected').innerHTML='<b>NASA EONET · '+esc(selected.title||selected.id)+'</b><p>'+esc(selected.time||'time unreported')+' · '+esc((selected.categories||[]).map(c=>c.title).filter(Boolean).join(', ')||'category unreported')+' · source geometry '+esc(selected.geometry_type||'Point')+'.</p>'}
function renderProof(){q('#earth214Proof').textContent=JSON.stringify({build:'r214-live-source-backed-geospatial-earth',layer,source:data?.source||null,generated_at:data?.generated_at||null,source_generated_at:data?.source_generated_at||null,observed_count:data?.observed_count??null,nasa_gibs_context_date:contextDate,projection:'EPSG:4326 / EQUIRECTANGULAR / DERIVED_DISPLAY_MATH',pan_zoom:'DERIVED_DISPLAY_MATH',truth_boundary:data?.truth_boundary||null,synthetic_event_coordinates:false,seismic_wavefield:'WITHHELD',weather_field:'WITHHELD unless a measured field layer is separately supplied'},null,2)}
function render(){const rows=Array.isArray(data?.events)?data.events:[];q('#earth214Layer').textContent=layer.toUpperCase();q('#earth214Count').textContent=String(rows.length);q('#earth214Age').textContent=ageText(data?.source_generated_at||data?.generated_at);q('#earth214Source').textContent=layer==='seismic'?'USGS REAL-TIME GEOJSON · '+rows.length:layer==='events'?'NASA EONET OPEN EVENTS · '+rows.length:layer==='space'?'NOAA SWPC · '+(data?.latest_kp?'KP '+data.latest_kp.kp:'NO KP'):layer==='weather'?'NASA GIBS · OPTICAL CLOUD CONTEXT':'DERIVED DENSITY · SOURCE EVENTS';q('#earth214Truth').textContent=layer==='derived'?'DERIVED_FRAMEWORK_MATH':'OBSERVED_SOURCE / SOURCE GEOMETRY';if(layer==='space'){q('#earth214Selected').innerHTML='<b>NOAA SWPC global space-weather context</b><p>Latest planetary K index: '+esc(data?.latest_kp?.kp??'unavailable')+' at '+esc(data?.latest_kp?.time??'time unavailable')+'. No terrestrial coordinate is fabricated from this global measurement.</p>'}else if(layer==='weather'){q('#earth214Selected').innerHTML='<b>NASA GIBS VIIRS true-color optical context</b><p>Clouds and surface are optical imagery. This layer does not mislabel true-color imagery as a meteorological scalar/vector field.</p>'}else renderSelected();renderProof();draw()}
async function load(){if(busy)return;busy=true;q('#earth214Refresh').disabled=true;selected=null;try{if(layer==='weather'){data={ok:true,source:{authority:'NASA_GIBS',role:'OPTICAL_CONTEXT'},generated_at:new Date().toISOString(),observed_count:0,events:[]}}else if(layer==='space'){const r=await fetch('/api/earth/live/r214/space',{cache:'no-store'});data=await r.json();if(!r.ok)throw new Error(JSON.stringify(data))}else{const endpoint=layer==='events'?'/api/earth/live/r214/events':'/api/earth/live/r214/seismic?window='+encodeURIComponent(q('#earth214Window').value);const r=await fetch(endpoint,{cache:'no-store'});data=await r.json();if(!r.ok)throw new Error(JSON.stringify(data));if(layer==='derived'){const sr=await fetch('/api/earth/live/r214/seismic?window='+encodeURIComponent(q('#earth214Window').value),{cache:'no-store'});data=await sr.json();data.source={authority:'USGS',derived:'15-degree event-density bins'};data.truth_boundary='Density bins are derived from observed USGS epicenter coordinates; they are not an observed physical field.'}}render()}catch(e){data={ok:false,events:[],error:String(e),generated_at:new Date().toISOString()};q('#earth214Source').textContent='SOURCE DEGRADED · NO SUBSTITUTE';renderProof();draw()}finally{busy=false;q('#earth214Refresh').disabled=false}}
function setLayer(v){layer=v;selected=null;qa('[data-layer]').forEach(b=>b.classList.toggle('active',b.dataset.layer===v));q('#earth214Window').style.display=(v==='seismic'||v==='derived')?'':'none';load()}
qa('[data-layer]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();setLayer(b.dataset.layer||'seismic')},true));q('#earth214Window').addEventListener('change',load);q('#earth214Refresh').onclick=load;q('#earth214Reset').onclick=()=>{zoom=1;panX=0;panY=0;setImageTransform();draw()};q('#earth214ContextToggle').onclick=e=>{contextOn=!contextOn;img.style.opacity=contextOn?'1':'0';e.currentTarget.dataset.on=contextOn?'1':'0'};
vp.onpointerdown=e=>{if(e.target.closest('.earth214Tools'))return;drag=true;lx=e.clientX;ly=e.clientY;vp.setPointerCapture(e.pointerId)};vp.onpointermove=e=>{if(!drag)return;panX+=e.clientX-lx;panY+=e.clientY-ly;lx=e.clientX;ly=e.clientY;setImageTransform();draw()};vp.onpointerup=e=>{drag=false;try{vp.releasePointerCapture(e.pointerId)}catch(_){}};vp.onwheel=e=>{e.preventDefault();const r=vp.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top,old=zoom,n=Math.max(1,Math.min(8,zoom*(e.deltaY<0?1.18:.84)));panX=mx-(mx-panX)*(n/old);panY=my-(my-panY)*(n/old);zoom=n;setImageTransform();draw()};canvas.onclick=e=>{if(layer!=='seismic'&&layer!=='events')return;const r=canvas.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top;const hit=hits.filter(h=>Math.hypot(px-h.x,py-h.y)<=h.r).sort((a,b)=>a.r-b.r)[0];selected=hit?.e||null;renderSelected();draw()};
addEventListener('resize',()=>{setImageTransform();draw()},{passive:true});setImageTransform();setLayer('seismic');
})();</script>`;

export async function enhanceEarthLiveGeospatialR214(response: Response, requestUrl: string): Promise<Response> {
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;
  const url = new URL(requestUrl), app = (url.searchParams.get("app") || "").toLowerCase();
  const earthRoute = app === "earth" || url.pathname === "/earth" || url.pathname.startsWith("/earth/") || url.pathname === "/";
  if (!earthRoute) return response;
  let html = await response.text();
  if (!html.includes('data-view="Earth"') || html.includes("omegaEarthLiveR214Runtime")) return new Response(html, { status: response.status, statusText: response.statusText, headers: response.headers });
  html = html.includes("</head>") ? html.replace("</head>", STYLE + "</head>") : STYLE + html;
  html = html.includes("</body>") ? html.replace("</body>", SCRIPT + "</body>") : html + SCRIPT;
  const headers = new Headers(response.headers);
  headers.set("cache-control", "no-store");
  headers.set("x-omega-earth-live", EARTH_LIVE_GEOSPATIAL_R214);
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
