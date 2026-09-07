import convergence from "./system/../convergence";

// Wrangler aliases heartbeatTruth's exact "./convergence" import to this module.
// The alternate spelling above resolves the preserved original convergence module
// without re-entering the alias, while the named Durable Object export is upgraded.
export { OmegaRuntime } from "./omegaRuntimeR204";
export default convergence;
