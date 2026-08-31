export const EVIDENCE_CLASSES = [
  "OBSERVED_MEASURED",
  "ESTABLISHED_MATH_OR_SCIENCE",
  "DERIVED_FROM_OBSERVED",
  "SIMULATED_CONTINUATION",
  "USER_DEFINED_MODEL",
  "SYMBOLIC_ANALOGY",
  "NO_EVIDENCE",
] as const;

export type EvidenceClass = typeof EVIDENCE_CLASSES[number];

export const STATE_WORKBENCH_BOUNDARY =
  "The Canonical State Workbench is a transparent computation instrument. It does not mutate canonical V6 or Genesis state, execute native work, establish new physical law, or turn uncalibrated model thresholds into empirical truth.";

const MODEL_BOUNDARY =
  "D=(CΩ·Φ)/(q+Λ+ε) and STAY/TURN/ESCALATE are governed user-defined model semantics unless calibrated against held-out observations for the selected domain.";

const STATE_PACKET_SCHEMA = {
  schema: "OMEGA_CANONICAL_STATE_PACKET_V1",
  fields: {
    S: "state/configuration",
    R: "typed relations with provenance/confidence",
    O: "observation/evidence",
    M_sigma: "memory/scar ledger",
    continuity_COmega: "normalized continuity score when defined for domain",
    future_plasticity_Phi: "normalized reachable-option/plasticity score when defined",
    contradiction_q: "normalized contradiction score when defined",
    burden_Lambda: "normalized burden/cost/friction score when defined",
    phase: "state phase/time context",
    constraint_boundary: "declared constraint/boundary",
    confidence: "evidence/model confidence",
    provenance: "source/derivation provenance",
    domain: "domain and units authority",
    scale: "representation/measurement scale",
    time_authority: "MEASURED_SOURCE | SIMULATED_CONTINUATION | CANON_PHASE",
    alternatives: "admissible action/forecast alternatives",
  },
  relation_rule: "Prefer typed multigraph edges with provenance and confidence. Parent edges must declare causal, constitutive, historical, symbolic, or other explicit type.",
  scale_rule: "Cross-scale causation requires an explicit transfer operator and measured invariant; analogy alone is not evidence.",
} as const;

const OPERATOR_STACK = [
  "OBSERVE",
  "NORMALIZE",
  "RELATE",
  "PRUNE",
  "TRANSLATE",
  "FORECAST_COMPUTE",
  "GATE_DECIDE",
  "ACT_RENDER",
  "PROVE",
  "LEDGER",
  "OBSERVE_RESULT",
] as const;

function finite(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalized(name: string, value: number | null): string | null {
  if (value === null) return `${name}_required`;
  if (value < 0 || value > 1) return `${name}_must_be_between_0_and_1`;
  return null;
}

function evidenceClass(value: string | null): EvidenceClass | null {
  return (EVIDENCE_CLASSES as readonly string[]).includes(value || "") ? value as EvidenceClass : null;
}

function round(value: number): number {
  return Number(value.toPrecision(12));
}

export function workbenchSchema() {
  return {
    schema: "OMEGA_STATE_WORKBENCH_SCHEMA_V1",
    authority: "computation-only",
    mutation: false,
    native_execution: false,
    state_packet: STATE_PACKET_SCHEMA,
    evidence_classes: EVIDENCE_CLASSES,
    operator_stack: OPERATOR_STACK,
    model: {
      score: "D=(CΩ*Φ)/(q+Λ+ε)",
      partial_derivatives: {
        continuity_COmega: "∂D/∂CΩ = Φ/(q+Λ+ε)",
        future_plasticity_Phi: "∂D/∂Φ = CΩ/(q+Λ+ε)",
        contradiction_q: "∂D/∂q = -(CΩ*Φ)/(q+Λ+ε)^2",
        burden_Lambda: "∂D/∂Λ = -(CΩ*Φ)/(q+Λ+ε)^2",
      },
      dispatch: "STAY if D≥τ_high; TURN if τ_low<D<τ_high; ESCALATE if D≤τ_low",
      boundary: MODEL_BOUNDARY,
    },
    validation_requirements: [
      "held-out baseline comparison",
      "calibration curve or proper scoring rule",
      "ablation of CΩ, Φ, q, Λ",
      "sensitivity analysis over ε and thresholds",
      "cross-domain transfer with domain-specific scaling only",
      "pre-registered falsification condition",
      "no rescue interpretation after failure",
    ],
    boundary: STATE_WORKBENCH_BOUNDARY,
  };
}

export function evaluateWorkbench(url: URL): { status: number; body: any } {
  const continuity = finite(url.searchParams.get("continuity"));
  const plasticity = finite(url.searchParams.get("plasticity"));
  const contradiction = finite(url.searchParams.get("contradiction"));
  const burden = finite(url.searchParams.get("burden"));
  const epsilon = finite(url.searchParams.get("epsilon"));
  const tauLow = finite(url.searchParams.get("tau_low"));
  const tauHigh = finite(url.searchParams.get("tau_high"));
  const evidence = evidenceClass(url.searchParams.get("evidence_class"));

  const errors = [
    normalized("continuity", continuity),
    normalized("plasticity", plasticity),
    normalized("contradiction", contradiction),
    normalized("burden", burden),
  ].filter(Boolean) as string[];
  if (epsilon === null || epsilon <= 0 || epsilon > 1) errors.push("epsilon_must_be_gt_0_and_lte_1");
  if (tauLow === null || tauLow < 0) errors.push("tau_low_must_be_nonnegative");
  if (tauHigh === null || tauHigh < 0) errors.push("tau_high_must_be_nonnegative");
  if (tauLow !== null && tauHigh !== null && tauLow >= tauHigh) errors.push("tau_low_must_be_less_than_tau_high");
  if (!evidence) errors.push("valid_evidence_class_required");

  if (errors.length) {
    return {
      status: 400,
      body: {
        ok: false,
        schema: "OMEGA_STATE_WORKBENCH_EVALUATION_V1",
        errors,
        evidence_classes: EVIDENCE_CLASSES,
        boundary: STATE_WORKBENCH_BOUNDARY,
      },
    };
  }

  const c = continuity as number, p = plasticity as number, q = contradiction as number, l = burden as number;
  const e = epsilon as number, low = tauLow as number, high = tauHigh as number;
  const denominator = q + l + e;
  const score = (c * p) / denominator;
  const decision = score >= high ? "STAY" : score <= low ? "ESCALATE" : "TURN";
  const derivativeNegative = -(c * p) / (denominator * denominator);
  const domain = (url.searchParams.get("domain") || "UNSPECIFIED").slice(0, 120);
  const scale = (url.searchParams.get("scale") || "UNSPECIFIED").slice(0, 120);
  const timeAuthority = (url.searchParams.get("time_authority") || "CANON_PHASE").slice(0, 80);

  return {
    status: 200,
    body: {
      ok: true,
      schema: "OMEGA_STATE_WORKBENCH_EVALUATION_V1",
      authority: "computation-only",
      mutation: false,
      native_execution: false,
      evidence_class: evidence,
      empirical_status: evidence === "OBSERVED_MEASURED" || evidence === "DERIVED_FROM_OBSERVED"
        ? "INPUT_EVIDENCE_DECLARED; MODEL_STILL_REQUIRES_DOMAIN_CALIBRATION"
        : "MODEL_OR_NONEMPIRICAL_INPUT",
      canonical_state_packet: {
        schema: "OMEGA_CANONICAL_STATE_PACKET_V1",
        S: { continuity_COmega: c, future_plasticity_Phi: p, contradiction_q: q, burden_Lambda: l },
        R: [],
        O: { evidence_class: evidence },
        M_sigma: { status: "not_supplied" },
        domain,
        scale,
        time_authority: timeAuthority,
        constraint_boundary: "user-declared normalized model inputs only",
        provenance: "interactive workbench query parameters",
      },
      computation: {
        expression: "D=(CΩ*Φ)/(q+Λ+ε)",
        numerator: round(c * p),
        denominator: round(denominator),
        score_D: round(score),
        thresholds: { tau_low: low, tau_high: high, calibrated: false },
        dispatch: decision,
        sensitivities: {
          dD_dCOmega: round(p / denominator),
          dD_dPhi: round(c / denominator),
          dD_dq: round(derivativeNegative),
          dD_dLambda: round(derivativeNegative),
        },
      },
      operator_trace: OPERATOR_STACK,
      proof: {
        formula_declared: true,
        inputs_bounded: true,
        evidence_class_declared: true,
        thresholds_calibrated: false,
        physical_law_claimed: false,
        reproducible_query: true,
      },
      model_boundary: MODEL_BOUNDARY,
      boundary: STATE_WORKBENCH_BOUNDARY,
    },
  };
}

const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>OMEGA V6 · Canonical State Workbench</title><style>
:root{--bg:#05070b;--panel:#0b1119;--line:#293950;--text:#f4f7ff;--muted:#94a3b8;--alpha:#9b6cff;--base:#e6bd4e;--construct:#ef625f;--prune:#4f8fff;--omega:#42cb7c;font:15px/1.45 Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(circle at 22% -10%,#182743,#080c13 38%,var(--bg) 76%);color:var(--text)}a{color:inherit;text-decoration:none}.top{position:sticky;top:0;z-index:20;display:flex;justify-content:space-between;gap:10px;align-items:center;padding:13px 16px;background:#05070be8;border-bottom:1px solid #202d41;backdrop-filter:blur(16px)}.brand{font-weight:900;letter-spacing:.14em}.actions{display:flex;gap:8px;flex-wrap:wrap}.btn,.pill,select,input{border:1px solid #34445e;border-radius:11px;background:#0c131e;color:var(--text);padding:8px 10px}.wrap{max-width:1500px;margin:auto;padding:18px}.hero{display:grid;grid-template-columns:1.25fr .75fr;gap:14px}.card{border:1px solid var(--line);border-radius:18px;background:linear-gradient(180deg,#0f1723ee,#080d14ee);padding:17px;box-shadow:0 28px 80px #0006}.ey{font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:#8090a7}h1{font-size:clamp(2.1rem,5vw,4.7rem);line-height:.94;letter-spacing:-.045em;margin:7px 0 12px}.muted{color:var(--muted)}.workspace{display:grid;grid-template-columns:420px minmax(0,1fr);gap:14px;margin-top:14px}.control{display:grid;grid-template-columns:1fr 86px;gap:8px;align-items:center;padding:9px 0;border-bottom:1px solid #202d40}.control label{font-weight:750}.control small{display:block;color:var(--muted);font-weight:400}.control input{width:100%}.vars{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}.var{border:1px solid #293950;border-radius:14px;padding:12px;background:#09111a}.var b{display:block;font-size:1.45rem}.var.alpha{border-top:3px solid var(--alpha)}.var.base{border-top:3px solid var(--base)}.var.construct{border-top:3px solid var(--construct)}.var.prune{border-top:3px solid var(--prune)}.var.omega{border-top:3px solid var(--omega)}.decision{font-size:clamp(2rem,5vw,4rem);font-weight:900;letter-spacing:-.04em;margin:5px 0}.flow{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.phase{border:1px solid #30415c;border-radius:999px;padding:5px 8px;font-size:.72rem;background:#09111b}.pair{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}.mono{font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;word-break:break-word;max-height:360px;overflow:auto}.boundary{border-left:3px solid var(--base);padding-left:12px}.footer{padding:20px 0 35px;color:#78889e;font-size:.8rem}@media(max-width:1000px){.workspace,.hero,.pair{grid-template-columns:1fr}.vars{grid-template-columns:1fr 1fr}}@media(max-width:620px){.vars{grid-template-columns:1fr}.wrap{padding:10px}.top{align-items:flex-start;flex-wrap:wrap}.control{grid-template-columns:1fr}}
</style></head><body><header class="top"><a class="brand" href="/">OMEGA V6</a><div class="actions"><span class="pill">COMPUTATION ONLY</span><a class="btn" href="/capabilities">Capabilities</a><a class="btn" href="/convergence">Convergence</a></div></header><main class="wrap"><section class="hero"><div class="card"><div class="ey">State · Relation · Computation · Observation · Proof</div><h1>Canonical State Workbench</h1><p class="muted">Manipulate the normalized Dewey state score directly, inspect the operator trace and local sensitivities, and keep the evidence class visible. The workbench makes authored model semantics executable without presenting them as established physical law.</p></div><div class="card boundary"><div class="ey">Truth boundary</div><p>${MODEL_BOUNDARY}</p><p class="muted">A useful model earns predictive authority only through held-out testing, calibration, ablation and falsification.</p></div></section><section class="workspace"><div class="card"><div class="ey">State inputs</div><div class="control"><label>CΩ · Continuity<small>normalized domain score</small></label><input id="continuity" type="number" min="0" max="1" step="0.01" value="0.72"></div><div class="control"><label>Φ · Plasticity<small>reachable-option score</small></label><input id="plasticity" type="number" min="0" max="1" step="0.01" value="0.68"></div><div class="control"><label>q · Contradiction<small>evidence/constraint conflict</small></label><input id="contradiction" type="number" min="0" max="1" step="0.01" value="0.22"></div><div class="control"><label>Λ · Burden<small>cost / friction / unresolved load</small></label><input id="burden" type="number" min="0" max="1" step="0.01" value="0.30"></div><div class="control"><label>ε · Resolution floor<small>numerical regularizer</small></label><input id="epsilon" type="number" min="0.000001" max="1" step="0.001" value="0.01"></div><div class="control"><label>τ low<small>user-defined, uncalibrated</small></label><input id="tau_low" type="number" min="0" step="0.01" value="0.45"></div><div class="control"><label>τ high<small>user-defined, uncalibrated</small></label><input id="tau_high" type="number" min="0" step="0.01" value="0.95"></div><div class="control"><label>Evidence class<small>never inferred silently</small></label><select id="evidence_class">${EVIDENCE_CLASSES.map(x=>`<option${x==="USER_DEFINED_MODEL"?" selected":""}>${x}</option>`).join("")}</select></div><div class="control"><label>Domain<small>units remain domain-specific</small></label><input id="domain" value="GENERAL_MODEL"></div><div class="control"><label>Scale<small>representation, not physical dimension</small></label><input id="scale" value="144_INTERFACE_SHELL"></div></div><div><section class="vars"><div class="var omega"><div class="ey">Score D</div><b id="score">—</b><span class="muted">coherent adaptive model score</span></div><div class="var alpha"><div class="ey">Dispatch</div><b id="dispatch">—</b><span class="muted">threshold routing state</span></div><div class="var base"><div class="ey">Evidence</div><b id="evidence">—</b><span class="muted">declared truth layer</span></div><div class="var prune"><div class="ey">Calibration</div><b id="calibration">NO</b><span class="muted">thresholds remain uncalibrated</span></div></section><section class="card" style="margin-top:14px"><div class="ey">Operator / proof flow</div><div id="flow" class="flow"></div><div class="decision" id="decision">COMPUTING</div><p class="muted" id="why">Waiting for deterministic evaluation.</p></section><section class="pair"><div class="card"><div class="ey">Local sensitivity</div><div id="sensitivity"></div></div><div class="card"><div class="ey">Canonical packet</div><pre id="packet" class="mono"></pre></div></section><section class="card" style="margin-top:14px"><div class="ey">Reproducible proof packet</div><pre id="proof" class="mono"></pre></section></div></section><div class="footer">${STATE_WORKBENCH_BOUNDARY} 144/1728/20736 and larger 12^n coordinate systems remain software/model/interface representations unless independently grounded otherwise.</div></main><script>
const q=s=>document.querySelector(s),ids=['continuity','plasticity','contradiction','burden','epsilon','tau_low','tau_high','evidence_class','domain','scale'];function params(){const p=new URLSearchParams;for(const id of ids)p.set(id,q('#'+id).value);return p}async function run(){try{const r=await fetch('/api/state/workbench/evaluate?'+params(),{cache:'no-store'}),d=await r.json();q('#proof').textContent=JSON.stringify(d,null,2);if(!r.ok){q('#decision').textContent='INPUT REJECTED';q('#why').textContent=(d.errors||[]).join(' · ');return}q('#score').textContent=String(d.computation.score_D);q('#dispatch').textContent=d.computation.dispatch;q('#evidence').textContent=d.evidence_class;q('#decision').textContent=d.computation.dispatch;q('#why').textContent=d.model_boundary;q('#flow').innerHTML=d.operator_trace.map(x=>'<span class="phase">'+x+'</span>').join('');q('#packet').textContent=JSON.stringify(d.canonical_state_packet,null,2);const s=d.computation.sensitivities;q('#sensitivity').innerHTML='<p><b>∂D/∂CΩ</b> '+s.dD_dCOmega+'</p><p><b>∂D/∂Φ</b> '+s.dD_dPhi+'</p><p><b>∂D/∂q</b> '+s.dD_dq+'</p><p><b>∂D/∂Λ</b> '+s.dD_dLambda+'</p>';q('#calibration').textContent=d.computation.thresholds.calibrated?'YES':'NO'}catch(e){q('#decision').textContent='EVALUATION UNAVAILABLE';q('#why').textContent=String(e)}}for(const id of ids)q('#'+id).addEventListener('input',run);run();
</script></body></html>`;

export function stateWorkbenchPage(): string { return page; }

export function handleStateWorkbenchRequest(request: Request): Response | null {
  if (request.method !== "GET") return null;
  const url = new URL(request.url);
  if (url.pathname === "/workbench") {
    return new Response(page, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-omega-authority": "computation-only" } });
  }
  if (url.pathname === "/api/state/workbench/schema") {
    return Response.json(workbenchSchema(), { headers: { "cache-control": "no-store", "x-omega-authority": "computation-only" } });
  }
  if (url.pathname === "/api/state/workbench/evaluate") {
    const evaluated = evaluateWorkbench(url);
    return Response.json(evaluated.body, { status: evaluated.status, headers: { "cache-control": "no-store", "x-omega-authority": "computation-only" } });
  }
  return null;
}
