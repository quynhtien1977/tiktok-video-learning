# -*- coding: utf-8 -*-
"""Render trọn bộ: bản 16:9 của từng tập và các bản dọc cho TikTok.

    python -I -X utf8 scripts/render_all.py              # tất cả
    python -I -X utf8 scripts/render_all.py --vertical   # chỉ bản dọc
    python -I -X utf8 scripts/render_all.py --ep ep03    # một tập

Bản ngang ra `out/epNN.mp4`, bản dọc ra `out/tiktok/epNN-pK.mp4` (TIKTOK.md đăng theo
đúng thứ tự tên file đó). In thời gian từng bản để biết còn bao lâu.
"""
import argparse, json, subprocess, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def parts_of(ep_file):
    d = json.loads(ep_file.read_text(encoding="utf-8"))
    return sorted({(s.get("part") or 1) for s in d["scenes"]})

def render(comp, out):
    out.parent.mkdir(parents=True, exist_ok=True)
    t0 = time.time()
    p = subprocess.run(
        ["npx", "remotion", "render", "src/index.ts", comp, str(out),
         "--concurrency=4", "--log=error"],
        cwd=ROOT, shell=(sys.platform == "win32"),
    )
    dt = time.time() - t0
    mb = out.stat().st_size / 1e6 if out.exists() else 0
    status = "ok " if p.returncode == 0 and mb > 0 else "LOI"
    print(f"  [{status}] {comp:<14} {dt:6.1f}s  {mb:6.1f} MB  -> {out.relative_to(ROOT)}", flush=True)
    return p.returncode == 0 and mb > 0

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ep")
    ap.add_argument("--vertical", action="store_true", help="bỏ qua bản 16:9")
    ap.add_argument("--horizontal", action="store_true", help="bỏ qua bản dọc")
    a = ap.parse_args()

    eps = sorted((ROOT / "content").glob("ep[0-9][0-9].json"))
    eps = [e for e in eps if e.stem != "ep00" and (not a.ep or e.stem == a.ep)]

    jobs = []
    for e in eps:
        if not a.vertical:
            jobs.append((e.stem, ROOT / "out" / f"{e.stem}.mp4"))
        if not a.horizontal:
            for k in parts_of(e):
                jobs.append((f"{e.stem}-v-p{k}", ROOT / "out" / "tiktok" / f"{e.stem}-p{k}.mp4"))

    print(f"Render {len(jobs)} bản\n", flush=True)
    t0 = time.time()
    failed = [c for c, o in jobs if not render(c, o)]
    print(f"\nXong {len(jobs) - len(failed)}/{len(jobs)} trong {(time.time() - t0) / 60:.1f} phút", flush=True)
    if failed:
        print("LỖI: " + ", ".join(failed), flush=True)
        raise SystemExit(1)

if __name__ == "__main__":
    main()
