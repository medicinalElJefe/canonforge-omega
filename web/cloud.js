(() => {
  const state = { authenticated: false, enabled: false, socket: null };

  function ensureUi() {
    if (document.getElementById("omegaCloudLogin")) return;
    const wrap = document.createElement("div");
    wrap.id = "omegaCloudLogin";
    wrap.className = "cloud-login";
    wrap.innerHTML = `
      <div class="cloud-login-card">
        <small>OMEGA CLOUD</small>
        <h2>Canonical cloud access</h2>
        <p>This cloud host owns the live canonical state. Enter the operator token generated during cloud bootstrap.</p>
        <input id="omegaCloudToken" type="password" autocomplete="current-password" placeholder="Operator token">
        <button id="omegaCloudLoginButton" class="btn primary">Enter OMEGA Cloud</button>
        <div id="omegaCloudLoginResult" class="result"></div>
      </div>`;
    document.body.appendChild(wrap);
    document.getElementById("omegaCloudLoginButton").addEventListener("click", login);
    document.getElementById("omegaCloudToken").addEventListener("keydown", e => {
      if (e.key === "Enter") login();
    });
  }

  function setVisible(show) {
    ensureUi();
    document.getElementById("omegaCloudLogin").classList.toggle("active", !!show);
  }

  async function login() {
    const token = document.getElementById("omegaCloudToken").value;
    const out = document.getElementById("omegaCloudLoginResult");
    out.textContent = "Authenticating…";
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        credentials: "same-origin",
        body: JSON.stringify({token})
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || "authentication failed");
      out.textContent = "Authenticated. Loading canonical cloud…";
      location.reload();
    } catch (err) {
      out.textContent = String(err.message || err);
    }
  }

  function connectStream() {
    if (!state.authenticated || state.socket) return;
    const scheme = location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${scheme}//${location.host}/stream`);
    state.socket = ws;
    ws.onopen = () => document.documentElement.dataset.omegaCloudStream = "live";
    ws.onmessage = event => {
      try {
        const packet = JSON.parse(event.data);
        window.dispatchEvent(new CustomEvent("omega-cloud-heartbeat", {detail: packet}));
      } catch (_) {}
    };
    ws.onclose = () => {
      document.documentElement.dataset.omegaCloudStream = "offline";
      state.socket = null;
      setTimeout(connectStream, 3000);
    };
    ws.onerror = () => ws.close();
  }

  async function boot() {
    ensureUi();
    try {
      const res = await fetch("/api/auth/status", {credentials: "same-origin"});
      const data = await res.json();
      state.enabled = !!data.auth_enabled;
      state.authenticated = !!data.authenticated;
      document.documentElement.dataset.omegaCloud = data.cloud_mode ? "canonical" : "local";
      setVisible(state.enabled && !state.authenticated);
      if (state.authenticated) connectStream();
    } catch (_) {
      setVisible(false);
    }
  }

  window.addEventListener("DOMContentLoaded", boot);
})();

(() => {
  const CONTROLLER_KEY = "omegaHybridControllerToken";
  let poller = null;
  let pairExpiry = 0;

  function css() {
    if (document.getElementById("omegaHybridEasyCss")) return;
    const style = document.createElement("style");
    style.id = "omegaHybridEasyCss";
    style.textContent = `
      .hybrid-easy{display:grid;gap:18px}.hybrid-hero{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(220px,.65fr);gap:16px;align-items:stretch}.hybrid-connect-box,.hybrid-status-box,.hybrid-device{border:1px solid rgba(255,255,255,.11);background:rgba(255,255,255,.025);border-radius:18px;padding:18px}.hybrid-connect-box{position:relative;overflow:hidden}.hybrid-connect-box:before{content:"";position:absolute;inset:auto -40px -70px auto;width:180px;height:180px;border-radius:50%;border:1px solid rgba(117,233,255,.18);box-shadow:0 0 70px rgba(65,190,255,.08)}.hybrid-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:14px 0}.hybrid-step{padding:12px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(0,0,0,.16)}.hybrid-step b{display:block;margin-bottom:5px}.hybrid-step span{font-size:.82rem;opacity:.72}.hybrid-actions{display:flex;flex-wrap:wrap;gap:9px}.hybrid-pill{display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:7px 10px;font-size:.78rem}.hybrid-dot{width:9px;height:9px;border-radius:50%;background:#777;box-shadow:0 0 0 4px rgba(255,255,255,.03)}.hybrid-pill.online .hybrid-dot{background:#62efad;box-shadow:0 0 18px rgba(98,239,173,.55)}.hybrid-pill.waiting .hybrid-dot{background:#f3cf65}.hybrid-code{font:700 clamp(1.6rem,5vw,3.1rem)/1 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.14em;margin:12px 0;word-break:break-all}.hybrid-command{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;margin-top:10px}.hybrid-command code{display:block;overflow:auto;white-space:nowrap;padding:11px 12px;border-radius:11px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.08);font-size:.78rem}.hybrid-device-list{display:grid;gap:10px;margin-top:10px}.hybrid-device{padding:13px}.hybrid-device-head{display:flex;justify-content:space-between;gap:12px;align-items:center}.hybrid-device small{display:block;margin-top:4px;opacity:.66}.hybrid-capabilities{display:flex;flex-wrap:wrap;gap:5px;margin-top:9px}.hybrid-capabilities span{font-size:.68rem;padding:4px 7px;border-radius:999px;background:rgba(255,255,255,.05)}.hybrid-empty{padding:14px;border:1px dashed rgba(255,255,255,.12);border-radius:12px;opacity:.72}.hybrid-note{font-size:.82rem;opacity:.7;line-height:1.5}.hybrid-advanced{margin-top:3px}.hybrid-advanced summary{cursor:pointer;padding:10px 0;font-weight:700}.hybrid-advanced[open] summary{margin-bottom:8px}.hybrid-countdown{font-size:.75rem;opacity:.66}.hybrid-status-box strong{font-size:1.15rem}.hybrid-status-line{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:12px}
      @media(max-width:850px){.hybrid-hero{grid-template-columns:1fr}.hybrid-steps{grid-template-columns:1fr}.hybrid-command{grid-template-columns:1fr}.hybrid-command button{width:100%}.hybrid-actions .btn{flex:1 1 150px}.hybrid-device-head{align-items:flex-start}.hybrid-code{font-size:2rem}}
      @media(max-width:520px){.hybrid-connect-box,.hybrid-status-box{padding:14px}.hybrid-code{font-size:1.55rem}.hybrid-actions{display:grid;grid-template-columns:1fr}.hybrid-actions .btn{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function hostCard() {
    const cards = [...document.querySelectorAll('[data-view="host"] article.card')];
    return cards.find(card => (card.querySelector("small")?.textContent || "").trim() === "HYBRID LINK") || null;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]));
  }

  async function linkFetch(path, options = {}) {
    const headers = new Headers(options.headers || {});
    const token = sessionStorage.getItem(CONTROLLER_KEY) || "";
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    const res = await fetch(path, {...options, headers, cache:"no-store"});
    let data = {};
    try { data = await res.json(); } catch (_) { data = {error:"non_json_response"}; }
    if (!res.ok) throw new Error(data.detail || data.error || `HTTP ${res.status}`);
    return data;
  }

  function install() {
    css();
    const card = hostCard();
    if (!card || card.dataset.easyHybrid === "1") return;
    card.dataset.easyHybrid = "1";
    card.innerHTML = `
      <div class="hybrid-easy">
        <div class="card-head"><div><small>HYBRID LINK</small><h2>Connect your PC to OMEGA</h2></div><span class="tag">SIGNED NODE</span></div>
        <p>Pair once, then OMEGA Cloud can see the PC as an optional execution node. Your PC stays non-canonical: typed jobs execute only inside the approved root and the cloud remains the state authority.</p>
        <div class="hybrid-hero">
          <div class="hybrid-connect-box">
            <div class="hybrid-pill waiting" id="hybridEasyState"><span class="hybrid-dot"></span><b>Not connected yet</b></div>
            <div class="hybrid-steps">
              <div class="hybrid-step"><b>1 · Create pair</b><span>OMEGA generates a short-lived secure pairing code.</span></div>
              <div class="hybrid-step"><b>2 · Start PC Link</b><span>Copy the command or use your existing Desktop Link launcher.</span></div>
              <div class="hybrid-step"><b>3 · Done</b><span>This panel changes to ONLINE automatically when the PC checks in.</span></div>
            </div>
            <div class="hybrid-actions">
              <button class="btn primary" id="hybridEasyPair">Create secure pair</button>
              <button class="btn" id="hybridEasyRefresh">Refresh devices</button>
              <button class="btn" id="hybridEasyForget" hidden>Forget this browser controller</button>
            </div>
            <div id="hybridEasyPairPanel" hidden>
              <div class="hybrid-code" id="hybridEasyCode">—</div>
              <div class="hybrid-countdown" id="hybridEasyExpiry"></div>
              <div class="hybrid-command"><code id="hybridEasyCommand"></code><button class="btn" id="hybridEasyCopy">Copy PC command</button></div>
              <p class="hybrid-note">The browser cannot silently launch software on your PC. Run this command from the OMEGA repository folder, or launch <code>START_OMEGA_DESKTOP_LINK.bat</code> and use the displayed pairing code. The device credential stays on the PC.</p>
            </div>
          </div>
          <div class="hybrid-status-box">
            <div class="hybrid-status-line"><div><small>NODE STATUS</small><strong id="hybridEasySummary">Waiting for a device</strong></div><span class="hybrid-pill" id="hybridEasyCount"><span class="hybrid-dot"></span>0 online</span></div>
            <div class="hybrid-device-list" id="hybridEasyDevices"><div class="hybrid-empty">No authenticated PC heartbeat has been observed by this controller yet.</div></div>
          </div>
        </div>
        <details class="hybrid-advanced">
          <summary>Advanced · typed Hybrid plan tools</summary>
          <label>Approved root (blank = configured default)<input id="hybridRoot" placeholder="blank uses configured default"></label>
          <label>Plan JSON<textarea id="hybridPlan" rows="7">[{"op":"HASH_TREE","path":"."}]</textarea></label>
          <div class="hybrid-actions"><button class="btn" data-action="hybrid-validate">Validate plan</button><button class="btn primary" data-action="hybrid-run">Run governed plan</button></div>
          <div class="result" id="hybridResult"></div>
        </details>
      </div>`;
    document.getElementById("hybridEasyPair").addEventListener("click", createPair);
    document.getElementById("hybridEasyRefresh").addEventListener("click", refreshDevices);
    document.getElementById("hybridEasyForget").addEventListener("click", forgetController);
    document.getElementById("hybridEasyCopy").addEventListener("click", copyCommand);
    updateControllerUi();
    refreshDevices();
    poller = setInterval(refreshDevices, 5000);
    setInterval(updateExpiry, 1000);
  }

  function updateControllerUi() {
    const has = !!sessionStorage.getItem(CONTROLLER_KEY);
    const forget = document.getElementById("hybridEasyForget");
    if (forget) forget.hidden = !has;
  }

  async function createPair() {
    const button = document.getElementById("hybridEasyPair");
    const statePill = document.getElementById("hybridEasyState");
    button.disabled = true;
    button.textContent = "Creating pair…";
    try {
      const data = await linkFetch("/api/link/pair", {method:"POST", body:"{}"});
      if (!data.controller_token || !data.pair_code) throw new Error("pair response missing credentials");
      sessionStorage.setItem(CONTROLLER_KEY, data.controller_token);
      pairExpiry = Date.parse(data.expires_at || "") || 0;
      document.getElementById("hybridEasyCode").textContent = data.pair_code;
      const service = location.origin;
      const command = `powershell -ExecutionPolicy Bypass -File .\\START_OMEGA_DESKTOP_LINK.ps1 -Cloud \"${service}\" -PairCode \"${data.pair_code}\"`;
      document.getElementById("hybridEasyCommand").textContent = command;
      document.getElementById("hybridEasyPairPanel").hidden = false;
      statePill.className = "hybrid-pill waiting";
      statePill.innerHTML = '<span class="hybrid-dot"></span><b>Pair code ready · waiting for PC</b>';
      updateControllerUi();
      updateExpiry();
      await refreshDevices();
    } catch (err) {
      statePill.className = "hybrid-pill";
      statePill.innerHTML = `<span class="hybrid-dot"></span><b>${escapeHtml(err.message || err)}</b>`;
    } finally {
      button.disabled = false;
      button.textContent = "Create new secure pair";
    }
  }

  async function refreshDevices() {
    const token = sessionStorage.getItem(CONTROLLER_KEY);
    const list = document.getElementById("hybridEasyDevices");
    if (!list) return;
    if (!token) {
      list.innerHTML = '<div class="hybrid-empty">Press “Create secure pair” to begin. No device is claimed online until an authenticated heartbeat is actually observed.</div>';
      renderSummary([]);
      return;
    }
    try {
      const data = await linkFetch("/api/link/status");
      const devices = Array.isArray(data.devices) ? data.devices : [];
      renderSummary(devices);
      if (!devices.length) {
        list.innerHTML = '<div class="hybrid-empty">Controller is ready. Waiting for the PC to claim the pairing code and send its first signed-protocol heartbeat.</div>';
        return;
      }
      list.innerHTML = devices.map(d => {
        const online = !!d.online;
        const caps = (d.capabilities || []).slice(0,12).map(x => `<span>${escapeHtml(x)}</span>`).join("");
        const protocol = d.execution_protocol || "protocol not reported";
        return `<div class="hybrid-device"><div class="hybrid-device-head"><div><b>${escapeHtml(d.device_name || "OMEGA PC")}</b><small>${escapeHtml(protocol)} · last seen ${escapeHtml(d.last_seen || "never")}</small></div><span class="hybrid-pill ${online?"online":""}"><span class="hybrid-dot"></span>${online?"ONLINE":"OFFLINE"}</span></div><div class="hybrid-capabilities">${caps || '<span>no capabilities reported</span>'}</div></div>`;
      }).join("");
    } catch (err) {
      list.innerHTML = `<div class="hybrid-empty">Could not read device status: ${escapeHtml(err.message || err)}</div>`;
    }
  }

  function renderSummary(devices) {
    const online = devices.filter(d => d.online).length;
    const summary = document.getElementById("hybridEasySummary");
    const count = document.getElementById("hybridEasyCount");
    const statePill = document.getElementById("hybridEasyState");
    if (!summary || !count || !statePill) return;
    summary.textContent = online ? `${online} authenticated node${online===1?"":"s"} online` : (devices.length ? "Paired device offline" : "Waiting for a device");
    count.className = `hybrid-pill ${online?"online":""}`;
    count.innerHTML = `<span class="hybrid-dot"></span>${online} online`;
    if (online) {
      statePill.className = "hybrid-pill online";
      statePill.innerHTML = '<span class="hybrid-dot"></span><b>PC connected and authenticated</b>';
      const panel = document.getElementById("hybridEasyPairPanel");
      if (panel) panel.hidden = true;
    }
  }

  function updateExpiry() {
    const el = document.getElementById("hybridEasyExpiry");
    if (!el || !pairExpiry) return;
    const left = Math.max(0, pairExpiry - Date.now());
    if (!left) { el.textContent = "Pairing code expired. Create a new secure pair if the PC has not connected."; return; }
    const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
    el.textContent = `Pair code expires in ${m}:${String(s).padStart(2,"0")}`;
  }

  async function copyCommand() {
    const text = document.getElementById("hybridEasyCommand")?.textContent || "";
    const button = document.getElementById("hybridEasyCopy");
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = "Copied";
      setTimeout(() => button.textContent = "Copy PC command", 1600);
    } catch (_) {
      button.textContent = "Select command manually";
    }
  }

  function forgetController() {
    sessionStorage.removeItem(CONTROLLER_KEY);
    pairExpiry = 0;
    const panel = document.getElementById("hybridEasyPairPanel");
    if (panel) panel.hidden = true;
    updateControllerUi();
    refreshDevices();
  }

  window.addEventListener("DOMContentLoaded", install);
  window.addEventListener("beforeunload", () => { if (poller) clearInterval(poller); });
})();
