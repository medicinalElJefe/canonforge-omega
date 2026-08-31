# R89 Genesis service-binding convergence repair

## Observed production failure

The exact canonical V6 head `25129f8a4795db35856226e471766ed1ea76a811` passed sovereign-core, Cloudflare type safety, promotion compatibility, and exact-head deployment. Its post-deploy public convergence verifier then failed because V6 received Cloudflare error 1042 when it attempted same-zone public fetches to the Genesis Worker. The independently fetched public Genesis manifest remained valid and reported `OMEGA_RECURSIVE_CONVERGENCE_MANIFEST_V2` with 29 registered capabilities.

## Bounded repair

R89 keeps `convergence.ts` unchanged, including the existing public Genesis probes and reciprocal-manifest contract. The active `heartbeatTruth.ts` edge wrapper gains an optional typed Cloudflare service-binding transport. When `env.GENESIS` exists, the wrapper queries the same five Genesis observation endpoints through the binding and replaces only observations whose bound responses are successful. If the binding is absent, canonical behavior is unchanged. If the binding is present but degraded, the original public observations remain visible and the transport is marked `SERVICE_BINDING_DEGRADED`.

The canonical V6 semantic build identity remains `r87-semantic-edge-settle-proof`. R88 heartbeat truth remains mandatory: PC ONLINE still requires both the upstream authenticated-online claim and a current authenticated Hybrid heartbeat. R89 is separately identified as `CONVERGENCE_TRANSPORT_ID = r89-genesis-service-binding`.

## Truth boundaries

A successful Cloudflare service binding proves transport reachability to the configured Genesis Worker only. It does not prove sovereign-PC execution, Earth observation, device/GPU execution, or production state outside the returned Genesis contracts. Genesis remains discovery/evolution authority for its own state; V6 remains operational/release authority. No public Drive identifiers, private corpus, credentials, tokens, or secrets are embedded.

## Rollback

Rollback is bounded: remove the `GENESIS` service binding and revert the R89 wrapper changes. The unchanged public Genesis probe path remains the fallback contract throughout.
