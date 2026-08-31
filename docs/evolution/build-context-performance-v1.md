# Build-context performance v1

This ordinary evolution candidate reduces avoidable cloud-build input by recursively excluding generated dependency, cache, runtime-data, release and log trees from Docker context while retaining governed runtime source.

The motivating observation is a governed Self-Builder Docker context transfer of approximately 258.27 MB even though canonical tracked source contains no repository blob larger than 1 MB. The candidate treats generated nested dependency trees as build inputs that must not leak into the canonical container context.

Acceptance is deliberately bounded: static tests prove the recursive exclusion contract and source retention. Actual context-byte and wall-clock improvement are measured only after governed canonical Self-Builder execution; they are not pre-claimed by this candidate.
