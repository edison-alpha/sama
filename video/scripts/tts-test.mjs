import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
const tts = new MsEdgeTTS();
await tts.setMetadata(process.argv[2], OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
const { audioFilePath } = await tts.toFile(process.argv[3], "Rebalancing alone is expensive. Sama finds the other side of your trade.");
console.log(audioFilePath);
process.exit(0);
