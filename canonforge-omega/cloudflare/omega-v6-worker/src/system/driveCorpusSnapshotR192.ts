import c0 from "./r192SnapshotChunk0";
import c1 from "./r192SnapshotChunk1";
import c2 from "./r192SnapshotChunk2";
import c3 from "./r192SnapshotChunk3";
import c4 from "./r192SnapshotChunk4";

export const DRIVE_CORPUS_SNAPSHOT_SHA256_R192 = "d80267761320c3bf3d219b38b6293fc52a02e09182fa0825853c7202131f2746";

let cached: any | null = null;
let cachedText: string | null = null;
let cachedDigest: string | null = null;

async function sha256Text(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, "0")).join("");
}

async function inflateDriveCorpusR192(): Promise<string> {
  if (cachedText !== null) return cachedText;
  const encoded = [c0, c1, c2, c3, c4].join("");
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const stream = new Response(bytes).body;
  if (!stream) throw new Error("R192_DRIVE_CORPUS_STREAM_UNAVAILABLE");
  cachedText = await new Response(stream.pipeThrough(new DecompressionStream("gzip"))).text();
  cachedDigest = await sha256Text(cachedText);
  if (cachedDigest !== DRIVE_CORPUS_SNAPSHOT_SHA256_R192) {
    throw new Error(`R192_DRIVE_CORPUS_HASH_MISMATCH:${cachedDigest}`);
  }
  return cachedText;
}

export async function driveCorpusIntegrityR192() {
  await inflateDriveCorpusR192();
  return {
    ok: cachedDigest === DRIVE_CORPUS_SNAPSHOT_SHA256_R192,
    expectedSha256: DRIVE_CORPUS_SNAPSHOT_SHA256_R192,
    observedSha256: cachedDigest,
    compression: "gzip+base64-chunks",
    chunks: 5,
    canonicalMutation: false,
  };
}

export async function readDriveCorpusSnapshotR192(): Promise<any> {
  if (cached) return cached;
  const text = await inflateDriveCorpusR192();
  cached = JSON.parse(text);
  return cached;
}
