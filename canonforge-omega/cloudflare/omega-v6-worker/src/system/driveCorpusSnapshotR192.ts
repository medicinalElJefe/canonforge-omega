import c0 from "./r192SnapshotChunk0";
import c1 from "./r192SnapshotChunk1";
import c2 from "./r192SnapshotChunk2";
import c3 from "./r192SnapshotChunk3";
import c4 from "./r192SnapshotChunk4";

export const DRIVE_CORPUS_SNAPSHOT_SHA256_R192 = "d80267761320c3bf3d219b38b6293fc52a02e09182fa0825853c7202131f2746";

let cached: any | null = null;

export async function readDriveCorpusSnapshotR192(): Promise<any> {
  if (cached) return cached;
  const encoded = [c0, c1, c2, c3, c4].join("");
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const stream = new Response(bytes).body;
  if (!stream) throw new Error("R192_DRIVE_CORPUS_STREAM_UNAVAILABLE");
  const decompressed = stream.pipeThrough(new DecompressionStream("gzip"));
  const text = await new Response(decompressed).text();
  cached = JSON.parse(text);
  return cached;
}
