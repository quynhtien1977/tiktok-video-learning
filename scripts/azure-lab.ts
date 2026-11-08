/**
 * Thử các giọng Azure (gồm dòng MAI-Voice mới) + style, xuất trang HTML để nghe so sánh.
 *
 *   node --env-file-if-exists=.env scripts/azure-lab.ts
 *   node --env-file-if-exists=.env scripts/azure-lab.ts --region southeastasia
 *
 * Ngoài âm thanh, script còn báo số word boundary nhận được — nếu bằng 0 thì
 * giọng đó không cho timing từng chữ và phụ đề karaoke sẽ không chạy.
 */
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { argOf, root } from "./lib.ts";

const KEY = process.env.AZURE_SPEECH_KEY;
const REGION = argOf("region", process.env.AZURE_SPEECH_REGION)!;
if (!KEY || !REGION) {
  console.error("Thiếu AZURE_SPEECH_KEY / AZURE_SPEECH_REGION");
  process.exit(1);
}

const TEXT =
  "Service-oriented architecture là cách xây hệ phân tán mà thành phần là các service độc lập. " +
  "Chuẩn WSDL mô tả interface, còn SOAP lo việc trao đổi message.";

type Case = { label: string; voice: string; style?: string; rate?: string };

const CASES: Case[] = [
  { label: "MAI Grant · educational", voice: "vi-VN-Grant:MAI-Voice-2.1", style: "educational" },
  { label: "MAI Grant · narrator", voice: "vi-VN-Grant:MAI-Voice-2.1", style: "narrator" },
  { label: "MAI Grant · neutral", voice: "vi-VN-Grant:MAI-Voice-2.1", style: "neutral" },
  { label: "MAI Grant Flash · educational", voice: "vi-VN-Grant:MAI-Voice-2.1-Flash", style: "educational" },
  { label: "MAI Harper · neutral (nữ)", voice: "vi-VN-Harper:MAI-Voice-2.1", style: "neutral" },
  { label: "MAI Harper · audiobook (nữ)", voice: "vi-VN-Harper:MAI-Voice-2.1", style: "audiobook" },
  { label: "NamMinh (neural cũ)", voice: "vi-VN-NamMinhNeural" },
  { label: "NamMinh · chậm 0.9", voice: "vi-VN-NamMinhNeural", rate: "-8%" },
  { label: "HoaiMy (neural cũ, nữ)", voice: "vi-VN-HoaiMyNeural" },
];

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const synth = (c: Case) =>
  new Promise<{ audio: Buffer; words: number }>((resolve, reject) => {
    const cfg = sdk.SpeechConfig.fromSubscription(KEY!, REGION);
    cfg.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio24Khz96KBitRateMonoMp3;
    const synthesizer = new sdk.SpeechSynthesizer(cfg, null as unknown as sdk.AudioConfig);

    let words = 0;
    synthesizer.wordBoundary = () => {
      words += 1;
    };

    const body = c.style
      ? `<mstts:express-as style="${c.style}">${escapeXml(TEXT)}</mstts:express-as>`
      : escapeXml(TEXT);
    const inner = c.rate ? `<prosody rate="${c.rate}">${body}</prosody>` : body;
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="vi-VN"><voice name="${c.voice}">${inner}</voice></speak>`;

    synthesizer.speakSsmlAsync(
      ssml,
      (result) => {
        synthesizer.close();
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          resolve({ audio: Buffer.from(result.audioData), words });
        } else {
          reject(new Error(result.errorDetails || `reason=${result.reason}`));
        }
      },
      (err) => {
        synthesizer.close();
        reject(new Error(String(err)));
      },
    );
  });

const main = async () => {
  const outDir = path.join(root, "out", "azure-lab");
  mkdirSync(outDir, { recursive: true });
  console.log(`Region: ${REGION}\n`);

  const cards: string[] = [];
  for (const c of CASES) {
    const file = `${c.voice.replace(/[:.]/g, "_")}${c.style ? "-" + c.style : ""}${c.rate ? "-rate" : ""}.mp3`;
    try {
      const { audio, words } = await synth(c);
      writeFileSync(path.join(outDir, file), audio);
      console.log(`OK   ${c.label.padEnd(32)} ${(audio.length / 1024).toFixed(0)} KB, ${words} word boundary`);
      cards.push(
        `<div class="card"><h2>${c.label}</h2><code>${c.voice}${c.style ? " · " + c.style : ""}</code>` +
          `<div class="meta">${words} word boundary${words === 0 ? " — KHÔNG có timing cho phụ đề" : ""}</div>` +
          `<audio controls preload="none" src="${file}"></audio></div>`,
      );
    } catch (e) {
      const msg = String(e).slice(0, 160);
      console.log(`FAIL ${c.label.padEnd(32)} ${msg}`);
      cards.push(
        `<div class="card"><h2>${c.label}</h2><code>${c.voice}</code><p class="err">${msg}</p></div>`,
      );
    }
  }

  writeFileSync(
    path.join(outDir, "index.html"),
    `<!doctype html><html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Azure voices — ${REGION}</title><style>
:root{color-scheme:dark}body{margin:0;padding:32px;background:#0B1020;color:#F4F6FF;font-family:system-ui,Segoe UI,sans-serif}
h1{font-size:24px;margin:0 0 6px}p{color:#9AA6D1;max-width:72ch;line-height:1.6}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:16px;margin-top:24px}
.card{background:#121934;border:1px solid #243063;border-radius:14px;padding:16px}
h2{font-size:17px;margin:0 0 4px}code{color:#4CC9F0;font-size:12px}
.meta{color:#6F7CAD;font-size:12px;margin:8px 0}audio{width:100%}.err{color:#F72585;font-size:12px}
</style></head><body><h1>Azure Speech — region ${REGION}</h1>
<p>${TEXT}</p><div class="grid">${cards.join("")}</div></body></html>`,
    "utf-8",
  );
  console.log(`\nMở: ${path.join(outDir, "index.html")}`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
