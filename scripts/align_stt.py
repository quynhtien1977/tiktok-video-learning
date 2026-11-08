#!/usr/bin/env python3
"""
Sinh timing tung chu cho file audio BANG CAPCUT STT.

    python -I scripts/align_stt.py --ep ep01            # moi scene chua co words.json
    python -I scripts/align_stt.py --ep ep01 --force
    python -I scripts/align_stt.py --file out/test.mp3  # mot file le

Dung khi nao: giong Azure dong MAI-Voice (vi-VN-Grant / vi-VN-Harper) cho chat luong tot
nhung KHONG tra word boundary -> khong co phu de karaoke. Script nay upload audio len
CapCut, chay nhan dang phu de, roi ghi ra <scene>.words.json nhu TTS CapCut van lam.
"""
import argparse
import importlib.util
import json
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("ttsc", str(ROOT / "scripts" / "tts_capcut.py"))
tts = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tts)


def transcribe(client, path: Path, language="vi-VN", timeout=240):
    up = client.upload_audio(str(path))
    res = client.create_stt_task(
        audio_vid=up.vid,
        audio_md5=up.md5,
        duration_ms=up.duration_ms or 10000,
        language=language,
    )
    task = res["data"]["tasks"][0]
    deadline = time.time() + timeout
    while time.time() < deadline:
        q = client.query_stt_task(task["id"], task["token"])
        tk = ((q.get("data") or {}).get("tasks") or [{}])[0]
        status = tk.get("status")
        if status in ("succeed", "success"):
            return json.loads(tk["payload"])
        if status in ("failed", "fail"):
            raise RuntimeError("STT that bai: " + json.dumps(tk, ensure_ascii=False)[:200])
        time.sleep(2)
    raise RuntimeError("STT qua {}s chua xong".format(timeout))


def _norm(s):
    return re.sub(r"[^\w]", "", s, flags=re.UNICODE).lower()


def align(tokens, stt):
    """
    Needleman-Wunsch giua chu TRONG SCRIPT va chu STT nghe duoc.
    Phu de luon hien dung chu da viet trong narration; STT chi dung de lay thoi gian.
    (STT hay doc "thứ hai" thanh "Thứ 2", bo dau cau... nen khong dung text cua no.)
    """
    n, m = len(tokens), len(stt)
    MATCH, MISS, GAP = 2, -1, -1
    score = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        score[i][0] = i * GAP
    for j in range(1, m + 1):
        score[0][j] = j * GAP
    for i in range(1, n + 1):
        ti = _norm(tokens[i - 1])
        for j in range(1, m + 1):
            same = ti and ti == _norm(stt[j - 1]["text"])
            score[i][j] = max(
                score[i - 1][j - 1] + (MATCH if same else MISS),
                score[i - 1][j] + GAP,
                score[i][j - 1] + GAP,
            )

    pairs = [None] * n  # pairs[i] = chi so word STT khop voi token i
    i, j = n, m
    while i > 0 and j > 0:
        same = _norm(tokens[i - 1]) and _norm(tokens[i - 1]) == _norm(stt[j - 1]["text"])
        if score[i][j] == score[i - 1][j - 1] + (MATCH if same else MISS):
            if same:
                pairs[i - 1] = j - 1
            i -= 1
            j -= 1
        elif score[i][j] == score[i - 1][j] + GAP:
            i -= 1
        else:
            j -= 1

    # Token khong khop duoc -> noi suy thoi gian giua hai moc khop gan nhat
    out = []
    for idx, tok in enumerate(tokens):
        k = pairs[idx]
        if k is not None:
            out.append({"text": tok, "startMs": stt[k]["startMs"], "endMs": stt[k]["endMs"]})
            continue
        prev = next((out[t]["endMs"] for t in range(len(out) - 1, -1, -1)), 0)
        nxt = None
        for later in range(idx + 1, n):
            if pairs[later] is not None:
                nxt = stt[pairs[later]]["startMs"]
                break
        if nxt is None:
            nxt = stt[-1]["endMs"] if stt else prev + 300
        gap_tokens = 1
        for later in range(idx + 1, n):
            if pairs[later] is not None:
                break
            gap_tokens += 1
        step = max(60, (nxt - prev) // max(gap_tokens, 1))
        out.append({"text": tok, "startMs": prev, "endMs": min(prev + step, nxt)})
    return out


def words_from_payload(payload, narration=None):
    """Gop word tu moi utterance; neu co narration thi can chu goc vao timing STT."""
    raw = []
    for utt in payload.get("utterances") or []:
        for w in utt.get("words") or []:
            text = (w.get("text") or "").strip()
            if not text:
                continue
            raw.append(
                {
                    "text": text,
                    "startMs": int(w.get("start_time", 0)),
                    "endMs": int(w.get("end_time", 0)),
                }
            )
    if not narration or not raw:
        return raw

    # Tag cam xuc cua Gemini (<laugh>, <sigh>, <short pause>) la chi dan cho engine,
    # khong phai chu de hien len man hinh -> loai khoi phu de.
    clean = re.sub(r"<[^>]{1,24}>", " ", narration)
    tokens = [t for t in re.split(r"\s+", clean.strip()) if t]
    return align(tokens, raw)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ep")
    ap.add_argument("--file")
    ap.add_argument("--only")
    ap.add_argument("--lang", default="vi-VN")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    client = tts.CapCutClient()

    if args.file:
        path = (ROOT / args.file) if not Path(args.file).is_absolute() else Path(args.file)
        payload = transcribe(client, path, args.lang)
        words = words_from_payload(payload)
        out = path.with_suffix(".words.json")
        out.write_text(json.dumps(words, ensure_ascii=False, indent=2), encoding="utf-8")
        print("{} tu -> {}".format(len(words), out))
        return

    if not args.ep:
        sys.exit("Can --ep hoac --file")

    episode = json.loads((ROOT / "content" / (args.ep + ".json")).read_text(encoding="utf-8"))
    voice_dir = ROOT / "public" / "voice" / args.ep

    for scene in episode["scenes"]:
        if args.only and scene["id"] != args.only:
            continue
        mp3 = voice_dir / (scene["id"] + ".mp3")
        words_file = voice_dir / (scene["id"] + ".words.json")
        if not mp3.exists():
            print("- {}: chua co audio, bo qua".format(scene["id"]))
            continue
        if words_file.exists() and not args.force:
            print("- {}: da co timing, bo qua (--force de lam lai)".format(scene["id"]))
            continue

        print("- {}: dang nhan dang... ".format(scene["id"]), end="", flush=True)
        payload = transcribe(client, mp3, args.lang)
        words = words_from_payload(payload, scene["narration"])
        words_file.write_text(json.dumps(words, ensure_ascii=False, indent=2), encoding="utf-8")
        print("{} tu".format(len(words)))

    print("\nTiep theo: npm run sync -- --ep " + args.ep)


if __name__ == "__main__":
    main()
