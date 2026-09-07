export const HYBRID_MISSION_LEDGER_RELEASE_R202 = "r202-hybrid-mission-continuity-ledger";
export const HYBRID_MISSION_LEDGER_SINGLETON_R202 = "omega-r202-hybrid-mission-continuity-v1";

const STORAGE_KEY = "hybridMissionContinuityR202";
const LEDGER_LIMIT = 96;
const HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

type AnyObj = Record<string, any>;

type LedgerEntry = {
  schema: "OMEGA_HYBRID_MISSION_EVIDENCE_R202";
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
  entrySha256: string;
};

type Ledger = {
  schema: "OMEGA_HYBRID_MISSION_LEDGER_R202";
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
    schema: "OMEGA_HYBRID_MISSION_LEDGER_R202",
    release: HYBRID_MISSION_LEDGER_RELEASE_R202,
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
    entrySha256: entry.entrySha256,
    canonicalMutation: false,
    hostStateMutation: false,
    promotionAuthorized: false,
  };
}

async function verifyLedger(ledger: Ledger) {
  let prev = ledger.anchorSha256;
  const errors: AnyObj[] = [];
  for (const entry of ledger.entries) {
    if (entry.prevEntrySha256 !== prev) {
      errors.push({ sequence: entry.sequence, code: "R202_PREV_LINK_MISMATCH", expected: prev, given: entry.prevEntrySha256 });
    }
    const core: AnyObj = { ...entry };
    delete core.entrySha256;
    const recomputed = await sha(core);
    if (recomputed !== entry.entrySha256) {
      errors.push({ sequence: entry.sequence, code: "R202_ENTRY_SHA256_MISMATCH", expected: recomputed, given: entry.entrySha256 });
    }
    prev = entry.entrySha256;
  }
  if ((ledger.entries.length ? prev : ledger.anchorSha256) !== ledger.headSha256) {
    errors.push({ code: "R202_HEAD_SHA256_MISMATCH", expected: ledger.entries.length ? prev : ledger.anchorSha256, given: ledger.headSha256 });
  }
  return {
    verified: errors.length === 0,
    class: errors.length === 0 ? "R202_HYBRID_CONTINUITY_HASH_CHAIN_VERIFIED" : "R202_HYBRID_CONTINUITY_HASH_CHAIN_FAILED",
    retainedEntries: ledger.entries.length,
    sequence: ledger.sequence,
    anchorSha256: ledger.anchorSha256,
    headSha256: ledger.headSha256,
    errors,
    authority: "EVIDENCE_CHAIN_NOT_HOSTSTATE_NOT_CANONSTATE",
    canonicalMutation: false,
    hostStateMutation: false,
    promotionAuthorized: false,
  };
}

export class OmegaHybridMissionLedgerR202 {
  ctx: any;
  env: any;

  constructor(ctx: any, env: any) {
    this.ctx = ctx;
    this.env = env;
  }

  async read(): Promise<Ledger> {
    return (await this.ctx.storage.get(STORAGE_KEY) as Ledger | undefined) || blankLedger();
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
      return json({ ok: false, code: "R202_ANCHORED_EVIDENCE_REQUIRED", canonicalMutation: false, hostStateMutation: false, promotionAuthorized: false }, 422);
    }

    const ledger = await this.read();
    const fingerprint = await sha({
      missionId,
      r201MissionReceiptSha256,
      r201EntrySha256,
      hybridMissionId: text(body.hybridMissionId) || null,
      hybridJobId: text(body.hybridJobId) || null,
      state,
      hybridMissionStatus: text(body.hybridMissionStatus) || null,
      hybridJobStatus: text(body.hybridJobStatus) || null,
      cycle: body.cycle == null ? null : Number(body.cycle),
      repairRequired: body.repairRequired === true,
      targetDeviceRefSha256: isSha(body.targetDeviceRefSha256) ? text(body.targetDeviceRefSha256).toLowerCase() : null,
      hostProofSha256: isSha(body.hostProofSha256) ? text(body.hostProofSha256).toLowerCase() : null,
      hostResultFingerprint: text(body.hostResultFingerprint) || null,
      evidenceClass: text(body.evidenceClass) || "R202_CORRELATED_EVIDENCE",
    });
    const duplicate = [...ledger.entries].reverse().find((entry: AnyObj) => entry.fingerprint === fingerprint);
    if (duplicate) {
      return json({ ok: true, state: "IDEMPOTENT_EXISTING_RECORD", entry: publicEntry(duplicate as LedgerEntry), verification: await verifyLedger(ledger) });
    }

    const prevEntrySha256 = ledger.headSha256;
    const core: AnyObj = {
      schema: "OMEGA_HYBRID_MISSION_EVIDENCE_R202",
      sequence: ledger.sequence + 1,
      observedAt: new Date().toISOString(),
      missionId,
      r201MissionReceiptSha256,
      r201EntrySha256,
      hybridMissionId: text(body.hybridMissionId) || null,
      hybridJobId: text(body.hybridJobId) || null,
      state,
      hybridMissionStatus: text(body.hybridMissionStatus) || null,
      hybridJobStatus: text(body.hybridJobStatus) || null,
      cycle: body.cycle == null ? null : Number(body.cycle),
      repairRequired: body.repairRequired === true,
      targetDeviceRefSha256: isSha(body.targetDeviceRefSha256) ? text(body.targetDeviceRefSha256).toLowerCase() : null,
      hostProofSha256: isSha(body.hostProofSha256) ? text(body.hostProofSha256).toLowerCase() : null,
      hostResultFingerprint: text(body.hostResultFingerprint) || null,
      evidenceClass: text(body.evidenceClass) || "R202_CORRELATED_EVIDENCE",
      prevEntrySha256,
      fingerprint,
    };
    const entrySha256 = await sha(core);
    const entry = { ...core, entrySha256 } as LedgerEntry & { fingerprint: string };
    ledger.sequence = entry.sequence;
    ledger.entries.push(entry as any);
    ledger.headSha256 = entrySha256;
    if (ledger.entries.length > LEDGER_LIMIT) {
      const removed = ledger.entries.slice(0, ledger.entries.length - LEDGER_LIMIT);
      ledger.entries = ledger.entries.slice(-LEDGER_LIMIT);
      ledger.anchorSha256 = removed.at(-1)?.entrySha256 || ledger.anchorSha256;
    }
    await this.write(ledger);
    const verification = await verifyLedger(ledger);
    return json({ ok: verification.verified, state: verification.verified ? "R202_EVIDENCE_RECORDED_CHAIN_VERIFIED" : "R202_EVIDENCE_RECORDED_CHAIN_FAILED", entry: publicEntry(entry), verification }, verification.verified ? 201 : 500);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "");
    if (path === "/r202/record" && request.method === "POST") {
      return this.record(await request.json().catch(() => ({})) as AnyObj);
    }
    if (path === "/r202/verify" && request.method === "GET") {
      return json({ ok: true, ...(await verifyLedger(await this.read())) });
    }
    if (path === "/r202/history" && request.method === "GET") {
      const ledger = await this.read();
      const missionId = text(url.searchParams.get("missionId"));
      const entries = missionId ? ledger.entries.filter(row => row.missionId === missionId) : ledger.entries;
      return json({
        ok: true,
        schema: "OMEGA_HYBRID_MISSION_PUBLIC_HISTORY_R202",
        release: HYBRID_MISSION_LEDGER_RELEASE_R202,
        entries: entries.map(publicEntry),
        count: entries.length,
        sequence: ledger.sequence,
        anchorSha256: ledger.anchorSha256,
        headSha256: ledger.headSha256,
        privacyBoundary: "No bridge credential, raw device identifier, mission draft, local path payload, host log, step proof body, or file content is exposed.",
        authority: "CORRELATED_EVIDENCE_HISTORY_NOT_HOSTSTATE_NOT_CANONSTATE",
        canonicalMutation: false,
        hostStateMutation: false,
        promotionAuthorized: false,
      });
    }
    if (path === "/r202/latest" && request.method === "GET") {
      const missionId = text(url.searchParams.get("missionId"));
      if (!missionId) return json({ ok: false, code: "MISSION_ID_REQUIRED" }, 422);
      const ledger = await this.read();
      const entry = [...ledger.entries].reverse().find(row => row.missionId === missionId) || null;
      return json({ ok: Boolean(entry), entry: entry ? publicEntry(entry) : null, canonicalMutation: false, hostStateMutation: false, promotionAuthorized: false }, entry ? 200 : 404);
    }
    return json({ ok: false, code: "R202_LEDGER_ROUTE_NOT_FOUND" }, 404);
  }
}
