# EV-008 Earth source registry candidate

This candidate adds a bounded deterministic provenance contract for Earth traversal inputs.

## Improvement

- Adds typed GIS vector, DEM raster, and OSM vector source descriptors.
- Binds each descriptor to a lowercase SHA-256 content digest and declared EPSG:4326 coverage.
- Produces deterministic source-envelope and traversal-packet fingerprints.
- Sorts source descriptors before packet construction so input ordering cannot alter proof output.
- Requires matching declared coverage before traversal ground evidence can move from `HOLD/NO_EVIDENCE` to `PASS/SOURCE_BOUND`.
- Registers CAP-024 as a LIVE_CORE source-binding/provenance-envelope capability.

## Truth boundary

`SOURCE_BOUND` does **not** mean a real dataset was fetched, that an external publisher was authenticated, or that ground pixels were observed. The candidate intentionally emits `observed_ground_claim: false` and `external_authority_verified: false`. EV-008's external `earth_dataset_bound` evidence remains separate and must be observed by OMEGA Cloud before the policy objective can be fully achieved.

The descriptor contains only a sanitized logical source identifier, dataset class, digest, CRS, and numeric coverage. It has no field for private Drive IDs, account metadata, credentials, tokens, or raw corpus content.

## Reversibility

The change is isolated to the Earth adapter, its tests, this evidence note, and the non-constitutional capability registry. No evolution/self-build judge or policy path is modified. Reverting the candidate removes CAP-024 and restores the prior Earth adapter without changing canonical state authority.
