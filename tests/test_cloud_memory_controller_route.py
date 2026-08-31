from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]


def test_existing_worker_route_reaches_controller_memory_multiplexer():
    index = (ROOT / "cloudflare" / "omega-genesis-worker" / "src" / "index.js").read_text(encoding="utf-8")
    link = (ROOT / "cloudflare" / "omega-genesis-worker" / "src" / "link.js").read_text(encoding="utf-8")
    assert '"/api/link/mission":"/link/mission/create"' in index
    assert 'if(u.pathname==="/link/mission/create"&&request.method==="POST")return Response.json(await createMission' in index
    assert 'if(body?.context_memory)return contextMemory(storage,req,body.context_memory)' in link
    for op in ('STATUS', 'SAVE', 'LIST', 'SEARCH', 'ARCHIVE'):
        assert f'op==="{op}"' in link


def test_create_mission_context_memory_path_executes_without_device_and_preserves_normal_mission_gate():
    script = r'''
      import {createMission} from "./cloudflare/omega-genesis-worker/src/link.js";
      import {hash} from "./cloudflare/omega-genesis-worker/src/kernel.js";
      class Storage {constructor(){this.m=new Map()} async get(k){return this.m.get(k)} async put(k,v){this.m.set(k,structuredClone(v))} async delete(k){this.m.delete(k)} async list({prefix}){return new Map([...this.m].filter(([k])=>k.startsWith(prefix)))}}
      const storage=new Storage(),token="controller-route-fixed-test-token",h=await hash(token);
      await storage.put("c:"+h,{created_at:"test"});
      const req=new Request("https://state/link/mission/create",{method:"POST",headers:{Authorization:`Bearer ${token}`}});
      const digest="b".repeat(64);
      const saved=await createMission(storage,req,{context_memory:{op:"SAVE",conversation_id:"route-1",title:"Context route",summary:"We decided to preserve proof and continue the build.",transcript:"Important context",tags:["proof"],canonical_digest:digest}});
      if(saved.status!=="SAVED_CLOUD")throw new Error("multiplex save failed");
      const found=await createMission(storage,req,{context_memory:{op:"SEARCH",query:"proof build"}});
      if(found.matches[0]?.conversation_id!=="route-1")throw new Error("multiplex search failed");
      let normalGate=false;try{await createMission(storage,req,{device_id:"missing",allowed_operations:["TEST"],cycle_budget:2,project_path:"."})}catch(e){normalGate=String(e.message)==="device_not_available"}
      if(!normalGate)throw new Error("normal mission device gate regressed");
      console.log("PASS");
    '''
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True, check=False)
    assert result.returncode == 0, result.stderr or result.stdout
    assert "PASS" in result.stdout
