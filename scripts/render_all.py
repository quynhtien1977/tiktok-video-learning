# -*- coding: utf-8 -*-
"""Render trọn bộ: bản 16:9 của từng tập và các bản dọc cho TikTok.

    python -I -X utf8 scripts/render_all.py              # tất cả
    python -I -X utf8 scripts/render_all.py --vertical   # chỉ bản dọc
    python -I -X utf8 scripts/render_all.py --ep ep03    # một tập
    python -I -X utf8 scripts/render_all.py --resume     # chỉ render bản đã cũ

Bản ngang ra `out/epNN.mp4`, bản dọc ra `out/tiktok/epNN-pK.mp4` (TIKTOK.md đăng theo
đúng thứ tự tên file đó). In thời gian từng bản để biết còn bao lâu.

`--resume`: bỏ qua bản nào **mới hơn mọi đầu vào của nó** (script tập, giọng của tập đó,
mã nguồn, sprite nhân vật, bộ hiệu ứng âm thanh) và mở ra được bình thường. Cần vì một
lượt render đủ 24 bản mất cả tiếng: có lần tắt máy giữa chừng, chạy lại từ đầu là mất
thêm một tiếng cho 3 bản đã xong.

Remotion ghi ra file tạm rồi mới đổi tên, nên tắt máy giữa chừng thì file cũ vẫn còn
nguyên — `--resume` nhận ra nó là bản cũ nhờ so thời điểm, không phải nhờ file hỏng.
"""
import argparse, json, subprocess, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Đầu vào dùng chung cho mọi tập: đổi một trong số này thì phải render lại tất cả.
SHARED_INPUTS = ["src", "public/characters", "public/sfx", "public/images"]

def parts_of(ep_file):
    d = json.loads(ep_file.read_text(encoding="utf-8"))
    return sorted({(s.get("part") or 1) for s in d["scenes"]})

def newest(paths):
    """Thời điểm sửa gần nhất trong một loạt file/thư mục (đệ quy, bỏ qua .raw)."""
    t = 0.0
    for p in paths:
        p = ROOT / p
        if p.is_file():
            t = max(t, p.stat().st_mtime)
        elif p.is_dir():
            for f in p.rglob("*"):
                if f.is_file() and ".raw" not in f.parts:
                    t = max(t, f.stat().st_mtime)
    return t

def playable(out):
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "stream=codec_type", "-of", "json", str(out)],
        capture_output=True, text=True,
    )
    try:
        kinds = {s["codec_type"] for s in json.loads(r.stdout)["streams"]}
    except Exception:
        return False
    return {"audio", "video"} <= kinds

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
    ap.add_argument("--resume", action="store_true", help="bỏ qua bản đã mới hơn mọi đầu vào")
    a = ap.parse_args()

    eps = sorted((ROOT / "content").glob("ep[0-9][0-9].json"))
    eps = [e for e in eps if e.stem != "ep00" and (not a.ep or e.stem == a.ep)]

    shared = newest(SHARED_INPUTS) if a.resume else 0.0
    jobs, skipped = [], []
    for e in eps:
        inputs = max(shared, newest([f"content/{e.stem}.json", f"public/voice/{e.stem}"])) if a.resume else 0.0
        cand = []
        if not a.vertical:
            cand.append((e.stem, ROOT / "out" / f"{e.stem}.mp4"))
        if not a.horizontal:
            for k in parts_of(e):
                cand.append((f"{e.stem}-v-p{k}", ROOT / "out" / "tiktok" / f"{e.stem}-p{k}.mp4"))
        for comp, out in cand:
            if a.resume and out.exists() and out.stat().st_mtime > inputs and playable(out):
                skipped.append(comp)
            else:
                jobs.append((comp, out))

    if skipped:
        print(f"Bỏ qua {len(skipped)} bản đã mới: {', '.join(skipped)}", flush=True)
    print(f"Render {len(jobs)} bản\n", flush=True)
    t0 = time.time()
    failed = [c for c, o in jobs if not render(c, o)]
    print(f"\nXong {len(jobs) - len(failed)}/{len(jobs)} trong {(time.time() - t0) / 60:.1f} phút", flush=True)
    if failed:
        print("LỖI: " + ", ".join(failed), flush=True)
        raise SystemExit(1)

if __name__ == "__main__":
    main()
