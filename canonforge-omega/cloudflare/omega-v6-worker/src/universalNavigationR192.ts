import { enhanceCorpusCoverageR208 } from "./system/corpusCoverageR208";

export const UNIVERSAL_NAVIGATION_RELEASE_R192 = "r192-navigation-home-repair";

const NAV = [
  ["HOME", "/"],
  ["FABRIC", "/fabric"],
  ["INSTRUMENT", "/instrument"],
  ["CLOUDS", "/clouds"],
  ["AI / SAI", "/sai"],
  ["COMPUTE", "/compute"],
  ["VALIDATE", "/validate"],
  ["TRUTH", "/truth"],
  ["CONVERGENCE", "/convergence"],
] as const;

const style = `<style id="omegaUniversalNavR192Style">
:root{--r192h:48px}
body{padding-top:var(--r192h)!important}
.top{top:var(--r192h)!important}
#omegaUniversalNavR192{position:fixed;inset:0 0 auto 0;height:var(--r192h);z-index:2147483600;display:flex;align-items:center;gap:8px;padding:6px 10px;border-bottom:1px solid rgba(112,145,190,.28);background:rgba(3,7,12,.95);backdrop-filter:blur(18px);box-shadow:0 10px 36px rgba(0,0,0,.34);font:700 11px/1.1 Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#eaf1fb}
#omegaUniversalNavR192 *{box-sizing:border-box}#omegaUniversalNavR192 a{color:inherit;text-decoration:none}
.r192Brand{display:flex;align-items:center;gap:8px;flex:0 0 auto;height:34px;padding:0 10px;border:1px solid #334a68;border-radius:10px;background:#0b1420;font-weight:900;letter-spacing:.13em}.r192Brand strong{font-size:16px}.r192Brand span{color:#91a4bd}
.r192Links{display:flex;gap:5px;min-width:0;overflow:auto;scrollbar-width:none}.r192Links::-webkit-scrollbar{display:none}.r192Link{height:34px;display:flex;align-items:center;white-space:nowrap;padding:0 9px;border:1px solid transparent;border-radius:9px;color:#aebcd0!important}.r192Link:hover{background:#101c2b;border-color:#2f4767;color:white!important}.r192Link.active{background:#16263b;border-color:#42658f;color:white!important}
.r192More{margin-left:auto;position:relative;flex:0 0 auto}.r192MenuButton{height:34px;border:1px solid #38516f;border-radius:9px;background:#0d1724;color:#eaf1fb;padding:0 10px;cursor:pointer;font:inherit}.r192Menu{position:absolute;right:0;top:40px;width:270px;display:none;padding:7px;border:1px solid #314864;border-radius:12px;background:#07101a;box-shadow:0 24px 70px #000b}.r192More.open .r192Menu{display:grid}.r192Menu a{padding:10px;border-radius:8px;color:#c4d0df!important}.r192Menu a:hover{background:#122136}.r192Menu small{display:block;color:#73869e;margin-top:2px;font-weight:600}
@media(max-width:760px){:root{--r192h:44px}#omegaUniversalNavR192{padding:5px 7px}.r192Brand{height:32px;padding:0 8px}.r192Brand span{display:none}.r192Links{gap:3px}.r192Link{height:32px;padding:0 8px}.r192Links .r192Secondary{display:none}.r192MenuButton{height:32px}.top{top:var(--r192h)!important}.nav{top:calc(var(--r192h) + 108px)!important}}
</style>`;

function navMarkup(pathname: string): string {
  const links = NAV.map(([label, href], i) => `<a class="r192Link ${i > 3 ? "r192Secondary" : ""} ${pathname === href || (href !== "/" && pathname.startsWith(href + "/")) ? "active" : ""}" href="${href}">${label}</a>`).join("");
  return `<nav id="omegaUniversalNavR192" aria-label="OMEGA universal navigation"><a class="r192Brand" href="/"><strong>Ω</strong><span>OMEGA V6</span></a><div class="r192Links">${links}</div><div class="r192More"><button class="r192MenuButton" type="button" aria-expanded="false">SYSTEMS</button><div class="r192Menu"><a href="/system">CORPUS COVERAGE<small>24-family implementation, live proof and residual truth</small></a><a href="/core">LIVING CORE<small>direct state instrument</small></a><a href="/capabilities">CAPABILITIES<small>registered tools and routes</small></a><a href="/evolution">EVOLUTION<small>governed development mesh</small></a><a href="/federation">FEDERATION<small>federated organ workspace</small></a><a href="https://omega-genesis-v1.jeffdeweyeljefe.workers.dev/" target="_blank" rel="noreferrer">GENESIS ↗<small>discovery / evolution authority</small></a></div></div></nav>`;
}

const script = `<script id="omegaUniversalNavR192Runtime">(()=>{const nav=document.getElementById('omegaUniversalNavR192');if(!nav)return;if(location.pathname==='/'||location.pathname===''){const launch=document.getElementById('omegaLaunch');launch?.classList.add('hidden');document.body.classList.remove('omegaLaunchOpen');try{sessionStorage.setItem('omega_launch_seen','1')}catch{}}const more=nav.querySelector('.r192More'),btn=nav.querySelector('.r192MenuButton');btn?.addEventListener('click',e=>{e.stopPropagation();const on=!more?.classList.contains('open');more?.classList.toggle('open',on);btn.setAttribute('aria-expanded',String(on))});document.addEventListener('click',e=>{if(more&&!more.contains(e.target))more.classList.remove('open')});document.addEventListener('keydown',e=>{if(e.key==='Escape')more?.classList.remove('open')})})();</script>`;

export async function enhanceUniversalNavigationR192(response: Response, pathname: string): Promise<Response> {
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;
  let html = await response.text();
  if (!/<body[\s>]/i.test(html)) return new Response(html, { status: response.status, statusText: response.statusText, headers: response.headers });
  if (html.includes('id="omegaUniversalNavR192"')) {
    return enhanceCorpusCoverageR208(new Response(html, { status: response.status, statusText: response.statusText, headers: response.headers }), pathname);
  }
  if (pathname === "/" || pathname === "") html = html.replace('<div id="omegaLaunch">', '<div id="omegaLaunch" class="hidden">');
  const withStyle = html.includes("</head>") ? html.replace("</head>", style + "</head>") : style + html;
  const withNav = withStyle.replace(/<body([^>]*)>/i, `<body$1>${navMarkup(pathname)}`);
  const body = withNav.includes("</body>") ? withNav.replace("</body>", script + "</body>") : withNav + script;
  const headers = new Headers(response.headers);
  headers.set("cache-control", "no-store");
  headers.set("x-omega-navigation", UNIVERSAL_NAVIGATION_RELEASE_R192);
  const navigated = new Response(body, { status: response.status, statusText: response.statusText, headers });
  return enhanceCorpusCoverageR208(navigated, pathname);
}
