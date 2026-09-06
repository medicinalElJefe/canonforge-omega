export const ATLAS_SOURCE = {
  file: "ALL_MODES_WOVEN_CONTINUITY_MAX_DETAIL_ATLAS (1).csv",
  sha256: "460d56a51be0115347574ebbebd5a2b2bad0e46b1bd75c266f954e9ad742e975",
  rows: 478922,
  columns: 57,
  atlasStates: 20736,
  modeAtlasStates: 248832,
  signedNeighborEdges: 165888,
  hierarchyEdges: 22608,
  antipodeRelations: 20736,
  base: 12,
  rank: 4,
} as const;

export const ATLAS_MODES = [
  [1,"Full Overall Canon","Master integrative framework; all active mode outputs are interpreted together."],
  [2,"Dewey Calculus","Parent-to-next-state process calculus with accumulation, scar, carry, phase, constraint, and continuity."],
  [3,"Relational Skin Calculus (RSC)","Parent → Interaction → Scar → Continuity → Compression → Skin → Interpretation → Behavior."],
  [4,"Unified Coherence","Cross-domain coherence, relation consistency, contradiction-aware integration."],
  [5,"Deep Mother","Continuity, preservation, recovery and future-carrying weighting."],
  [6,"High Father","Structure, law, discipline, boundary and constraint weighting."],
  [7,"No-Nothing Truth","Evidence, contradiction and unsupported-claim exposure."],
  [8,"Guidance Field","Bounded directional projection over admissible continuation paths."],
  [9,"Full Sphere","Recursive multi-perspective shell and enclosure projection."],
  [10,"Forecast Mode","Probabilistic/conditional future topology and branch continuation."],
  [11,"Heavy Prune","Constraint-aware removal and simplification before construction."],
  [12,"Alpha / Crimson","Exploration/plasticity and construction/consequence polarity."],
] as const;

export const ATLAS_AXES = ["domain","phase","regulation","layer"] as const;
export type AtlasAddress = readonly [number,number,number,number];
export type AtlasState = {
  index:number;
  address:AtlasAddress;
  phase:number;
  phaseCos:number;
  phaseSin:number;
  signedBin:number;
  antipode:number;
  parent:number;
};

export function atlasIndex(d:number,p:number,r:number,l:number){
  return (((d*12)+p)*12+r)*12+l;
}
export function atlasAddress(index:number):AtlasAddress{
  const l=index%12; index=Math.floor(index/12);
  const r=index%12; index=Math.floor(index/12);
  const p=index%12; index=Math.floor(index/12);
  const d=index%12;
  return [d,p,r,l];
}
export function atlasAntipode(index:number){
  const [d,p,r,l]=atlasAddress(index);
  return atlasIndex((d+6)%12,(p+6)%12,(r+6)%12,(l+6)%12);
}
export function atlasNeighbors(index:number){
  const a=[...atlasAddress(index)] as number[];
  const out:number[]=[];
  for(let axis=0;axis<4;axis++) for(const dir of [-1,1]){
    const b=[...a]; b[axis]=(b[axis]+dir+12)%12;
    out.push(atlasIndex(b[0],b[1],b[2],b[3]));
  }
  return out;
}
export function atlasState(index:number):AtlasState{
  index=((index%20736)+20736)%20736;
  const address=atlasAddress(index);
  const phase=address[1];
  const angle=phase*Math.PI/6;
  return {
    index,address,phase,
    phaseCos:Math.cos(angle),phaseSin:Math.sin(angle),
    signedBin:(address[1]*2 + (address[2]>=6?1:0))%24,
    antipode:atlasAntipode(index),
    parent:Math.floor(index/12),
  };
}

export const NATIVE_20736_ATLAS_BOUNDARY = "This module is a compact reconstruction of the regular graph/topology encoded by the supplied 478,922-row atlas CSV: 12^4 addressed software/model states with axis order domain, phase, regulation, layer; ±1 modulo-12 nearest neighbors; +6 modulo-12 antipodes; rank-3 parents; 12 modes × 20,736 states; and source identity by SHA-256. The phase coordinate is the second address axis, matching the canonical Address20736 runtime contract. It does not fabricate empirical measurements or treat 20,736 as physical dimensions.";
