import c0 from "./r194SnapshotChunk0";
import c1 from "./r194SnapshotChunk1";
import c2 from "./r194SnapshotChunk2";
import c3 from "./r194SnapshotChunk3";
import c4 from "./r194SnapshotChunk4";

export const DRIVE_CORPUS_SNAPSHOT_SHA256_R194 = "8b66519d36387f3a9ca3f9a10a7dd5da0b806c4fc7b29d9a4353e94e9859e655";

let cached: any | null = null;
let cachedText: string | null = null;
let cachedDigest: string | null = null;

async function sha256Text(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, "0")).join("");
}

async function inflateDriveCorpusR194(): Promise<string> {
  if (cachedText !== null) return cachedText;
  const encoded = [c0, c1, c2, c3, c4].join("");
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const stream = new Response(bytes).body;
  if (!stream) throw new Error("R194_DRIVE_CORPUS_STREAM_UNAVAILABLE");
  cachedText = await new Response(stream.pipeThrough(new DecompressionStream("gzip"))).text();
  cachedDigest = await sha256Text(cachedText);
  if (cachedDigest !== DRIVE_CORPUS_SNAPSHOT_SHA256_R194) {
    throw new Error(`R194_DRIVE_CORPUS_HASH_MISMATCH:${cachedDigest}`);
  }
  return cachedText;
}

export async function driveCorpusIntegrityR194() {
  await inflateDriveCorpusR194();
  return {
    ok: cachedDigest === DRIVE_CORPUS_SNAPSHOT_SHA256_R194,
    expectedSha256: DRIVE_CORPUS_SNAPSHOT_SHA256_R194,
    observedSha256: cachedDigest,
    compression: "gzip+base64-chunks",
    chunks: 5,
    driveEvidence: {
      primaryLedgerId: "1tvDDlPxHFTXMPN43-rE1kPKdmJW5uYj6",
      primaryLedgerTitle: "OMEGA_ONE_SYSTEM_FULL_SOFTWARE_MENU_LEDGER.xlsx",
      corroboratingLedgerId: "12w_vkhiXU1RUx5YU4C4M232fyvoqx_XN",
      corroboratingLedgerTitle: "OMEGA_ONE_SYSTEM_J_DRIVE_1728D_AUTOPING_LEDGER.xlsx",
    },
    canonicalMutation: false,
  };
}

export async function readDriveCorpusSnapshotR194(): Promise<any> {
  if (cached) return cached;
  cached = JSON.parse(await inflateDriveCorpusR194());
  return cached;
}
