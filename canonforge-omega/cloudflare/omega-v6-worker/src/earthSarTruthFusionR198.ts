export const EARTH_SAR_TRUTH_R198 = "r198-real-public-sar-truth-fusion";

const PROVIDERS = {
  sentinel1: {
    id: "sentinel1",
    label: "Copernicus Sentinel-1",
    band: "C",
    mode: "dynamic-stac",
    endpoint: "https://stac.dataspace.copernicus.eu/v1/search",
    root: "https://stac.dataspace.copernicus.eu/v1/",
    collection: "sentinel-1-grd",
    evidence: "OBSERVED_SOURCE",
  },
  nisar: {
    id: "nisar",
    label: "NASA-ISRO NISAR",
    band: "L/S",
    mode: "cmr-discovery",
    endpoint: "https://cmr.earthdata.nasa.gov/search/collections.json?keyword=NISAR&page_size=12",
    root: "https://cmr.earthdata.nasa.gov/search/",
    evidence: "OBSERVED_SOURCE",
  },
  umbra: {
    id: "umbra",
    label: "Umbra Open Data",
    band: "X",
    mode: "static-stac",
    endpoint: "https://s3.us-west-2.amazonaws.com/umbra-open-data-catalog/stac/catalog.json",
    root: "https://s3.us-west-2.amazonaws.com/umbra-open-data-catalog/stac/catalog.json",
    evidence: "OBSERVED_SOURCE",
  },
  capella: {
    id: "capella",
    label: "Capella Open Data",
    band: "X",
    mode: "static-stac",
    endpoint: "https://capella-open-data.s3.us-west-2.amazonaws.com/stac/catalog.json",
    root: "https://capella-open-data.s3.us-west-2.amazonaws.com/stac/catalog.json",
    evidence: "OBSERVED_SOURCE",
  },
  iceye: {
    id: "iceye",
    label: "ICEYE Open Data",
    band: "X",
    mode: "static-stac",
    endpoint: "https://iceye-open-data-catalog.s3.amazonaws.com/collections/iceye-sar.json",
    root: "https://iceye-open-data-catalog.s3.amazonaws.com/collections/iceye-sar.json",
    evidence: "OBSERVED_SOURCE",
  },
} as const;

type ProviderId = keyof typeof PROVIDERS;
type Box = [number, number, number, number];

type SarObservation = {
  id: string;
  provider: ProviderId;
  provider_label: string;
  mission: string;
  band: string;
  datetime: string | null;
  bbox: Box | null;
  center: [number, number] | null;
  geometry: any | null;
  polarization: string[];
  resolution_m: number | null;
  orbit_state: string | null;
  incidence_angle_deg: number | null;
  product_type: string | null;
  assets: Array<{ key: string; href: string; type: string | null; roles: string[] }>;
  source_href: string | null;
  evidence_class: "OBSERVED_SOURCE";
  calibration: {
    coordinate_authority: "SOURCE_GEOMETRY" | "WITHHELD";
    temporal_authority: "SOURCE_TIME" | "WITHHELD";
    sensor_frame: string;
    completeness: number;
  };
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-omega-earth-truth": EARTH_SAR_TRUTH_R198,
    },
  });
}

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function parseBbox(raw: string | null): Box | null {
  if (!raw) return null;
  const a = raw.split(",").map(Number);
  if (a.length !== 4 || a.some((v) => !Number.isFinite(v))) return null;
  const [w, s, e, n] = a;
  if (w < -180 || e > 180 || s < -90 || n > 90 || w >= e || s >= n) return null;
  return [w, s, e, n];
}

function bboxIntersects(a: Box | null, b: Box | null): boolean {
  if (!a || !b) return true;
  return !(a[2] < b[0] || a[0] > b[2] || a[3] < b[1] || a[1] > b[3]);
}

function bboxCenter(b: Box | null): [number, number] | null {
  return b ? [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2] : null;
}

function geometryBbox(g: any): Box | null {
  const coords: number[][] = [];
  function walk(v: any): void {
    if (!Array.isArray(v)) return;
    if (v.length >= 2 && typeof v[0] === "number" && typeof v[1] === "number") {
      const x = Number(v[0]), y = Number(v[1]);
      if (Number.isFinite(x) && Number.isFinite(y)) coords.push([x, y]);
      return;
    }
    for (const x of v) walk(x);
  }
  walk(g?.coordinates);
  if (!coords.length) return null;
  const xs = coords.map((p) => p[0]), ys = coords.map((p) => p[1]);
  const b: Box = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  return b.every(Number.isFinite) ? b : null;
}

function dateText(v: any): string | null {
  const x = v == null ? null : String(v);
  if (!x) return null;
  const t = Date.parse(x);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

function strings(v: any): string[] {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (v == null || v === "") return [];
  return [String(v)];
}

function assetList(assets: any): SarObservation["assets"] {
  if (!assets || typeof assets !== "object") return [];
  return Object.entries(assets).flatMap(([key, raw]: [string, any]) => {
    const href = typeof raw?.href === "string" ? raw.href : "";
    if (!href) return [];
    return [{ key, href, type: raw?.type ? String(raw.type) : null, roles: strings(raw?.roles) }];
  }).slice(0, 18);
}

function resolutionOf(p: any): number | null {
  const candidates = [
    p?.resolution,
    p?.["gsd"],
    p?.["sar:resolution_range"],
    p?.["sar:resolution_azimuth"],
    p?.["proj:shape"] && p?.["gsd"],
  ].map(num).filter((v): v is number => v != null && v > 0);
  return candidates.length ? Math.min(...candidates) : null;
}

function normalizeStac(item: any, provider: ProviderId): SarObservation | null {
  if (!item || typeof item !== "object") return null;
  const P = PROVIDERS[provider];
  const props = item.properties || {};
  const rawB = Array.isArray(item.bbox) && item.bbox.length >= 4
    ? [num(item.bbox[0]), num(item.bbox[1]), num(item.bbox[item.bbox.length - 2]), num(item.bbox[item.bbox.length - 1])]
    : null;
  let bbox: Box | null = rawB && rawB.every((v) => v != null)
    ? [rawB[0] as number, rawB[1] as number, rawB[2] as number, rawB[3] as number]
    : geometryBbox(item.geometry);
  if (bbox && (bbox[0] < -180 || bbox[2] > 180 || bbox[1] < -90 || bbox[3] > 90)) bbox = null;
  const dt = dateText(props.datetime || props.start_datetime || item.datetime);
  const pol = strings(props["sar:polarizations"] || props.polarizations || props.polarization);
  const orbit = props["sat:orbit_state"] || props["sar:orbit_state"] || props.orbitDirection || props.orbit_state;
  const inc = num(props["sar:incidence_angle"] || props.incidenceAngle || props.incidence_angle);
  const product = props["sar:product_type"] || props.productType || props.product_type || item.collection;
  const assets = assetList(item.assets);
  const sourceHref = Array.isArray(item.links)
    ? (item.links.find((l: any) => l?.rel === "self")?.href || item.links.find((l: any) => l?.rel === "canonical")?.href || null)
    : null;
  let complete = 0;
  complete += bbox ? 0.32 : 0;
  complete += dt ? 0.22 : 0;
  complete += pol.length ? 0.12 : 0;
  complete += resolutionOf(props) ? 0.12 : 0;
  complete += orbit ? 0.08 : 0;
  complete += assets.length ? 0.14 : 0;
  return {
    id: String(item.id || props.id || `${provider}-unnamed`),
    provider,
    provider_label: P.label,
    mission: String(props.mission || props.platform || props.constellation || P.label),
    band: P.band,
    datetime: dt,
    bbox,
    center: bboxCenter(bbox),
    geometry: bbox ? (item.geometry || null) : null,
    polarization: pol,
    resolution_m: resolutionOf(props),
    orbit_state: orbit ? String(orbit) : null,
    incidence_angle_deg: inc,
    product_type: product ? String(product) : null,
    assets,
    source_href: sourceHref,
    evidence_class: "OBSERVED_SOURCE",
    calibration: {
      coordinate_authority: bbox ? "SOURCE_GEOMETRY" : "WITHHELD",
      temporal_authority: dt ? "SOURCE_TIME" : "WITHHELD",
      sensor_frame: `${P.band}-band/${pol.length ? pol.join("+") : "polarization-unreported"}`,
      completeness: Math.round(clamp(complete, 0, 1) * 1000) / 1000,
    },
  };
}

async function fetchJson(url: string, init?: RequestInit, timeoutMs = 8500): Promise<any> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { ...(init || {}), signal: ctrl.signal, headers: { accept: "application/json", ...(init?.headers || {}) } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}

async function sentinelSearch(bbox: Box | null, start: string, end: string, limit: number): Promise<SarObservation[]> {
  const body: any = {
    collections: [PROVIDERS.sentinel1.collection],
    datetime: `${start}/${end}`,
    limit,
    sortby: [{ field: "properties.datetime", direction: "desc" }],
  };
  if (bbox) body.bbox = bbox;
  const d = await fetchJson(PROVIDERS.sentinel1.endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const features = Array.isArray(d?.features) ? d.features : [];
  return features.map((x: any) => normalizeStac(x, "sentinel1")).filter(Boolean) as SarObservation[];
}

function absolutize(base: string, href: string): string | null {
  try { return new URL(href, base).toString(); } catch { return null; }
}

async function staticStacSearch(provider: "umbra" | "capella" | "iceye", bbox: Box | null, startMs: number, endMs: number, limit: number): Promise<SarObservation[]> {
  const root = PROVIDERS[provider].root;
  const queue = [root];
  const seen = new Set<string>();
  const out: SarObservation[] = [];
  let docs = 0;
  while (queue.length && docs < 36 && out.length < limit) {
    const url = queue.shift()!;
    if (seen.has(url)) continue;
    seen.add(url);
    docs++;
    let d: any;
    try { d = await fetchJson(url, undefined, 6500); } catch { continue; }
    const candidates = Array.isArray(d?.features) ? d.features : (d?.type === "Feature" ? [d] : []);
    for (const raw of candidates) {
      const obs = normalizeStac(raw, provider);
      if (!obs) continue;
      const t = obs.datetime ? Date.parse(obs.datetime) : NaN;
      if (Number.isFinite(t) && (t < startMs || t > endMs)) continue;
      if (!bboxIntersects(obs.bbox, bbox)) continue;
      out.push(obs);
      if (out.length >= limit) break;
    }
    const links = Array.isArray(d?.links) ? d.links : [];
    for (const l of links) {
      if (!l?.href || !["child", "item", "items", "collection"].includes(String(l.rel))) continue;
      const next = absolutize(url, String(l.href));
      if (next && !seen.has(next) && queue.length < 90) queue.push(next);
    }
  }
  return out.sort((a, b) => (Date.parse(b.datetime || "") || 0) - (Date.parse(a.datetime || "") || 0));
}

async function nisarDiscovery(): Promise<any[]> {
  const d = await fetchJson(PROVIDERS.nisar.endpoint, undefined, 7000);
  const entries = Array.isArray(d?.feed?.entry) ? d.feed.entry : [];
  return entries.map((x: any) => ({
    id: String(x.id || x.concept_id || x.short_name || "nisar-collection"),
    short_name: x.short_name ? String(x.short_name) : null,
    version_id: x.version_id ? String(x.version_id) : null,
    title: x.dataset_id ? String(x.dataset_id) : (x.title ? String(x.title) : "NISAR collection"),
    updated: dateText(x.updated),
    evidence_class: "OBSERVED_SOURCE",
    coordinate_authority: "WITHHELD_UNTIL_GRANULE_GEOMETRY",
  }));
}

async function providerStatus(): Promise<any[]> {
  return Promise.all((Object.keys(PROVIDERS) as ProviderId[]).map(async (id) => {
    const p = PROVIDERS[id];
    const t0 = Date.now();
    try {
      await fetch(p.mode === "dynamic-stac" ? p.root : p.endpoint, { method: "GET", headers: { accept: "application/json" } });
      return { ...p, reachable: true, latency_ms: Date.now() - t0, checked_at: new Date().toISOString() };
    } catch (e) {
      return { ...p, reachable: false, latency_ms: Date.now() - t0, checked_at: new Date().toISOString(), error: String(e) };
    }
  }));
}

export async function handleEarthSarFusionR198(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/earth/sar/r198/")) return null;
  if (request.method !== "GET") return json({ ok: false, code: "METHOD_NOT_ALLOWED", allowed: ["GET"] }, 405);

  if (url.pathname.endsWith("/sources") || url.pathname.endsWith("/health")) {
    const providers = await providerStatus();
    return json({
      ok: true,
      build: EARTH_SAR_TRUTH_R198,
      truth_boundary: "OBSERVED_SOURCE != DERIVED_FRAMEWORK_MATH != INFERRED_STATE != FORECAST_PROJECTION",
      no_invented_coordinates: true,
      providers,
    });
  }

  if (url.pathname.endsWith("/search")) {
    const requested = (url.searchParams.get("providers") || "sentinel1,nisar,umbra,capella,iceye")
      .split(",").map((x) => x.trim()).filter((x): x is ProviderId => x in PROVIDERS);
    const bbox = parseBbox(url.searchParams.get("bbox"));
    if (url.searchParams.has("bbox") && !bbox) return json({ ok: false, code: "INVALID_BBOX", format: "west,south,east,north" }, 400);
    const days = clamp(Number(url.searchParams.get("days") || 30) || 30, 1, 3650);
    const limit = Math.round(clamp(Number(url.searchParams.get("limit") || 18) || 18, 1, 60));
    const end = new Date();
    const start = new Date(end.getTime() - days * 86400000);
    const startIso = start.toISOString(), endIso = end.toISOString();
    const jobs = requested.map(async (id) => {
      try {
        if (id === "sentinel1") return { provider: id, observations: await sentinelSearch(bbox, startIso, endIso, limit), discovery: [] };
        if (id === "nisar") return { provider: id, observations: [], discovery: await nisarDiscovery() };
        return { provider: id, observations: await staticStacSearch(id, bbox, start.getTime(), end.getTime(), limit), discovery: [] };
      } catch (e) {
        return { provider: id, observations: [], discovery: [], error: String(e) };
      }
    });
    const results = await Promise.all(jobs);
    const observations = results.flatMap((r) => r.observations).slice(0, limit * Math.max(1, requested.length));
    return json({
      ok: true,
      build: EARTH_SAR_TRUTH_R198,
      generated_at: new Date().toISOString(),
      query: { providers: requested, bbox, days, start: startIso, end: endIso, limit_per_provider: limit },
      truth_boundary: {
        observed: "Only metadata/geometry returned by public source catalogs is OBSERVED_SOURCE.",
        derived: "Frame normalization, display projection, completeness and cross-source relations are DERIVED_FRAMEWORK_MATH.",
        inferred: "WITHHELD unless a separately validated solver returns an inference with uncertainty.",
        forecast: "WITHHELD unless a separately admitted forecast model returns a projection.",
        insar: "No displacement claim is made from catalog metadata. InSAR requires phase-coherent products, co-registration, orbit/topography correction and coherence/error accounting.",
      },
      observed_count: observations.length,
      observations,
      discovery: results.flatMap((r) => r.discovery),
      provider_results: results.map((r) => ({ provider: r.provider, observed_count: r.observations.length, discovery_count: r.discovery.length, error: (r as any).error || null })),
    });
  }

  return json({ ok: false, code: "NOT_FOUND", paths: ["/api/earth/sar/r198/sources", "/api/earth/sar/r198/search"] }, 404);
}

const css = `<style id="omegaSarTruthR198Style">
#omegaSarTruthR198{margin:14px 0 28px;border:1px solid #29485e;border-radius:22px;overflow:hidden;background:#050d13}.sar198Head{display:flex;justify-content:space-between;gap:16px;padding:17px 18px;border-bottom:1px solid #20394b}.sar198Head h2{margin:4px 0 5px;font-size:clamp(1.35rem,2.6vw,2.2rem)}.sar198Ey{font-size:.61rem;letter-spacing:.15em;text-transform:uppercase;color:#7f98a9}.sar198Head p{margin:0;max-width:940px;color:#91a8b8;font-size:.76rem}.sar198Refresh{border:1px solid #3b6077;border-radius:12px;background:#0c1b25;padding:10px 13px;align-self:center;cursor:pointer}.sar198Controls{display:flex;gap:7px;flex-wrap:wrap;padding:11px 13px;border-bottom:1px solid #182e3c}.sar198Provider{border:1px solid #294356;border-radius:999px;background:#08151e;padding:7px 10px;cursor:pointer;font-size:.68rem}.sar198Provider[data-on="1"]{background:#143044;border-color:#5e91aa}.sar198Grid{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(300px,.55fr);gap:12px;padding:13px}.sar198Map{position:relative;min-height:430px;border:1px solid #203d50;border-radius:16px;overflow:hidden;background:#02070b}.sar198Map canvas{display:block;width:100%;height:430px}.sar198Hud{position:absolute;left:10px;right:10px;top:10px;display:flex;justify-content:space-between;gap:8px;pointer-events:none}.sar198Pill{border:1px solid #315064;border-radius:999px;background:#06111adf;padding:5px 8px;font-size:.58rem}.sar198Side{border:1px solid #203c4f;border-radius:16px;background:#07141c;padding:12px}.sar198Truth{display:grid;grid-template-columns:1fr 1fr;gap:7px}.sar198Truth div{border:1px solid #263f50;border-radius:11px;padding:8px;background:#091820}.sar198Truth small{display:block;color:#728a9b;font-size:.52rem;letter-spacing:.08em}.sar198Truth b{font-size:.7rem}.sar198List{margin-top:10px;max-height:260px;overflow:auto;border-top:1px solid #1d3545}.sar198Item{padding:8px 2px;border-bottom:1px solid #172c39}.sar198Item b{display:block;font-size:.67rem}.sar198Item span{display:block;color:#7790a1;font-size:.56rem;margin-top:2px}.sar198Proof{white-space:pre-wrap;max-height:220px;overflow:auto;font:10px/1.42 ui-monospace,monospace;color:#91a9b9}.sar198Note{margin-top:9px;color:#6e8798;font-size:.58rem;line-height:1.45}@media(max-width:900px){.sar198Grid{grid-template-columns:1fr}.sar198Map,.sar198Map canvas{height:380px;min-height:380px}}@media(max-width:620px){#omegaSarTruthR198{border-radius:15px}.sar198Head{display:block;padding:13px}.sar198Refresh{margin-top:10px}.sar198Grid{padding:9px}.sar198Map,.sar198Map canvas{height:320px;min-height:320px}.sar198Truth{grid-template-columns:1fr 1fr}.sar198Controls{overflow-x:auto;flex-wrap:nowrap}.sar198Provider{white-space:nowrap}}
</style>`;

const markup = `<section id="omegaSarTruthR198" aria-label="Real public synthetic aperture radar truth fusion"><div class="sar198Head"><div><div class="sar198Ey">R198 · REAL SAR / MULTI-SENSOR EARTH TRUTH</div><h2>Public radar observations, projected only where the source provides geometry.</h2><p>Sentinel-1, NISAR discovery, Umbra, Capella and ICEYE are joined as complementary source frames. Display projection and calibration relations are derived; missing coordinates, phase and displacement are never invented.</p></div><button id="sar198Refresh" class="sar198Refresh">REFRESH REAL SAR</button></div><div class="sar198Controls"><button class="sar198Provider" data-sar-provider="sentinel1" data-on="1">Sentinel-1 · C</button><button class="sar198Provider" data-sar-provider="nisar" data-on="1">NISAR · L/S</button><button class="sar198Provider" data-sar-provider="umbra" data-on="1">Umbra · X</button><button class="sar198Provider" data-sar-provider="capella" data-on="1">Capella · X</button><button class="sar198Provider" data-sar-provider="iceye" data-on="1">ICEYE · X</button></div><div class="sar198Grid"><div class="sar198Map"><canvas id="sar198Canvas"></canvas><div class="sar198Hud"><span class="sar198Pill" id="sar198Status">UNQUERIED</span><span class="sar198Pill">actual catalog geometry · equirectangular projection</span></div></div><aside class="sar198Side"><div class="sar198Truth"><div><small>OBSERVED_SOURCE</small><b id="sar198Observed">0</b></div><div><small>DERIVED_FRAMEWORK_MATH</small><b>DISPLAY / FRAME</b></div><div><small>INFERRED_STATE</small><b>WITHHELD</b></div><div><small>FORECAST_PROJECTION</small><b>WITHHELD</b></div></div><div class="sar198List" id="sar198List"><div class="sar198Item"><b>Awaiting public catalogs</b><span>No synthetic observation will be substituted.</span></div></div><details style="margin-top:9px"><summary class="sar198Ey">Provenance + calibration proof</summary><pre id="sar198Proof" class="sar198Proof">Unqueried.</pre></details><div class="sar198Note">R198 is additive. It does not mutate canonical state, Hybrid heartbeat truth, SAI authority, route admission, calibration kernels, or existing Earth layers. InSAR displacement remains withheld until phase-coherent source products and a validated processing chain are present.</div></aside></div></section>`;

const js = `<script id="omegaSarTruthR198Runtime">(()=>{const q=s=>document.querySelector(s),qa=s=>Array.from(document.querySelectorAll(s)),root=q('#omegaSarTruthR198');if(!root||document.documentElement.dataset.omegaSarTruthR198)return;document.documentElement.dataset.omegaSarTruthR198='r198';let data=null,busy=false,providers=new Set(['sentinel1','nisar','umbra','capella','iceye']);const C={sentinel1:'#e6bd4e',nisar:'#42cb7c',umbra:'#ef625f',capella:'#9b6cff',iceye:'#4f8fff'};const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));function fit(c){const r=c.getBoundingClientRect(),D=Math.min(2,devicePixelRatio||1),x=c.getContext('2d');c.width=Math.max(1,Math.round(r.width*D));c.height=Math.max(1,Math.round(r.height*D));x.setTransform(D,0,0,D,0,0);return{x,W:r.width,H:r.height}}function xy(lon,lat,W,H){return[(lon+180)/360*W,(90-lat)/180*H]}function draw(){const c=q('#sar198Canvas');if(!c)return;const {x,W,H}=fit(c);x.fillStyle='#02070b';x.fillRect(0,0,W,H);const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#071824');g.addColorStop(.5,'#0a202b');g.addColorStop(1,'#06131b');x.fillStyle=g;x.fillRect(0,0,W,H);x.strokeStyle='rgba(150,190,205,.14)';x.lineWidth=1;for(let lon=-180;lon<=180;lon+=30){const [px]=xy(lon,0,W,H);x.beginPath();x.moveTo(px,0);x.lineTo(px,H);x.stroke()}for(let lat=-60;lat<=60;lat+=30){const [,py]=xy(0,lat,W,H);x.beginPath();x.moveTo(0,py);x.lineTo(W,py);x.stroke()}x.strokeStyle='rgba(200,220,228,.24)';x.strokeRect(.5,.5,W-1,H-1);const obs=Array.isArray(data?.observations)?data.observations:[];for(const o of obs){if(!providers.has(o.provider)||!Array.isArray(o.bbox))continue;const b=o.bbox,[x0,y1]=xy(b[0],b[1],W,H),[x1,y0]=xy(b[2],b[3],W,H),w=Math.max(2,x1-x0),h=Math.max(2,y1-y0);x.fillStyle=(C[o.provider]||'#fff')+'20';x.strokeStyle=C[o.provider]||'#fff';x.lineWidth=1.2;x.fillRect(x0,y0,w,h);x.strokeRect(x0,y0,w,h);if(Array.isArray(o.center)){const[p,qy]=xy(o.center[0],o.center[1],W,H);x.beginPath();x.arc(p,qy,2.5,0,Math.PI*2);x.fillStyle=C[o.provider]||'#fff';x.fill()}}x.fillStyle='#dce8ed';x.font='800 10px ui-monospace,monospace';x.fillText(obs.filter(o=>providers.has(o.provider)&&o.center).length+' GEOREFERENCED PUBLIC SAR RECORDS',10,H-11)}function render(){const obs=Array.isArray(data?.observations)?data.observations:[],disc=Array.isArray(data?.discovery)?data.discovery:[],visible=obs.filter(o=>providers.has(o.provider));q('#sar198Observed').textContent=String(visible.length);q('#sar198Status').textContent=data?'SOURCE RESPONSE · '+visible.length+' OBSERVED':'UNQUERIED';const rows=visible.slice(0,30).map(o=>'<div class="sar198Item"><b>'+esc(o.provider_label)+' · '+esc(o.id)+'</b><span>'+esc(o.datetime||'time withheld')+' · '+esc(o.band)+'-band · '+esc((o.polarization||[]).join('/')||'polarization unreported')+' · geometry '+esc(o.calibration?.coordinate_authority||'WITHHELD')+'</span></div>');if(disc.length)rows.push(...disc.slice(0,8).map(o=>'<div class="sar198Item"><b>NISAR discovery · '+esc(o.short_name||o.id)+'</b><span>Collection authority only · granule coordinates withheld until a granule geometry is returned.</span></div>'));q('#sar198List').innerHTML=rows.length?rows.join(''):'<div class="sar198Item"><b>No matching georeferenced observations returned</b><span>The layer remains empty rather than fabricating coverage.</span></div>';q('#sar198Proof').textContent=JSON.stringify({build:data?.build||'r198',generated_at:data?.generated_at||null,query:data?.query||null,truth_boundary:data?.truth_boundary||null,provider_results:data?.provider_results||null,display_projection:'DERIVED_FRAMEWORK_MATH/equirectangular from source bbox only',inference:'WITHHELD',forecast:'WITHHELD',insar_displacement:'WITHHELD'},null,2);draw()}async function load(){if(busy)return;busy=true;q('#sar198Refresh').disabled=true;q('#sar198Status').textContent='QUERYING PUBLIC CATALOGS…';try{const ps=Array.from(providers).join(','),r=await fetch('/api/earth/sar/r198/search?days=45&limit=16&providers='+encodeURIComponent(ps),{cache:'no-store',headers:{accept:'application/json'}}),t=await r.text();if(!r.ok)throw new Error('HTTP '+r.status+' '+t.slice(0,160));data=JSON.parse(t);render()}catch(e){data=null;q('#sar198Status').textContent='SOURCE DEGRADED';q('#sar198Proof').textContent=String(e);draw()}finally{busy=false;q('#sar198Refresh').disabled=false}}qa('[data-sar-provider]').forEach(b=>b.onclick=()=>{const id=b.dataset.sarProvider;if(providers.has(id))providers.delete(id);else providers.add(id);b.dataset.on=providers.has(id)?'1':'0';render()});q('#sar198Refresh').onclick=load;addEventListener('resize',draw,{passive:true});load()})();</script>`;

export async function enhanceEarthSarTruthR198(response: Response, path: string): Promise<Response> {
  if (path.startsWith("/api/") || path.startsWith("/_")) return response;
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;
  let html = await response.text();
  if (html.includes("omegaSarTruthR198Runtime")) return new Response(html, { status: response.status, statusText: response.statusText, headers: response.headers });
  html = html.replace("</head>", css + "</head>");
  const earth = /<section class="surface app" data-view="Earth">/;
  if (earth.test(html)) {
    const pos = html.search(earth);
    const close = html.indexOf("</section>", pos);
    if (close > pos) html = html.slice(0, close) + markup + html.slice(close);
  } else {
    html = html.includes("</main>") ? html.replace("</main>", markup + "</main>") : html.replace("</body>", markup + "</body>");
  }
  html = html.replace("</body>", js + "</body>");
  return new Response(html, { status: response.status, statusText: response.statusText, headers: response.headers });
}
