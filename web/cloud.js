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
