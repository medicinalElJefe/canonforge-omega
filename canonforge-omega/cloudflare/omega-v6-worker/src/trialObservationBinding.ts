export const TRIAL_OBSERVATION_BINDING_BOUNDARY="R120 binds one later dispatch observation to an unchanged preregistered mode/operator trial draft. It deterministically verifies the draft plan_id against the frozen trial payload, scores baseline versus preview probabilities with a fixed three-class normalized Brier metric, and emits a held-out evidence record. It does not independently authenticate a source, does not prove causation, does not rewrite trial terms or historical forecasts, does not execute the modeled operator, does not mutate canonical state or weights, and does not authorize production policy changes.";

const DISPATCH=["STAY","TURN","ESCALATE"] as const;
const stable=(value:any):string=>{if(value===null||typeof value!=="object")return JSON.stringify(value);if(Array.isArray(value))return"["+value.map(stable).join(",")+"]";return"{"+Object.keys(value).sort().map(k=>JSON.stringify(k)+":"+stable(value[k])).join(",")+"}"};
const hashText=(s:string)=>{let h=0x811c9dc5;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return(h>>>0).toString(16).padStart(8,"0")};
const txt=(v:any,max=360)=>typeof v==="string"&&v.trim()?v.trim().slice(0,max):null;
const finite01=(v:any)=>{const n=Number(v);return Number.isFinite(n)&&n>=0&&n<=1?n:null};
const round=(v:number)=>Number(v.toFixed(6));

export function trialObservationBindingSchema(){return{
  schema:"OMEGA_FROZEN_TRIAL_OBSERVATION_BINDING_V1",
  authority:"validation-and-evidence-binding-only",
  mutation:false,
  execution:false,
  production_policy_mutation:false,
  automatic_weight_change:false,
  causal_attribution:false,
  required:["trial_draft","observation"],
  observation_required:["dispatch","observed_at","evidence_class","authenticated_source","provenance"],
  dispatch:DISPATCH,
  metric:"normalized multiclass Brier = mean((p_dispatch - one_hot_dispatch)^2) over STAY/TURN/ESCALATE",
  boundary:TRIAL_OBSERVATION_BINDING_BOUNDARY
}}

export function evaluateTrialObservationBinding(body:any){
  const draft=body?.trial_draft,trial=draft?.trial;
  if(!draft||typeof draft!=="object"||draft.schema!=="OMEGA_MODE_OPERATOR_PREREGISTERED_TRIAL_DRAFT_V1"||!trial||typeof trial!=="object")return{status:400,body:{ok:false,error:"valid_preregistered_trial_draft_required",boundary:TRIAL_OBSERVATION_BINDING_BOUNDARY}};
  const planId=txt(draft.plan_id,120),expected="mode-trial-"+hashText(stable(trial));
  if(!planId||planId!==expected)return{status:409,body:{ok:false,error:"frozen_trial_fingerprint_mismatch",submitted_plan_id:planId,expected_plan_id:expected,trial_terms_accepted:false,historical_terms_rewritten:false,boundary:TRIAL_OBSERVATION_BINDING_BOUNDARY}};
  const corridor=Array.isArray(trial.forecast_corridor)?trial.forecast_corridor:[];
  const byDispatch=new Map<string,any>();
  for(const row of corridor){const d=txt(row?.dispatch,24);if(d&&(DISPATCH as readonly string[]).includes(d)&&!byDispatch.has(d))byDispatch.set(d,row)}
  if(DISPATCH.some(d=>!byDispatch.has(d)))return{status:400,body:{ok:false,error:"frozen_trial_requires_stay_turn_escalate_corridor",plan_id:planId,boundary:TRIAL_OBSERVATION_BINDING_BOUNDARY}};
  const baseline:number[]=[],candidate:number[]=[];
  for(const d of DISPATCH){const row=byDispatch.get(d),b=finite01(row?.baseline_probability),c=finite01(row?.preview_probability);if(b===null||c===null)return{status:400,body:{ok:false,error:"corridor_probabilities_must_be_0_1",dispatch:d,plan_id:planId,boundary:TRIAL_OBSERVATION_BINDING_BOUNDARY}};baseline.push(b);candidate.push(c)}
  const obs=body?.observation&&typeof body.observation==="object"?body.observation:{},dispatch=txt(obs.dispatch,24),observedAt=txt(obs.observed_at,160),evidenceClass=txt(obs.evidence_class,80)||"NO_EVIDENCE",authenticatedSource=Boolean(obs.authenticated_source),provenance=txt(obs.provenance,360);
  if(!dispatch||!(DISPATCH as readonly string[]).includes(dispatch))return{status:400,body:{ok:false,error:"observation_dispatch_required",allowed:DISPATCH,plan_id:planId,boundary:TRIAL_OBSERVATION_BINDING_BOUNDARY}};
  if(!observedAt||!provenance)return{status:400,body:{ok:false,error:"observation_time_and_provenance_required",plan_id:planId,boundary:TRIAL_OBSERVATION_BINDING_BOUNDARY}};
  const y=DISPATCH.map(d=>d===dispatch?1:0),brier=(p:number[])=>p.reduce((s,v,i)=>s+(v-y[i])*(v-y[i]),0)/DISPATCH.length,baselineBrier=brier(baseline),candidateBrier=brier(candidate),lift=baselineBrier-candidateBrier;
  const evidenceGate=authenticatedSource&&evidenceClass==="OBSERVED/MEASURED",minimum=Number.isFinite(Number(trial.minimum_observations))?Math.max(1,Math.floor(Number(trial.minimum_observations))):20;
  return{status:200,body:{
    ok:true,
    schema:"OMEGA_FROZEN_TRIAL_OBSERVATION_BINDING_V1",
    authority:"validation-and-evidence-binding-only",
    status:evidenceGate?"BOUND_FOR_HELD_OUT_LEDGER":"HOLD_EVIDENCE",
    plan_id:planId,
    frozen_trial_verified:true,
    trial_terms_accepted:true,
    trial:{domain:trial.domain||"unspecified",mode_id:trial.mode_id||null,operator:trial.operator||null,intensity:trial.intensity??null,minimum_observations:minimum,maximum_observations:trial.maximum_observations??null,metric:trial.metric||null,success_condition:trial.success_condition||null,falsification_condition:trial.falsification_condition||null,stop_conditions:trial.stop_conditions||[],rollback:trial.rollback||null},
    observation:{dispatch,observed_at:observedAt,evidence_class:evidenceClass,authenticated_source_claimed:authenticatedSource,provenance},
    scoring:{metric:"normalized_multiclass_brier_3_dispatch",dispatch_order:DISPATCH,baseline_probabilities:baseline,candidate_probabilities:candidate,one_hot_observation:y,baseline_brier:round(baselineBrier),candidate_brier:round(candidateBrier),brier_lift:round(lift),performance:lift>0?"CANDIDATE_LOWER_ERROR":lift<0?"BASELINE_LOWER_ERROR":"EQUAL_ERROR"},
    held_out_record:{plan_id:planId,domain:trial.domain||"unspecified",mode_ids:trial.mode_id?[String(trial.mode_id)]:[],operator_ids:trial.operator?[String(trial.operator)]:[],dispatch,observed_at:observedAt,baseline_brier:round(baselineBrier),candidate_brier:round(candidateBrier),brier_lift:round(lift),evidence_class:evidenceGate?"DERIVED_FROM_OBSERVED":evidenceClass,source_observation_evidence_class:evidenceClass,authenticated_source_claimed:authenticatedSource,provenance},
    evidence:{required_future_evidence_class:"OBSERVED/MEASURED",authenticated_source_required:true,gate_satisfied:evidenceGate,authentication_assertion_independently_verified:false,derived_score_evidence_class:evidenceGate?"DERIVED_FROM_OBSERVED":"NO_EVIDENCE",minimum_observations_for_declared_trial:minimum,observations_bound_this_response:1,remaining_until_minimum:Math.max(0,minimum-1)},
    proof:{trial_payload_fingerprint_recomputed:true,trial_terms_rewritten:false,historical_predictions_rewritten:false,metric_changed_after_observation:false,causation_claimed:false,automatic_execution:false,automatic_weight_change:false,canonical_state_mutation:false,production_policy_mutation:false},
    boundary:TRIAL_OBSERVATION_BINDING_BOUNDARY
  }}
}