import { evaluateForecastObservationBinding, FORECAST_OBSERVATION_BINDING_BOUNDARY } from "./forecastObservationBinding";

export const MODE_OPERATOR_ATTRIBUTION_BOUNDARY = "Mode/operator evidence attribution groups authenticated forecast-observation performance by declared domain, operator IDs, and mode IDs. It measures association on submitted evidence only; it does not prove causal operator effect, does not convert symbolic modes into physical claims, does not mutate canonical weights, does not execute actions, and does not authorize production policy changes.";

function txt(v:any,max=120){return typeof v==="string"&&v.trim()?v.trim().slice(0,max):null}
function list(v:any,max=24):string[]{if(!Array.isArray(v))return[];const values=v.map((x:any)=>txt(x,120)).filter((x:string|null):x is string=>x!==null);return[...new Set(values)].slice(0,max)}
function mean(xs:number[]){return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null}
function round(v:number|null){return v===null?null:Number(v.toFixed(6))}

type Bucket={id:string;domain:string;kind:"operator"|"mode";n:number;lifts:number[];candidate:number[];baseline:number[];degrading:number;improving:number};

export function modeOperatorEvidenceAttributionSchema(){return{
  schema:"OMEGA_MODE_OPERATOR_EVIDENCE_ATTRIBUTION_V1",
  authority:"validation-and-attribution-only",
  mutation:false,
  execution:false,
  production_policy_mutation:false,
  automatic_weight_change:false,
  causal_attribution:false,
  minimum_authenticated_sample:5,
  required:["records"],
  boundary:MODE_OPERATOR_ATTRIBUTION_BOUNDARY
}}

export function evaluateModeOperatorEvidenceAttribution(body:any){
  if(!body||typeof body!=="object")return{status:400,body:{ok:false,error:"attribution_object_required",boundary:MODE_OPERATOR_ATTRIBUTION_BOUNDARY}};
  const records=Array.isArray(body.records)?body.records:[];
  if(!records.length)return{status:400,body:{ok:false,error:"records_required",boundary:MODE_OPERATOR_ATTRIBUTION_BOUNDARY}};
  if(records.length>500)return{status:400,body:{ok:false,error:"record_limit_500",boundary:MODE_OPERATOR_ATTRIBUTION_BOUNDARY}};
  const buckets=new Map<string,Bucket>();
  const rows=records.map((record:any,index:number)=>{
    const bindingInput=record?.binding&&typeof record.binding==="object"?record.binding:record;
    const evaluated=evaluateForecastObservationBinding(bindingInput);
    const domain=txt(record?.domain||bindingInput?.forecast_packet?.state?.domain,120)||"unspecified";
    const operatorIds=list(record?.operator_ids);
    const modeIds=list(record?.mode_ids);
    if(evaluated.status!==200)return{index,ok:false,status:evaluated.status,error:(evaluated.body as any)?.error||"binding_invalid",domain,operator_ids:operatorIds,mode_ids:modeIds,preserved:true};
    const b:any=evaluated.body;
    const authenticated=Boolean(b.evidence?.authenticated_observation&&b.observation?.evidence_class==="OBSERVED/MEASURED");
    const lift=typeof b.comparison?.brier_lift==="number"?b.comparison.brier_lift:null;
    const candidate=typeof b.comparison?.candidate_brier==="number"?b.comparison.candidate_brier:null;
    const baseline=typeof b.comparison?.baseline_brier==="number"?b.comparison.baseline_brier:null;
    if(authenticated&&lift!==null&&candidate!==null&&baseline!==null){
      const add=(kind:"operator"|"mode",id:string)=>{const key=kind+"\u0000"+domain+"\u0000"+id,g=buckets.get(key)||{id,domain,kind,n:0,lifts:[],candidate:[],baseline:[],degrading:0,improving:0};g.n++;g.lifts.push(lift);g.candidate.push(candidate);g.baseline.push(baseline);if(lift>0)g.improving++;if(lift<0)g.degrading++;buckets.set(key,g)};
      operatorIds.forEach(id=>add("operator",id));
      modeIds.forEach(id=>add("mode",id));
    }
    return{index,ok:true,domain,operator_ids:operatorIds,mode_ids:modeIds,authenticated_observation:authenticated,brier_lift:lift,candidate_brier:candidate,baseline_brier:baseline,performance:b.comparison?.performance||null,preserved:true};
  });
  const summaries=[...buckets.values()].map(g=>{const lift=mean(g.lifts),candidate=mean(g.candidate),baseline=mean(g.baseline);let recommendation="HOLD_EVIDENCE";if(g.n>=5){if(lift!==null&&lift>0.01)recommendation="RETAIN_FOR_HELD_OUT_TESTING";else if(lift!==null&&lift< -0.01)recommendation="ABLATION_CANDIDATE";else recommendation="NO_CLEAR_LIFT"}return{kind:g.kind,id:g.id,domain:g.domain,authenticated_sample:g.n,mean_candidate_brier:round(candidate),mean_baseline_brier:round(baseline),mean_brier_lift:round(lift),improving_bindings:g.improving,degrading_bindings:g.degrading,recommendation,causal_effect_claimed:false,automatic_weight_change:false}}).sort((a,b)=>a.kind.localeCompare(b.kind)||a.domain.localeCompare(b.domain)||a.id.localeCompare(b.id));
  const authenticatedRows=rows.filter((r:any)=>r.ok&&r.authenticated_observation).length;
  return{status:200,body:{
    ok:true,
    schema:"OMEGA_MODE_OPERATOR_EVIDENCE_ATTRIBUTION_V1",
    authority:"validation-and-attribution-only",
    counts:{submitted:records.length,valid:rows.filter((r:any)=>r.ok).length,invalid:rows.filter((r:any)=>!r.ok).length,authenticated:authenticatedRows,groups:summaries.length},
    summaries,
    rows,
    association_only:true,
    causation_claimed:false,
    symbolic_to_physical_upgrade:false,
    historical_predictions_rewritten:false,
    automatic_weight_change:false,
    canonical_state_mutation:false,
    execution:false,
    production_policy_mutation:false,
    binding_boundary:FORECAST_OBSERVATION_BINDING_BOUNDARY,
    boundary:MODE_OPERATOR_ATTRIBUTION_BOUNDARY
  }}
}
