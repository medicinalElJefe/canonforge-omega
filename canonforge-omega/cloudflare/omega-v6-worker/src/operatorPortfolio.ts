import { evaluateCalibration, evaluateAblation, CALIBRATION_BOUNDARY } from "./calibrationWorkbench";

export const OPERATOR_PORTFOLIO_BOUNDARY="Operator portfolio recommendations are advisory evidence summaries. They do not establish causation, do not mutate canonical weights, and require explicit governed promotion before affecting canonical reasoning policy.";

type PortfolioRow={domain:string;operator:string;observations:number;brier:number;mae:number;bias:number;evidence_strength:string;trust_update_allowed:boolean;advisory_action:string;domain_peer_median_brier:number|null};
type AblationRow={domain:string;operator:string;observations:number;with_operator_brier:number;without_operator_brier:number;held_out_brier_lift:number;decision:string};
const key=(d:string,o:string)=>d+"\u0000"+o;
const round=(n:number)=>Number(n.toFixed(6));

export function evaluateOperatorPortfolio(body:any){
  const calibration=evaluateCalibration({forecasts:Array.isArray(body?.forecasts)?body.forecasts:[]});
  if(calibration.status!==200)return calibration;
  const ablationInput=Array.isArray(body?.held_out)&&body.held_out.length?{held_out:body.held_out}:null;
  const ablation=ablationInput?evaluateAblation(ablationInput):null;
  if(ablation&&ablation.status!==200)return ablation;
  const rows:PortfolioRow[]=Array.isArray((calibration.body as any).recommendations)?(calibration.body as any).recommendations:[];
  const abRows:AblationRow[]=ablation&&Array.isArray((ablation.body as any).comparisons)?(ablation.body as any).comparisons:[];
  const abMap=new Map(abRows.map(r=>[key(r.domain,r.operator),r]));
  const minStack=typeof body?.min_stack_size==="number"&&body.min_stack_size>=1&&body.min_stack_size<=12?Math.floor(body.min_stack_size):1;
  const maxStack=typeof body?.max_stack_size==="number"&&body.max_stack_size>=minStack&&body.max_stack_size<=12?Math.floor(body.max_stack_size):4;
  const portfolio=rows.map(row=>{
    const ab=abMap.get(key(row.domain,row.operator));
    const sampleFactor=Math.min(1,row.observations/20);
    const errorQuality=Math.max(0,1-row.brier);
    const ablationFactor=ab?Math.max(-1,Math.min(1,ab.held_out_brier_lift/0.05)):0;
    const evidenceScore=round(Math.max(0,Math.min(1,0.55*sampleFactor+0.35*errorQuality+0.10*Math.max(0,ablationFactor))));
    let status="HOLD_EVIDENCE";
    if(ab?.decision==="ABLATION_IMPROVES_HELD_OUT")status="DEPRIORITIZE";
    else if(ab?.decision==="OPERATOR_ADDS_HELD_OUT_LIFT"&&row.observations>=5)status="EARNED_HELD_OUT_SUPPORT";
    else if(row.advisory_action==="RETAIN_FOR_TESTING")status="RETAIN_FOR_TESTING";
    else if(row.advisory_action==="ABLATION_CANDIDATE")status="ABLATION_CANDIDATE";
    const uncertainty=round(1-sampleFactor);
    return{domain:row.domain,operator:row.operator,observations:row.observations,brier:row.brier,mae:row.mae,bias:row.bias,evidence_strength:row.evidence_strength,calibration_action:row.advisory_action,ablation_decision:ab?.decision??"NO_HELD_OUT_ABLATION",held_out_brier_lift:ab?.held_out_brier_lift??null,evidence_score:evidenceScore,uncertainty,status,causation_claimed:false,canonical_weight_mutation:false};
  });
  const byDomain=new Map<string,typeof portfolio>(); for(const row of portfolio){const a=byDomain.get(row.domain)||[];a.push(row);byDomain.set(row.domain,a)}
  const domains=[...byDomain.entries()].map(([domain,ops])=>{
    const ranked=[...ops].sort((a,b)=>b.evidence_score-a.evidence_score||a.brier-b.brier);
    const eligible=ranked.filter(x=>x.status!=="DEPRIORITIZE"&&x.status!=="ABLATION_CANDIDATE"&&x.observations>=5);
    const target=Math.min(maxStack,Math.max(minStack,eligible.length));
    const proposed_stack=eligible.slice(0,target).map(x=>x.operator);
    return{domain,proposed_stack,stack_size:proposed_stack.length,operator_count:ops.length,portfolio:ranked,ready_for_policy_review:proposed_stack.length>=minStack,automatic_policy_change:false};
  });
  return{status:200,body:{ok:true,schema:"OMEGA_EVIDENCE_WEIGHTED_OPERATOR_PORTFOLIO_V1",authority:"advisory-computation-only",mutation:false,domains,proof:{calibration_schema:(calibration.body as any).schema,ablation_schema:ablation?(ablation.body as any).schema:null,explicit_promotion_required:true,causation_claimed:false,automatic_canonical_weight_mutation:false,uncertainty_retained:true},boundary:OPERATOR_PORTFOLIO_BOUNDARY,calibration_boundary:CALIBRATION_BOUNDARY}};
}
