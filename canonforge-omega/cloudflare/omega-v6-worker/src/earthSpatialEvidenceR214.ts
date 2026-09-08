export const EARTH_SPATIAL_EVIDENCE_RELEASE_R214 = "r214-source-backed-spatial-earth";

type RuntimeNext = (request: Request, env: any, ctx: any) => Promise<Response>;

type Point = { lon: number; lat: number };

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-omega-earth-spatial": EARTH_SPATIAL_EVIDENCE_RELEASE_R214,
    },
  });
}

async function fetchJson(url: string, timeoutMs = 8500): Promise<any> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const response = await fetch(url, { headers: { accept: "application/json" }, signal: ctrl.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally { clearTimeout(timer); }
}

async function sha256(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function finite(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeQuakes(feed: any) {
  const features = Array.isArray(feed?.features) ? feed.features : [];
  return features.flatMap((feature: any) => {
    const c = feature?.geometry?.coordinates;
    const lon = finite(c?.[0]), lat = finite(c?.[1]), depthKm = finite(c?.[2]);
    if (lon == null || lat == null || depthKm == null || lon < -180 || lon > 180 || lat < -90 || lat > 90) return [];
    const p = feature?.properties || {};
    return [{
      id: String(feature.id || p.code || "unknown"),
      lon, lat, depthKm,
      magnitude: finite(p.mag),
      time: Number.isFinite(Number(p.time)) ? new Date(Number(p.time)).toISOString() : null,
      updated: Number.isFinite(Number(p.updated)) ? new Date(Number(p.updated)).toISOString() : null,
      place: p.place ? String(p.place) : null,
      type: p.type ? String(p.type) : "earthquake",
      status: p.status ? String(p.status) : null,
      tsunami: Number(p.tsunami || 0) === 1,
      detailUrl: p.url ? String(p.url) : null,
      source: "USGS_EARTHQUAKE_HAZARDS_PROGRAM",
      evidenceClass: "OBSERVED_SOURCE_CATALOG",
    }];
  }).sort((a: any, b: any) => Date.parse(b.time || "") - Date.parse(a.time || ""));
}

function normalizeEvents(feed: any) {
  const events = Array.isArray(feed?.events) ? feed.events : [];
  return events.flatMap((event: any) => {
    const geometries = Array.isArray(event?.geometry) ? event.geometry : [];
    const latest = geometries.length ? geometries[geometries.length - 1] : null;
    if (!latest?.coordinates || !latest?.type) return [];
    return [{
      id: String(event.id || "unknown"),
      title: String(event.title || "Natural event"),
      categories: Array.isArray(event.categories) ? event.categories.map((c: any) => String(c?.title || c?.id || "")).filter(Boolean) : [],
      geometryType: String(latest.type),
      coordinates: latest.coordinates,
      time: latest.date ? String(latest.date) : null,
      closed: event.closed || null,
      sources: Array.isArray(event.sources) ? event.sources.map((s: any) => ({ id: s?.id || null, url: s?.url || null })) : [],
      source: "NASA_EONET",
      evidenceClass: "OBSERVED_SOURCE_CATALOG",
    }];
  });
}

function normalizeKp(raw: any) {
  if (!Array.isArray(raw) || raw.length < 2) return null;
  const row = raw[raw.length - 1];
  if (!Array.isArray(row)) return null;
  const kp = finite(row[1]);
  return {
    time: row[0] ? String(row[0]) : null,
    kp,
    source: "NOAA_SWPC_PLANETARY_K_INDEX",
    spatialScope: "GLOBAL_GEOMAGNETIC_INDEX_NOT_LOCAL_MAP_OBSERVATION",
    evidenceClass: "OBSERVED_SOURCE_INDEX",
  };
}

async function selectedWeather(url: URL) {
  const lat = finite(url.searchParams.get("lat"));
  const lon = finite(url.searchParams.get("lon"));
  if (lat == null || lon == null || lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  const endpoint = new URL("https://api.open-meteo.com/v1/forecast");
  endpoint.searchParams.set("latitude", String(lat));
  endpoint.searchParams.set("longitude", String(lon));
  endpoint.searchParams.set("current", "temperature_2m,wind_speed_10m,wind_direction_10m,cloud_cover,precipitation");
  endpoint.searchParams.set("timezone", "UTC");
  const body = await fetchJson(endpoint.toString(), 7000);
  return {
    lon, lat,
    current: body?.current || null,
    units: body?.current_units || null,
    source: "OPEN_METEO_RETURNED_WEATHER_MODEL",
    evidenceClass: "RETURNED_PUBLIC_WEATHER_MODEL_NOT_STATION_MEASUREMENT",
  };
}

async function sar(next: RuntimeNext, request: Request, env: any, ctx: any) {
  try {
    const u = new URL(request.url);
    u.pathname = "/api/earth/sar/r198/search";
    u.search = "?providers=sentinel1&days=10&limit=24";
    const response = await next(new Request(u.toString(), { method: "GET", headers: request.headers }), env, ctx);
    const body = await response.json().catch(() => null);
    return { ok: response.ok, status: response.status, body };
  } catch (error) {
    return { ok: false, status: 0, error: error instanceof Error ? error.message : String(error), body: null };
  }
}

function gibsDate(): string {
  const d = new Date(Date.now() - 86400000);
  return d.toISOString().slice(0, 10);
}

function gibsUrl(date: string): string {
  const u = new URL("https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi");
  u.searchParams.set("SERVICE", "WMS"); u.searchParams.set("REQUEST", "GetMap"); u.searchParams.set("VERSION", "1.3.0");
  u.searchParams.set("LAYERS", "VIIRS_SNPP_CorrectedReflectance_TrueColor"); u.searchParams.set("STYLES", "");
  u.searchParams.set("FORMAT", "image/jpeg"); u.searchParams.set("CRS", "EPSG:4326");
  u.searchParams.set("BBOX", "-90,-180,90,180"); u.searchParams.set("WIDTH", "2048"); u.searchParams.set("HEIGHT", "1024");
  u.searchParams.set("TIME", date); return u.toString();
}

export async function handleEarthSpatialEvidenceR214(request: Request, env: any, ctx: any, next: RuntimeNext): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== "/api/earth/spatial/r214" && url.pathname !== "/api/earth/spatial/r214/manifest") return null;
  if (request.method !== "GET") return json({ ok: false, code: "METHOD_NOT_ALLOWED", allowed: ["GET"] }, 405);
  if (url.pathname.endsWith("/manifest")) return json({
    ok: true, schema: "OMEGA_EARTH_SPATIAL_MANIFEST_R214", revision: "R214", release: EARTH_SPATIAL_EVIDENCE_RELEASE_R214,
    layers: {
      baseMap: { source: "NASA_GIBS_VIIRS_TRUE_COLOR", spatial: true },
      seismic: { source: "USGS_EARTHQUAKE_HAZARDS_PROGRAM", spatial: true, fields: ["lon","lat","depthKm","magnitude","time","place"] },
      naturalEvents: { source: "NASA_EONET", spatial: true },
      sar: { source: "R198_PUBLIC_SAR_CATALOGS", spatial: "ONLY_WHERE_SOURCE_GEOMETRY_EXISTS" },
      weather: { source: "OPEN_METEO", spatial: "SELECTED_POINT_ONLY", authority: "RETURNED_PUBLIC_WEATHER_MODEL_NOT_STATION_MEASUREMENT" },
      spaceWeather: { source: "NOAA_SWPC", spatial: false, authority: "GLOBAL_INDEX_NOT_LOCAL_GEOGRAPHY" },
      omegaModel: { source: "OMEGA", spatial: false, authority: "MODEL_LAYER_SEPARATE_FROM_OBSERVATION" },
    },
    rule: "Render evidence where its source says it occurred; derive summaries from spatial evidence, never derive spatial locations from summaries.",
    canonicalMutation: false, promotionAuthorized: false,
  });

  const statuses: Record<string, any> = {};
  const [quakeResult, eventResult, kpResult, sarResult, weatherResult] = await Promise.all([
    fetchJson("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson", 8000).then((v) => ({ ok: true, v })).catch((e) => ({ ok: false, e: String(e) })),
    fetchJson("https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=200", 8000).then((v) => ({ ok: true, v })).catch((e) => ({ ok: false, e: String(e) })),
    fetchJson("https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json", 7000).then((v) => ({ ok: true, v })).catch((e) => ({ ok: false, e: String(e) })),
    sar(next, request, env, ctx),
    selectedWeather(url).then((v) => ({ ok: true, v })).catch((e) => ({ ok: false, e: String(e), v: null })),
  ]);
  const earthquakes = quakeResult.ok ? normalizeQuakes((quakeResult as any).v) : [];
  const events = eventResult.ok ? normalizeEvents((eventResult as any).v) : [];
  const spaceWeather = kpResult.ok ? normalizeKp((kpResult as any).v) : null;
  const weather = weatherResult.ok ? (weatherResult as any).v : null;
  const sarObservations = Array.isArray(sarResult?.body?.observations) ? sarResult.body.observations : [];
  statuses.seismic = { ok: quakeResult.ok, count: earthquakes.length, error: (quakeResult as any).e || null };
  statuses.naturalEvents = { ok: eventResult.ok, count: events.length, error: (eventResult as any).e || null };
  statuses.spaceWeather = { ok: kpResult.ok && Boolean(spaceWeather), error: (kpResult as any).e || null };
  statuses.sar = { ok: sarResult.ok, count: sarObservations.length, status: sarResult.status, error: (sarResult as any).error || null };
  statuses.weather = { ok: Boolean(weather), requested: url.searchParams.has("lat") && url.searchParams.has("lon"), error: (weatherResult as any).e || null };
  const date = gibsDate();
  const evidenceCore = { earthquakes, events, sarObservations, weather, spaceWeather, statuses, basemapDate: date };
  return json({
    ok: true,
    schema: "OMEGA_EARTH_SPATIAL_EVIDENCE_R214",
    revision: "R214",
    release: EARTH_SPATIAL_EVIDENCE_RELEASE_R214,
    generatedAt: new Date().toISOString(),
    canonicalGitSha: env?.CANONICAL_GIT_SHA || null,
    basemap: { source: "NASA_GIBS_VIIRS_SNPP_TRUE_COLOR", date, href: gibsUrl(date), authority: "RETURNED_REMOTE_SENSING_IMAGE_IF_IMAGE_REQUEST_SUCCEEDS" },
    statuses,
    seismic: { source: "USGS", count: earthquakes.length, maxMagnitude: earthquakes.reduce((m: number | null, q: any) => q.magnitude == null ? m : m == null ? q.magnitude : Math.max(m, q.magnitude), null), earthquakes },
    naturalEvents: { source: "NASA_EONET", count: events.length, events },
    sar: { source: "R198_PUBLIC_SAR_CATALOGS", count: sarObservations.length, observations: sarObservations },
    weather,
    spaceWeather,
    evidenceSha256: await sha256(evidenceCore),
    truthBoundary: {
      seismicLocations: "SOURCE_COORDINATES_ONLY",
      sarLocations: "SOURCE_GEOMETRY_ONLY",
      naturalEventLocations: "SOURCE_GEOMETRY_ONLY",
      weather: "SELECTED_POINT_RETURNED_PUBLIC_MODEL; NOT GLOBAL OBSERVATION FIELD",
      spaceWeather: "GLOBAL INDEX; NOT DRAWN AS LOCAL GEOGRAPHY",
      omegaModel: "SEPARATE MODEL/INTERFACE SHELL; NEVER DRAWN AS OBSERVED EARTH",
      noSummaryToFakeGeometry: true,
      canonicalMutation: false,
      promotionAuthorized: false,
    },
  });
}

const style = `<style id="omegaEarthSpatialR214Style">
#omegaEarthTruthLayers{display:none!important}#omegaEarthSpatialR214{margin:14px 0 28px;border:1px solid #29475a;border-radius:20px;overflow:hidden;background:#050c12;color:#edf5fb}.r214Head{display:flex;justify-content:space-between;gap:14px;padding:16px 18px;border-bottom:1px solid #213746}.r214Head h2{margin:4px 0 5px;font-size:clamp(1.4rem,2.7vw,2.35rem)}.r214Ey{font:800 10px ui-monospace,monospace;letter-spacing:.13em;color:#76cde9}.r214Muted{color:#91a8b7;font-size:12px}.r214Btn{border:1px solid #3b6076;border-radius:10px;background:#0b1a23;color:#eaf5fa;padding:9px 11px;cursor:pointer;font-weight:800}.r214Layers{display:flex;gap:6px;flex-wrap:wrap;padding:10px 12px;border-bottom:1px solid #1b303d}.r214Layer{border:1px solid #2c4556;border-radius:999px;background:#07151d;color:#9fb6c5;padding:7px 10px;cursor:pointer;font:800 10px ui-monospace,monospace}.r214Layer[data-on="1"]{background:#123044;color:#fff;border-color:#5d91a8}.r214Layer:disabled{opacity:.35;cursor:not-allowed}.r214Grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(330px,.45fr);gap:11px;padding:11px}.r214Map{position:relative;min-height:590px;border:1px solid #203b4c;border-radius:15px;overflow:hidden;background:#02070b}.r214Map canvas{display:block;width:100%;height:590px;cursor:grab}.r214Map canvas:active{cursor:grabbing}.r214Hud{position:absolute;left:9px;right:9px;top:9px;display:flex;gap:7px;justify-content:space-between;pointer-events:none}.r214Pill{border:1px solid #315165;border-radius:999px;background:#051018dd;padding:5px 8px;font:800 9px ui-monospace,monospace}.r214Side{display:grid;gap:9px;align-content:start}.r214Card{border:1px solid #223d4d;border-radius:13px;background:#07141c;padding:10px}.r214MetricGrid{display:grid;grid-template-columns:1fr 1fr;gap:6px}.r214Metric{border:1px solid #263f50;border-radius:9px;background:#091820;padding:8px}.r214Metric small{display:block;color:#718a9b;font-size:9px}.r214Metric b{font-size:17px}.r214List{max-height:280px;overflow:auto}.r214Quake{display:grid;grid-template-columns:52px 1fr auto;gap:8px;padding:7px 3px;border-bottom:1px solid #18303d;cursor:pointer}.r214Quake:hover,.r214Quake[data-selected="1"]{background:#10232e}.r214Mag{font-size:19px;font-weight:900}.r214Quake small{display:block;color:#7892a3}.r214Proof{white-space:pre-wrap;word-break:break-word;max-height:190px;overflow:auto;font:9px/1.4 ui-monospace,monospace;color:#91a9b8}.r214Weather{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}.r214Warning{color:#e6bd6a}.r214Bad{color:#e98585}@media(max-width:980px){.r214Grid{grid-template-columns:1fr}.r214Map,.r214Map canvas{height:500px;min-height:500px}}@media(max-width:620px){#omegaEarthSpatialR214{border-radius:14px}.r214Head{display:block;padding:12px}.r214Head .r214Btn{margin-top:9px}.r214Layers{overflow-x:auto;flex-wrap:nowrap}.r214Layer{white-space:nowrap}.r214Grid{padding:8px}.r214Map,.r214Map canvas{height:390px;min-height:390px}.r214MetricGrid{grid-template-columns:1fr 1fr}}
</style>`;

const markup = `<section id="omegaEarthSpatialR214" aria-label="Source-backed spatial Earth evidence"><div class="r214Head"><div><div class="r214Ey">R214 · SPATIAL EARTH EVIDENCE · NO SUMMARY-TO-GEOMETRY FABRICATION</div><h2>Earth evidence where it actually occurred.</h2><div class="r214Muted">True-color NASA GIBS context under source-coordinate USGS seismicity, NASA EONET geometry and public SAR footprints. OMEGA model state remains a separate layer.</div></div><button class="r214Btn" id="r214Refresh">REFRESH SOURCE EVIDENCE</button></div><div class="r214Layers"><button class="r214Layer" data-r214-layer="BASEMAP" data-on="1">BASEMAP</button><button class="r214Layer" data-r214-layer="SEISMIC" data-on="1">SEISMIC</button><button class="r214Layer" data-r214-layer="EVENTS" data-on="1">EVENTS</button><button class="r214Layer" data-r214-layer="SAR" data-on="1">SAR</button><button class="r214Layer" data-r214-layer="WEATHER" data-on="1">WEATHER · SELECTED POINT</button><button class="r214Layer" data-r214-layer="SPACE" data-on="1">SPACE WEATHER · GLOBAL</button><button class="r214Layer" data-r214-layer="OMEGA" data-on="0">OMEGA MODEL · SEPARATE</button></div><div class="r214Grid"><div class="r214Map"><canvas id="r214Canvas"></canvas><div class="r214Hud"><span class="r214Pill" id="r214Status">LOADING</span><span class="r214Pill" id="r214View">CENTER 0°,0° · Z1.0</span></div></div><aside class="r214Side"><div class="r214Card"><div class="r214MetricGrid"><div class="r214Metric"><small>USGS · 24H EVENTS</small><b id="r214QuakeCount">—</b></div><div class="r214Metric"><small>MAX MAGNITUDE</small><b id="r214MaxMag">—</b></div><div class="r214Metric"><small>NASA EONET OPEN</small><b id="r214EventCount">—</b></div><div class="r214Metric"><small>SAR FOOTPRINTS</small><b id="r214SarCount">—</b></div></div></div><div class="r214Card"><div class="r214Ey">SELECTED EARTH POINT</div><div id="r214Selected" class="r214Muted">Select an earthquake to inspect exact source coordinates and returned weather context.</div><div style="margin-top:7px"><button class="r214Btn" id="r214Weather">LOAD RETURNED WEATHER AT SELECTION</button></div><div id="r214WeatherOut" class="r214Muted" style="margin-top:7px">Weather is not painted globally without a source field.</div></div><div class="r214Card"><div class="r214Ey">SEISMIC TIMELINE · SOURCE COORDINATES</div><div class="r214List" id="r214Quakes"></div></div><div class="r214Card"><div class="r214Ey">PROVENANCE / LAYER HEALTH</div><pre class="r214Proof" id="r214Proof">Loading.</pre></div></aside></div></section>`;

const script = `<script id="omegaEarthSpatialR214Runtime">(()=>{const $=s=>document.querySelector(s),all=s=>Array.from(document.querySelectorAll(s));if(document.documentElement.dataset.omegaEarthSpatialR214)return;const legacy=$('#omegaEarthTruthLayers'),host=legacy?.parentElement||document.querySelector('.app.active')||document.querySelector('main')||document.body;if(!host)return;document.documentElement.dataset.omegaEarthSpatialR214='r214';const box=document.createElement('div');box.innerHTML=${JSON.stringify(markup)};const root=box.firstElementChild;if(legacy)legacy.before(root);else host.prepend(root);let data=null,selected=null,weather=null,center={lon:0,lat:0},zoom=1,drag=null,baseImage=null,baseReady=false;const layers=new Map(all('[data-r214-layer]').map(b=>[b.dataset.r214Layer,b.dataset.on==='1']));const esc=v=>String(v??'');function fit(c){const r=c.getBoundingClientRect(),D=Math.min(2,devicePixelRatio||1),x=c.getContext('2d');c.width=Math.max(1,Math.round(r.width*D));c.height=Math.max(1,Math.round(r.height*D));x.setTransform(D,0,0,D,0,0);return{x,W:r.width,H:r.height}}function project(lon,lat,W,H){let dx=lon-center.lon;while(dx>180)dx-=360;while(dx<-180)dx+=360;return[W/2+dx/360*W*zoom,H/2-(lat-center.lat)/180*H*zoom]}function drawPolygon(x,coords,W,H){const rings=[];const walk=v=>{if(!Array.isArray(v))return;if(v.length>=2&&typeof v[0]==='number'&&typeof v[1]==='number'){return}if(v.length&&Array.isArray(v[0])&&v[0].length>=2&&typeof v[0][0]==='number'){rings.push(v);return}v.forEach(walk)};walk(coords);for(const ring of rings){let started=false;x.beginPath();for(const p of ring){const [px,py]=project(Number(p[0]),Number(p[1]),W,H);if(!started){x.moveTo(px,py);started=true}else x.lineTo(px,py)}if(started){x.closePath();x.stroke()}}}function draw(){const c=$('#r214Canvas');if(!c)return;const {x,W,H}=fit(c);x.fillStyle='#02070b';x.fillRect(0,0,W,H);if(layers.get('BASEMAP')&&baseReady&&baseImage){const sw=baseImage.width/zoom,sh=baseImage.height/zoom;let sx=(center.lon+180)/360*baseImage.width-sw/2,sy=(90-center.lat)/180*baseImage.height-sh/2;sx=Math.max(0,Math.min(baseImage.width-sw,sx));sy=Math.max(0,Math.min(baseImage.height-sh,sy));x.globalAlpha=.82;x.drawImage(baseImage,sx,sy,sw,sh,0,0,W,H);x.globalAlpha=1}else{x.fillStyle='#071822';x.fillRect(0,0,W,H)}x.strokeStyle='rgba(220,235,242,.16)';x.lineWidth=1;for(let lon=-180;lon<=180;lon+=30){const [px]=project(lon,0,W,H);x.beginPath();x.moveTo(px,0);x.lineTo(px,H);x.stroke()}for(let lat=-60;lat<=60;lat+=30){const [,py]=project(0,lat,W,H);x.beginPath();x.moveTo(0,py);x.lineTo(W,py);x.stroke()}if(layers.get('SAR')){x.strokeStyle='rgba(78,202,255,.75)';x.lineWidth=1.5;for(const o of data?.sar?.observations||[]){if(Array.isArray(o?.geometry?.coordinates))drawPolygon(x,o.geometry.coordinates,W,H);else if(Array.isArray(o?.bbox)&&o.bbox.length>=4){const a=project(o.bbox[0],o.bbox[3],W,H),b=project(o.bbox[2],o.bbox[1],W,H);x.strokeRect(a[0],a[1],b[0]-a[0],b[1]-a[1])}}}if(layers.get('EVENTS')){x.strokeStyle='rgba(86,219,143,.9)';x.fillStyle='rgba(86,219,143,.75)';for(const e of data?.naturalEvents?.events||[]){if(e.geometryType==='Point'&&Array.isArray(e.coordinates)){const p=project(Number(e.coordinates[0]),Number(e.coordinates[1]),W,H);x.beginPath();x.arc(p[0],p[1],4,0,Math.PI*2);x.fill()}else drawPolygon(x,e.coordinates,W,H)}}if(layers.get('SEISMIC'))for(const q of data?.seismic?.earthquakes||[]){const p=project(q.lon,q.lat,W,H),m=Number(q.magnitude||0),r=Math.max(2,Math.min(13,2+m*1.55));x.beginPath();x.arc(p[0],p[1],r,0,Math.PI*2);x.fillStyle=q===selected?'rgba(255,255,255,.95)':'rgba(255,191,78,.84)';x.fill();x.strokeStyle='rgba(65,18,12,.8)';x.stroke()}if(layers.get('WEATHER')&&weather){const p=project(weather.lon,weather.lat,W,H);x.strokeStyle='rgba(111,178,255,.95)';x.lineWidth=2;x.beginPath();x.arc(p[0],p[1],9,0,Math.PI*2);x.stroke();const dir=Number(weather.current?.wind_direction_10m||0)*Math.PI/180,spd=Math.min(34,8+Number(weather.current?.wind_speed_10m||0)*.45);x.beginPath();x.moveTo(p[0],p[1]);x.lineTo(p[0]+Math.sin(dir)*spd,p[1]-Math.cos(dir)*spd);x.stroke()}if(layers.get('OMEGA')){x.setLineDash([6,6]);x.strokeStyle='rgba(183,112,255,.7)';x.lineWidth=2;x.strokeRect(8,8,W-16,H-16);x.setLineDash([]);x.fillStyle='rgba(208,176,255,.9)';x.font='800 10px ui-monospace,monospace';x.fillText('OMEGA MODEL / INTERFACE SHELL · NOT OBSERVED EARTH',14,H-14)}$('#r214View').textContent='CENTER '+center.lon.toFixed(1)+'°,'+center.lat.toFixed(1)+'° · Z'+zoom.toFixed(1)}function render(){const s=data?.statuses||{};for(const b of all('[data-r214-layer]')){const k=b.dataset.r214Layer;if(k==='SEISMIC')b.disabled=s.seismic?.ok!==true;if(k==='EVENTS')b.disabled=s.naturalEvents?.ok!==true;if(k==='SAR')b.disabled=s.sar?.ok!==true;if(k==='SPACE')b.disabled=s.spaceWeather?.ok!==true}$('#r214QuakeCount').textContent=String(data?.seismic?.count??'—');$('#r214MaxMag').textContent=data?.seismic?.maxMagnitude==null?'—':Number(data.seismic.maxMagnitude).toFixed(1);$('#r214EventCount').textContent=String(data?.naturalEvents?.count??'—');$('#r214SarCount').textContent=String(data?.sar?.count??'—');$('#r214Status').textContent='BOUND · '+String(data?.evidenceSha256||'').slice(0,12);$('#r214Proof').textContent=JSON.stringify({generatedAt:data?.generatedAt,statuses:data?.statuses,spaceWeather:data?.spaceWeather,basemap:data?.basemap,evidenceSha256:data?.evidenceSha256,truthBoundary:data?.truthBoundary},null,2);const qs=(data?.seismic?.earthquakes||[]).slice(0,80);$('#r214Quakes').innerHTML=qs.map((q,i)=>'<div class="r214Quake" data-r214-q="'+i+'"><div class="r214Mag">'+(q.magnitude==null?'—':Number(q.magnitude).toFixed(1))+'</div><div><b>'+esc(q.place||q.id)+'</b><small>'+esc(q.time||'time withheld')+' · '+q.lat.toFixed(3)+', '+q.lon.toFixed(3)+' · '+q.depthKm.toFixed(1)+' km depth</small></div><small>'+esc(q.source)+'</small></div>').join('')||'<div class="r214Muted">No returned USGS spatial events.</div>';all('[data-r214-q]').forEach(el=>el.addEventListener('click',()=>select(qs[Number(el.dataset.r214Q)])));if(data?.basemap?.href){baseImage=new Image();baseImage.crossOrigin='anonymous';baseImage.onload=()=>{baseReady=true;draw()};baseImage.onerror=()=>{baseReady=false;$('#r214Status').textContent+=' · BASEMAP UNAVAILABLE';draw()};baseImage.src=data.basemap.href}draw()}function select(q){selected=q;center={lon:q.lon,lat:q.lat};zoom=Math.max(zoom,2.2);$('#r214Selected').textContent='M'+(q.magnitude==null?'—':q.magnitude)+' · '+(q.place||q.id)+' · '+q.lat.toFixed(4)+', '+q.lon.toFixed(4)+' · depth '+q.depthKm.toFixed(1)+' km · '+(q.time||'time withheld');all('[data-r214-q]').forEach((el,i)=>el.dataset.selected=(data?.seismic?.earthquakes||[])[i]===q?'1':'0');weather=null;$('#r214WeatherOut').textContent='Weather not loaded for this point.';draw()}async function load(withWeather=false){$('#r214Status').textContent='LOADING SOURCE EVIDENCE';let url='/api/earth/spatial/r214';if(withWeather&&selected)url+='?lat='+encodeURIComponent(selected.lat)+'&lon='+encodeURIComponent(selected.lon);try{const r=await fetch(url,{cache:'no-store'}),j=await r.json();if(!r.ok)throw new Error('HTTP '+r.status);data=j;if(withWeather)weather=j.weather;render();if(withWeather)$('#r214WeatherOut').textContent=weather?JSON.stringify({source:weather.source,evidenceClass:weather.evidenceClass,coordinates:[weather.lat,weather.lon],current:weather.current,units:weather.units},null,2):'No returned weather model at selection.'}catch(e){$('#r214Status').textContent='SOURCE LOAD DEGRADED';$('#r214Proof').textContent=String(e)}}all('[data-r214-layer]').forEach(b=>b.addEventListener('click',()=>{if(b.disabled)return;const k=b.dataset.r214Layer,l=!layers.get(k);layers.set(k,l);b.dataset.on=l?'1':'0';draw()}));$('#r214Refresh').addEventListener('click',()=>load(false));$('#r214Weather').addEventListener('click',()=>selected?load(true):$('#r214WeatherOut').textContent='Select an exact source-coordinate earthquake first.');const c=$('#r214Canvas');c.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(1,Math.min(12,zoom*(e.deltaY<0?1.18:.85)));draw()},{passive:false});c.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,lon:center.lon,lat:center.lat};c.setPointerCapture(e.pointerId)});c.addEventListener('pointermove',e=>{if(!drag)return;const r=c.getBoundingClientRect();center.lon=drag.lon-(e.clientX-drag.x)/r.width*360/zoom;center.lat=Math.max(-85,Math.min(85,drag.lat+(e.clientY-drag.y)/r.height*180/zoom));while(center.lon>180)center.lon-=360;while(center.lon<-180)center.lon+=360;draw()});c.addEventListener('pointerup',()=>drag=null);window.addEventListener('resize',draw,{passive:true});load(false)})();</script>`;

export async function enhanceEarthSpatialEvidenceR214(response: Response, requestUrl: string): Promise<Response> {
  const url = new URL(requestUrl);
  const earthApp = (url.searchParams.get("app") || "").toLowerCase() === "earth" || url.pathname === "/earth" || url.pathname.startsWith("/earth/");
  if (!earthApp || !(response.headers.get("content-type") || "").includes("text/html")) return response;
  let html = await response.text();
  if (!html.includes('id="omegaEarthSpatialR214Runtime"')) {
    html = html.includes("</head>") ? html.replace("</head>", style + "</head>") : style + html;
    html = html.includes("</body>") ? html.replace("</body>", script + "</body>") : html + script;
  }
  const headers = new Headers(response.headers);
  headers.set("cache-control", "no-store");
  headers.set("x-omega-earth-spatial", EARTH_SPATIAL_EVIDENCE_RELEASE_R214);
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
