(() => {
  const STYLE_ID = "omegaUltraUiStyle";
  const SCRIM_ID = "omegaNavScrim";
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    :root{
      --omega-surface-0:#040609;--omega-surface-1:#080c12;--omega-surface-2:#0d141f;--omega-surface-3:#111b29;
      --omega-edge:rgba(158,184,221,.15);--omega-edge-strong:rgba(180,204,236,.25);
      --omega-gold:#e2c274;--omega-cyan:#78d8e8;--omega-live:#6de0a1;--omega-danger:#f08080;
      --omega-radius-xl:22px;--omega-radius-lg:16px;--omega-touch:44px;
      --omega-shadow-deep:0 28px 90px rgba(0,0,0,.42);--omega-shadow-soft:0 14px 42px rgba(0,0,0,.24);
    }
    html.omega-ultra-ui{background:var(--omega-surface-0);scrollbar-color:#344258 #090d13;scrollbar-width:thin}
    .omega-ultra-ui body{
      background:
        radial-gradient(900px 520px at 82% -8%,rgba(90,126,180,.18),transparent 62%),
        radial-gradient(720px 500px at 8% 92%,rgba(199,159,75,.07),transparent 65%),
        linear-gradient(145deg,#030507 0%,#080b11 48%,#05080c 100%);
      background-attachment:fixed;
    }
    .omega-ultra-ui body:before{content:"";position:fixed;inset:0;pointer-events:none;z-index:-1;opacity:.38;background-image:linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.012) 1px,transparent 1px);background-size:52px 52px;mask-image:linear-gradient(to bottom,rgba(0,0,0,.7),transparent 80%)}
    .omega-ultra-ui .sidebar{background:linear-gradient(180deg,rgba(6,9,14,.97),rgba(5,8,13,.93));border-right-color:var(--omega-edge);box-shadow:18px 0 70px rgba(0,0,0,.18)}
    .omega-ultra-ui .brand{position:relative}.omega-ultra-ui .brand:after{content:"SOVEREIGN COMPUTE";position:absolute;right:8px;bottom:4px;color:#718097;font-size:.46rem;letter-spacing:.2em}
    .omega-ultra-ui .mark{border-color:rgba(190,208,236,.3);background:radial-gradient(circle at 32% 25%,#24344b 0,#101925 42%,#080d14 76%);box-shadow:inset 0 1px rgba(255,255,255,.09),0 8px 30px rgba(0,0,0,.32),0 0 24px rgba(121,174,246,.07)}
    .omega-ultra-ui .authority{border-color:var(--omega-edge);background:linear-gradient(135deg,rgba(15,24,36,.92),rgba(8,13,20,.9));box-shadow:inset 0 1px rgba(255,255,255,.025)}
    .omega-ultra-ui nav button{min-height:var(--omega-touch);border:1px solid transparent;transition:background-color .16s ease,border-color .16s ease,transform .16s ease;color:#bfcadc}
    .omega-ultra-ui nav button:hover{background:linear-gradient(90deg,rgba(26,38,56,.78),rgba(13,20,30,.72));border-color:rgba(255,255,255,.055);transform:translateX(2px)}
    .omega-ultra-ui nav button.active{background:linear-gradient(90deg,rgba(39,49,64,.94),rgba(15,23,34,.92));border-color:rgba(226,194,116,.13);box-shadow:inset 2px 0 var(--omega-gold),0 8px 26px rgba(0,0,0,.12)}
    .omega-ultra-ui .topbar{min-height:76px;height:auto;background:linear-gradient(180deg,rgba(7,11,17,.9),rgba(6,9,14,.78));border-bottom-color:var(--omega-edge);box-shadow:0 12px 38px rgba(0,0,0,.12)}
    .omega-ultra-ui .topbar h1{font-size:1.04rem;letter-spacing:.035em}.omega-ultra-ui .topbar p{color:#8997ad}
    .omega-ultra-ui .topchips{overflow-x:auto;scrollbar-width:none}.omega-ultra-ui .topchips::-webkit-scrollbar{display:none}
    .omega-ultra-ui .chip,.omega-ultra-ui .tag{min-height:30px;align-items:center;background:rgba(10,16,24,.72);border-color:var(--omega-edge-strong);backdrop-filter:blur(12px)}
    .omega-ultra-ui .chip.good{background:rgba(28,81,57,.16);box-shadow:inset 0 0 18px rgba(109,224,161,.035)}
    .omega-ultra-ui main{padding:22px;position:relative}
    .omega-ultra-ui .card{position:relative;border-color:var(--omega-edge);border-radius:var(--omega-radius-xl);background:linear-gradient(160deg,rgba(17,25,37,.96),rgba(8,13,20,.97) 68%);box-shadow:var(--omega-shadow-soft);overflow:clip;isolation:isolate}
    .omega-ultra-ui .card:before{content:"";position:absolute;z-index:-1;left:0;right:0;top:0;height:1px;background:linear-gradient(90deg,transparent,rgba(177,204,238,.28),rgba(226,194,116,.18),transparent)}
    .omega-ultra-ui .card:after{content:"";position:absolute;z-index:-1;width:220px;height:220px;right:-150px;top:-155px;border-radius:50%;background:radial-gradient(circle,rgba(109,153,214,.08),transparent 70%);pointer-events:none}
    .omega-ultra-ui .card h2{font-size:1.08rem;letter-spacing:.01em}.omega-ultra-ui .card h3{letter-spacing:.02em}.omega-ultra-ui .card p{color:#aebacf}
    .omega-ultra-ui .field-card,.omega-ultra-ui .render-surface{box-shadow:inset 0 0 0 1px rgba(255,255,255,.02),0 30px 80px rgba(0,0,0,.2)}
    .omega-ultra-ui .field{background:radial-gradient(circle at 50% 43%,rgba(38,59,88,.88) 0,rgba(15,25,39,.92) 18%,rgba(7,12,19,.98) 56%,rgba(4,7,11,.99) 80%)}
    .omega-ultra-ui .core{border-color:rgba(172,196,230,.46);box-shadow:0 0 60px rgba(89,132,193,.2),inset 0 0 40px rgba(128,164,215,.07)}
    .omega-ultra-ui .metric,.omega-ultra-ui .decision-row>div,.omega-ultra-ui .stat-grid div,.omega-ultra-ui .rule-grid div{border-color:var(--omega-edge);background:linear-gradient(155deg,rgba(8,14,22,.95),rgba(11,18,28,.82))}
    .omega-ultra-ui .metric strong,.omega-ultra-ui .stat-grid strong{font-variant-numeric:tabular-nums;letter-spacing:.01em}
    .omega-ultra-ui .btn,.omega-ultra-ui button,.omega-ultra-ui input,.omega-ultra-ui textarea,.omega-ultra-ui summary{touch-action:manipulation}
    .omega-ultra-ui .btn,.omega-ultra-ui button:not(.mobile-menu){min-height:var(--omega-touch)}
    .omega-ultra-ui .btn{border-color:rgba(138,165,205,.3);background:linear-gradient(180deg,rgba(25,36,52,.96),rgba(14,22,33,.96));border-radius:11px;padding:10px 14px;box-shadow:inset 0 1px rgba(255,255,255,.035),0 7px 20px rgba(0,0,0,.16);transition:transform .14s ease,border-color .14s ease,background-color .14s ease,box-shadow .14s ease}
    .omega-ultra-ui .btn:hover{transform:translateY(-1px);border-color:rgba(157,187,228,.48);background:linear-gradient(180deg,rgba(30,44,63,.98),rgba(17,27,40,.98));box-shadow:inset 0 1px rgba(255,255,255,.045),0 11px 28px rgba(0,0,0,.2)}
    .omega-ultra-ui .btn:active{transform:translateY(0)}
    .omega-ultra-ui .btn.primary{border-color:rgba(226,194,116,.42);background:linear-gradient(180deg,rgba(72,59,27,.78),rgba(35,29,15,.94));color:#f7dda0;box-shadow:inset 0 1px rgba(255,240,190,.05),0 10px 25px rgba(76,55,15,.12)}
    .omega-ultra-ui button:disabled,.omega-ultra-ui .btn:disabled{opacity:.48;cursor:not-allowed;transform:none;filter:saturate(.55)}
    .omega-ultra-ui input,.omega-ultra-ui textarea{min-height:var(--omega-touch);border-color:rgba(118,147,188,.34);background:linear-gradient(180deg,rgba(6,11,18,.96),rgba(8,14,22,.96));border-radius:11px;padding:10px 12px;transition:border-color .14s ease,box-shadow .14s ease}
    .omega-ultra-ui textarea{min-height:96px}
    .omega-ultra-ui :is(button,input,textarea,summary,[tabindex]):focus-visible{outline:2px solid var(--omega-cyan);outline-offset:3px;box-shadow:0 0 0 5px rgba(120,216,232,.09)}
    .omega-ultra-ui .table-wrap{border-color:var(--omega-edge);background:rgba(5,9,14,.42)}
    .omega-ultra-ui th{position:sticky;top:0;z-index:2;background:rgba(10,16,25,.98);backdrop-filter:blur(12px)}
    .omega-ultra-ui tr:hover td{background:rgba(122,162,216,.025)}
    .omega-ultra-ui .raw,.omega-ultra-ui .result{border-color:rgba(116,143,181,.24);background:linear-gradient(180deg,rgba(4,8,13,.96),rgba(7,12,18,.96));box-shadow:inset 0 1px rgba(255,255,255,.018)}
    .omega-ultra-ui .boundary,.omega-ultra-ui .note{border-left-width:3px;background:linear-gradient(90deg,rgba(74,60,25,.28),rgba(20,17,11,.58));border-radius:7px 12px 12px 7px}
    .omega-ultra-ui .pulse{animation:omegaPulse 2.8s ease-in-out infinite}
    .omega-ultra-ui[data-omega-network="offline"] .pulse{background:var(--omega-danger);box-shadow:0 0 14px rgba(240,128,128,.45);animation:none}
    .omega-ultra-ui .omega-render-chip{display:inline-flex;align-items:center;gap:6px}.omega-ultra-ui .omega-render-chip:before{content:"";width:6px;height:6px;border-radius:50%;background:var(--omega-live);box-shadow:0 0 12px rgba(109,224,161,.5)}
    #${SCRIM_ID}{display:none;position:fixed;inset:0;z-index:19;background:rgba(0,0,0,.58);backdrop-filter:blur(3px);border:0;margin:0;padding:0;width:100%;height:100%}
    @keyframes omegaPulse{0%,100%{transform:scale(.92);opacity:.72}50%{transform:scale(1.06);opacity:1}}
    @media(max-width:760px){
      .omega-ultra-ui main{padding:10px;padding-bottom:max(12px,env(safe-area-inset-bottom))}
      .omega-ultra-ui .topbar{padding-left:max(10px,env(safe-area-inset-left));padding-right:max(10px,env(safe-area-inset-right));min-height:64px}
      .omega-ultra-ui .mobile-menu{display:grid;place-items:center;min-width:var(--omega-touch);min-height:var(--omega-touch);border-radius:11px;border:1px solid var(--omega-edge);background:rgba(12,19,29,.88);cursor:pointer}
      .omega-ultra-ui .sidebar{width:min(86vw,310px);left:min(-88vw,-320px);padding-top:max(16px,env(safe-area-inset-top));padding-bottom:max(14px,env(safe-area-inset-bottom));box-shadow:30px 0 90px rgba(0,0,0,.48)}
      .omega-ultra-ui .sidebar.open{left:0}
      .omega-ultra-ui .sidebar.open~#${SCRIM_ID},#${SCRIM_ID}.active{display:block}
      .omega-ultra-ui .card{border-radius:17px;padding:14px}
      .omega-ultra-ui .topchips{max-width:52vw;padding-bottom:2px}
      .omega-ultra-ui nav button{min-height:48px}
      .omega-ultra-ui .btn,.omega-ultra-ui button:not(.mobile-menu),.omega-ultra-ui input{min-height:46px}
    }
    @media(max-width:520px){
      .omega-ultra-ui .topbar h1{font-size:.9rem}.omega-ultra-ui .topchips{max-width:46vw}.omega-ultra-ui .chip{flex:0 0 auto}
      .omega-ultra-ui .card{padding:13px}.omega-ultra-ui .metric{padding:9px}.omega-ultra-ui .render-surface{border-radius:14px}
    }
    @media(prefers-reduced-motion:reduce){
      .omega-ultra-ui *,.omega-ultra-ui *:before,.omega-ultra-ui *:after{scroll-behavior:auto!important;animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}
      .omega-ultra-ui body{background-attachment:scroll}
    }
    @media(prefers-contrast:more){
      .omega-ultra-ui .card,.omega-ultra-ui .btn,.omega-ultra-ui input,.omega-ultra-ui textarea,.omega-ultra-ui .table-wrap{border-color:rgba(220,232,248,.48)}
      .omega-ultra-ui .card p,.omega-ultra-ui label,.omega-ultra-ui small{color:#c4cfdf}
    }
  `;
  document.head.appendChild(style);
  document.documentElement.classList.add("omega-ultra-ui");
  document.documentElement.dataset.omegaNetwork = navigator.onLine ? "online" : "offline";
  document.documentElement.dataset.omegaDesign = "ULTRA_UI_V1";

  function ensureScrim(){
    if(document.getElementById(SCRIM_ID)) return;
    const scrim=document.createElement("button");
    scrim.id=SCRIM_ID; scrim.type="button"; scrim.setAttribute("aria-label","Close navigation");
    document.body.appendChild(scrim);
    scrim.addEventListener("click",closeNav);
  }
  function sidebar(){return document.querySelector(".sidebar")}
  function closeNav(){const s=sidebar();if(s)s.classList.remove("open");document.getElementById(SCRIM_ID)?.classList.remove("active")}
  function syncScrim(){const open=sidebar()?.classList.contains("open");document.getElementById(SCRIM_ID)?.classList.toggle("active",!!open)}
  function bindNavigation(){
    ensureScrim();
    const s=sidebar();if(!s)return;
    new MutationObserver(syncScrim).observe(s,{attributes:true,attributeFilter:["class"]});
    s.querySelectorAll("nav button").forEach(btn=>btn.addEventListener("click",()=>{if(matchMedia("(max-width:760px)").matches)closeNav()}));
    document.addEventListener("keydown",e=>{if(e.key==="Escape")closeNav()});
  }
  function ensureRenderChip(){
    const host=document.querySelector(".topchips");if(!host||document.getElementById("omegaRenderChip"))return;
    const chip=document.createElement("span");chip.id="omegaRenderChip";chip.className="chip omega-render-chip";chip.textContent="FIELD · READY";chip.title="Derived render telemetry; not a hardware verification claim";host.appendChild(chip);
  }
  function boot(){bindNavigation();ensureRenderChip()}

  window.addEventListener("online",()=>document.documentElement.dataset.omegaNetwork="online");
  window.addEventListener("offline",()=>document.documentElement.dataset.omegaNetwork="offline");
  window.addEventListener("omega-render-telemetry",event=>{
    const chip=document.getElementById("omegaRenderChip");if(!chip)return;
    const d=event.detail||{};const ms=Number(d.average_frame_ms);
    chip.textContent=Number.isFinite(ms)&&ms>0?`FIELD · ${ms.toFixed(1)} ms`:"FIELD · LIVE";
    chip.dataset.stateIdentity=String(d.state_identity||"");
  });
  window.addEventListener("omega-cloud-heartbeat",()=>document.documentElement.dataset.omegaNetwork="online");
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
