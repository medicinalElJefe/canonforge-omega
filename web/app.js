const views=[
 ['overview','Command Overview','State, proof, motion and source authority in one instrument.'],
 ['runtime','01 Runtime Core','The only canonical state owner.'],
 ['proof','02 Proof & Governance','Admission, replay, evidence and immutable receipts.'],
 ['traversal','03 Traversal','Addressable state motion and Dewey / RSC calculus.'],
 ['render','04 Render Field','One projection packet; no decorative authority.'],
 ['host','05 Host Inputs','Evidence-classed adapters and governed Hybrid Link.'],
 ['ai','06 AI Orchestration','All registered modes evaluated against one canonical packet.'],
 ['data','07 Data / Excel Atlas','Provenance-aware corpus, workbook roundtrip and atlas control.'],
 ['audio','08 Audio / Signal','Derived deterministic sonification with bounded claims.'],
 ['world','09 World / Bio / Forecast','Source-bound world traversal and frozen-prior forecast.'],
 ['recovery','10 Recovery / Packaging','Replay, manifest and recovery gates.'],
 ['archive','11 Archive Merge','KEEP / MERGE / DONOR / QUARANTINE migration governance.'],
 ['cockpit','12 Operator Cockpit','System diagnostics and operator control-plane truth.'],
 ['plugins','Plugin Runtime','Bounded capabilities and mutation leases.']
];
const $=id=>document.getElementById(id);
const fmt=(v,n=4)=>Number(v).toFixed(n);
const json=x=>JSON.stringify(x,null,2);

$('nav').innerHTML=views.map((v,i)=>`<button class="${i?'':'active'}" data-view="${v[0]}"><i></i>${v[1]}</button>`).join('');
$('phaseDots').innerHTML=Array.from({length:12},(_,i)=>`<i data-p="${i+1}" style="--i:${i}"></i>`).join('');
$('nav').onclick=e=>{const b=e.target.closest('button');if(!b)return;document.querySelectorAll('nav button').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.dataset.view===b.dataset.view));const m=views.find(v=>v[0]===b.dataset.view);$('viewTitle').textContent=m[1];$('viewSub').textContent=m[2];document.querySelector('.sidebar').classList.remove('open')};
$('mobileMenu').onclick=()=>document.querySelector('.sidebar').classList.toggle('open');

async function api(url,opts={}){const r=await fetch(url,{cache:'no-store',...opts});let d;try{d=await r.json()}catch{d={error:'non_json_response',status:r.status}}if(!r.ok)throw d;return d}
async function post(url,body){const headers={'content-type':'application/json'};if(url==='/api/transition'||url==='/api/recovery/rollback'){let token=sessionStorage.getItem('omegaWriteToken')||'';if(!token&&location.hostname!=='127.0.0.1'&&location.hostname!=='localhost'){token=prompt('OMEGA cloud write token (leave blank for read-only)')||'';if(token)sessionStorage.setItem('omegaWriteToken',token)}if(token)headers['X-Omega-Write-Token']=token}return api(url,{method:'POST',headers,body:JSON.stringify(body)})}

let SNAP=null;
function metric(k,v,cls=''){return `<div class="metric"><small>${k}</small><strong class="${cls}">${v}</strong></div>`}
function renderSnap(d){
 SNAP=d;const s=d.state,m=s.metrics,c=d.calculus,p=d.projection;
 $('runtimeStatus').textContent='RUNTIME LIVE';$('sideDigest').textContent=s.digest.slice(0,18)+'…';$('sideEvidence').textContent=s.evidence_class;$('stateChip').textContent='STATE '+s.state_id;
 const proofOK=Boolean(d.proof?.valid)&&Boolean(d.replay?.valid??true);$('proofChip').textContent=proofOK?'PROOF + REPLAY PASS':'PROOF / REPLAY FAIL';$('proofChip').classList.toggle('good',proofOK);
 $('coreState').textContent='STATE '+s.state_id;$('corePhase').textContent='P'+String(s.address[1]).padStart(2,'0');document.querySelectorAll('.phase-dots i').forEach(x=>x.classList.toggle('active',Number(x.dataset.p)===s.address[1]));$('projectionFingerprint').textContent=p.packet_fingerprint.slice(0,24)+'…';
 $('metrics').innerHTML=metric('CΩ continuity',fmt(m.continuity),'green')+metric('Φ plasticity',fmt(m.future_plasticity),'teal')+metric('Λ burden',fmt(m.burden))+metric('q contradiction',fmt(m.contradiction),m.contradiction>m.continuity?'red':'')+metric('S stability',fmt(m.stability))+metric('scar',fmt(m.scar))+metric('evidence',fmt(m.evidence_strength))+metric('water',fmt(c.water));
 $('dispatch').textContent=c.mode188.dispatch;$('admission').textContent=c.mode188.admission;$('ratio').textContent=c.mode188.ratio==null?'∞':(Number.isFinite(c.mode188.ratio)?fmt(c.mode188.ratio,3):'∞');
 $('lensBars').innerHTML=[['RSC capacity',Math.min(1,c.rsc.capacity/3)],['Deep Mother',c.deep_mother],['High Father',c.high_father],['Deep Thought',c.deep_thought]].map(([k,v])=>`<div class="lens"><span>${k}</span><div class="bar"><i style="width:${Math.max(0,Math.min(100,v*100))}%"></i></div><b>${fmt(v,2)}</b></div>`).join('');
 $('stateRaw').textContent=json(d);document.documentElement.style.setProperty('--field-pressure',Math.min(1,(m.burden+m.contradiction)/2));
}
async function refresh(){try{renderSnap(await api('/api/state'));await proof()}catch(e){$('runtimeStatus').textContent='RUNTIME OFFLINE';console.error(e)}}
async function capabilities(){const d=await api('/api/capabilities');$('overviewCards').innerHTML=d.menus.map(x=>`<article class="card mini-card"><small>${x[0]} MASTER SURFACE</small><h3>${x[1]}</h3><p>${x[2]}</p></article>`).join('');$('gates').innerHTML=d.acceptance_gates.map((g,i)=>`<div><i></i><b>G${String(i+1).padStart(2,'0')}</b><span>${g}</span></div>`).join('')}
async function plugins(){const d=await api('/api/plugins');$('pluginRows').innerHTML=d.plugins.map(p=>`<tr><td><b>${p.name||p.id||p.path}</b><br><small>${p.version||''}</small></td><td>${p.status}</td><td>${(p.permissions||[]).join(', ')||'—'}</td><td>${(p.capabilities||[]).join(', ')||'—'}</td></tr>`).join('')||'<tr><td colspan="4">No plugins registered.</td></tr>'}
async function modes(){const d=await api('/api/modes');$('modeGrid').innerHTML=d.modes.map(m=>`<div class="mode" data-mode="${m.id}"><b>${m.name}</b><small>${m.purpose}</small></div>`).join('');$('modeGrid').onclick=async e=>{const m=e.target.closest('.mode');if(!m)return;const d=await api('/api/mode?id='+encodeURIComponent(m.dataset.mode));alert(m.dataset.mode+'\n\n'+json(d.result))}}
async function proof(){const d=await api('/api/proof');$('proofRows').innerHTML=d.records.slice().reverse().map(r=>`<tr><td>${r.sequence}</td><td>${r.kind}</td><td>${r.decision}</td><td><code>${r.state_before.slice(0,10)}</code></td><td><code>${r.state_after?r.state_after.slice(0,10):'—'}</code></td></tr>`).join('')||'<tr><td colspan="5">No mutations recorded yet.</td></tr>';return d}

function dailySignal(){
 const principles=[
  ['Preserve Before Expansion','A system that cannot recover should not be trusted to grow. Preserve the last proven state before adding new reach.','↺'],
  ['Proof Before Promotion','Names, dimensions and visual confidence do not establish authority. Promotion follows evidence, tests and reproducible identity.','◇'],
  ['One State, Many Views','Rendering, forecasting and analysis may transform the packet, but none of them may quietly become a second truth source.','◎'],
  ['Contradiction Is Data','Do not erase disagreement to make the system look coherent. Carry contradiction explicitly until evidence resolves it.','∆'],
  ['Freeze the Prior','A forecast is judged against information available when it was made; future observation cannot leak backward into the prior.','⧖'],
  ['Short Arc, Single Phase','Cyclic motion is transformed once along the shortest valid arc. A renderer does not get a second hidden clock.','◌'],
  ['Quarantine Unknown Donors','An archive with an impressive filename is still untrusted until its lineage, checksum and behavior are known.','▱'],
  ['Bound the Powerful Edge','Host control becomes useful when authority is explicit: approved roots, typed operations, receipts, no arbitrary shell.','⌁'],
  ['Keep Evidence Classes Visible','Observed, imported, derived, inferred and forecast claims are different objects. The interface should show that difference.','≋'],
  ['Reversible Traversal','A good state transition has identity, parentage and a path back through proof—not merely a new screen.','⇄'],
  ['Prune → Translate → Prove','Reject what breaks authority, translate what is useful, and prove the accepted behavior before it enters the kernel.','⟶'],
  ['Care Is a Stability Constraint','Preservation and future plasticity are operational weights: maximize useful change without destroying recoverability.','Ω']
 ];
 const now=new Date();const start=new Date(now.getFullYear(),0,0);const day=Math.floor((now-start)/86400000);const item=principles[day%principles.length];$('dailyTitle').textContent=item[0];$('dailyText').textContent=item[1];$('dailyGlyph').textContent=item[2];$('dailyDate').textContent=now.toLocaleDateString(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric'});
}

async function sonify(){
 if(!SNAP)throw {error:'state_not_loaded'};const m=SNAP.state.metrics,phase=SNAP.state.address[1];const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)throw {error:'web_audio_unavailable'};const ctx=new AudioCtx();const master=ctx.createGain();master.gain.setValueAtTime(0.0001,ctx.currentTime);master.gain.exponentialRampToValueAtTime(Math.max(.015,.10*m.continuity),ctx.currentTime+.08);master.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+1.8);master.connect(ctx.destination);
 const base=92+phase*7;const freqs=[base,base*(1.5+.08*m.contradiction)];freqs.forEach((f,i)=>{const o=ctx.createOscillator();const g=ctx.createGain();o.type=i?'triangle':'sine';o.frequency.value=f;g.gain.value=i?.22+.25*m.burden:.55;o.connect(g);g.connect(master);o.start();o.stop(ctx.currentTime+1.85)});$('audioResult').textContent=json({status:'PLAYING_DERIVED',state_id:SNAP.state.state_id,phase,base_hz:base,boundary:'interface sonification only; not source evidence or a medical/physical efficacy claim'});setTimeout(()=>ctx.close(),2100);
}

const actionTarget={
 'refresh-proof':'proofRows','refresh-plugins':'pluginRows','run-plugin':'pluginResult','atlas':'atlasResult','forecast':'forecastResult','classify':'classifyResult','dewey':'deweyResult','simulate':'simResult','orchestrate':'orchestrateResult','host-status':'hostStatus','hybrid-validate':'hybridResult','hybrid-run':'hybridResult','workbook-inspect':'workbookResult','workbook-roundtrip':'workbookResult','sonify':'audioResult','earth-destination':'earthResult','release-verify':'releaseResult','cockpit-check':'cockpitResult'
};

document.body.onclick=async e=>{
 const b=e.target.closest('[data-action]');if(!b)return;const action=b.dataset.action;const target=actionTarget[action]&&$(actionTarget[action]);
 try{
  if(action==='refresh-proof')await proof();
  else if(action==='refresh-plugins')await plugins();
  else if(action==='run-plugin')target.textContent=json(await post('/api/plugins/run',{id:b.dataset.plugin,payload:{request:'self-test'}}));
  else if(action==='atlas')target.textContent=json(await api('/api/atlas?index='+$('atlasIndex').value));
  else if(action==='forecast')target.textContent=json(await api('/api/forecast?horizon='+$('horizon').value));
  else if(action==='classify')target.textContent=json(await api('/api/corpus/classify?name='+encodeURIComponent($('corpusName').value)));
  else if(action==='dewey')target.textContent=json(await post('/api/dewey-bal/validate',{source_state:11499,target_state:11687,source_burden:0.8000063837447882,target_burden:0.42901814817581707,edge:'MODE188+'}));
  else if(action==='simulate'){const addr=SNAP.state.address;const body={address:addr,evidence_class:'DERIVED',mode:'MODE188',metrics:{continuity:+$('c').value,future_plasticity:+$('phi').value,burden:+$('lambda').value,contradiction:+$('q').value,stability:+$('stability').value,evidence_strength:+$('evidence').value,scar:SNAP.state.metrics.scar,water_conductance:SNAP.state.metrics.water_conductance,triangulation:SNAP.state.metrics.triangulation,occupancy:SNAP.state.metrics.occupancy,proof_scar:SNAP.state.metrics.proof_scar,normalized_mri:SNAP.state.metrics.normalized_mri}};target.textContent=json(await post('/api/transition',body));await refresh()}
  else if(action==='orchestrate')target.textContent=json(await api('/api/orchestrate'));
  else if(action==='host-status')target.textContent=json(await api('/api/host/status'));
  else if(action==='hybrid-validate'||action==='hybrid-run'){const body={root:$('hybridRoot').value||undefined,steps:JSON.parse($('hybridPlan').value)};target.textContent=json(await post(action==='hybrid-run'?'/api/hybrid/run':'/api/hybrid/validate',body))}
  else if(action==='workbook-inspect')target.textContent=json(await post('/api/workbook/inspect',{root:$('workbookRoot').value||undefined,path:$('workbookPath').value}));
  else if(action==='workbook-roundtrip')target.textContent=json(await post('/api/workbook/roundtrip',{root:$('workbookRoot').value||undefined,path:$('workbookPath').value,output:$('workbookOutput').value}));
  else if(action==='sonify')await sonify();
  else if(action==='earth-destination')target.textContent=json(await post('/api/earth/destination',{lat:+$('earthLat').value,lon:+$('earthLon').value,bearing_rad:+$('earthBearing').value,distance_m:+$('earthDistance').value}));
  else if(action==='release-verify')target.textContent=json(await api('/api/release/verify'));
  else if(action==='cockpit-check'){const [host,replay,release,proofState]=await Promise.all([api('/api/host/status'),api('/api/replay'),api('/api/release/verify'),proof()]);target.textContent=json({host,replay,release,proof:proofState.verify,canonical_digest:SNAP?.state?.digest})}
 }catch(err){if(target)target.textContent=json(err);else console.error(err)}
};

dailySignal();refresh();capabilities();modes();plugins();setInterval(refresh,7000);
