import c0 from "./r195SnapshotChunk0";
import c1 from "./r195SnapshotChunk1";
import c2 from "./r195SnapshotChunk2";
import c3 from "./r195SnapshotChunk3";
import c4 from "./r195SnapshotChunk4";

export const DRIVE_CORPUS_SNAPSHOT_SHA256_R195 = "8b66519d36387f3a9ca3f9a10a7dd5da0b806c4fc7b29d9a4353e94e9859e655";

export const DRIVE_CORPUS_EVIDENCE_R195 = {
  primaryLedgerId: "1tvDDlPxHFTXMPN43-rE1kPKdmJW5uYj6",
  primaryLedgerTitle: "OMEGA_ONE_SYSTEM_FULL_SOFTWARE_MENU_LEDGER.xlsx",
  corroboratingLedgerId: "12w_vkhiXU1RUx5YU4C4M232fyvoqx_XN",
  corroboratingLedgerTitle: "OMEGA_ONE_SYSTEM_J_DRIVE_1728D_AUTOPING_LEDGER.xlsx",
} as const;

let cached: any | null = null;
let cachedText: string | null = null;
let cachedDigest: string | null = null;

async function sha256Text(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, "0")).join("");
}

async function inflateDriveCorpusR195(): Promise<string> {
  if (cachedText !== null) return cachedText;
  const encoded = [c0, c1, c2, c3, c4].join("");
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const stream = new Response(bytes).body;
  if (!stream) throw new Error("R195_DRIVE_CORPUS_STREAM_UNAVAILABLE");
  cachedText = await new Response(stream.pipeThrough(new DecompressionStream("gzip"))).text();
  cachedDigest = await sha256Text(cachedText);
  if (cachedDigest !== DRIVE_CORPUS_SNAPSHOT_SHA256_R195) {
    throw new Error(`R195_DRIVE_CORPUS_HASH_MISMATCH:${cachedDigest}`);
  }
  return cachedText;
}

export async function driveCorpusIntegrityR195() {
  await inflateDriveCorpusR195();
  return {
    ok: cachedDigest === DRIVE_CORPUS_SNAPSHOT_SHA256_R195,
    expectedSha256: DRIVE_CORPUS_SNAPSHOT_SHA256_R195,
    observedSha256: cachedDigest,
    compression: "gzip+base64-chunks",
    chunks: 5,
    driveEvidence: DRIVE_CORPUS_EVIDENCE_R195,
    canonicalMutation: false,
  };
}

export async function readDriveCorpusSnapshotR195(): Promise<any> {
  if (cached) return cached;
  cached = JSON.parse(await inflateDriveCorpusR195());
  return cached;
}
