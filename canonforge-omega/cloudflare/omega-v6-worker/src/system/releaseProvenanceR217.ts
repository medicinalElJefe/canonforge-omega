type ReleaseProvenanceEnvR217 = {
  CANONICAL_GIT_SHA?: string;
  OMEGA_RELEASE_LEASE?: string;
  OMEGA_RELEASE_RUN_ID?: string;
  OMEGA_RELEASE_RUN_ATTEMPT?: string;
};

const RELEASE_PROVENANCE_PATH_R217 = "/api/system/r217/release-lease";

function jsonR217(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, max-age=0",
    },
  });
}

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function releaseProvenanceR217(env: ReleaseProvenanceEnvR217 | undefined) {
  const canonicalGitSha = clean(env?.CANONICAL_GIT_SHA);
  const releaseLease = clean(env?.OMEGA_RELEASE_LEASE);
  const releaseRunId = clean(env?.OMEGA_RELEASE_RUN_ID);
  const releaseRunAttempt = clean(env?.OMEGA_RELEASE_RUN_ATTEMPT);
  const bound = Boolean(canonicalGitSha && releaseLease && releaseRunId && releaseRunAttempt);

  return {
    ok: bound,
    schema: "OMEGA_RELEASE_PROVENANCE_R217",
    revision: "R217",
    state: bound ? "DEPLOYMENT_PROVENANCE_BOUND" : "DEPLOYMENT_PROVENANCE_UNBOUND",
    canonicalGitSha,
    releaseLease,
    releaseRunId,
    releaseRunAttempt,
    authority: "DEPLOYMENT_PROVENANCE_ONLY_NOT_AUTHORIZATION",
    truthBoundaries: {
      releaseLeaseIsNotCanonAuthority: true,
      releaseLeaseIsNotPromotionAuthority: true,
      releaseLeaseIsNotExecutionAuthority: true,
      releaseLeaseIsNotPhysicalPcProof: true,
      workerVersionPlusLeaseIsDeploymentIdentityOnly: true,
      unexpectedLeaseOrVersionBlocksAdmission: true,
    },
    canonicalMutation: false,
    promotionAuthorized: false,
  };
}

export function handleReleaseProvenanceR217(
  request: Request,
  env: ReleaseProvenanceEnvR217 | undefined,
): Response | null {
  const url = new URL(request.url);
  if (url.pathname !== RELEASE_PROVENANCE_PATH_R217 && url.pathname !== `${RELEASE_PROVENANCE_PATH_R217}/`) {
    return null;
  }
  if (request.method !== "GET") {
    return jsonR217({ ok: false, code: "METHOD_NOT_ALLOWED", allowed: ["GET"] }, 405);
  }
  const packet = releaseProvenanceR217(env);
  return jsonR217(packet, packet.ok ? 200 : 503);
}
