# Source-bound world reconstruction

This candidate implements only the portion of the historical world-reconstruction contract that can be made truthful without pretending unavailable sensors or datasets exist.

The recovered implementation canon contributes the requirements for source-bound rendering/reconstruction, explicit frames and units, time binding, deterministic replay, admission gates, and residual diagnostics. That canon also labels many world-reconstruction modules as PLANNED, so this implementation is new Genesis code rather than a claim that those planned modules had already executed.

## Contract

A reconstruction requires at least two observations. Every observation carries:

- source identifier and authority;
- evidence class;
- ISO-8601 observation time;
- coordinate frame;
- units;
- x/y/z value;
- positive uncertainty sigma.

OMEGA refuses mixed frames and mixed units. It does not invent transforms or conversions. An explicit target frame/unit must match the source declarations unless a future separately proven transform adapter is supplied.

The current solver is deliberately bounded: inverse-variance weighted point fusion with residual and normalized-residual diagnostics. The result is DERIVED evidence and is bound to the canonical OMEGA state digest and a SHA-256 digest of the complete source set.

This is a source-calibrated reconstruction primitive, not a claim that OMEGA already possesses a complete real-time model of Earth or the physical world.
