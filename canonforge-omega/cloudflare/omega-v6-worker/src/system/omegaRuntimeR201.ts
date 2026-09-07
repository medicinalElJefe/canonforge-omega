import { OmegaRuntime as BaseOmegaRuntime } from "../omegaRuntime";

export const DURABLE_MISSION_LEDGER_R201 = "r201-durable-mission-evidence-ledger";
export const DURABLE_MISSION_LEDGER_SCHEMA_R201 = "OMEGA_DURABLE_MISSION_LEDGER_R201";

const LEDGER_KEY = "missionLedgerR201";
const LEDGER_LIMIT = 96;
const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

type AnyObj = Record<string, any>;

type LedgerEntry = {
  schema: string;
  release: string;
  missionId: string;
  recordedAt: string;
  intent: string;
  planSha256: string | null;
  missionReceiptSha256: string;
  receiptIntegrityVerified: boolean;
  modes: { activeCount: number | null; priority: string[] };
  execution: {
    requiredTasks: number | null;
    requiredReturned: number | null;
    requiredVerified: number | null;
    receiptIntegrityVerified: number | null;
    specialistVerified: number | null;
    coherence: number | null;
  };
  residuals: AnyObj;
  renderProjection: AnyObj | null;
  admission: AnyObj | null;
  truthBoundaries: AnyObj;
  taskReceipts: AnyObj[];
  prevEntrySha256: string | null;
  entrySha256: string;
};

type LedgerState = {
  schema: string;
  release: string;
  createdAt: string;
  updatedAt: string;
  anchorSha256: string | null;
  headSha256: string | null;
  entries: LedgerEntry[];
};

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value, null, 2), { status, headers: JSON_HEADERS });
}

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function finite(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function residualCount(residuals: AnyObj): number {
  return Object.values(residuals || {}).reduce((n: number, v: any) => n + (Array.isArray(v) ? v.length : 0), 0);
}

async function sha(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(typeof value === "string" ? value : JSON.stringify(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}

function blankLedger(): LedgerState {
  const now = new Date().toISOString();
  return {
    schema: DURABLE_MISSION_LEDGER_SCHEMA_R201,
    release: DURABLE_MISSION_LEDGER_R201,
    createdAt: now,
    updatedAt: now,
    anchorSha256: null,
    headSha256: null,
    entries: [],
  };
}

function compactTaskReceipt(row: any): AnyObj {
  const receipt = row?.receipt || {};
  const downstream = receipt?.downstream || {};
  return {
    id: text(row?.task?.id).slice(0, 180),
    phase: text(row?.task?.phase).slice(0, 40),
    menuId: text(row?.task?.menuId).slice(0, 40),
    action: text(row?.task?.action).slice(0, 80),
    required: Boolean(row?.task?.required),
    taskState: text(row?.task?.state).slice(0, 40) || null,
    status: finite(row?.status),
    ok: Boolean(row?.ok),
    returned: Boolean(row?.returned),
    verified: Boolean(row?.verified),
    specialistVerified: Boolean(row?.specialistVerified),
    verificationClass: text(row?.verificationClass).slice(0, 100) || null,
    receiptIntegrity: {
      verified: Boolean(row?.receiptIntegrity?.verified),
      class: text(row?.receiptIntegrity?.class).slice(0, 100) || null,
      given: text(row?.receiptIntegrity?.given).slice(0, 64) || null,
      recomputed: text(row?.receiptIntegrity?.recomputed).slice(0, 64) || null,
    },
    downstream: {
      path: text(downstream?.path).slice(0, 260) || null,
      method: text(downstream?.method).slice(0, 16) || null,
      status: finite(downstream?.status),
      ok: downstream?.ok === true,
    },
    r199ReceiptSha256: text(receipt?.receiptSha256).slice(0, 64) || null,
    residual: text(row?.residual).slice(0, 80) || null,
    error: text(row?.error).slice(0, 500) || null,
  };
}

async function verifyMissionReceipt(packet: any) {
  const given = text(packet?.missionReceiptSha256);
  if (!packet || typeof packet !== "object" || !/^[0-9a-f]{64}$/i.test(given)) {
    return { verified: false, class: "R200_MISSION_RECEIPT_SHA256_MISSING", given: given || null, recomputed: null };
  }
  const core: AnyObj = { ...packet };
  delete core.missionReceiptSha256;
  const recomputed = await sha(core);
  return {
    verified: recomputed.toLowerCase() === given.toLowerCase(),
    class: recomputed.toLowerCase() === given.toLowerCase() ? "R200_MISSION_RECEIPT_SHA256_VERIFIED" : "R200_MISSION_RECEIPT_SHA256_MISMATCH",
    given,
    recomputed,
  };
}

function ledgerSummary(ledger: LedgerState) {
  const latest = ledger.entries.length ? ledger.entries[ledger.entries.length - 1] : null;
  return {
    schema: ledger.schema,
    release: ledger.release,
    authority: "DURABLE_EVIDENCE_HISTORY_NOT_HOSTSTATE_NOT_CANONSTATE",
    entryCount: ledger.entries.length,
    anchorSha256: ledger.anchorSha256,
    headSha256: ledger.headSha256,
    createdAt: ledger.createdAt,
    updatedAt: ledger.updatedAt,
    latest: latest ? {
      missionId: latest.missionId,
      recordedAt: latest.recordedAt,
      missionReceiptSha256: latest.missionReceiptSha256,
      entrySha256: latest.entrySha256,
      admissionState: latest.admission?.state || null,
      requiredVerified: latest.execution.requiredVerified,
      residualCount: residualCount(latest.residuals),
    } : null,
    canonicalMutation: false,
    hostStateMutation: false,
    promotionAuthorized: false,
  };
}

function publicEntry(entry: LedgerEntry) {
  return {
    missionId: entry.missionId,
    recordedAt: entry.recordedAt,
    planSha256: entry.planSha256,
    missionReceiptSha256: entry.missionReceiptSha256,
    entrySha256: entry.entrySha256,
    prevEntrySha256: entry.prevEntrySha256,
    receiptIntegrityVerified: entry.receiptIntegrityVerified,
    modeCount: entry.modes.activeCount,
    execution: entry.execution,
    residualCount: residualCount(entry.residuals),
    admissionState: entry.admission?.state || null,
  };
}

export class OmegaRuntime extends BaseOmegaRuntime {
  async loadMissionLedgerR201(): Promise<LedgerState> {
    const existing = await this.ctx.storage.get(LEDGER_KEY) as LedgerState | undefined;
    if (!existing || existing.schema !== DURABLE_MISSION_LEDGER_SCHEMA_R201 || !Array.isArray(existing.entries)) return blankLedger();
    return {
      ...existing,
      anchorSha256: existing.anchorSha256 ?? existing.entries[0]?.prevEntrySha256 ?? null,
      headSha256: existing.headSha256 ?? existing.entries.at(-1)?.entrySha256 ?? null,
    };
  }

  async saveMissionLedgerR201(ledger: LedgerState) {
    ledger.updatedAt = new Date().toISOString();
    await this.ctx.storage.put(LEDGER_KEY, ledger);
  }

  async verifyMissionLedgerR201() {
    const ledger = await this.loadMissionLedgerR201();
    let expectedPrev = ledger.anchorSha256;
    const failures: AnyObj[] = [];
    for (let i = 0; i < ledger.entries.length; i++) {
      const entry = ledger.entries[i];
      const core: AnyObj = { ...entry };
      delete core.entrySha256;
      const recomputed = await sha(core);
      if (entry.prevEntrySha256 !== expectedPrev) {
        failures.push({ index: i, missionId: entry.missionId, class: "R201_PREV_LINK_MISMATCH", expected: expectedPrev, actual: entry.prevEntrySha256 });
      }
      if (recomputed.toLowerCase() !== text(entry.entrySha256).toLowerCase()) {
        failures.push({ index: i, missionId: entry.missionId, class: "R201_ENTRY_SHA256_MISMATCH", expected: recomputed, actual: entry.entrySha256 });
      }
      expectedPrev = entry.entrySha256;
    }
    const expectedHead = ledger.entries.length ? ledger.entries[ledger.entries.length - 1].entrySha256 : null;
    if (ledger.headSha256 !== expectedHead) failures.push({ class: "R201_HEAD_SHA256_MISMATCH", expected: expectedHead, actual: ledger.headSha256 });
    return {
      ok: failures.length === 0,
      verified: failures.length === 0,
      schema: "OMEGA_DURABLE_MISSION_CHAIN_VERIFICATION_R201",
      release: DURABLE_MISSION_LEDGER_R201,
      entryCount: ledger.entries.length,
      anchorSha256: ledger.anchorSha256,
      headSha256: ledger.headSha256,
      failures,
      authority: "DURABLE_EVIDENCE_HISTORY_NOT_HOSTSTATE_NOT_CANONSTATE",
      canonicalMutation: false,
      hostStateMutation: false,
      promotionAuthorized: false,
    };
  }

  async recordMissionR201(packet: any): Promise<Response> {
    if (packet?.schema !== "OMEGA_CANONICAL_MISSION_R200" || packet?.release !== "r200-canonical-mission-kernel") {
      return json({ ok: false, code: "R201_R200_MISSION_PACKET_REQUIRED", canonicalMutation: false, hostStateMutation: false }, 422);
    }
    const integrity = await verifyMissionReceipt(packet);
    if (!integrity.verified) {
      return json({ ok: false, code: "R201_MISSION_RECEIPT_REJECTED", integrity, canonicalMutation: false, hostStateMutation: false }, 409);
    }
    const missionId = text(packet.missionId).slice(0, 180);
    if (!missionId) return json({ ok: false, code: "R201_MISSION_ID_REQUIRED" }, 422);

    const ledger = await this.loadMissionLedgerR201();
    const duplicate = ledger.entries.find(e => e.missionReceiptSha256 === integrity.given || e.missionId === missionId && e.planSha256 === text(packet.planSha256));
    if (duplicate) {
      return json({
        ok: true,
        schema: "OMEGA_DURABLE_MISSION_RECORD_R201",
        release: DURABLE_MISSION_LEDGER_R201,
        state: "IDEMPOTENT_EXISTING_RECORD",
        record: duplicate,
        ledger: ledgerSummary(ledger),
        canonicalMutation: false,
        hostStateMutation: false,
        promotionAuthorized: false,
      });
    }

    const base = {
      schema: "OMEGA_DURABLE_MISSION_ENTRY_R201",
      release: DURABLE_MISSION_LEDGER_R201,
      missionId,
      recordedAt: new Date().toISOString(),
      intent: text(packet.intent).slice(0, 6000),
      planSha256: /^[0-9a-f]{64}$/i.test(text(packet.planSha256)) ? text(packet.planSha256) : null,
      missionReceiptSha256: integrity.given as string,
      receiptIntegrityVerified: true,
      modes: {
        activeCount: finite(packet?.modes?.activeCount),
        priority: Array.isArray(packet?.modes?.priority) ? packet.modes.priority.map(String).slice(0, 32) : [],
      },
      execution: {
        requiredTasks: finite(packet?.execution?.requiredTasks),
        requiredReturned: finite(packet?.execution?.requiredReturned),
        requiredVerified: finite(packet?.execution?.requiredVerified),
        receiptIntegrityVerified: finite(packet?.execution?.receiptIntegrityVerified),
        specialistVerified: finite(packet?.execution?.specialistVerified),
        coherence: finite(packet?.execution?.coherence),
      },
      residuals: packet?.residuals && typeof packet.residuals === "object" ? packet.residuals : {},
      renderProjection: packet?.renderProjection && typeof packet.renderProjection === "object" ? packet.renderProjection : null,
      admission: packet?.admission && typeof packet.admission === "object" ? packet.admission : null,
      truthBoundaries: packet?.truthBoundaries && typeof packet.truthBoundaries === "object" ? packet.truthBoundaries : {},
      taskReceipts: Array.isArray(packet?.execution?.results) ? packet.execution.results.slice(0, 64).map(compactTaskReceipt) : [],
      prevEntrySha256: ledger.headSha256,
    };
    const entry: LedgerEntry = { ...base, entrySha256: await sha(base) };
    ledger.entries.push(entry);
    if (ledger.entries.length > LEDGER_LIMIT) {
      ledger.entries = ledger.entries.slice(-LEDGER_LIMIT);
      ledger.anchorSha256 = ledger.entries[0]?.prevEntrySha256 ?? ledger.anchorSha256;
    }
    ledger.headSha256 = entry.entrySha256;
    await this.saveMissionLedgerR201(ledger);
    await this.event("MISSION_CONTINUITY_RECORDED", `R201 recorded mission ${missionId} into the durable evidence chain.`, {
      missionId,
      missionReceiptSha256: entry.missionReceiptSha256,
      entrySha256: entry.entrySha256,
      admissionState: entry.admission?.state || null,
    });

    return json({
      ok: true,
      schema: "OMEGA_DURABLE_MISSION_RECORD_R201",
      release: DURABLE_MISSION_LEDGER_R201,
      state: "RECORDED",
      integrity,
      record: entry,
      ledger: ledgerSummary(ledger),
      authority: "DURABLE_EVIDENCE_HISTORY_NOT_HOSTSTATE_NOT_CANONSTATE",
      canonicalMutation: false,
      hostStateMutation: false,
      promotionAuthorized: false,
    }, 201);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "");

    if (path === "/mission-ledger" && request.method === "GET") {
      const ledger = await this.loadMissionLedgerR201();
      const limit = Math.max(1, Math.min(96, Number(url.searchParams.get("limit") || 24)));
      return json({
        ok: true,
        schema: DURABLE_MISSION_LEDGER_SCHEMA_R201,
        release: DURABLE_MISSION_LEDGER_R201,
        summary: ledgerSummary(ledger),
        entries: ledger.entries.slice(-limit),
        authority: "DURABLE_EVIDENCE_HISTORY_NOT_HOSTSTATE_NOT_CANONSTATE",
        canonicalMutation: false,
        hostStateMutation: false,
        promotionAuthorized: false,
      });
    }

    if (path === "/mission-ledger/public-history" && request.method === "GET") {
      const ledger = await this.loadMissionLedgerR201();
      const limit = Math.max(1, Math.min(96, Number(url.searchParams.get("limit") || 24)));
      return json({
        ok: true,
        schema: "OMEGA_DURABLE_MISSION_PUBLIC_HISTORY_R201",
        release: DURABLE_MISSION_LEDGER_R201,
        summary: ledgerSummary(ledger),
        entries: ledger.entries.slice(-limit).map(publicEntry),
        privacyBoundary: "Mission intent, specialist payloads, downstream evidence bodies, stored task errors, and secrets are omitted from the public history surface.",
        authority: "DURABLE_EVIDENCE_HISTORY_NOT_HOSTSTATE_NOT_CANONSTATE",
        canonicalMutation: false,
        hostStateMutation: false,
        promotionAuthorized: false,
      });
    }

    if (path === "/mission-ledger/summary" && request.method === "GET") {
      return json({ ok: true, ...ledgerSummary(await this.loadMissionLedgerR201()) });
    }

    if (path === "/mission-ledger/verify" && request.method === "GET") {
      const verification = await this.verifyMissionLedgerR201();
      return json(verification, verification.verified ? 200 : 409);
    }

    if (path.startsWith("/mission-ledger/mission/") && request.method === "GET") {
      const missionId = decodeURIComponent(path.slice("/mission-ledger/mission/".length));
      const ledger = await this.loadMissionLedgerR201();
      const record = ledger.entries.find(e => e.missionId === missionId) || null;
      return record ? json({ ok: true, record, ledger: ledgerSummary(ledger) }) : json({ ok: false, code: "R201_MISSION_NOT_FOUND", missionId }, 404);
    }

    if (path === "/mission-ledger/record" && request.method === "POST") {
      return this.recordMissionR201(await request.json().catch(() => ({})));
    }

    if ((path === "/status" || path === "/snapshot") && request.method === "GET") {
      const base = await super.fetch(request);
      const type = base.headers.get("content-type") || "";
      if (!type.includes("application/json")) return base;
      const raw = await base.json().catch(() => null) as AnyObj | null;
      if (!raw || typeof raw !== "object") return base;
      const ledger = await this.loadMissionLedgerR201();
      return json({ ...raw, missionContinuityR201: ledgerSummary(ledger) }, base.status);
    }

    return super.fetch(request);
  }
}
