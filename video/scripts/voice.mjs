/**
 * Renders the demo's narration (src/demo/voice.json) with Microsoft's neural TTS: one MP3 per line in public/vo/, and
 * src/demo/voice-durations.json with each line's length in seconds, which the demo timeline is built from.
 * Only the narration text is sent to the TTS service. Usage: node scripts/voice.mjs [lineId …]
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const FFPROBE = path.join(root, "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffprobe.exe");
const { voice, rate, lines } = JSON.parse(fs.readFileSync(path.join(root, "src/demo/voice.json"), "utf8"));
const outDir = path.join(root, "public", "vo");
const durFile = path.join(root, "src/demo/voice-durations.json");
fs.mkdirSync(outDir, { recursive: true });
const durations = fs.existsSync(durFile) ? JSON.parse(fs.readFileSync(durFile, "utf8")) : {};
const only = process.argv.slice(2);

for (const [id, text] of Object.entries(lines)) {
  if (only.length && !only.includes(id)) continue;
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
  const tmp = fs.mkdtempSync(path.join(outDir, `.${id}-`));
  const { audioFilePath } = await tts.toFile(tmp, text, { rate });
  const file = path.join(outDir, `${id}.mp3`);
  fs.renameSync(audioFilePath, file);
  fs.rmSync(tmp, { recursive: true, force: true });
  tts.close();
  durations[id] = Number(execFileSync(FFPROBE, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString().trim());
  console.log(`${id}: ${durations[id].toFixed(2)}s`);
}
fs.writeFileSync(durFile, JSON.stringify(durations, null, 2) + "\n");
process.exit(0);
