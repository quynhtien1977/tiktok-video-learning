#!/usr/bin/env python3
"""
Sinh voiceover bằng CapCut TTS (API không chính thức, qua vendor/capcut-tts-api).

    python -I scripts/tts_capcut.py --ep ep01 [--force] [--only s03] [--voice BV075_streaming]
    python -I scripts/tts_capcut.py --list-voices

Khác với SDK gốc:
  - Bật need_subtitle_timestamp => lấy luôn timing từng chữ cho phụ đề karaoke.
  - Tự poll trạng thái (SDK gốc chờ "success" nhưng API trả "succeed" nên luôn timeout).
  - Tải mp3 về public/voice/<ep>/<scene>.mp3 và ghi <scene>.words.json.
"""
import argparse
import json
import re
import sys
import subprocess
import time
import uuid
from pathlib import Path
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parent.parent
VENDOR = ROOT / "vendor" / "capcut-tts-api"
if not VENDOR.exists():
    sys.exit(
        f"Thieu {VENDOR}\n"
        "Chay: git clone https://github.com/quynhtien1977/capcut-tts-api.git vendor/capcut-tts-api"
    )
sys.path.insert(0, str(VENDOR))

from capcut_tts_api import CapCutClient  # noqa: E402
from capcut_tts_api.config import BASE_URL  # noqa: E402
from capcut_tts_api.signer import (  # noqa: E402
    escape_xml,
    compact_json,
    base_headers,
    common_query,
    make_sign_header,
    make_tts_payload_sign,
)

PUNCT = set("，。！？、；：,.!?;:…")
# CapCut chen token danh dau khoang nghi vao utterances -> khong phai chu, bo khoi phu de
PAUSE_TOKENS = {"pau", "sp", "sil", "br"}
UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/140.0 Safari/537.36"
)
WORD_RE = re.compile(r"[^\s。，！？,.!?;:()\[\]\"]+", re.UNICODE)


def atempo_filter(speed):
    """ffmpeg atempo chi nhan 0.5-2.0 moi lan -> ghep nhieu lan cho he so ngoai khoang."""
    parts = []
    s = float(speed)
    while s < 0.5:
        parts.append(0.5)
        s /= 0.5
    while s > 2.0:
        parts.append(2.0)
        s /= 2.0
    parts.append(round(s, 4))
    return ",".join("atempo={}".format(p) for p in parts)


def apply_speed(path: Path, speed: float, words):
    """Doi nhip doc bang ffmpeg (khong doi cao do) va co gian lai timing tuong ung."""
    if not speed or abs(float(speed) - 1.0) < 1e-3:
        return words
    tmp = path.with_suffix(".tmp.mp3")
    subprocess.run(
        ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(path),
         "-filter:a", atempo_filter(speed), "-c:a", "libmp3lame", "-b:a", "128k", str(tmp)],
        check=True,
    )
    tmp.replace(path)
    factor = 1.0 / float(speed)
    return [
        {"text": w["text"], "startMs": int(w["startMs"] * factor), "endMs": int(w["endMs"] * factor)}
        for w in words
    ]


def build_request(client, text, voice_type, resource_id, rate, emotion="", emotion_scale="0"):
    d = client.device.to_dict()
    babi = {
        "feature_entrance": "editor",
        "feature_entrance_detail": "editor-feature-text_to_speech",
        "feature_key": "text_to_speech",
        "scenario": "video_editor",
    }
    ssml = (
        '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">\n'
        '    <voice name="{v}" mock_tone_info="" platform="sami" resource_id="{r}" '
        'emotion="{e}" emotion_scale="{es}" style="" role="" moyin_emotion="" is_clone_tone="false" '
        'need_subtitle_timestamp="true">\n'
        '        <prosody rate="{rate}">{t}</prosody>\n'
        "    </voice>\n</speak>"
    ).format(
        v=voice_type, r=resource_id, rate=rate, t=escape_xml(text),
        e=emotion or "", es=emotion_scale or "0",
    )

    extra_info = compact_json({"benefit_info": {}})
    payload = {
        "audio_format": "mp3",
        "babi_param": compact_json(babi),
        "credit_disable": False,
        "extra_info": extra_info,
        "need_merge_voice": False,
        "need_subtitle_timestamp": True,
        "scene": "text_to_speech",
        "ssml": ssml,
    }
    payload["sign"] = make_tts_payload_sign(ssml, extra_info, d["device_id"], d["aid"])
    body = {
        "bind_id": str(uuid.uuid4()),
        "can_queue": True,
        "enter_from": "text_to_speech",
        "tasks": [
            {
                "context": str(uuid.uuid4()),
                "payload": compact_json(payload),
                "req_key": "sami_text_to_speech",
                "task_version": "v3",
            }
        ],
    }
    body_text = compact_json(body)
    url = BASE_URL + "/lv/v1/common_task/new?" + urlencode(
        common_query(d, babi, include_region=True)
    )
    headers = base_headers(d, body_text, appid=True)
    lower = {k.lower(): v for k, v in headers.items()}
    if "sign" not in lower:
        headers["sign"] = make_sign_header(url, d["appvr"], lower["device-time"], d["tdid"])
    return url, headers, body_text


def synth(client, text, voice_type, resource_id, rate, timeout=180, emotion="", emotion_scale="0"):
    url, headers, body_text = build_request(
        client, text, voice_type, resource_id, rate, emotion, emotion_scale
    )
    res = client.session.post(
        url, headers=headers, data=body_text.encode("utf-8"), timeout=60
    ).json()
    if str(res.get("ret")) != "0":
        raise RuntimeError("CapCut tu choi request: {} ({})".format(res.get("errmsg"), res.get("ret")))

    task = res["data"]["tasks"][0]
    deadline = time.time() + timeout
    while time.time() < deadline:
        q = client.query_tts_task(task["id"], task["token"])
        t = ((q.get("data") or {}).get("tasks") or [{}])[0]
        status = t.get("status")
        if status in ("succeed", "success"):
            audio = json.loads(t["payload"])["audio_subtitles"][0]
            if audio.get("code") not in (0, None):
                raise RuntimeError("TTS loi: {}".format(audio.get("msg")))
            return audio
        if status in ("failed", "fail"):
            raise RuntimeError("Task that bai: " + json.dumps(t, ensure_ascii=False)[:300])
        time.sleep(1.5)
    raise RuntimeError("Qua {}s chua xong".format(timeout))


def restore_case(utterances, narration):
    """CapCut tra chu thuong + dau cau kieu CJK -> khop lai voi loi thoai goc."""
    tokens = WORD_RE.findall(narration)
    out = []
    i = 0
    for u in utterances or []:
        w = (u.get("word") or "").strip()
        if not w or w.lower() in PAUSE_TOKENS or all(ch in PUNCT for ch in w):
            continue
        text = w
        if i < len(tokens) and tokens[i].lower() == w.lower():
            text = tokens[i]
            i += 1
        elif i + 1 < len(tokens) and tokens[i + 1].lower() == w.lower():
            text = tokens[i + 1]
            i += 2
        out.append(
            {
                "text": text,
                "startMs": int(u.get("start_time", 0)),
                "endMs": int(u.get("end_time", 0)),
            }
        )
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ep", default="ep01")
    ap.add_argument("--only")
    ap.add_argument("--voice", help="ghi de voice_type, vi du BV075_streaming")
    ap.add_argument("--rate", default="1.0", help="CapCut BO QUA rate - dung speed trong JSON")
    ap.add_argument("--emotion", help="ghi de emotion cho moi scene, vi du narrator")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--list-voices", action="store_true")
    args = ap.parse_args()

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    client = CapCutClient()

    if args.list_voices:
        for v in client.list_voices(lang="vi-VN"):
            print("{:45} {}".format(v.voice_type, v.display_name))
        return

    episode = json.loads((ROOT / "content" / (args.ep + ".json")).read_text(encoding="utf-8"))
    out_dir = ROOT / "public" / "voice" / args.ep
    out_dir.mkdir(parents=True, exist_ok=True)

    done = 0
    for scene in episode["scenes"]:
        if args.only and scene["id"] != args.only:
            continue
        # Thu tu uu tien giong: scene.voice > episode.voices[scene.speaker] > episode.voice
        role = (episode.get("voices") or {}).get(scene.get("speaker") or "host") or {}
        sv = dict(episode["voice"])
        sv.update({k: v for k, v in role.items() if v is not None})
        sv.update({k: v for k, v in (scene.get("voice") or {}).items() if v is not None})

        provider = sv.get("provider")
        if provider != "capcut":
            continue

        mp3 = out_dir / (scene["id"] + ".mp3")
        if mp3.exists() and not args.force:
            print("- {}: da co file, bo qua (--force de ghi lai)".format(scene["id"]))
            continue

        voice_in = args.voice or sv.get("name") or "BV075_streaming"
        rate = str(sv.get("rate") or args.rate)
        voice_type, resource_id = client.resolve_voice(voice=voice_in)

        emotion = args.emotion if args.emotion is not None else (sv.get("emotion") or "")
        emotion_scale = str(sv.get("emotionScale") or (4 if emotion else 0))
        speed = float(sv.get("speed") or 1.0)

        label = voice_type + (" · " + emotion if emotion else "")
        print("- {}: dang tong hop ({})... ".format(scene["id"], label), end="", flush=True)
        audio = synth(
            client, scene["narration"], voice_type, resource_id, rate,
            emotion=emotion, emotion_scale=emotion_scale,
        )

        r = client.session.get(audio["speech_url"], headers={"User-Agent": UA}, timeout=120)
        r.raise_for_status()
        mp3.write_bytes(r.content)

        words = restore_case(audio.get("utterances"), scene["narration"])
        words = apply_speed(mp3, speed, words)
        (out_dir / (scene["id"] + ".words.json")).write_text(
            json.dumps(words, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        print("xong ({} KB, {}ms, {} tu)".format(len(r.content) // 1024, audio.get("duration"), len(words)))
        done += 1

    if done == 0:
        print("Khong co scene nao dung provider=capcut trong content/{}.json".format(args.ep))
    print("\nTiep theo: npm run sync -- --ep " + args.ep)


if __name__ == "__main__":
    main()
