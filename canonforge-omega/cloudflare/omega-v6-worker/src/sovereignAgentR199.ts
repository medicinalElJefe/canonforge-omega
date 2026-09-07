// The reviewed Python agent is imported as inert text and served byte-for-byte.
// Cloudflare never executes this source; the authenticated Windows launcher downloads it.
// @ts-ignore Text-module import supplied by wrangler [[rules]].
import sovereignAgentR199 from "../../../scripts/omega_hybrid_agent_r199.py";

const CANONICAL_ORIGIN = "https://omegav6.jeffdeweyeljefe.workers.dev";

async function sha256Text(source: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(source));
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}

export async function sovereignAgentR199Manifest(): Promise<Record<string, unknown>> {
  const source = String(sovereignAgentR199);
  const digest = await sha256Text(source);
  return {
    ok: true,
    schema: "OMEGA_HYBRID_CONNECTOR_MANIFEST_R199",
    canonicalControlOrigin: CANONICAL_ORIGIN,
    agent: {
      path: "/api/hybrid/agent-download",
      directPath: "/omega-hybrid-agent.py",
      version: "R34.1",
      capabilityRevision: "R132",
      sovereignClosureRevision: "R199",
      sha256: digest,
      bytes: new TextEncoder().encode(source).byteLength,
      identity: "OMEGA Hybrid Link R199 sovereign workstation agent",
    },
    rootPolicy: {
      defaultApprovedRoot: "J:\\",
      explicitAlternateNonSystemRootAllowed: true,
      pathEscapeAllowed: false,
      systemDriveRuntimeFallback: false,
    },
    executionPolicy: {
      projectAwareDiscovery: true,
      heavyOperationsSequential: true,
      resourceGuard: true,
      windowsHeavyPriority: "BELOW_NORMAL",
      reversibleSourceMutation: true,
      implicitDependencyInstall: false,
      uncontrolledSystemOptimization: false,
      arbitraryShell: false,
      verifiedReturnReceipt: true,
    },
    connectorProtocol: "R127_ZERO_DRIFT_SHA256_PLUS_R199_VERIFIED_RETURN",
    truthBoundary: "MANIFEST_AND_AGENT_DIGEST_PROVE DELIVERED CONNECTOR BYTES; PC ONLINE STILL REQUIRES A CURRENT AUTHENTICATED HEARTBEAT.",
  };
}

export async function sovereignAgentR199Response(): Promise<Response> {
  const source = String(sovereignAgentR199);
  if (source.length < 1000 || !source.startsWith("#!/usr/bin/env python3") || !source.includes('SOVEREIGN_CLOSURE_REVISION = "R199"')) {
    return Response.json({ ok: false, code: "R199_AGENT_SOURCE_INVALID" }, { status: 503 });
  }
  const digest = await sha256Text(source);
  return new Response(source, {
    status: 200,
    headers: {
      "content-type": "text/x-python; charset=utf-8",
      "content-disposition": 'attachment; filename="omega-hybrid-agent.py"',
      "cache-control": "no-store, max-age=0",
      "x-omega-agent-version": "R34.1",
      "x-omega-capability-revision": "R132",
      "x-omega-sovereign-closure-revision": "R199",
      "x-omega-agent-sha256": digest,
      "x-omega-agent-bytes": String(new TextEncoder().encode(source).byteLength),
      "x-omega-canonical-origin": CANONICAL_ORIGIN,
      "x-omega-hybrid-protocol": "R127_ZERO_DRIFT_SHA256_PLUS_R199_VERIFIED_RETURN",
    },
  });
}
