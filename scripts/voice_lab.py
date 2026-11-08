#!/usr/bin/env python3
"""
Lay mau TAT CA giong CapCut cua mot ngon ngu + tao trang HTML de nghe so sanh.

    python -I scripts/voice_lab.py                    # tat ca giong vi-VN
    python -I scripts/voice_lab.py --lang en-US
    python -I scripts/voice_lab.py --text "cau khac"  # doi cau mau
    python -I scripts/voice_lab.py --only BV075_streaming,BV560_streaming

Ket qua: out/voice-lab/index.html  (mo bang trinh duyet, bam nghe tung giong)
"""
import argparse
import html
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("ttsc", str(ROOT / "scripts" / "tts_capcut.py"))
tts = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tts)

DEFAULT_TEXT = (
    "Chuẩn WSDL mô tả service interface, gồm ba phần: what, how và where. "
    "Thử kiểu viết tắt có dấu chấm: W.S.D.L. Các thuật ngữ khác: SOAP, REST, API, HTTP. "
    "Vậy REST khác SOAP ở điểm nào?"
)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lang", default="vi-VN")
    ap.add_argument("--text", default=DEFAULT_TEXT)
    ap.add_argument("--only", help="danh sach voice_type, phan cach bang dau phay")
    ap.add_argument("--rate", default="1.0")
    ap.add_argument("--out", default="out/voice-lab")
    args = ap.parse_args()

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    client = tts.CapCutClient()
    voices = client.list_voices(lang=args.lang)
    if args.only:
        keep = {v.strip() for v in args.only.split(",")}
        voices = [v for v in voices if v.voice_type in keep]

    out_dir = ROOT / args.out
    out_dir.mkdir(parents=True, exist_ok=True)

    rows = []
    for i, v in enumerate(voices, 1):
        name = "{:02d}-{}.mp3".format(i, v.voice_type)
        dest = out_dir / name
        if dest.exists():
            print("- {:40} da co, bo qua".format(v.voice_type))
            rows.append((v, name, None))
            continue
        try:
            audio = tts.synth(client, args.text, v.voice_type, v.resource_id, args.rate)
            r = client.session.get(audio["speech_url"], headers={"User-Agent": tts.UA}, timeout=120)
            r.raise_for_status()
            dest.write_bytes(r.content)
            ms = audio.get("duration")
            rows.append((v, name, ms))
            print("- {:40} {} {}ms".format(v.voice_type, v.display_name, ms))
        except Exception as exc:  # giong loi thi bo qua, van lam tiep
            rows.append((v, None, str(exc)[:80]))
            print("- {:40} LOI: {}".format(v.voice_type, str(exc)[:80]))

    cards = []
    for v, name, info in rows:
        if name:
            player = '<audio controls preload="none" src="{}"></audio>'.format(html.escape(name))
            meta = "{} ms".format(info) if isinstance(info, int) else "đã có sẵn"
        else:
            player = '<p class="err">{}</p>'.format(html.escape(str(info)))
            meta = "lỗi"
        cards.append(
            """<div class="card">
  <div class="name">{display}</div>
  <code>{vtype}</code>
  <div class="meta">{meta}</div>
  {player}
</div>""".format(
                display=html.escape(v.display_name),
                vtype=html.escape(v.voice_type),
                meta=meta,
                player=player,
            )
        )

    page = """<!doctype html>
<html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Nghe thử giọng CapCut — {lang}</title>
<style>
  :root {{ color-scheme: dark; }}
  body {{ margin:0; padding:32px; background:#0B1020; color:#F4F6FF;
         font-family:"Be Vietnam Pro",system-ui,Segoe UI,sans-serif; }}
  h1 {{ font-size:24px; margin:0 0 8px; }}
  p.sample {{ color:#9AA6D1; max-width:70ch; line-height:1.6; }}
  .grid {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:16px; margin-top:24px; }}
  .card {{ background:#121934; border:1px solid #243063; border-radius:14px; padding:16px; }}
  .name {{ font-weight:700; font-size:17px; }}
  code {{ color:#4CC9F0; font-size:12px; }}
  .meta {{ color:#6F7CAD; font-size:12px; margin:6px 0 10px; }}
  audio {{ width:100%; }}
  .err {{ color:#F72585; font-size:12px; }}
</style></head>
<body>
<h1>Nghe thử giọng CapCut — {lang} ({n} giọng)</h1>
<p class="sample">{text}</p>
<div class="grid">
{cards}
</div>
</body></html>"""

    (out_dir / "index.html").write_text(
        page.format(
            lang=html.escape(args.lang),
            n=len(rows),
            text=html.escape(args.text),
            cards="\n".join(cards),
        ),
        encoding="utf-8",
    )
    (out_dir / "voices.json").write_text(
        json.dumps(
            [{"voice_type": v.voice_type, "display_name": v.display_name, "file": n} for v, n, _ in rows],
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print("\nMo file: {}".format(out_dir / "index.html"))


if __name__ == "__main__":
    main()
