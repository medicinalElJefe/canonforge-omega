# OMEGA Genesis architecture

OMEGA Genesis enforces one write authority: `OmegaRuntime`. Everything else is a lens, adapter, proposal source, or projection.

## Kernel

`CanonicalPacket` carries the 20,736 address, CΩ/Φ/Λ/q/S metrics, motion, evidence class, source references, parent digest, sequence and packet digest. A transition passes Mode 188/evidence gates before commit. Accepted and rejected transitions are appended to the proof chain.

## Mode fabric

The registry contains 35 governed modes. Each declares a mutation policy: READ_ONLY, PROPOSE, EXTERNAL_SIDECAR, or GOVERNED_HOST. “All modes active” means all registered lenses may evaluate the same packet; it does not mean 35 competing state writers.

## Corpus

Drive/software artifacts are a provenance graph. Filename chronology does not establish authority. Known authorities are ranked; unknown material defaults to QUARANTINE. Public source control stores safe names, hashes and contracts, while full corpus indexing runs against an approved local Drive/project root.

## Plugins

Plugins declare permissions and capabilities. Direct canonical commit, evidence promotion, proof rewrite, arbitrary shell and arbitrary network are forbidden. Plugins may read/query/render and return state proposals through the kernel.

## Hybrid Link

The Desktop/PC bridge accepts typed operations confined to an approved root and returns deterministic plan fingerprints. It is not an arbitrary remote shell.

## Projection

Render, audio, graph, Earth, forecast and semantic outputs bind to the canonical digest. They never become measurement authority merely by being displayed.
