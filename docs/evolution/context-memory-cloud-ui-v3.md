# Adaptive cloud-first contextual interaction memory v3

This generation makes the CAP-026/CAP-027 memory system directly usable from the OMEGA interaction surface.

## Executed interaction behavior

- memory controls prefer authenticated controller-scoped Durable Object storage whenever the current browser has the existing Hybrid controller authority
- each cloud save first retrieves the live canonical state and requires a 64-character canonical digest before cloud persistence
- if the controller or canonical identity cannot be proven, the same user action falls back to bounded browser-local memory and reports the fallback explicitly
- cloud memories are locally mirrored for resilience but remain source-classed as `SAVED_CONVERSATION_CONTEXT`
- search/list/archive prefer the authenticated cloud authority and visibly identify CLOUD, LOCAL, or DEGRADED → LOCAL state
- retrieved memories expose an explicit **Use as context** action and a **Clear context** action
- planning with selected memory visibly injects a `SAVED_CONVERSATION_CONTEXT` block labeled **not evidence or canonical truth**
- planner objective/result can be copied into the memory editor with **Capture planner interaction**; capture only prepares the editor and importance suggestion and never saves automatically
- an importance suggestion appears only above the current threshold and requires **Save it** confirmation
- rejecting a suggestion raises the local threshold; accepting a save lowers it slightly
- adaptive threshold is bounded from 0.40 to 0.70 and displays accepted/dismissed counts and current threshold
- suggestion adaptation is browser-local preference state and cannot mutate canonical state
- memory module is loaded fail-open; failure leaves prior local CAP-026 controls available rather than breaking the render/runtime surface

## Truth and privacy boundary

No conversation is silently autosaved. Saved conversation memory is contextual material, not source evidence and not canonical OMEGA state. Controller credentials remain in session storage and are sent only as bearer authorization to the existing authenticated Hybrid controller route; they are never persisted inside a memory record.

## Adaptation boundary

This is bounded interaction adaptation, not autonomous rewriting of policy or canonical truth. The system adapts only the suggestion threshold based on explicit accepted/dismissed interactions. Future adaptation can extend to transparent user-controlled preference profiles only after separate proof-gated generations.
