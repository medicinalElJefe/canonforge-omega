export const MODE_OPERATOR_ABLATION_BOUNDARY = "Matched mode/operator ablation compares paired held-out predictions on the same authenticated observation: one prediction with the declared mode/operator and one without it. It reports paired error differences on submitted evidence only; it does not prove causal effect, does not upgrade symbolic modes into physical claims, does not mutate canonical weights, does not execute actions, and does not authorize production policy changes.";

type Kind="operator"|"mode";
type CaseRow={case_id:string;kind:Kind;id:string;domain:string;observed:number;with_probability:number;without_probability:number;baseline_probability:number;with_brier:number;without_brier:number;baseline_brier:number;paired_lift:number;with_vs_baseline_lift:number;without_vs_baseline_lift:number;evidence_class:"OBSERVED/MEASURED";authenticated_source:true;provenance:string|null;preserved:true};
type Bucket={kind:Kind;id:string;domain:string;rows:CaseRow[]};

function txt(v:any,max=180){return typeof v==="string"&&v.trim()?v.trim().slice(0,max):null}
function p01(v:any){const n=Number(v);return Number.isFinite(n)&&n>=0&&n<=1?n:null}
function sq(a:number,b:number){return(a-b)*(a-b)}
function mean(xs:number[]){return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null}
function round(v:number|null){return v===null?null:Number(v.toFixed(6))}

export function modeOperatorAblationMatrixSchema(){return{
  schema:"OMEGA_MODE_OPERATOR_ABLATION_MATRIX_V1",
  authority:"held-out-validation-only",
  mutation:false,
  execution:false,
  production_policy_mutation:false,
  automatic_weight_change:false,
  causal_attribution:false,
  minimum_matched_authenticated_sample:5,
  required_case_fields:["case_id","kind","id","domain","observed","with_probability","without_probability","baseline_probability","evidence_class","authenticated_source"],
  positive_paired_lift_definition:"without_brier - with_brier; positive means lower error with the declared mode/operator on this matched held-out set",
  boundary:MODE_OPERATOR_ABLATION_BOUNDARY
}}

export function evaluateModeOperatorAblationMatrix(body:any){
  if(!body||typeof body!=="object")return{status:400,body:{ok:false,error:"ablation_object_required",boundary:MODE_OPERATOR_ABLATION_BOUNDARY}};
  const cases=Array.isArray(body.cases)?body.cases:[];
  if(!cases.length)return{status:400,body:{ok:false,error:"cases_required",boundary:MODE_OPERATOR_ABLATION_BOUNDARY}};
  if(cases.length>1000)return{status:400,body:{ok:false,error:"case_limit_1000",boundary:MODE_OPERATOR_ABLATION_BOUNDARY}};
  const buckets=new Map<string,Bucket>(),seen=new Set<string>(),invalid:any[]=[];
  for(let index=0;index<cases.length;index++){
    const raw=cases[index],caseId=txt(raw?.case_id,180),kind=raw?.kind==="operator"||raw?.kind==="mode"?raw.kind:null,id=txt(raw?.id,120),domain=txt(raw?.domain,120)||"unspecified",observed=p01(raw?.observed),withP=p01(raw?.with_probability),withoutP=p01(raw?.without_probability),baselineP=p01(raw?.baseline_probability),authenticated=Boolean(raw?.authenticated_source&&raw?.evidence_class==="OBSERVED/MEASURED");
    if(!caseId||!kind||!id||observed===null||withP===null||withoutP===null||baselineP===null){invalid.push({index,case_id:caseId,error:"matched_case_fields_required",preserved:true});continue}
    const unique=kind+"\u0000"+domain+"\u0000"+id+"\u0000"+caseId;
    if(seen.has(unique)){invalid.push({index,case_id:caseId,kind,id,domain,error:"duplicate_matched_case_id",preserved:true});continue}
    seen.add(unique);
    if(!authenticated){invalid.push({index,case_id:caseId,kind,id,domain,error:"authenticated_observed_measured_required_for_ablation",evidence_class:txt(raw?.evidence_class,80)||"NO_EVIDENCE",authenticated_source:Boolean(raw?.authenticated_source),preserved:true});continue}
    const withB=sq(withP,observed),withoutB=sq(withoutP,observed),baseB=sq(baselineP,observed);
    const row:CaseRow={case_id:caseId,kind,id,domain,observed,with_probability:withP,without_probability:withoutP,baseline_probability:baselineP,with_brier:Number(withB.toFixed(6)),without_brier:Number(withoutB.toFixed(6)),baseline_brier:Number(baseB.toFixed(6)),paired_lift:Number((withoutB-withB).toFixed(6)),with_vs_baseline_lift:Number((baseB-withB).toFixed(6)),without_vs_baseline_lift:Number((baseB-withoutB).toFixed(6)),evidence_class:"OBSERVED/MEASURED",authenticated_source:true,provenance:txt(raw?.provenance,360),preserved:true};
    const key=kind+"\u0000"+domain+"\u0000"+id;
    const bucket:Bucket=buckets.get(key)||{kind,id,domain,rows:[]};
    bucket.rows.push(row);buckets.set(key,bucket);
  }
  const groups=[...buckets.values()].map(g=>{
    const paired=mean(g.rows.map(r=>r.paired_lift)),withB=mean(g.rows.map(r=>r.with_brier)),withoutB=mean(g.rows.map(r=>r.without_brier)),baseB=mean(g.rows.map(r=>r.baseline_brier)),withBase=mean(g.rows.map(r=>r.with_vs_baseline_lift));
    let gate="HOLD_INSUFFICIENT_MATCHED_SAMPLE";
    if(g.rows.length>=5){if(paired!==null&&paired>0.01)gate="FEATURE_ADDS_MATCHED_HELD_OUT_LIFT";else if(paired!==null&&paired< -0.01)gate="ABLATION_IMPROVES_MATCHED_HELD_OUT";else gate="NO_CLEAR_MATCHED_LIFT"}
    return{kind:g.kind,id:g.id,domain:g.domain,matched_authenticated_sample:g.rows.length,mean_with_brier:round(withB),mean_without_brier:round(withoutB),mean_baseline_brier:round(baseB),mean_paired_brier_lift:round(paired),mean_with_vs_baseline_lift:round(withBase),improving_cases:g.rows.filter(r=>r.paired_lift>0).length,degrading_cases:g.rows.filter(r=>r.paired_lift<0).length,neutral_cases:g.rows.filter(r=>r.paired_lift===0).length,gate,causal_effect_claimed:false,automatic_weight_change:false,rows:g.rows};
  }).sort((a,b)=>a.kind.localeCompare(b.kind)||a.domain.localeCompare(b.domain)||a.id.localeCompare(b.id));
  return{status:200,body:{ok:true,schema:"OMEGA_MODE_OPERATOR_ABLATION_MATRIX_V1",authority:"held-out-validation-only",counts:{submitted:cases.length,admissible:groups.reduce((n,g)=>n+g.matched_authenticated_sample,0),invalid:invalid.length,groups:groups.length},groups,invalid_rows:invalid,matched_same_observation_required:true,baseline_comparison_required:true,association_only:false,causation_claimed:false,symbolic_to_physical_upgrade:false,historical_predictions_rewritten:false,automatic_weight_change:false,canonical_state_mutation:false,execution:false,production_policy_mutation:false,boundary:MODE_OPERATOR_ABLATION_BOUNDARY}}
}
