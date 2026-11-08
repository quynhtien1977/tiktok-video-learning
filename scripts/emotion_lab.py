#!/usr/bin/env python3
"""
Thu cac gia tri emotion cua CapCut TTS tren mot vai giong, xuat trang HTML de nghe so sanh.

    python -I scripts/emotion_lab.py
    python -I scripts/emotion_lab.py --voices BV075_streaming,BV562_streaming --scale 4

Ket qua: out/emotion-lab/index.html

Luu y: CapCut KHONG ho tro SSML prosody (rate/pitch/volume bi bo qua hoan toan,
da do bang md5). Chi co thuoc tinh emotion + emotion_scale la thuc su doi am thanh.
"""
import argparse
import hashlib
import html
import importlib.util
import json
import sys
import time
import uuid
from pathlib import Path
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("ttsc", str(ROOT / "scripts" / "tts_capcut.py"))
tts = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tts)

from capcut_tts_api.config import BASE_URL  # noqa: E402
from capcut_tts_api.signer import (  # noqa: E402
    escape_xml,
    compact_json,
    base_headers,
    common_query,
    make_sign_header,
    make_tts_payload_sign,
)

DEFAULT_TEXT = (
    "Service-oriented architecture là cách xây hệ phân tán mà thành phần là các service độc lập. "
    "Vậy nó khác gì so với component?"
)
DEFAULT_EMOTIONS = [
    "",
    "neutral",
    "narrator",
    "narration",
    "storytelling",
    "customer_service",
    "happy",
    "excited",
    "calm",
    "serious",
    "radio",
    "advertising",
]


def synth_emotion(client, text, voice_type, resource_id, emotion, scale, timeout=180):
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
        'emotion="{e}" emotion_scale="{s}" style="" role="" moyin_emotion="" is_clone_tone="false" '
        'need_subtitle_timestamp="false">\n'
        "        <prosody>{t}</prosody>\n    </voice>\n</speak>"
    ).format(v=voice_type, r=resource_id, e=emotion, s=scale, t=escape_xml(text))

    extra = compact_json({"benefit_info": {}})
    payload = {
        "audio_format": "mp3",
        "babi_param": compact_json(babi),
        "credit_disable": False,
        "extra_info": extra,
        "need_merge_voice": False,
        "need_subtitle_timestamp": False,
        "scene": "text_to_speech",
        "ssml": ssml,
    }
    payload["sign"] = make_tts_payload_sign(ssml, extra, d["device_id"], d["aid"])
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
    bt = compact_json(body)
    url = BASE_URL + "/lv/v1/common_task/new?" + urlencode(common_query(d, babi, include_region=True))
    h = base_headers(d, bt, appid=True)
    lh = {k.lower(): v for k, v in h.items()}
    if "sign" not in lh:
        h["sign"] = make_sign_header(url, d["appvr"], lh["device-time"], d["tdid"])

    res = client.session.post(url, headers=h, data=bt.encode("utf-8"), timeout=60).json()
    if str(res.get("ret")) != "0":
        raise RuntimeError(res.get("errmsg"))
    t = res["data"]["tasks"][0]
    deadline = time.time() + timeout
    while time.time() < deadline:
        q = client.query_tts_task(t["id"], t["token"])
        tk = ((q.get("data") or {}).get("tasks") or [{}])[0]
        if tk.get("status") in ("succeed", "success"):
            return json.loads(tk["payload"])["audio_subtitles"][0]
        if tk.get("status") in ("failed", "fail"):
            raise RuntimeError(tk.get("err_msg") or "failed")
        time.sleep(1.5)
    raise RuntimeError("timeout")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voices", default="BV075_streaming,multi_male_felipe_uranus_bigtts,BV562_streaming")
    ap.add_argument("--emotions", default=",".join(DEFAULT_EMOTIONS))
    ap.add_argument("--scale", default="4")
    ap.add_argument("--text", default=DEFAULT_TEXT)
    ap.add_argument("--out", default="out/emotion-lab")
    args = ap.parse_args()

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    client = tts.CapCutClient()
    catalog = {v.voice_type: v.display_name for v in client.list_voices(lang="vi-VN")}
    out_dir = ROOT / args.out
    out_dir.mkdir(parents=True, exist_ok=True)

    cards = []
    for vt in [v.strip() for v in args.voices.split(",") if v.strip()]:
        voice_type, rid = client.resolve_voice(voice=vt)
        items = []
        base_md5 = None
        for emo in args.emotions.split(","):
            label = emo or "(trống)"
            fname = "{}--{}.mp3".format(vt, emo or "none")
            try:
                a = synth_emotion(client, args.text, voice_type, rid, emo, args.scale)
                r = client.session.get(a["speech_url"], headers={"User-Agent": tts.UA}, timeout=120)
                r.raise_for_status()
                (out_dir / fname).write_bytes(r.content)
                md5 = hashlib.md5(r.content).hexdigest()[:8]
                if base_md5 is None:
                    base_md5 = md5
                same = " · giống bản gốc" if md5 == base_md5 and emo else ""
                items.append(
                    '<div class="v"><b>{}{}</b><audio controls preload="none" src="{}"></audio></div>'.format(
                        html.escape(label), same, html.escape(fname)
                    )
                )
                print("{:38} {:18} {:>6}ms md5={}{}".format(vt, label, a.get("duration"), md5, same))
            except Exception as exc:
                items.append(
                    '<div class="v"><b>{}</b><span class="err">{}</span></div>'.format(
                        html.escape(label), html.escape(str(exc)[:70])
                    )
                )
                print("{:38} {:18} LOI {}".format(vt, label, str(exc)[:70]))
        cards.append(
            '<div class="card"><h2>{}</h2><code>{}</code>{}</div>'.format(
                html.escape(catalog.get(vt, vt)), html.escape(vt), "".join(items)
            )
        )

    (out_dir / "index.html").write_text(
        """<!doctype html><html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Emotion CapCut</title><style>
:root{{color-scheme:dark}}body{{margin:0;padding:32px;background:#0B1020;color:#F4F6FF;font-family:system-ui,Segoe UI,sans-serif}}
h1{{font-size:24px;margin:0 0 6px}}p{{color:#9AA6D1;max-width:70ch;line-height:1.6}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:16px;margin-top:24px}}
.card{{background:#121934;border:1px solid #243063;border-radius:14px;padding:16px}}
h2{{font-size:18px;margin:0}}code{{color:#4CC9F0;font-size:12px}}
.v{{margin-top:12px}}.v b{{display:block;font-size:13px;color:#9AA6D1;margin-bottom:4px}}
audio{{width:100%}}.err{{color:#F72585;font-size:12px}}
</style></head><body>
<h1>CapCut — thử emotion (scale {scale})</h1>
<p>{text}</p>
<p>Nhãn "giống bản gốc" nghĩa là server bỏ qua giá trị emotion đó (file byte-identical).</p>
<div class="grid">{cards}</div></body></html>""".format(
            scale=html.escape(args.scale), text=html.escape(args.text), cards="".join(cards)
        ),
        encoding="utf-8",
    )
    print("\nMo file:", out_dir / "index.html")


if __name__ == "__main__":
    main()
