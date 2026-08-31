# Contextual conversation memory v1

This candidate adds a bounded, user-controlled memory layer for important conversations.

## Executed capability

- deterministic importance scoring with explainable reasons
- explicit Save Important Conversation action
- contextual search with matched-term explanation
- secret-like credential redaction before persistence
- canonical digest binding at save time
- tamper-evident SHA-256 record hashes in the Python contract
- archive chaining and archived-record retrieval exclusion
- browser interaction surface under AI Orchestration
- browser storage is capped at 250 records
- `canonical_mutation` is always false for saved context

## Truth boundary

Saved conversation context is not canonical OMEGA truth and is not external evidence. It may inform interaction and retrieval while retaining source class `SAVED_CONVERSATION_CONTEXT`. The current browser interaction persists to the active browser profile; cross-device cloud synchronization is not claimed by this generation.

## Next strengthening

After this core is promoted, the next generation should bind the same record contract to authenticated Durable Object storage so authorized OMEGA nodes can share selected memories without turning them into canonical state or exposing private conversations publicly.
