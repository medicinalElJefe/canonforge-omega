(() => {
  const q=s=>document.querySelector(s);
  const block=(title,body)=>`<article class="card"><small>GENESIS FULL BUILD</small><h2>${title}</h2>${body}</article>`;
  const result=id=>`<div class="result" id="${id}"></div>`;

  function inject(){
    const runtime=q('[data-view="runtime"] .section-grid');
    runtime?.insertAdjacentHTML("beforeend",block("Authority + live transport",`
      <p>Canonical identity, replay integrity and shadow-state count are reported directly by the runtime. Local WebSocket transport publishes the same packet as the HTTP API.</p>
      <button class="btn primary" data-advanced="authority">Verify authority</button>
      <button class="btn" data-advanced="stream-status">Stream status</button>
      <span class="chip" id="streamLive">STREAM —</span>
      ${result("authorityResult")}<div class="result" id="streamResult"></div>`));

    const render=q('[data-view="render"] .render-surface');
    if(render){
      render.innerHTML='<canvas id="field3d" aria-label="State-bound 20736 point field"></canvas><div class="render-legend"><b>20,736 canonical points</b><span>observer orbit · active state in gold · derived projection only</span></div>';
      render.classList.add("webgl-field");
    }

    const data=q('[data-view="data"] .section-grid');
    data?.insertAdjacentHTML("beforeend",`
      <article class="card span2"><small>12¹⁰ CAPACITY NAMESPACE</small><h2>61,917,364,224 reversible software addresses</h2>
        <p>This is an address-compressed design/instrumentation capacity layered above the 20,736 canonical runtime lattice—not a physical dimension and not 61.9 billion worksheet rows.</p>
        <label>Capacity index 0–61,917,364,223<input id="capacityIndex" type="number" min="0" max="61917364223" value="0"></label>
        <button class="btn primary" data-advanced="capacity">Resolve 12¹⁰ address</button>
        <label>Seven-host index 0–145,151<input id="starIndex" type="number" min="0" max="145151" value="0"></label>
        <button class="btn" data-advanced="star">Resolve 145,152 layer</button>
        ${result("capacityResult")}
      </article>
      <article class="card"><small>SOFTWARE UNIVERSE</small><h2>24 systems · 6 families</h2>
        <button class="btn primary" data-advanced="systems">Load governed registry</button>
        ${result("systemsResult")}
      </article>`);

    const host=q('[data-view="host"] .section-grid');
    host?.insertAdjacentHTML("beforeend",`
      <article class="card span2"><small>TYPED OBSERVATION COMPILER</small><h2>Source → evidence packet</h2>
        <p>OBSERVED and IMPORTED packets require provenance. Compilation never commits canonical state.</p>
        <div class="form2">
          <label>Evidence class<select id="obsClass"><option>DERIVED</option><option>OBSERVED</option><option>IMPORTED</option><option>INFERRED</option><option>FORECAST</option><option>ASSUMED</option><option>SYMBOLIC</option><option>USER_ASSERTED</option></select></label>
          <label>Source ID<input id="obsSource" value="operator-input"></label>
          <label>Authority<input id="obsAuthority" value="operator"></label>
          <label>Observed / retrieved time<input id="obsTime" placeholder="2026-08-30T22:00:00Z"></label>
          <label>Immutable reference<input id="obsRef" placeholder="frame/file/version reference"></label>
        </div>
        <label>Payload JSON<textarea id="obsPayload" rows="6">{"value":"example"}</textarea></label>
        <button class="btn primary" data-advanced="host-compile">Compile evidence packet</button>
        ${result("hostCompileResult")}
      </article>`);

    const ai=q('[data-view="ai"] .section-grid');
    ai?.insertAdjacentHTML("beforeend",`
      <article class="card span2"><small>GOVERNED PLANNER</small><h2>Objective → PRUNE / TRANSLATE / PROVE</h2>
        <label>Objective<input id="aiObjective" value="Preserve canonical truth while advancing the current system safely"></label>
        <button class="btn primary" data-advanced="ai-plan">Build governed plan</button>
        <button class="btn" data-advanced="language">Decode current packet</button>
        ${result("aiPlanResult")}
      </article>`);

    const world=q('[data-view="world"] .section-grid');
    world?.insertAdjacentHTML("beforeend",`
      <article class="card span2"><small>SOURCE-BOUND BIOLOGY</small><h2>Multiscale relation analyzer</h2>
        <p>Analyzes only supplied nodes and relations. It does not fabricate microscopy, diagnosis, DNA, brain, or organism evidence.</p>
        <label>Nodes JSON<textarea id="bioNodes" rows="7">[{"node_id":"n1","scale":"BIOLOGICAL","evidence_class":"USER_ASSERTED","properties":{"label":"source node"}},{"node_id":"n2","scale":"CHEMICAL","evidence_class":"DERIVED","properties":{"label":"derived node"}}]</textarea></label>
        <label>Relations JSON<textarea id="bioRelations" rows="5">[{"source":"n1","target":"n2","relation":"CONTEXT"}]</textarea></label>
        <button class="btn primary" data-advanced="bio-analyze">Analyze supplied network</button>
        ${result("bioResult")}
      </article>`);

    const cockpit=q('[data-view="cockpit"] .section-grid');
    cockpit?.insertAdjacentHTML("beforeend",`
      <article class="card span2"><small>12-GATE ACCEPTANCE BOARD</small><h2>No fake completion</h2>
        <p>Runs the Drive-defined acceptance gates against the current source/runtime and distinguishes source PASS from target-specific Windows/browser/device evidence.</p>
        <button class="btn primary" data-advanced="acceptance">Run full acceptance board</button>
        ${result("acceptanceResult")}
      </article>`);

    const recovery=q('[data-view="recovery"] .section-grid');
    recovery?.insertAdjacentHTML("beforeend",`
      <article class="card span2"><small>APPEND-ONLY RECOVERY</small><h2>Proven-state rollback</h2>
        <p>Rollback never rewrites the journal. It creates a new packet whose parent is the current head and whose payload records the historical digest restored.</p>
        <button class="btn" data-advanced="history">Load proven history</button>
        <label>Historical digest<input id="rollbackDigest" placeholder="64-character canonical digest"></label>
        <label>Reason<input id="rollbackReason" value="operator recovery"></label>
        <button class="btn primary" data-advanced="rollback">Create rollback transition</button>
        ${result("recoveryResult")}
      </article>`);
  }

  async function safe(fn,target){
    const el=document.getElementById(target);
    try{el.textContent=JSON.stringify(await fn(),null,2)}catch(err){el.textContent=JSON.stringify(err,null,2)}
  }

  async function connectStream(){
    const badge=document.getElementById("streamLive");
    if(!badge)return;
    if(!["localhost","127.0.0.1"].includes(location.hostname)){
      badge.textContent="STREAM CLOUD HTTP/DO";
      return;
    }
    try{
      const s=await api("/api/stream/status");
      badge.textContent="STREAM "+String(s.status||"UNKNOWN");
      document.getElementById("streamResult").textContent=JSON.stringify(s,null,2);
      const port=s.port||8128;
      const ws=new WebSocket(`ws://${location.hostname}:${port}`);
      ws.onopen=()=>badge.textContent="STREAM LIVE";
      ws.onmessage=e=>{
        try{
          const packet=JSON.parse(e.data);
          badge.textContent="STREAM LIVE · STATE "+packet.state.state_id;
          if(packet.state?.digest&&SNAP?.state?.digest!==packet.state.digest) refresh();
        }catch{}
      };
      ws.onclose=()=>badge.textContent="STREAM CLOSED";
      ws.onerror=()=>badge.textContent="STREAM DEGRADED";
    }catch(err){
      badge.textContent="STREAM UNAVAILABLE";
    }
  }

  document.body.addEventListener("click",e=>{
    const b=e.target.closest("[data-advanced]");
    if(!b)return;
    const a=b.dataset.advanced;
    if(a==="authority") safe(()=>api("/api/authority"),"authorityResult");
    if(a==="acceptance") safe(()=>api("/api/acceptance"),"acceptanceResult");
    if(a==="language") safe(()=>api("/api/language/current"),"aiPlanResult");
    if(a==="ai-plan") safe(()=>post("/api/ai/plan",{objective:document.getElementById("aiObjective").value}),"aiPlanResult");
    if(a==="bio-analyze") safe(()=>post("/api/bio/analyze",{nodes:JSON.parse(document.getElementById("bioNodes").value||"[]"),relations:JSON.parse(document.getElementById("bioRelations").value||"[]")}),"bioResult");
    if(a==="stream-status") safe(()=>api("/api/stream/status"),"streamResult");
    if(a==="capacity") safe(()=>api("/api/capacity?index="+encodeURIComponent(document.getElementById("capacityIndex").value)),"capacityResult");
    if(a==="star") safe(()=>api("/api/star?index="+encodeURIComponent(document.getElementById("starIndex").value)),"capacityResult");
    if(a==="systems") safe(()=>api("/api/systems"),"systemsResult");
    if(a==="history") safe(()=>api("/api/history?limit=100"),"recoveryResult");
    if(a==="rollback") safe(()=>post("/api/recovery/rollback",{digest:document.getElementById("rollbackDigest").value.trim(),reason:document.getElementById("rollbackReason").value}),"recoveryResult");
    if(a==="host-compile") safe(()=>post("/api/host/compile",{
      evidence_class:document.getElementById("obsClass").value,
      source_id:document.getElementById("obsSource").value,
      authority:document.getElementById("obsAuthority").value,
      observed_at:document.getElementById("obsTime").value||undefined,
      immutable_ref:document.getElementById("obsRef").value||undefined,
      payload:JSON.parse(document.getElementById("obsPayload").value||"{}")
    }),"hostCompileResult");
  });

  inject();
  if(window.mountOmegaField){
    window.mountOmegaField(document.getElementById("field3d"),()=>SNAP);
  }
  connectStream();
})();
