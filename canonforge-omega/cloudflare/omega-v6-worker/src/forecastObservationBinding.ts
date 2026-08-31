import { evaluateOperationalCore, OPERATIONAL_CORE_BOUNDARY } from "./unifiedOperationalCore";

export const FORECAST_OBSERVATION_BINDING_BOUNDARY = "Forecast-observation binding pairs one frozen forecast with one later observation for validation. It preserves the forecast packet unchanged, rejects non-later observations, distinguishes authenticated OBSERVED/MEASURED evidence from user declarations, requires a baseline for improvement claims, and cannot establish causation, mutate canonical state, execute actions, or authorize production policy changes.";

function txt(v:any,max=300){return typeof v==="string"&&v.trim()?v.trim().slice(0,max):null}
function n01(v:any){const n=Number(v);return Number.isFinite(n)&&n>=0&&n<=1?n:null}
function epoch(v:any){const t=Date.parse(String(v||""));return Number.isFinite(t)?t:null}
function sq(a:number,b:number){return(a-b)*(a-b)}
function stable(value:any):string{if(value===null||typeof value!=="object")return JSON.stringify(value);if(Array.isArray(value))return"["+value.map(stable).join(",")+"]";return"{"+Object.keys(value).sort().map(k=>JSON.stringify(k)+":"+stable(value[k])).join(",")+"}"}
function hashText(s:string){let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return(h>>>0).toString(16).padStart(8,"0")}

export function forecastObservationBindingSchema(){return{
  schema:"OMEGA_FORECAST_OBSERVATION_BINDING_V1",
  authority:"validation-only",
  mutation:false,
  execution:false,
  production_policy_mutation:false,
  required:["forecast_packet","forecast_id","observation","baseline_probability"],
  evidence_rule:"Only authenticated_source=true with evidence_class=OBSERVED/MEASURED is authenticated observation evidence.",
  boundary:FORECAST_OBSERVATION_BINDING_BOUNDARY
}}

export function evaluateForecastObservationBinding(body:any){
  if(!body||typeof body!=="object")return{status:400,body:{ok:false,error:"binding_object_required",boundary:FORECAST_OBSERVATION_BINDING_BOUNDARY}};
  const packet=body.forecast_packet;
  const core=evaluateOperationalCore(packet);
  if(core.status!==200)return{status:400,body:{ok:false,error:"forecast_packet_invalid",core:core.body,boundary:FORECAST_OBSERVATION_BINDING_BOUNDARY}};
  const frozen:any=core.body;
  const forecastId=txt(body.forecast_id,120);
  const forecasts=Array.isArray(frozen.forecasts)?frozen.forecasts:[];
  const forecast=forecasts.find((f:any)=>f.id===forecastId);
  if(!forecast)return{status:404,body:{ok:false,error:"forecast_id_not_in_frozen_packet",forecast_id:forecastId,boundary:FORECAST_OBSERVATION_BINDING_BOUNDARY}};
  if(typeof forecast.probability!=="number")return{status:400,body:{ok:false,error:"selected_forecast_probability_required",forecast_id:forecastId,boundary:FORECAST_OBSERVATION_BINDING_BOUNDARY}};
  const forecastTimeRaw=body.forecast_time||packet?.state?.time_authority;
  const forecastTime=epoch(forecastTimeRaw);
  const observation=body.observation&&typeof body.observation==="object"?body.observation:{};
  const observationTime=epoch(observation.observed_at);
  if(forecastTime===null||observationTime===null)return{status:400,body:{ok:false,error:"forecast_time_and_observation_time_required",boundary:FORECAST_OBSERVATION_BINDING_BOUNDARY}};
  if(observationTime<=forecastTime)return{status:409,body:{ok:false,error:"future_leakage_or_nonlater_observation",forecast_time:forecastTimeRaw,observation_time:observation.observed_at,boundary:FORECAST_OBSERVATION_BINDING_BOUNDARY}};
  const outcome=n01(observation.outcome),baseline=n01(body.baseline_probability);
  if(outcome===null)return{status:400,body:{ok:false,error:"observation_outcome_0_1_required",boundary:FORECAST_OBSERVATION_BINDING_BOUNDARY}};
  if(baseline===null)return{status:400,body:{ok:false,error:"baseline_probability_0_1_required",boundary:FORECAST_OBSERVATION_BINDING_BOUNDARY}};
  const candidateBrier=sq(forecast.probability,outcome),baselineBrier=sq(baseline,outcome),lift=baselineBrier-candidateBrier;
  const candidateAbs=Math.abs(forecast.probability-outcome),baselineAbs=Math.abs(baseline-outcome);
  const authenticated=Boolean(observation.authenticated_source&&observation.evidence_class==="OBSERVED/MEASURED");
  const evidenceClass=txt(observation.evidence_class,80)||"USER_DEFINED_MODEL";
  const evidenceUpdate=authenticated?"ELIGIBLE_FOR_LEDGER_UPDATE":"HOLD_UNAUTHENTICATED_OBSERVATION";
  const performance=lift>0?"BEATS_BASELINE_ON_THIS_OBSERVATION":lift<0?"UNDERPERFORMS_BASELINE_ON_THIS_OBSERVATION":"MATCHES_BASELINE_ON_THIS_OBSERVATION";
  const payload={forecast_packet_fingerprint:frozen.packet_fingerprint,forecast_id:forecast.id,forecast_probability:forecast.probability,forecast_time:forecastTimeRaw,observation_time:observation.observed_at,outcome,baseline_probability:baseline};
  return{status:200,body:{
    ok:true,
    schema:"OMEGA_FORECAST_OBSERVATION_BINDING_V1",
    authority:"validation-only",
    binding_fingerprint:"bind-"+hashText(stable(payload)),
    forecast_packet_fingerprint:frozen.packet_fingerprint,
    forecast_frozen:true,
    forecast_rewritten:false,
    selected_forecast:{id:forecast.id,label:forecast.label,dispatch:forecast.dispatch,probability:forecast.probability,evidence_class:forecast.evidence_class,observed:false},
    observation:{observed_at:observation.observed_at,outcome,evidence_class:evidenceClass,authenticated_source:Boolean(observation.authenticated_source),provenance:txt(observation.provenance,300)},
    comparison:{baseline_probability:baseline,candidate_probability:forecast.probability,baseline_brier:Number(baselineBrier.toFixed(6)),candidate_brier:Number(candidateBrier.toFixed(6)),brier_lift:Number(lift.toFixed(6)),baseline_absolute_error:Number(baselineAbs.toFixed(6)),candidate_absolute_error:Number(candidateAbs.toFixed(6)),performance},
    evidence:{authenticated_observation:authenticated,evidence_update_status:evidenceUpdate,improvement_claim_scope:"this observation only",causation_claimed:false,held_out_claimed:Boolean(body.held_out===true&&authenticated)},
    future_leakage:false,
    canonical_state_mutation:false,
    execution:false,
    production_policy_mutation:false,
    core_boundary:OPERATIONAL_CORE_BOUNDARY,
    boundary:FORECAST_OBSERVATION_BINDING_BOUNDARY
  }}
}
