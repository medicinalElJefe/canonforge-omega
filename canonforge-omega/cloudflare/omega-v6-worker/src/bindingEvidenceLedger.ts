import { evaluateForecastObservationBinding, FORECAST_OBSERVATION_BINDING_BOUNDARY } from "./forecastObservationBinding";

export const BINDING_EVIDENCE_LEDGER_BOUNDARY = "The binding evidence ledger aggregates validated forecast-observation comparisons without rewriting forecasts or observations. Only authenticated OBSERVED/MEASURED observations contribute to evidence-update metrics. Failed, unauthenticated, and baseline-underperforming bindings remain preserved. The ledger cannot establish causation, mutate canonical state, execute actions, change operator weights, or authorize production policy changes.";

function mean(values:number[]){return values.length?values.reduce((a,b)=>a+b,0)/values.length:null}
function round(v:number|null){return v===null?null:Number(v.toFixed(6))}

export function bindingEvidenceLedgerSchema(){return{
  schema:"OMEGA_BINDING_EVIDENCE_LEDGER_V1",
  authority:"validation-and-aggregation-only",
  mutation:false,
  execution:false,
  production_policy_mutation:false,
  automatic_weight_change:false,
  minimum_authenticated_sample:5,
  required:["bindings"],
  boundary:BINDING_EVIDENCE_LEDGER_BOUNDARY
}}

export function evaluateBindingEvidenceLedger(body:any){
  if(!body||typeof body!=="object")return{status:400,body:{ok:false,error:"ledger_object_required",boundary:BINDING_EVIDENCE_LEDGER_BOUNDARY}};
  const rows=Array.isArray(body.bindings)?body.bindings:[];
  if(!rows.length)return{status:400,body:{ok:false,error:"bindings_required",boundary:BINDING_EVIDENCE_LEDGER_BOUNDARY}};
  if(rows.length>500)return{status:400,body:{ok:false,error:"binding_limit_500",boundary:BINDING_EVIDENCE_LEDGER_BOUNDARY}};
  const evaluated=rows.map((row:any,index:number)=>{
    const r=evaluateForecastObservationBinding(row);
    if(r.status!==200)return{index,ok:false,status:r.status,error:(r.body as any)?.error||"binding_invalid",preserved:true,detail:r.body};
    const b:any=r.body;
    return{index,ok:true,status:200,binding_fingerprint:b.binding_fingerprint,forecast_packet_fingerprint:b.forecast_packet_fingerprint,forecast_id:b.selected_forecast?.id||null,authenticated_observation:Boolean(b.evidence?.authenticated_observation),observation_evidence_class:b.observation?.evidence_class||"NO_EVIDENCE",candidate_brier:b.comparison?.candidate_brier??null,baseline_brier:b.comparison?.baseline_brier??null,brier_lift:b.comparison?.brier_lift??null,performance:b.comparison?.performance||null,forecast_rewritten:Boolean(b.forecast_rewritten),future_leakage:Boolean(b.future_leakage),preserved:true};
  });
  const valid=evaluated.filter((r:any)=>r.ok);
  const authenticated=valid.filter((r:any)=>r.authenticated_observation&&r.observation_evidence_class==="OBSERVED/MEASURED");
  const unauthenticated=valid.filter((r:any)=>!r.authenticated_observation);
  const failures=evaluated.filter((r:any)=>!r.ok);
  const degrading=authenticated.filter((r:any)=>typeof r.brier_lift==="number"&&r.brier_lift<0);
  const improving=authenticated.filter((r:any)=>typeof r.brier_lift==="number"&&r.brier_lift>0);
  const neutral=authenticated.filter((r:any)=>r.brier_lift===0);
  const lifts=authenticated.map((r:any)=>Number(r.brier_lift)).filter(Number.isFinite);
  const candidateBriers=authenticated.map((r:any)=>Number(r.candidate_brier)).filter(Number.isFinite);
  const baselineBriers=authenticated.map((r:any)=>Number(r.baseline_brier)).filter(Number.isFinite);
  const authenticatedSample=authenticated.length;
  const meanLift=mean(lifts),candidateMean=mean(candidateBriers),baselineMean=mean(baselineBriers);
  let gate="HOLD_INSUFFICIENT_AUTHENTICATED_SAMPLE";
  if(authenticatedSample>=5){if(meanLift!==null&&meanLift>0)gate="READY_FOR_GOVERNANCE_REVIEW";else if(meanLift!==null&&meanLift<0)gate="ROLLBACK_CANDIDATE";else gate="HOLD_NO_MATERIAL_MEAN_LIFT"}
  return{status:200,body:{
    ok:true,
    schema:"OMEGA_BINDING_EVIDENCE_LEDGER_V1",
    authority:"validation-and-aggregation-only",
    counts:{submitted:rows.length,valid:valid.length,invalid:failures.length,authenticated:authenticated.length,unauthenticated:unauthenticated.length,improving:improving.length,degrading:degrading.length,neutral:neutral.length},
    metrics:{authenticated_sample:authenticatedSample,minimum_authenticated_sample:5,mean_candidate_brier:round(candidateMean),mean_baseline_brier:round(baselineMean),mean_brier_lift:round(meanLift)},
    gate,
    evidence_update_allowed:gate==="READY_FOR_GOVERNANCE_REVIEW",
    failures_preserved:true,
    unauthenticated_preserved:true,
    degrading_bindings_preserved:true,
    historical_forecasts_rewritten:false,
    causation_claimed:false,
    automatic_weight_change:false,
    canonical_state_mutation:false,
    execution:false,
    production_policy_mutation:false,
    rows:evaluated,
    binding_boundary:FORECAST_OBSERVATION_BINDING_BOUNDARY,
    boundary:BINDING_EVIDENCE_LEDGER_BOUNDARY
  }}
}
