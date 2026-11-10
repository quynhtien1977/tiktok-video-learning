# -*- coding: utf-8 -*-
"""Căn lại khung cho sprite nhân vật, để đổi tư thế thì nhân vật không nhảy chỗ.

Máy sinh ảnh không giữ được khung giữa các tư thế: đo bộ đầu tiên thấy đỉnh đầu dao động
55–64px và chiều cao người dao động hơn 10% khung. Trong video thì đó là nhân vật vừa
nhảy lên nhảy xuống vừa to nhỏ mỗi lần đổi tư thế — nhìn ra ngay.

Script đưa mọi sprite về cùng một khung: đỉnh đầu ở TOP_PX, người cao HEIGHT_RATIO so với
khung, và **tâm đầu** (không phải tâm hộp bao) nằm giữa. Lấy tâm đầu vì tay chỉ hoặc tay
vẫy kéo hộp bao lệch sang một bên, căn theo hộp bao sẽ làm mặt lệch khỏi tâm.

    python -I -X utf8 scripts/normalize_sprites.py                    # cả hai nhân vật
    python -I -X utf8 scripts/normalize_sprites.py public/characters/muc
    python -I -X utf8 scripts/normalize_sprites.py --check            # chỉ đo, không sửa

Bản gốc được chép sang `public/characters/.raw/` ở lần chạy đầu, và các lần sau luôn căn
lại **từ bản gốc** — nên chạy bao nhiêu lần cũng không chồng méo.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
CHARS = ROOT / "public" / "characters"
RAW = CHARS / ".raw"

N = 1024           # khung vuông
TOP_PX = 100       # đỉnh đầu cách mép trên
HEIGHT_RATIO = 0.82  # chiều cao người so với khung
HEAD_BAND = 220    # dải tính tâm đầu, tính từ đỉnh đầu xuống
ALPHA_MIN = 128


def measure(arr):
    """(đỉnh đầu, đáy, tâm đầu theo chiều ngang) — None nếu ảnh rỗng."""
    m = arr[:, :, 3] > ALPHA_MIN
    rows = np.nonzero(m.any(axis=1))[0]
    if rows.size == 0:
        return None
    top, bot = int(rows.min()), int(rows.max())
    band = m[top : top + HEAD_BAND, :]
    cols = np.nonzero(band.any(axis=0))[0]
    if cols.size == 0:
        return None
    return top, bot, (int(cols.min()) + int(cols.max())) / 2


def normalize(src: Path, dst: Path) -> bool:
    im = Image.open(src).convert("RGBA")
    if im.size != (N, N):
        im = im.resize((N, N), Image.LANCZOS)
    got = measure(np.array(im))
    if got is None:
        return False
    top, bot, head_cx = got

    scale = (HEIGHT_RATIO * N) / max(bot - top, 1)
    w = max(1, round(N * scale))
    scaled = im.resize((w, w), Image.LANCZOS)

    # Sau khi phóng, đỉnh đầu nằm ở top*scale và tâm đầu ở head_cx*scale.
    # Dời sao cho đỉnh đầu về TOP_PX và tâm đầu về giữa khung.
    off_y = round(TOP_PX - top * scale)
    off_x = round(N / 2 - head_cx * scale)

    out = Image.new("RGBA", (N, N), (0, 0, 0, 0))
    out.paste(scaled, (off_x, off_y), scaled)
    dst.parent.mkdir(parents=True, exist_ok=True)
    out.save(dst)
    return True


def report(root: Path, label: str):
    tops, heights, cxs = [], [], []
    for f in sorted(root.rglob("*.png")):
        got = measure(np.array(Image.open(f).convert("RGBA")))
        if got is None:
            continue
        top, bot, cx = got
        tops.append(top)
        heights.append(bot - top)
        cxs.append(cx)
    if not tops:
        print(f"  {label}: không có sprite nào")
        return
    tops, heights, cxs = np.array(tops), np.array(heights), np.array(cxs)
    print(
        f"  {label:<8} đỉnh đầu {tops.min():4d}→{tops.max():4d} (lệch {tops.max()-tops.min():3d}px)"
        f" | cao {100*heights.min()/N:4.1f}%→{100*heights.max()/N:4.1f}%"
        f" | tâm đầu lệch chuẩn {cxs.std():5.1f}px"
    )


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    check_only = "--check" in sys.argv
    roots = [Path(a) for a in args] or [CHARS / "muc", CHARS / "son"]

    for root in roots:
        root = root if root.is_absolute() else ROOT / root
        if not root.exists():
            print(f"bỏ qua {root} — không tồn tại")
            continue
        name = root.name
        print(f"\n{name}")
        report(root, "trước")
        if check_only:
            continue

        done = skipped = 0
        for f in sorted(root.rglob("*.png")):
            rel = f.relative_to(CHARS)
            raw = RAW / rel
            if not raw.exists():                 # lần đầu: giữ bản gốc lại
                raw.parent.mkdir(parents=True, exist_ok=True)
                raw.write_bytes(f.read_bytes())
            if normalize(raw, f):                # luôn căn lại TỪ bản gốc
                done += 1
            else:
                skipped += 1
        print(f"  đã căn {done} sprite" + (f", bỏ {skipped} ảnh rỗng" if skipped else ""))
        report(root, "sau")


if __name__ == "__main__":
    main()
