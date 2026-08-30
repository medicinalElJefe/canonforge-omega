export const CAPACITY = 12 ** 10;
export const STAR_CAPACITY = 7 * (12 ** 4);
export const TIERS = {
  "12D": 12,
  "144D": 12 ** 2,
  "1728D": 12 ** 3,
  "20736D": 12 ** 4,
  "145152D": STAR_CAPACITY,
  "61917364224D": CAPACITY,
};
export const SYSTEMS = [
  ["S00","Omega Atlas Desktop / Runtime OS","Core Runtime"],
  ["S01","Omega Reality Compiler","Core Runtime"],
  ["S02","Persistent Packet Substrate","Core Runtime"],
  ["S03","Hybrid Link Software","Core Runtime"],
  ["S04","CanonForge / Genesis Engine","Proof / Governance"],
  ["S05","VGCL / Vigil Geometry","Proof / Governance"],
  ["S06","Executable Atlas Generator","Traversal / Domain"],
  ["S07","Shell / Mandala Engine","Traversal / Domain"],
  ["S08","Field Render Engine","Rendering / Media"],
  ["S09","Earth Traversal Engine","Traversal / Domain"],
  ["S10","Biological Traversal Engine","Traversal / Domain"],
  ["S11","Omega Patch System","Recovery / Packaging"],
  ["S12","Omega Micro Build","Recovery / Packaging"],
  ["S13","Living Coherence Membrane","Rendering / Media"],
  ["S14","Dewey Calculus Engine","Proof / Governance"],
  ["S15","Proof / Forensic / Ledger System","Proof / Governance"],
  ["S16","Workbook / Excel Atlas Runtime","Control Planes"],
  ["S17","Echo-Chamber / SOMA Audio Engine","Rendering / Media"],
  ["S18","Universal Language / Lexicon Engine","Control Planes"],
  ["S19","Observer / Now-Frame System","Traversal / Domain"],
  ["S20","Recovery Board System","Recovery / Packaging"],
  ["S21","Cinematic Field Renderer","Rendering / Media"],
  ["S22","Omega Installer / One-Click Shell","Recovery / Packaging"],
  ["S23","Runtime API / WebSocket Service","Recovery / Packaging"],
].map(([id,name,family])=>({id,name,family}));
export const FAMILIES = [...new Set(SYSTEMS.map(x=>x.family))];

export function capacityAddress(index0){
  let n=Math.trunc(Number(index0));
  if(!Number.isSafeInteger(n)||n<0||n>=CAPACITY)throw new RangeError(`capacity index must be in 0..${CAPACITY-1}`);
  const digits=Array(10).fill(1);
  for(let i=9;i>=0;i--){const rem=n%12;n=Math.floor(n/12);digits[i]=rem+1}
  const canonicalIndex=Number(index0)%(12**4);
  return {
    index0:Number(index0),
    state_id:Number(index0)+1,
    capacity:CAPACITY,
    factorization:"12^10 = 2^20 × 3^10",
    coordinates:digits,
    compact:"Ω12:"+digits.map(x=>String(x).padStart(2,"0")).join("."),
    canonical_index0:canonicalIndex,
    boundary:"software design/instrumentation capacity; not a physical dimension and not an enumerated worksheet",
  };
}
export function starAddress(index0){
  const n=Math.trunc(Number(index0));
  if(!Number.isSafeInteger(n)||n<0||n>=STAR_CAPACITY)throw new RangeError(`star index must be in 0..${STAR_CAPACITY-1}`);
  return {index0:n,state_id:n+1,capacity:STAR_CAPACITY,star:Math.floor(n/(12**4))+1,canonical_index0:n%(12**4),boundary:"seven-host software layer; domain-specific representation, not universal physical proof"};
}
const wrap=x=>((x-1)%12+12)%12+1;
export function shell(address){
  const axes=[["phase-",1,-1],["phase+",1,1],["regulation-",2,-1],["regulation+",2,1],["lens-",3,-1],["lens+",3,1]];
  const id=a=>(((a[0]-1)*12+(a[1]-1))*12+(a[2]-1))*12+(a[3]-1)+1;
  return {
    center:{state_id:id(address),address},
    neighbors:axes.map(([axis,pos,delta])=>{const a=[...address];a[pos]=wrap(a[pos]+delta);return{axis,state_id:id(a),address:a,reverse_axis:axis.endsWith("-")?axis.slice(0,-1)+"+":axis.slice(0,-1)+"-"}}),
    count:7,
    topology:"1+6 local reversible shell",
  };
}
