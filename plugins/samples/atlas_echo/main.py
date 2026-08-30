import json, sys
payload=json.load(sys.stdin)
print(json.dumps({"plugin":"atlas_echo","status":"PASS","received_state_id":payload.get("state_id"),"note":"read-only sample; no canonical mutation"}))
