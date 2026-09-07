export const HYBRID_MISSION_LEDGER_RELEASE_R203 = "r203-hybrid-mission-continuity-ledger";
export const HYBRID_MISSION_LEDGER_SINGLETON_R203 = "omega-r203-hybrid-mission-continuity-v1";

const STORAGE_KEY = "hybridMissionContinuityR203";
const LEDGER_LIMIT = 96;
const HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

type AnyObj = Record<string, any>;

type LedgerEntry = {
  schema: "OMEGA_HYBRID_MISSION_EVIDENCE_R203";
  sequence: number;
  observedAt: string;
  missionId: string;
  r201MissionReceiptSha256: string;
  r201EntrySha256: string;
  hybridMissionId: string | null;
  hybridJobId: string | null;
  state: string;
  hybridMissionStatus: string | null;
  hybridJobStatus: string | null;
  cycle: number | null;
  repairRequired: boolean;
  targetDeviceRefSha256: string | null;
  hostProofSha256: string | null;
  hostResultFingerprint: string | null;
  evidenceClass: string;
  prevEntrySha256: string | null;
  fingerprint: string;
  entrySha256: string;
};

type Ledger = {
  schema: "OMEGA_HYBRID_MISSION_LEDGER_R203";
  release: string;
  sequence: number;
  anchorSha256: string | null;
  headSha256: string | null;
  entries: LedgerEntry[];
};

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value, null, 2), { status, headers: HEADERS });
}

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function isSha(value: unknown): value is string {
  return /^[0-9a-f]{64}$/i.test(text(value));
}

async function sha(value: unknown): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(value)));
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}

function blankLedger(): Ledger {
  return {
    schema: "OMEGA_HYBRID_MISSION_LEDGER_R203",
    release: HYBRID_MISSION_LEDGER_RELEASE_R203,
    sequence: 0,
    anchorSha256: null,
    headSha256: null,
    entries: [],
  };
}

function publicEntry(entry: LedgerEntry) {
  return {
    schema: entry.schema,
    sequence: entry.sequence,
    observedAt: entry.observedAt,
    missionId: entry.missionId,
    r201MissionReceiptSha256: entry.r201MissionReceiptSha256,
    r201EntrySha256: entry.r201EntrySha256,
    hybridMissionId: entry.hybridMissionId,
    hybridJobId: entry.hybridJobId,
    state: entry.state,
    hybridMissionStatus: entry.hybridMissionStatus,
    hybridJobStatus: entry.hybridJobStatus,
    cycle: entry.cycle,
    repairRequired: entry.repairRequired,
    targetDeviceRefSha256: entry.targetDeviceRefSha256,
    hostProofSha256: entry.hostProofSha256,
    hostResultFingerprint: entry.hostResultFingerprint,
    evidenceClass: entry.evidenceClass,
    prevEntrySha256: entry.prevEntrySha256,
    fingerprint: entry.fingerprint,
    entrySha256: entry.entrySha256,
    canonicalMutation: false,
    hostStateMutation: false,
    promotionAuthorized: false,
  };
}

async function verifyLedger(ledger: Ledger) {
  let expectedPrev = ledger.anchorSha256;
  const failures: AnyObj[] = [];
  for (const entry of ledger.entries) {
    if (entry.prevEntrySha256 !== expectedPrev) {
      failures.push({ sequence: entry.sequence, code: "R203_PREV_LINK_MISMATCH", expected: expectedPrev, actual: entry.prevEntrySha256 });
    }
    const core: AnyObj = { ...entry };
    delete core.entrySha256;
    const recomputed = await sha(core);
    if (recomputed.toLowerCase() !== text(entry.entrySha256).toLowerCase()) {
      failures.push({ sequence: entry.sequence, code: "R203_ENTRY_SHA256_MISMATCH", expected: recomputed, actual: entry.entrySha256 });
    }
    expectedPrev = entry.entrySha256;
  }
  const expectedHead = ledger.entries.length ? ledger.entries.at(-1)?.entrySha256 ?? null : null;
  if (ledger.headSha256 !== expectedHead) {
    failures.push({ code: "R203_HEAD_SHA256_MISMATCH", expected: expectedHead, actual: ledger.headSha256 });
  }
  return {
    ok: failures.length === 0,
    verified: failures.length === 0,
    schema: "OMEGA_HYBRID_MISSION_CHAIN_VERIFICATION_R203",
    release: HYBRID_MISSION_LEDGER_RELEASE_R203,
    retainedEntries: ledger.entries.length,
    sequence: ledger.sequence,
    anchorSha256: ledger.anchorSha256,
    headSha256: ledger.headSha256,
    failures,
    authority: "EVIDENCE_CHAIN_NOT_HOSTSTATE_NOT_CANONSTATE",
    canonicalMutation: false,
    hostStateMutation: false,
    promotionAuthorized: false,
  };
}

export class OmegaHybridMissionLedgerR203 {
  ctx: any;
  env: any;

  constructor(ctx: any, env: any) {
    this.ctx = ctx;
    this.env = env;
  }

  async read(): Promise<Ledger> {
    const existing = await this.ctx.storage.get(STORAGE_KEY) as Ledger | undefined;
    if (!existing || existing.schema !== "OMEGA_HYBRID_MISSION_LEDGER_R203" || !Array.isArray(existing.entries)) return blankLedger();
    return existing;
  }

  async write(ledger: Ledger): Promise<void> {
    await this.ctx.storage.put(STORAGE_KEY, ledger);
  }

  async record(body: AnyObj): Promise<Response> {
    const missionId = text(body.missionId);
    const r201MissionReceiptSha256 = text(body.r201MissionReceiptSha256).toLowerCase();
    const r201EntrySha256 = text(body.r201EntrySha256).toLowerCase();
    const state = text(body.state);
    if (!missionId || !isSha(r201MissionReceiptSha256) || !isSha(r201EntrySha256) || !state) {
      return json({ ok: false, code: "R203_R201_ANCHORED_EVIDENCE_REQUIRED", canonicalMutation: false, hostStateMutation: false, promotionAuthorized: false }, 422);
    }

    const normalized = {
      missionId,
      r201MissionReceiptSha256,
      r201EntrySha256,
      hybridMissionId: text(body.hybridMissionId) || null,
      hybridJobId: text(body.hybridJobId) || null,
      state,
      hybridMissionStatus: text(body.hybridMissionStatus) || null,
      hybridJobStatus: text(body.hybridJobStatus) || null,
      cycle: body.cycle == null || !Number.isFinite(Number(body.cycle)) ? null : Number(body.cycle),
      repairRequired: body.repairRequired === true,
      targetDeviceRefSha256: isSha(body.targetDeviceRefSha256) ? text(body.targetDeviceRefSha256).toLowerCase() : null,
      hostProofSha256: isSha(body.hostProofSha256) ? text(body.hostProofSha256).toLowerCase() : null,
      hostResultFingerprint: text(body.hostResultFingerprint) || null,
      evidenceClass: text(body.evidenceClass) || "R203_CORRELATED_EVIDENCE",
    };
    const fingerprint = await sha(normalized);
    const ledger = await this.read();
    const duplicate = [...ledger.entries].reverse().find(entry => entry.fingerprint === fingerprint);
    if (duplicate) {
      return json({ ok: true, state: "IDEMPOTENT_EXISTING_RECORD", entry: publicEntry(duplicate), verification: await verifyLedger(ledger) });
    }

    const base = {
      schema: "OMEGA_HYBRID_MISSION_EVIDENCE_R203" as const,
      sequence: ledger.sequence + 1,
      observedAt: new Date().toISOString(),
      ...normalized,
      prevEntrySha256: ledger.headSha256,
      fingerprint,
    };
    const entry: LedgerEntry = { ...base, entrySha256: await sha(base) };
    ledger.sequence = entry.sequence;
    ledger.entries.push(entry);
    if (ledger.entries.length > LEDGER_LIMIT) {
      ledger.entries = ledger.entries.slice(-LEDGER_LIMIT);
      ledger.anchorSha256 = ledger.entries[0]?.prevEntrySha256 ?? ledger.anchorSha256;
    }
    ledger.headSha256 = entry.entrySha256;
    await this.write(ledger);
    const verification = await verifyLedger(ledger);
    return json({
      ok: verification.verified,
      schema: "OMEGA_HYBRID_MISSION_RECORD_R203",
      release: HYBRID_MISSION_LEDGER_RELEASE_R203,
      state: verification.verified ? "R203_EVIDENCE_RECORDED_CHAIN_VERIFIED" : "R203_EVIDENCE_RECORDED_CHAIN_FAILED",
      entry: publicEntry(entry),
      verification,
      authority: "CORRELATED_EVIDENCE_NOT_HOSTSTATE_NOT_CANONSTATE",
      canonicalMutation: false,
      hostStateMutation: false,
      promotionAuthorized: false,
    }, verification.verified ? 201 : 500);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "");
    if (path === "/r203/record" && request.method === "POST") {
      return this.record(await request.json().catch(() => ({})) as AnyObj);
    }
    if (path === "/r203/verify" && request.method === "GET") {
      const verification = await verifyLedger(await this.read());
      return json(verification, verification.verified ? 200 : 409);
    }
    if (path === "/r203/history" && request.method === "GET") {
      const ledger = await this.read();
      const missionId = text(url.searchParams.get("missionId"));
      const entries = missionId ? ledger.entries.filter(row => row.missionId === missionId) : ledger.entries;
      return json({
        ok: true,
        schema: "OMEGA_HYBRID_MISSION_PUBLIC_HISTORY_R203",
        release: HYBRID_MISSION_LEDGER_RELEASE_R203,
        entries: entries.map(publicEntry),
        count: entries.length,
        sequence: ledger.sequence,
        anchorSha256: ledger.anchorSha256,
        headSha256: ledger.headSha256,
        privacyBoundary: "No bridge credential, raw device identifier, mission draft, local path payload, host log, step proof body, output-path body, or file content is exposed.",
        authority: "CORRELATED_EVIDENCE_HISTORY_NOT_HOSTSTATE_NOT_CANONSTATE",
        canonicalMutation: false,
        hostStateMutation: false,
        promotionAuthorized: false,
      });
    }
    if (path === "/r203/latest" && request.method === "GET") {
      const missionId = text(url.searchParams.get("missionId"));
      if (!missionId) return json({ ok: false, code: "MISSION_ID_REQUIRED" }, 422);
      const ledger = await this.read();
      const entry = [...ledger.entries].reverse().find(row => row.missionId === missionId) || null;
      return json({
        ok: Boolean(entry),
        entry: entry ? publicEntry(entry) : null,
        canonicalMutation: false,
        hostStateMutation: false,
        promotionAuthorized: false,
      }, entry ? 200 : 404);
    }
    return json({
      ok: false,
      code: "R203_LEDGER_ROUTE_NOT_FOUND",
      authority: "CORRELATED_EVIDENCE_NOT_HOSTSTATE_NOT_CANONSTATE",
      canonicalMutation: false,
      hostStateMutation: false,
      promotionAuthorized: false,
    }, 404);
  }
}
