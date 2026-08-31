# OMEGA lineage and Drive provenance

OMEGA Cloud must know not only which capability exists, but where the claim came from and what kind of evidence supports it.

The initial cloud provenance catalog is grounded in three high-value historical sources reviewed from the authorized Google Drive corpus:

1. `OMEGA_ALL_SOFTWARE_61917364224D_FULL_BUILD_v22.xlsx`
   - recovered 24-system software universe;
   - 24 subsystems per system, 12 phases, four streams, 27,648 grid rows;
   - 20,736 packet space and 61,917,364,224 design-address space;
   - invariant: `ONE FIELD / ONE PACKET / ONE CONTINUITY LAW`.

2. `OMEGA_20736D_IMPLEMENTATION_CANON_INDEX.xlsx`
   - 675 canonical rows;
   - 94 modules, 408 symbols/functions/kernels, 31 shader bindings;
   - 22 runtime events, 22 API routes, 12 database tables;
   - 25 build gates and 12 hard invariants;
   - critical distinction: many rows are explicitly `PLANNED`, while the invariants are `LOCKED`.

3. `v31r1__INTEGRATION_REPORT.txt`
   - records the execution spine `camera -> feature field -> canon state -> runtime atlas sample -> unified kernel -> adaptive learning -> renderer/panels`;
   - names four modules actually integrated in that pass;
   - explicitly states that several other packages remained architectural references rather than full code-level merges.

## Cloud contract

`config/provenance_sources.json` stores only sanitized lineage material:

- source names;
- extracted contracts;
- capability relations;
- authority/disposition;
- evidence boundaries;
- SHA-256 digests of the extracted contract objects.

It deliberately does **not** store Google Drive file IDs, URLs, account metadata, tokens, or raw private corpus content.

`omega_genesis.provenance` validates the catalog, detects contract tampering, blocks private identifier fields, and supports capability-to-source queries.

The cloud API exposes:

- `GET /api/provenance`
- `GET /api/provenance/capability?name=HYBRID_LINK`

Production health now includes a provenance summary. The immutable deployment gate requires that provenance catalog validation pass before a candidate can be promoted.

## Admission law

The lineage registry prevents several recurring failure modes:

- planned does not mean implemented;
- donor/reference does not mean merged;
- newer does not automatically mean more authoritative;
- generated output does not become observed evidence;
- historical capability claims remain separate from current-runtime proof.

This is the first stage of the larger provenance graph:

`Artifact -> Build -> Capability -> Evidence -> Descendant -> SupersededBy`

Additional Drive artifacts can be admitted incrementally after their contracts are extracted and classified. Private Drive identifiers stay outside the public/runtime manifest.
