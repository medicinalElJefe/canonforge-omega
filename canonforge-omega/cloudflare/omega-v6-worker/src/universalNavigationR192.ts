export const UNIVERSAL_NAVIGATION_RELEASE_R192 = "r192-navigation-home-repair";
export const UNIVERSAL_NAVIGATION_POLISH_R214 = "r214-r192-submenu-reachability";

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
.r192More{margin-left:auto;position:relative;flex:0 0 auto}.r192MenuButton{height:34px;border:1px solid #38516f;border-radius:9px;background:#0d1724;color:#eaf1fb;padding:0 10px;cursor:pointer;font:inherit}.r192MenuButton[aria-expanded="true"]{background:#16263b;border-color:#526f94}.r192Menu{position:absolute;right:0;top:40px;width:min(336px,calc(100vw - 20px));display:none;padding:8px;border:1px solid #314864;border-radius:12px;background:#07101a;box-shadow:0 24px 70px #000b}.r192More.open .r192Menu{display:grid;gap:7px}.r192MenuGroup{display:grid;gap:2px;padding:5px;border:1px solid rgba(112,145,190,.13);border-radius:9px;background:rgba(9,19,30,.72)}.r192MenuTitle{padding:4px 6px 3px;color:#698099;font-size:8px;letter-spacing:.15em}.r192Menu a{padding:8px 9px;border-radius:7px;color:#c4d0df!important}.r192Menu a:hover,.r192Menu a.active{background:#122136;color:#fff!important}.r192Menu a.active{outline:1px solid #3c5a7c}.r192Menu small{display:block;color:#73869e;margin-top:2px;font-weight:600}.r192Menu a.active small{color:#9eb3ca}
@media(max-width:760px){:root{--r192h:44px}#omegaUniversalNavR192{padding:5px 7px}.r192Brand{height:32px;padding:0 8px}.r192Brand span{display:none}.r192Links{gap:3px}.r192Link{height:32px;padding:0 8px}.r192Links .r192Secondary{display:none}.r192MenuButton{height:32px}.r192Menu{position:fixed;right:7px;top:calc(var(--r192h) + 5px);width:calc(100vw - 14px);max-height:calc(100vh - var(--r192h) - 12px);overflow:auto}.top{top:var(--r192h)!important}.nav{top:calc(var(--r192h) + 108px)!important}}
@media(prefers-reduced-motion:reduce){#omegaUniversalNavR192 *{scroll-behavior:auto!important}}
</style>`;

function isActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
}

function menuLink(pathname: string, href: string, label: string, description: string): string {
  const active = isActive(pathname, href) ? " active" : "";
  const current = active ? ' aria-current="page"' : "";
  return `<a role="menuitem" class="${active.trim()}" href="${href}"${current}>${label}<small>${description}</small></a>`;
}

function navMarkup(pathname: string): string {
  const links = NAV.map(([label, href], i) => `<a class="r192Link ${i > 3 ? "r192Secondary" : ""} ${isActive(pathname, href) ? "active" : ""}" href="${href}"${isActive(pathname, href) ? ' aria-current="page"' : ""}>${label}</a>`).join("");
  const operator = [
    menuLink(pathname, "/system", "ONE SYSTEM", "operator, mission, continuity and residual restoration"),
    menuLink(pathname, "/core", "LIVING CORE", "direct state instrument"),
    menuLink(pathname, "/capabilities", "CAPABILITIES", "registered tools, routes and execution truth"),
    menuLink(pathname, "/federation", "FEDERATION", "federated organ workspace and proof"),
  ].join("");
  const proof = [
    menuLink(pathname, "/truth", "TRUTH / ACCEPTANCE", "whole-system acceptance and provenance"),
    menuLink(pathname, "/validate", "VALIDATE", "validation and bounded proof surface"),
    menuLink(pathname, "/instrument", "WHOLE INSTRUMENT", "integrated system workstation"),
    menuLink(pathname, "/convergence", "CONVERGENCE", "host and cross-surface convergence"),
    menuLink(pathname, "/evolution", "EVOLUTION", "governed development mesh"),
  ].join("");
  return `<nav id="omegaUniversalNavR192" aria-label="OMEGA universal navigation"><a class="r192Brand" href="/"><strong>Ω</strong><span>OMEGA V6</span></a><div class="r192Links">${links}</div><div class="r192More"><button class="r192MenuButton" type="button" aria-expanded="false" aria-haspopup="menu" aria-controls="omegaR192SystemsMenu">SYSTEMS</button><div id="omegaR192SystemsMenu" class="r192Menu" role="menu" aria-label="OMEGA systems submenu"><div class="r192MenuGroup"><div class="r192MenuTitle">OPERATOR / RUNTIME</div>${operator}</div><div class="r192MenuGroup"><div class="r192MenuTitle">PROOF / DEVELOPMENT</div>${proof}</div><div class="r192MenuGroup"><div class="r192MenuTitle">FEDERATED EXTERNAL</div><a role="menuitem" href="https://omega-genesis-v1.jeffdeweyeljefe.workers.dev/" target="_blank" rel="noreferrer">GENESIS ↗<small>discovery / evolution authority</small></a></div></div></div></nav>`;
}

const script = `<script id="omegaUniversalNavR192Runtime">(()=>{const nav=document.getElementById('omegaUniversalNavR192');if(!nav)return;if(location.pathname==='/'||location.pathname===''){const launch=document.getElementById('omegaLaunch');launch?.classList.add('hidden');document.body.classList.remove('omegaLaunchOpen');try{sessionStorage.setItem('omega_launch_seen','1')}catch{}}const more=nav.querySelector('.r192More'),btn=nav.querySelector('.r192MenuButton');const close=(focus=false)=>{more?.classList.remove('open');btn?.setAttribute('aria-expanded','false');if(focus)btn?.focus()};btn?.addEventListener('click',e=>{e.stopPropagation();const on=!more?.classList.contains('open');more?.classList.toggle('open',on);btn.setAttribute('aria-expanded',String(on));if(on){const current=more?.querySelector('[aria-current="page"]');current?.scrollIntoView?.({block:'nearest'})}});document.addEventListener('click',e=>{if(more&&!more.contains(e.target))close()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&more?.classList.contains('open'))close(true)});window.addEventListener('pagehide',()=>close())})();</script>`;

export async function enhanceUniversalNavigationR192(response: Response, pathname: string): Promise<Response> {
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;
  let html = await response.text();
  if (!/<body[\s>]/i.test(html) || html.includes('id="omegaUniversalNavR192"')) return new Response(html, { status: response.status, headers: response.headers });
  if (pathname === "/" || pathname === "") html = html.replace('<div id="omegaLaunch">', '<div id="omegaLaunch" class="hidden">');
  const withStyle = html.includes("</head>") ? html.replace("</head>", style + "</head>") : style + html;
  const withNav = withStyle.replace(/<body([^>]*)>/i, `<body$1>${navMarkup(pathname)}`);
  const body = withNav.includes("</body>") ? withNav.replace("</body>", script + "</body>") : withNav + script;
  const headers = new Headers(response.headers);
  headers.set("cache-control", "no-store");
  headers.set("x-omega-navigation", UNIVERSAL_NAVIGATION_RELEASE_R192);
  headers.set("x-omega-navigation-fallback-polish", UNIVERSAL_NAVIGATION_POLISH_R214);
  return new Response(body, { status: response.status, headers });
}
