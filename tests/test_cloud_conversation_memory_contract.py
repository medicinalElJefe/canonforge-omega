from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MEMORY = ROOT / "cloudflare" / "omega-genesis-worker" / "src" / "memory.js"


def test_cloud_memory_module_has_required_security_and_truth_boundaries():
    source = MEMORY.read_text(encoding="utf-8")
    required = [
        'omega.conversation.memory.cloud.v1',
        'controller_unauthorized',
        'controller_scope_hash',
        'canonical_mutation:false',
        'SAVED_CONVERSATION_CONTEXT',
        'MAX_RECORDS=250',
        '[REDACTED]',
        'record_hash',
        'previous_hash',
        'Authenticated controller-scoped context only',
        'not external evidence or canonical truth',
    ]
    for marker in required:
        assert marker in source, marker


def test_cloud_memory_module_executes_save_search_archive_and_auth_isolation():
    script = r'''
      import {saveConversation,listConversations,searchConversations,archiveConversation,memoryStatus} from "./cloudflare/omega-genesis-worker/src/memory.js";
      import {hash} from "./cloudflare/omega-genesis-worker/src/kernel.js";
      class Storage {
        constructor(){this.m=new Map()}
        async get(k){return this.m.get(k)}
        async put(k,v){this.m.set(k,structuredClone(v))}
        async delete(k){this.m.delete(k)}
        async list({prefix}){return new Map([...this.m].filter(([k])=>k.startsWith(prefix)))}
      }
      const storage=new Storage();
      const tokenA="controller-a-fixed-test-token",tokenB="controller-b-fixed-test-token";
      await storage.put("c:"+await hash(tokenA),{created_at:"test"});
      await storage.put("c:"+await hash(tokenB),{created_at:"test"});
      const req=t=>new Request("https://state/memory",{headers:{Authorization:`Bearer ${t}`}});
      const digest="a".repeat(64);
      const saved=await saveConversation(storage,req(tokenA),{
        conversation_id:"decision-1",title:"Hybrid build decision",
        summary:"We decided the Hybrid build must preserve proof and rollback. api_key=do-not-store-this-value",
        transcript:"Continue the build with accurate contextual memory.",tags:["hybrid","build"]
      },digest);
      if(saved.status!=="SAVED_CLOUD")throw new Error("save failed");
      if(JSON.stringify(saved).includes("do-not-store-this-value"))throw new Error("secret leaked");
      const own=await listConversations(storage,req(tokenA));
      if(own.records.length!==1)throw new Error("owner list failed");
      const other=await listConversations(storage,req(tokenB));
      if(other.records.length!==0)throw new Error("controller isolation failed");
      const search=await searchConversations(storage,req(tokenA),"hybrid proof build",8);
      if(search.matches[0]?.conversation_id!=="decision-1")throw new Error("search failed");
      if(!search.matches[0]?.why?.matched_terms?.includes("hybrid"))throw new Error("explanation missing");
      const archived=await archiveConversation(storage,req(tokenA),{conversation_id:"decision-1"});
      if(archived.status!=="ARCHIVED"||!archived.previous_hash)throw new Error("archive chain failed");
      const hidden=await searchConversations(storage,req(tokenA),"hybrid proof",8);
      if(hidden.matches.length!==0)throw new Error("archived record retrieved");
      const status=await memoryStatus(storage,req(tokenA));
      if(!status.authenticated||status.records!==1||status.max_records!==250)throw new Error("status failed");
      let rejected=false;try{await listConversations(storage,req("wrong-token"))}catch(e){rejected=String(e.message)==="controller_unauthorized"}
      if(!rejected)throw new Error("unauthorized request accepted");
      console.log("PASS");
    '''
    result = subprocess.run(
        ["node", "--input-type=module", "-e", script],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr or result.stdout
    assert "PASS" in result.stdout
