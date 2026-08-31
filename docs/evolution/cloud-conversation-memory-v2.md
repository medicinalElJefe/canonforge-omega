# Authenticated cloud conversation memory v2

This generation promotes saved important-conversation context from browser-only persistence to an authenticated controller-scoped Durable Object store while preserving local browser memory as the existing interaction surface.

## Executed cloud capability

- reuses the one-time Hybrid Link controller authority instead of creating a weaker second credential system
- Durable Object keys are scoped by the controller-token hash
- save, list, contextual search, status and archive operations are reachable through the existing authenticated `/api/link/mission` controller route using a `context_memory` operation envelope
- no paired PC is required to use conversation memory, while ordinary build missions retain their device-online and operation allowlist gates
- bounded to 250 records per controller scope
- secret-like values are redacted before persistence
- every record is canonical-digest bound, SHA-256 integrity protected, source-classed as `SAVED_CONVERSATION_CONTEXT`, and explicitly `canonical_mutation:false`
- archive updates preserve the prior record hash and archived records are excluded from contextual search
- contextual retrieval explains matched terms and importance contribution
- different controller credentials cannot list or search each other's records

## Compatibility boundary

The public browser memory controls introduced in CAP-026 remain functional locally. This generation establishes the real authenticated cloud synchronization backend and controller route. A subsequent interaction generation should make those controls prefer the cloud store whenever `omegaHybridControllerToken` exists in session storage and explicitly show CLOUD / LOCAL FALLBACK status.

Saved context remains subordinate to canonical truth and is not external evidence.
