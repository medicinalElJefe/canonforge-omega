// R198 successor agent serving layer.
// The reviewed Python source is imported as a Cloudflare Text module so the bytes served by the
// canonical Worker are the same source that is compiled and unit-tested in this repository.
// R34.1/R132 transport identity remains compatible with the existing R127 zero-drift launcher;
// R198 is an additive sovereign full-build closure capability.
// @ts-ignore Wrangler Text module configured in wrangler.toml.
import agentSource from "../../../scripts/omega_hybrid_agent_r198.py";

export const SOVEREIGN_AGENT_R198_SHA256 = "945f3e1fe9e9acf67691a9eaecf4afe5d43f9df317aed036bc50f99f27546082";
export const SOVEREIGN_AGENT_TRANSPORT_VERSION = "R34.1";
export const SOVEREIGN_AGENT_COMPATIBILITY_REVISION = "R132";
export const SOVEREIGN_AGENT_CLOSURE_REVISION = "R198";

export function sovereignAgentR198Response(): Response {
  return new Response(agentSource, {
    status: 200,
    headers: {
      "content-type": "text/x-python; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
      "content-disposition": "inline; filename=omega-hybrid-agent.py",
      "x-omega-agent-sha256": SOVEREIGN_AGENT_R198_SHA256,
      "x-omega-agent-version": SOVEREIGN_AGENT_TRANSPORT_VERSION,
      "x-omega-capability-revision": SOVEREIGN_AGENT_COMPATIBILITY_REVISION,
      "x-omega-sovereign-closure-revision": SOVEREIGN_AGENT_CLOSURE_REVISION,
      "x-content-type-options": "nosniff",
    },
  });
}
