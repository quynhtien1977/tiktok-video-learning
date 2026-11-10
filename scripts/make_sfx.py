# -*- coding: utf-8 -*-
"""Sinh bộ hiệu ứng âm thanh UI cho loạt video.

Bài học đã đo được: loa điện thoại và laptop gần như không phát gì dưới 300Hz.
Bộ tiếng đầu tiên đặt thunk ở 52Hz nên đo đỉnh -4,4dB mà người xem vẫn không nghe
thấy gì. Vì vậy mọi tiếng ở đây đều đặt phần chính trong dải 800Hz - 4kHz, là chỗ
loa nhỏ to nhất và tai người nhạy nhất, cộng một tiếng tách rất ngắn để nghe dứt khoát.

Tiếng gõ dùng mô hình thanh marimba: hoạ âm ở 1f, 4f, 10f, mỗi hoạ âm tắt nhanh hơn
hoạ âm dưới nó. Bốn cao độ tăng dần để bullet thứ nhất tới thứ tư nghe như một câu
nhạc đi lên, người xem nhận ra ngay là "vừa thêm một ý".

    python -I -X utf8 scripts/make_sfx.py
"""
import subprocess, sys, re
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "public" / "sfx" / "ui"
SR = 48000
PEAK_DB = -1.0  # chuẩn hoá đỉnh; mức trộn thật đặt trong src/Episode.tsx

def sh(args):
    p = subprocess.run(args, capture_output=True, text=True, errors="replace")
    if p.returncode != 0:
        print("\n".join(args), file=sys.stderr)
        print(p.stderr[-2000:], file=sys.stderr)
        raise SystemExit(f"ffmpeg lỗi: {args[-1]}")
    return p.stderr

def peak_db(path):
    err = sh(["ffmpeg", "-v", "info", "-i", str(path), "-af", "volumedetect", "-f", "null", "-"])
    m = re.findall(r"max_volume:\s*(-?[\d.]+) dB", err)
    return float(m[-1]) if m else -99.0

def render(name, expr, dur, extra_af=None):
    """Dựng một tiếng từ biểu thức sóng, chuẩn hoá đỉnh rồi ghi mp3."""
    raw = OUT / f".{name}.wav"
    af = [f"afade=t=out:st={max(dur - 0.03, 0):.3f}:d=0.03"]
    if extra_af:
        af = extra_af + af
    sh(["ffmpeg", "-y", "-v", "error",
        # Biểu thức bọc nháy đơn: trong đó có dấu phẩy, mà ffmpeg hiểu phẩy là dấu ngắt filter.
        "-f", "lavfi", "-i", f"aevalsrc=exprs='{expr}':d={dur}:s={SR}",
        "-af", ",".join(af), "-ac", "1", str(raw)])
    gain = PEAK_DB - peak_db(raw)
    mp3 = OUT / f"{name}.mp3"
    sh(["ffmpeg", "-y", "-v", "error", "-i", str(raw),
        "-af", f"volume={gain:.2f}dB", "-ac", "1", "-ar", str(SR), "-b:a", "192k", str(mp3)])
    raw.unlink()
    return mp3

def click(amp, decay):
    """Tiếng tách rất ngắn — thứ làm cho một tiếng nghe dứt khoát thay vì ù."""
    return f"(random(1)-0.5)*2*exp(-t*{decay})*{amp}"

def mallet(f, amps=(0.90, 0.30, 0.08), decays=(13, 38, 90)):
    """Thanh gõ kiểu marimba: hoạ âm 1f/4f/10f, hoạ âm cao tắt nhanh hơn."""
    parts = [
        f"exp(-t*{decays[0]})*sin(2*PI*{f:.1f}*t)*{amps[0]}",
        f"exp(-t*{decays[1]})*sin(2*PI*{4 * f:.1f}*t)*{amps[1]}",
        f"exp(-t*{decays[2]})*sin(2*PI*{10 * f:.1f}*t)*{amps[2]}",
    ]
    return "+".join(parts)

def woodblock(f):
    """Tiếng gõ gỗ: hoạ âm lệch (2.4f, 5.1f) nên nghe đục và có thân, không trong như chuông."""
    parts = [
        f"exp(-t*17)*sin(2*PI*{f:.1f}*t)*0.80",
        f"exp(-t*34)*sin(2*PI*{2.4 * f:.1f}*t)*0.38",
        f"exp(-t*62)*sin(2*PI*{5.1 * f:.1f}*t)*0.16",
        f"exp(-t*19)*sin(2*PI*{0.5 * f:.1f}*t)*0.16",  # thân trầm, cố ý nhỏ
    ]
    return "+".join(parts)

# Bốn cao độ đi lên: C6 E6 G6 C7 — bullet 1..4 nghe thành một câu nhạc.
POP_HZ = [1046.5, 1318.5, 1568.0, 2093.0]
# Khối sơ đồ: thấp hơn một quãng tám nên nghe "nặng" hơn bullet mà vẫn trong dải loa nghe được.
BLOCK_HZ = [523.3, 659.3, 784.0, 1046.5]

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    made = []

    for i, f in enumerate(POP_HZ, 1):
        made.append(render(f"pop{i}", f"({mallet(f)}+{click(0.45, 520)})*0.92", 0.26))

    for i, f in enumerate(BLOCK_HZ, 1):
        made.append(render(f"block{i}", f"({woodblock(f)}+{click(0.55, 360)})*0.92", 0.38))

    # Chuyển cảnh: nhiễu lọc dải, đường bao hình chuông. Dải này vốn đã nghe được nên giữ cách dựng.
    made.append(render(
        "whoosh",
        "(random(1)-0.5)*2*(exp(-pow((t-0.10)/0.075,2))*0.9+exp(-t*9)*0.25)",
        0.30,
        extra_af=["highpass=f=850", "lowpass=f=7500", "highpass=f=850"],
    ))

    # Hook: chuông sáng G6 chồng một cú trầm 180Hz (không phải 46Hz — 46Hz là vô hình trên điện thoại).
    sting = "+".join([
        "exp(-t*2.6)*sin(2*PI*1568.0*t)*0.55",
        "exp(-t*4.5)*sin(2*PI*3136.0*t)*0.18",
        "exp(-t*3.2)*sin(2*PI*784.0*t)*0.40",
        "exp(-t*6.0)*sin(2*PI*180.0*t)*0.30",
        click(0.40, 260),
    ])
    made.append(render("hook-sting", f"({sting})*0.85", 1.10))

    # Thẻ kết: hai nốt G5 rồi D6, trên nền C4. Nốt hai vào ở 0,42s.
    end = "+".join([
        "exp(-t*2.2)*sin(2*PI*784.0*t)*0.45",
        "exp(-t*3.8)*sin(2*PI*1568.0*t)*0.15",
        "gt(t,0.42)*exp(-(t-0.42)*2.0)*sin(2*PI*1174.7*(t-0.42))*0.45",
        "gt(t,0.42)*exp(-(t-0.42)*3.6)*sin(2*PI*2349.3*(t-0.42))*0.14",
        "exp(-t*2.4)*sin(2*PI*261.6*t)*0.26",
    ])
    made.append(render("endcard", f"({end})*0.85", 2.30))

    # Chuông đổi vai: hai nốt đi lên, rất nhẹ, báo người xem là giọng hỏi vào.
    ask = "+".join([
        "exp(-t*5.0)*sin(2*PI*1174.7*t)*0.45",
        "gt(t,0.13)*exp(-(t-0.13)*4.5)*sin(2*PI*1760.0*(t-0.13))*0.45",
        "exp(-t*8.0)*sin(2*PI*2349.3*t)*0.12",
    ])
    made.append(render("ask-chime", f"({ask})*0.85", 0.70))

    for p in made:
        print(f"  {p.name:<16} {p.stat().st_size / 1024:6.1f} KB")

if __name__ == "__main__":
    main()
