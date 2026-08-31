const LOCAL_KEY = "omega.context.memory.v1";
const CONTROLLER_KEY = "omegaHybridControllerToken";
const PREF_KEY = "omega.context.memory.preference.v1";
const ACTIVE_KEY = "omega.context.active.v1";
const MAX_LOCAL = 250;
const BASE_THRESHOLD = .48;
const MIN_THRESHOLD = .40;
const MAX_THRESHOLD = .70;

const q = selector => document.querySelector(selector);

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
  }[ch]));
}

function redact(value) {
  return String(value || "").slice(0, 12000)
    .replace(/(bearer\s+)[A-Za-z0-9._~+\-/=]{12,}/ig, "$1[REDACTED]")
    .replace(/((?:api[_ -]?key|token|password|secret)\s*[:=]\s*)[^\s,;]{6,}/ig, "$1[REDACTED]");
}

function wordSet(value) {
  return new Set(String(value || "").toLowerCase().match(/[a-z0-9][a-z0-9_'-]{2,}/g) || []);
}

function localRows() {
  try {
    const rows = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
    return Array.isArray(rows) ? rows : [];
  } catch (_) {
    return [];
  }
}

function writeLocal(rows) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(rows.slice(-MAX_LOCAL)));
}

function preference() {
  try {
    return {
      accepted: 0,
      dismissed: 0,
      threshold: BASE_THRESHOLD,
      ...JSON.parse(localStorage.getItem(PREF_KEY) || "{}")
    };
  } catch (_) {
    return {accepted: 0, dismissed: 0, threshold: BASE_THRESHOLD};
  }
}

function writePreference(value) {
  value.threshold = Math.max(
    MIN_THRESHOLD,
    Math.min(MAX_THRESHOLD, +Number(value.threshold || BASE_THRESHOLD).toFixed(2))
  );
  localStorage.setItem(PREF_KEY, JSON.stringify(value));
  return value;
}

function activeContext() {
  try {
    return JSON.parse(sessionStorage.getItem(ACTIVE_KEY) || "null");
  } catch (_) {
    return null;
  }
}

function setActiveContext(value) {
  if (value) sessionStorage.setItem(ACTIVE_KEY, JSON.stringify(value));
  else sessionStorage.removeItem(ACTIVE_KEY);
  renderActiveContext();
}

function importance(text) {
  const value = String(text || "").toLowerCase();
  const signals = [
    ["decision", .20, ["decide", "decision", "agreed", "choose", "selected", "final"]],
    ["commitment", .18, ["will", "commit", "must", "require", "promise", "deadline"]],
    ["goal", .16, ["goal", "objective", "want", "need", "build", "make"]],
    ["constraint", .16, ["constraint", "never", "avoid", "cannot", "do not", "must not"]],
    ["recovery", .12, ["rollback", "restore", "repair", "recover", "broken", "failure"]],
    ["identity", .10, ["canonical", "authority", "source", "proof", "version", "release"]],
    ["future", .08, ["next", "later", "future", "follow up", "continue", "pending"]]
  ];
  let score = 0;
  const reasons = [];
  for (const [reason, weight, needles] of signals) {
    if (needles.some(needle => value.includes(needle))) {
      score += weight;
      reasons.push(reason);
    }
  }
  if (value.length >= 800) {
    score += .05;
    reasons.push("substantive_context");
  }
  return {score: Math.min(1, +score.toFixed(4)), reasons};
}

async function hashText(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}

function controllerToken() {
  return sessionStorage.getItem(CONTROLLER_KEY) || "";
}

async function canonicalDigest() {
  try {
    const response = await fetch("/api/state", {cache: "no-store"});
    const data = await response.json();
    const digest = String(data?.state?.digest || data?.canonical_digest || "").toLowerCase();
    return /^[0-9a-f]{64}$/.test(digest) ? digest : null;
  } catch (_) {
    return null;
  }
}

async function cloudMemory(op, payload = {}) {
  const token = controllerToken();
  if (!token) throw new Error("controller_not_available");
  const response = await fetch("/api/link/mission", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    cache: "no-store",
    body: JSON.stringify({context_memory: {op, ...payload}})
  });
  let data = {};
  try { data = await response.json(); }
  catch (_) { data = {error: "non_json_response"}; }
  if (!response.ok) throw new Error(data.detail || data.error || `HTTP ${response.status}`);
  return data;
}

function collectEditor() {
  const title = redact(q("#memoryTitle")?.value).slice(0, 160) || "Important conversation";
  const summary = redact(q("#memorySummary")?.value).slice(0, 4000);
  const transcript = redact(q("#memoryTranscript")?.value);
  const tags = [...new Set(
    String(q("#memoryTags")?.value || "")
      .split(",")
      .map(x => redact(x).trim().toLowerCase())
      .filter(Boolean)
  )].slice(0, 24);
  if (!summary && !transcript) throw new Error("conversation_content_required");
  return {
    conversation_id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    title,
    summary,
    transcript,
    tags
  };
}

async function localSave(data, authority = "LOCAL_FALLBACK") {
  const created_at = new Date().toISOString();
  const signal = importance(`${data.title}\n${data.summary}\n${data.transcript}`);
  const base = {
    schema: "omega.conversation.memory.browser.v1",
    ...data,
    importance: {
      ...signal,
      reasons: ["explicit_user_save", ...signal.reasons],
      suggest_save: true
    },
    created_at,
    archived: false,
    canonical_mutation: false,
    source_class: "SAVED_CONVERSATION_CONTEXT",
    storage_authority: authority
  };
  const record_hash = await hashText(JSON.stringify(base));
  const rows = localRows();
  rows.push({...base, record_hash});
  writeLocal(rows);
  return {...base, record_hash};
}

function localRank(query) {
  const queryWords = wordSet(query);
  if (!queryWords.size) return [];
  return localRows()
    .filter(record => !record.archived)
    .map(record => {
      const recordWords = wordSet(`${record.title} ${record.summary} ${(record.tags || []).join(" ")}`);
      const matched = [...queryWords].filter(term => recordWords.has(term));
      const union = new Set([...queryWords, ...recordWords]);
      const importanceScore = Number(record.importance?.score || 0);
      return {
        conversation_id: record.conversation_id,
        title: record.title,
        summary: record.summary,
        tags: record.tags || [],
        relevance: +((matched.length / Math.max(1, union.size)) * 2.2 + importanceScore * .28).toFixed(4),
        why: {matched_terms: matched.slice(0, 12), importance: importanceScore},
        record_hash: record.record_hash,
        canonical_digest: record.canonical_digest,
        source_class: "SAVED_CONVERSATION_CONTEXT",
        storage_authority: record.storage_authority || "LOCAL"
      };
    })
    .filter(record => record.why.matched_terms.length)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 8);
}

function setAuthorityChip(text, kind = "") {
  const element = q("#memoryAuthority");
  if (!element) return;
  element.textContent = text;
  element.className = `chip ${kind}`.trim();
}

async function detectAuthority() {
  if (!controllerToken()) {
    setAuthorityChip("MEMORY · LOCAL");
    return {authority: "LOCAL", authenticated: false};
  }
  try {
    const status = await cloudMemory("STATUS");
    setAuthorityChip(`MEMORY · CLOUD · ${status.records || 0}/${status.max_records || 250}`, "good");
    return {authority: "CLOUD", ...status};
  } catch (error) {
    setAuthorityChip("MEMORY · DEGRADED → LOCAL");
    return {authority: "LOCAL_FALLBACK", error: String(error.message || error)};
  }
}

async function saveImportantConversation() {
  const data = collectEditor();
  data.canonical_digest = await canonicalDigest();
  const pref = preference();
  let result;
  try {
    if (!controllerToken()) throw new Error("controller_not_available");
    if (!data.canonical_digest) throw new Error("canonical_digest_unavailable");
    result = await cloudMemory("SAVE", data);
    await localSave(data, "CLOUD_MIRROR");
    setAuthorityChip("MEMORY · CLOUD", "good");
  } catch (error) {
    const local = await localSave(data, "LOCAL_FALLBACK");
    result = {
      status: "SAVED_LOCAL_FALLBACK",
      record: local,
      cloud_error: String(error.message || error),
      boundary: "Cloud controller unavailable or canonical identity could not be proven; saved locally without mutating canonical state."
    };
    setAuthorityChip("MEMORY · LOCAL FALLBACK");
  }
  pref.accepted += 1;
  pref.threshold = Math.max(MIN_THRESHOLD, pref.threshold - .01);
  writePreference(pref);
  hideSuggestion();
  await renderList();
  renderPreference();
  return result;
}

async function searchMemory(query) {
  const value = String(query || "").trim();
  if (!value) return {status: "CONTEXT", matches: [], authority: "NONE"};
  try {
    if (!controllerToken()) throw new Error("controller_not_available");
    const data = await cloudMemory("SEARCH", {query: value, limit: 8});
    setAuthorityChip("MEMORY · CLOUD", "good");
    return {...data, authority: "CLOUD"};
  } catch (error) {
    setAuthorityChip(controllerToken() ? "MEMORY · DEGRADED → LOCAL" : "MEMORY · LOCAL");
    return {
      schema: "omega.conversation.memory.search.local.v1",
      query: value,
      matches: localRank(value),
      authority: "LOCAL_FALLBACK",
      cloud_error: controllerToken() ? String(error.message || error) : undefined,
      canonical_mutation: false,
      boundary: "Local saved context only; not external evidence or canonical truth."
    };
  }
}

async function archiveMemory(id, authority) {
  if (authority === "CLOUD" && controllerToken()) {
    try {
      await cloudMemory("ARCHIVE", {conversation_id: id});
      await renderList();
      return;
    } catch (_) {}
  }
  const rows = localRows();
  const record = rows.find(row => row.conversation_id === id);
  if (record) {
    record.archived = true;
    record.archived_at = new Date().toISOString();
    writeLocal(rows);
  }
  await renderList();
}

async function listRecords() {
  try {
    if (!controllerToken()) throw new Error("controller_not_available");
    const data = await cloudMemory("LIST");
    return {authority: "CLOUD", records: (data.records || []).filter(row => !row.archived)};
  } catch (_) {
    return {
      authority: "LOCAL",
      records: localRows().filter(row => !row.archived).slice().reverse()
    };
  }
}

async function renderList() {
  const element = q("#memoryList");
  if (!element) return;
  const data = await listRecords();
  const rows = data.records.slice(0, 12);
  element.innerHTML = rows.length ? rows.map(record => `
    <div class="gate memory-row">
      <i></i>
      <div class="memory-copy">
        <b>${escapeHtml(record.title)}</b>
        <span>${escapeHtml((record.tags || []).join(" · ") || "saved context")}</span>
      </div>
      <button class="btn" data-context-use="${escapeHtml(record.conversation_id)}" data-context-title="${escapeHtml(record.title)}" data-context-summary="${escapeHtml(record.summary || "")}">Use as context</button>
      <button class="btn" data-memory-cloud-archive="${escapeHtml(record.conversation_id)}" data-memory-authority="${data.authority}">Archive</button>
    </div>`).join("") : "<div class='hybrid-empty'>No saved important conversations yet.</div>";
}

function renderMatches(data) {
  const element = q("#memoryResult");
  if (!element) return;
  const rows = data.matches || [];
  element.innerHTML = `
    <div class="memory-result-head">
      <b>${escapeHtml(data.authority || "CONTEXT")}</b>
      <span>${rows.length} relevant saved conversation${rows.length === 1 ? "" : "s"}</span>
    </div>` + (rows.length ? rows.map(record => `
      <div class="memory-match">
        <b>${escapeHtml(record.title)}</b>
        <p>${escapeHtml(record.summary || "")}</p>
        <small>matched: ${escapeHtml((record.why?.matched_terms || []).join(", ") || "importance")}</small>
        <button class="btn" data-context-use="${escapeHtml(record.conversation_id)}" data-context-title="${escapeHtml(record.title)}" data-context-summary="${escapeHtml(record.summary || "")}">Use as context</button>
      </div>`).join("") : "<div class='hybrid-empty'>No relevant saved context found.</div>");
}

function renderActiveContext() {
  const element = q("#activeMemoryContext");
  if (!element) return;
  const context = activeContext();
  element.innerHTML = context ? `
    <div>
      <small>ACTIVE SAVED CONTEXT · NOT EVIDENCE</small>
      <b>${escapeHtml(context.title)}</b>
      <p>${escapeHtml(context.summary || "")}</p>
      <button class="btn" data-context-clear>Clear context</button>
    </div>` : "<span>No saved conversation is currently injected into planning.</span>";
}

function renderPreference() {
  const element = q("#memoryAdaptation");
  if (!element) return;
  const pref = preference();
  element.textContent = `Suggestion threshold ${pref.threshold.toFixed(2)} · accepted ${pref.accepted} · dismissed ${pref.dismissed} · transparent local preference only · resettable by clearing site data`;
}

function hideSuggestion() {
  const element = q("#memorySuggestion");
  if (element) element.hidden = true;
}

let suggestionTimer = 0;
let lastSuggestionSignature = "";

function evaluateSuggestion() {
  clearTimeout(suggestionTimer);
  suggestionTimer = setTimeout(() => {
    const title = q("#memoryTitle")?.value || "";
    const summary = q("#memorySummary")?.value || "";
    const transcript = q("#memoryTranscript")?.value || "";
    const text = `${title}\n${summary}\n${transcript}`;
    const signal = importance(text);
    const pref = preference();
    const element = q("#memorySuggestion");
    if (!element) return;
    const signature = `${signal.score}:${signal.reasons.join(",")}:${text.length}`;
    if (text.trim().length >= 80 && signal.score >= pref.threshold && signature !== lastSuggestionSignature) {
      lastSuggestionSignature = signature;
      element.hidden = false;
      element.innerHTML = `
        <b>This looks worth remembering.</b>
        <span>${Math.round(signal.score * 100)}% importance · ${escapeHtml(signal.reasons.join(" · ") || "substantive context")}</span>
        <div>
          <button class="btn primary" data-suggestion-save>Save it</button>
          <button class="btn" data-suggestion-dismiss>Not important</button>
        </div>`;
    } else if (signal.score < pref.threshold) {
      element.hidden = true;
    }
  }, 500);
}

function dismissSuggestion() {
  const pref = preference();
  pref.dismissed += 1;
  pref.threshold = Math.min(MAX_THRESHOLD, pref.threshold + .02);
  writePreference(pref);
  hideSuggestion();
  renderPreference();
}

function capturePlanner() {
  const objective = redact(q("#aiObjective")?.value || "");
  const result = redact(q("#aiPlanResult")?.textContent || "");
  if (q("#memoryTitle")) q("#memoryTitle").value = "OMEGA planner interaction";
  if (q("#memoryTags")) q("#memoryTags").value = "planner, decision, context";
  if (q("#memorySummary")) q("#memorySummary").value = objective.slice(0, 4000);
  if (q("#memoryTranscript")) q("#memoryTranscript").value = `Objective:\n${objective}\n\nPlanner result:\n${result}`.slice(0, 12000);
  evaluateSuggestion();
  q("#memoryTranscript")?.focus();
}

async function plannerRequest(objective) {
  const response = await fetch("/api/ai/plan", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    cache: "no-store",
    body: JSON.stringify({objective})
  });
  let data = {};
  try { data = await response.json(); }
  catch (_) { data = {error: "non_json_response"}; }
  if (!response.ok) throw new Error(data.detail || data.error || `HTTP ${response.status}`);
  return data;
}

async function planWithContext() {
  const objective = q("#aiObjective")?.value || "";
  const context = activeContext();
  const output = q("#aiPlanResult");
  if (!output) return;
  if (!context) {
    output.textContent = JSON.stringify(await plannerRequest(objective), null, 2);
    return;
  }
  const contextualObjective = `${objective}\n\n[SAVED_CONVERSATION_CONTEXT — contextual memory, not evidence or canonical truth]\nTitle: ${context.title}\nSummary: ${context.summary}`;
  const result = await plannerRequest(contextualObjective);
  output.textContent = JSON.stringify({
    ...result,
    context_used: {
      source_class: "SAVED_CONVERSATION_CONTEXT",
      conversation_id: context.conversation_id,
      title: context.title,
      canonical_mutation: false
    }
  }, null, 2);
}

function installCss() {
  if (q("#omegaContextMemoryCss")) return;
  const style = document.createElement("style");
  style.id = "omegaContextMemoryCss";
  style.textContent = `
    .memory-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
    .memory-suggestion{display:grid;gap:8px;border:1px solid rgba(243,207,101,.35);background:rgba(243,207,101,.06);padding:12px;border-radius:14px}
    .memory-suggestion span{font-size:.8rem;opacity:.78}
    .memory-row{grid-template-columns:auto minmax(0,1fr) auto auto;align-items:center}
    .memory-copy{display:grid;gap:3px}.memory-copy span,.memory-match small{opacity:.68;font-size:.76rem}
    .memory-match{display:grid;gap:7px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.07)}
    .memory-match p{margin:0;opacity:.82}.memory-result-head{display:flex;justify-content:space-between;gap:8px}
    .active-memory-context{padding:12px;border:1px solid rgba(117,233,255,.18);border-radius:14px;background:rgba(117,233,255,.04)}
    .active-memory-context>div{display:grid;gap:6px}.memory-adaptation{font-size:.72rem;opacity:.62}
    @media(max-width:700px){.memory-row{grid-template-columns:auto 1fr}.memory-row .btn{grid-column:2;width:100%}.memory-toolbar .btn{flex:1 1 140px}}
  `;
  document.head.appendChild(style);
}

function enhance() {
  const card = q("#contextMemoryCard");
  if (!card || card.dataset.memoryV3 === "1") return false;
  card.dataset.memoryV3 = "1";
  installCss();
  const label = card.querySelector("small");
  if (label) label.textContent = "CONTEXTUAL MEMORY · CAP-028";
  const heading = card.querySelector("h2");
  if (heading) heading.textContent = "Remember what matters. Carry context safely.";
  const description = card.querySelector("p");
  if (description) description.textContent = "OMEGA can save important conversations, prefer authenticated cloud memory when a Hybrid controller is present, fall back locally when needed, and explain why context is reused. Nothing is silently autosaved or promoted to canonical truth.";
  const saveButton = card.querySelector('[data-advanced="memory-save"]');
  if (saveButton) saveButton.textContent = "Save important conversation";
  const scoreButton = card.querySelector('[data-advanced="memory-score"]');
  scoreButton?.insertAdjacentHTML("afterend", '<span class="chip" id="memoryAuthority">MEMORY · CHECKING</span><button class="btn" data-memory-capture-planner>Capture planner interaction</button>');
  const searchButton = card.querySelector('[data-advanced="memory-search"]');
  searchButton?.insertAdjacentHTML("afterend", '<div class="memory-suggestion" id="memorySuggestion" hidden></div><div class="active-memory-context" id="activeMemoryContext"></div><div class="memory-adaptation" id="memoryAdaptation"></div>');
  ["memoryTitle", "memorySummary", "memoryTranscript", "memoryTags"].forEach(id => {
    q(`#${id}`)?.addEventListener("input", evaluateSuggestion, {passive: true});
  });
  renderActiveContext();
  renderPreference();
  detectAuthority().then(renderList);
  return true;
}

async function handleClick(event) {
  const target = event.target.closest("[data-advanced],[data-memory-cloud-archive],[data-context-use],[data-context-clear],[data-suggestion-save],[data-suggestion-dismiss],[data-memory-capture-planner]");
  if (!target) return;
  const action = target.dataset.advanced;
  const owned = ["memory-save", "memory-score", "memory-search", "ai-plan"].includes(action) ||
    target.matches("[data-memory-cloud-archive],[data-context-use],[data-context-clear],[data-suggestion-save],[data-suggestion-dismiss],[data-memory-capture-planner]");
  if (!owned) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  try {
    if (action === "memory-save" || target.hasAttribute("data-suggestion-save")) {
      const result = await saveImportantConversation();
      q("#memoryResult").textContent = JSON.stringify(result, null, 2);
    } else if (action === "memory-score") {
      const signal = importance(`${q("#memoryTitle")?.value || ""}\n${q("#memorySummary")?.value || ""}\n${q("#memoryTranscript")?.value || ""}`);
      const pref = preference();
      q("#memoryResult").textContent = JSON.stringify({
        ...signal,
        current_suggestion_threshold: pref.threshold,
        suggest_save: signal.score >= pref.threshold,
        canonical_mutation: false
      }, null, 2);
    } else if (action === "memory-search") {
      renderMatches(await searchMemory(q("#memoryQuery")?.value));
    } else if (action === "ai-plan") {
      await planWithContext();
    } else if (target.hasAttribute("data-memory-cloud-archive")) {
      await archiveMemory(target.dataset.memoryCloudArchive, target.dataset.memoryAuthority);
    } else if (target.hasAttribute("data-context-use")) {
      setActiveContext({
        conversation_id: target.dataset.contextUse,
        title: target.dataset.contextTitle,
        summary: target.dataset.contextSummary,
        source_class: "SAVED_CONVERSATION_CONTEXT",
        canonical_mutation: false
      });
    } else if (target.hasAttribute("data-context-clear")) {
      setActiveContext(null);
    } else if (target.hasAttribute("data-suggestion-dismiss")) {
      dismissSuggestion();
    } else if (target.hasAttribute("data-memory-capture-planner")) {
      capturePlanner();
    }
  } catch (error) {
    const output = q("#memoryResult") || q("#aiPlanResult");
    if (output) output.textContent = JSON.stringify({status: "ERROR", detail: String(error.message || error), canonical_mutation: false}, null, 2);
  }
}

document.addEventListener("click", handleClick, true);
let attempts = 0;
const installTimer = setInterval(() => {
  if (enhance() || ++attempts > 80) clearInterval(installTimer);
}, 100);

let lastController = controllerToken();
setInterval(() => {
  const current = controllerToken();
  if (current !== lastController) {
    lastController = current;
    detectAuthority().then(renderList);
  } else if (q("#contextMemoryCard")) {
    detectAuthority();
  }
}, 5000);

window.addEventListener("DOMContentLoaded", enhance, {once: true});
window.OmegaContextMemory = {
  cloudMemory,
  importance,
  search: searchMemory,
  detectAuthority,
  activeContext,
  setActiveContext,
  canonicalDigest
};
