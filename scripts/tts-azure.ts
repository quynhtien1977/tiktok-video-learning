/**
 * Sinh voiceover bằng Azure AI Speech, mỗi scene 1 file mp3 + timing từng chữ.
 *
 *   node --env-file-if-exists=.env scripts/tts-azure.ts --ep ep01 [--force] [--only s03]
 *
 * Scene nào khai báo voice.provider = "capcut" sẽ được bỏ qua (xem scripts/capcut.ts).
 */
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { mkdirSync, writeFileSync, existsSync, renameSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { argOf, hasFlag, loadEpisode, voiceDir } from "./lib.ts";

const episodeId = argOf("ep", "ep01")!;
const only = argOf("only");
const force = hasFlag("force");

const KEY = process.env.AZURE_SPEECH_KEY;
const REGION = process.env.AZURE_SPEECH_REGION;
if (!KEY || !REGION) {
  console.error("Thiếu AZURE_SPEECH_KEY / AZURE_SPEECH_REGION (xem .env.example)");
  process.exit(1);
}

const escapeXml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

type Word = { text: string; startMs: number; endMs: number };

const synthScene = (
  text: string,
  voice: { name: string; rate: string; pitch: string; style?: string },
) =>
  new Promise<{ audio: Buffer; words: Word[] }>((resolve, reject) => {
    const speechConfig = sdk.SpeechConfig.fromSubscription(KEY!, REGION!);
    speechConfig.speechSynthesisOutputFormat =
      sdk.SpeechSynthesisOutputFormat.Audio24Khz96KBitRateMonoMp3;
    // Không truyền AudioConfig => SDK trả audio qua result.audioData, không phát ra loa
    const synthesizer = new sdk.SpeechSynthesizer(
      speechConfig,
      null as unknown as sdk.AudioConfig,
    );

    const words: Word[] = [];
    synthesizer.wordBoundary = (_s, e) => {
      if (e.boundaryType === sdk.SpeechSynthesisBoundaryType.Punctuation) return;
      const startMs = e.audioOffset / 10_000;
      const durationMs = Number(e.duration ?? 0) / 10_000;
      words.push({
        text: e.text,
        startMs: Math.round(startMs),
        endMs: Math.round(startMs + (durationMs || 220)),
      });
    };

    // prosody PHẢI nằm trong express-as: đo thực tế cho thấy đặt ngoài thì MAI-Voice
    // chỉ nghe một phần (7.49s -> 6.77s), đặt trong thì ăn đủ (-> 5.86s).
    const body = voice.rate
      ? `<prosody rate="${voice.rate}">${escapeXml(text)}</prosody>`
      : escapeXml(text);
    const inner = voice.style
      ? `<mstts:express-as style="${voice.style}">${body}</mstts:express-as>`
      : body;

    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="vi-VN">
  <voice name="${voice.name}">${inner}</voice>
</speak>`;

    synthesizer.speakSsmlAsync(
      ssml,
      (result) => {
        synthesizer.close();
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          resolve({ audio: Buffer.from(result.audioData), words });
        } else {
          reject(new Error(result.errorDetails || `Azure trả về reason=${result.reason}`));
        }
      },
      (err) => {
        synthesizer.close();
        reject(new Error(String(err)));
      },
    );
  });

const main = async () => {
  const episode = loadEpisode(episodeId);
  const outDir = voiceDir(episodeId);
  mkdirSync(outDir, { recursive: true });
  const noTiming: string[] = [];

  for (const scene of episode.scenes) {
    if (only && scene.id !== only) continue;

    // Thứ tự ưu tiên giọng: scene.voice > episode.voices[scene.speaker] > episode.voice
    const role = episode.voices?.[scene.speaker ?? "host"] ?? {};
    const resolved = { ...episode.voice, ...role, ...(scene.voice ?? {}) };
    const provider = resolved.provider;
    const mp3 = path.join(outDir, `${scene.id}.mp3`);

    if (provider === "capcut") {
      console.log(`· ${scene.id}: giọng CapCut — bỏ qua Azure`);
      continue;
    }
    if (existsSync(mp3) && !force) {
      console.log(`· ${scene.id}: đã có file, bỏ qua (dùng --force để ghi lại)`);
      continue;
    }

    const voice = {
      name: resolved.name ?? "vi-VN-NamMinhNeural",
      rate: resolved.rate ?? "+0%",
      pitch: resolved.pitch ?? "0%",
      style: resolved.style,
    };

    process.stdout.write(
      `· ${scene.id}: đang tổng hợp (${voice.name}${voice.style ? " · " + voice.style : ""})... `,
    );
    const { audio, words } = await synthScene(scene.narration, voice);
    writeFileSync(mp3, audio);

    // Cắt khoảng lặng thừa ở đầu/cuối: mỗi scene dư 0.3–0.5s là cả tập ì ra vài giây
    const trimmed = mp3.replace(/\.mp3$/, ".trim.mp3");
    try {
      execFileSync("ffmpeg", [
        "-y", "-hide_banner", "-loglevel", "error", "-i", mp3,
        "-af",
        "silenceremove=start_periods=1:start_silence=0.06:start_threshold=-45dB:" +
          "stop_periods=-1:stop_silence=0.18:stop_threshold=-45dB",
        "-c:a", "libmp3lame", "-b:a", "128k", trimmed,
      ]);
      renameSync(trimmed, mp3);
    } catch {
      // không cắt được thì giữ nguyên, không chặn pipeline
    }

    // Đổi nhịp đọc bằng ffmpeg nếu khai báo speed (không đổi cao độ), rồi co giãn timing
    const speed = Number(resolved.speed ?? 1);
    let finalWords = words;
    if (Math.abs(speed - 1) > 1e-3) {
      const tmp = mp3.replace(/\.mp3$/, ".tmp.mp3");
      execFileSync("ffmpeg", [
        "-y", "-hide_banner", "-loglevel", "error", "-i", mp3,
        "-filter:a", `atempo=${speed}`, "-c:a", "libmp3lame", "-b:a", "128k", tmp,
      ]);
      renameSync(tmp, mp3);
      const f = 1 / speed;
      finalWords = words.map((w) => ({
        text: w.text,
        startMs: Math.round(w.startMs * f),
        endMs: Math.round(w.endMs * f),
      }));
    }

    if (finalWords.length > 0) {
      writeFileSync(
        path.join(outDir, `${scene.id}.words.json`),
        JSON.stringify(finalWords, null, 2),
        "utf-8",
      );
    }
    console.log(
      `xong (${(audio.length / 1024).toFixed(0)} KB, ${finalWords.length} từ)` +
        (finalWords.length === 0 ? "  ← không có timing" : ""),
    );
    if (finalWords.length === 0) noTiming.push(scene.id);
  }

  if (noTiming.length) {
    console.log(
      `\nGiọng này không trả word boundary (${noTiming.join(", ")}) — dòng MAI-Voice là vậy.` +
        `\nLấy timing cho phụ đề bằng: python -I scripts/align_stt.py --ep ${episodeId}`,
    );
  }
  console.log("\nTiếp theo: npm run sync -- --ep " + episodeId);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
