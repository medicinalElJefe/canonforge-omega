# OMEGA V6 single-product facade G1

## Problem corrected

The governed Genesis runtime and the operator-facing `omegav6` Worker had diverged into separate public surfaces. Reciprocal observation alone did not make them one product.

## Architecture

`omegav6` is the stable public product surface. It serves the governed `web/` interface and forwards API, proof, Hybrid Link, memory, and stream traffic through a Cloudflare service binding to `omega-genesis-v1`.

Genesis remains the only canonical state authority and retains its existing Durable Object namespace. The V6 facade declares no Durable Object binding and cannot create a second canonical state.

## Promotion proof

The V6 deployment workflow must prove all of the following before reporting success:

- V6 reports product identity `OMEGA_V6` and runtime `OMEGA_V6_PUBLIC_FACADE`.
- V6 transport authority is `cloudflare-service-binding`.
- Genesis reports `durable-object-canonical` authority.
- V6 health, V6 API health, V6 convergence edge, and Genesis API health expose the same 64-character canonical digest.
- Genesis proof and replay are valid and replay resolves to the same canonical digest.
- The V6 root returns the actual OMEGA interface rather than a health-only placeholder.

The facade never promotes its own state. `canonical_mutation` remains false at the V6 identity layer.

## Remaining boundary

This generation makes the deployment topology one product without migrating or rewriting Genesis Durable Object state. A subsequent governance amendment should make the protected Self-Builder final-promotion edge job deploy and verify both Genesis and V6 from the exact final promotion SHA so final release identity is also unified.
