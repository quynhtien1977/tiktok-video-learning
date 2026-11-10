"""
Xử lý bộ nhân vật 2D Chibi PNGTuber / Mascot (phong cách "Game Cực Hay" & "snaptik"):
- Tách chuẩn xác cả 9 ô biểu cảm trong lưới 3x3 cho toàn bộ 8 tạo hình trang phục của SON
  và tạo hình dẫn chuyện của MỰC (host), giữ trọn các icon biểu cảm bay quanh đầu (?, ✦, ♥)
  và đóng kín đáy thân áo để áo trắng / sách / hộp bỏng ngô đặc 100% (alpha = 255).
- Tạo viền cắt Sticker trắng mịn chuẩn PNGTuber + khử sạch hoàn toàn nhiễu biên JPG.
- Xuất đủ 8 Style × 28 file PNG (1024x1024) cho SON tại public/characters/son/<style>/
  và 28 file PNG (1024x1024) cho MỰC tại public/characters/muc/.
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "characters"
SON_DIR = OUT_DIR / "son"
MUC_DIR = OUT_DIR / "muc"
OUT_DIR.mkdir(parents=True, exist_ok=True)
SON_DIR.mkdir(parents=True, exist_ok=True)
MUC_DIR.mkdir(parents=True, exist_ok=True)

BRAIN_DIR = Path(r"C:\Users\Asus\.gemini\antigravity\brain\4be2f80c-36d3-45fc-bd86-eb63db92832e")

# 9 ô gốc theo thứ tự lưới 3x3 (từ trái qua phải, từ trên xuống dưới):
# (0,0): wave       - Vẫy tay chào cười tươi
# (0,1): touch      - Đọc sách đỏ chăm chú (kiểu Game Cực Hay)
# (0,2): ok         - Ăn bỏng ngô mắt sao lấp lánh (kiểu Game Cực Hay)
# (1,0): shocked    - Hoảng hốt tụt huyết áp + đổ mồ hôi hột (kiểu snaptik)
# (1,1): point      - Chỉ tay giải thích tự tin
# (1,2): curious    - Hai tay ôm má phúng phính + mắt sao lấp lánh ✦
# (2,0): think      - Chống cằm suy ngẫm + dấu chấm hỏi ?
# (2,1): peace      - Cười tít mắt ^ ^ giơ tay chữ V
# (2,2): heart      - Nháy mắt ;) bắn tim ♥ (hoặc giơ ngón cái với MỰC)
GRID_CELL_NAMES = [
    "wave",
    "touch",
    "ok",
    "shocked",
    "point",
    "curious",
    "think",
    "peace",
    "heart",
]

STYLE_SHEETS = [
    {
        "style": "beret",
        "file": BRAIN_DIR / "chibi_pngtuber_expression_sheet_3x3_1794283031760.jpg",
    },
    {
        "style": "cardigan",
        "file": BRAIN_DIR / "chibi_expression_sheet_red_cardigan_3x3_1794283132078.jpg",
    },
    {
        "style": "preppy",
        "file": BRAIN_DIR / "chibi_expression_sheet_outfit3_1794283129295.jpg",
    },
    {
        "style": "bun-bow",
        "file": BRAIN_DIR / "chibi_pngtuber_outfit4_bun_expressions_3x3_1794283137377.jpg",
    },
    {
        "style": "braid-rose",
        "file": BRAIN_DIR / "chibi_pngtuber_expression_sheet_outfit5_3x3_1794283140563.jpg",
    },
    {
        "style": "maroon-tee",
        "file": BRAIN_DIR / "chibi_pngtuber_style6_expression_sheet_3x3_1794283194133.jpg",
    },
    {
        "style": "black-cami",
        "file": BRAIN_DIR / "chibi_pngtuber_style7_expression_sheet_3x3_1794283220594.jpg",
    },
    {
        "style": "bus-polo",
        "file": BRAIN_DIR / "chibi_expression_sheet_polo_style8_1794283223513.jpg",
    },
]

MUC_SHEET = BRAIN_DIR / "daniel_park_chibi_pngtuber_expression_sheet_3x3_1794284455407.jpg"

# 28 Postures & Emotions per style (27 chuẩn + shocked/book/popcorn đồng bộ):
# (pose_id, source_cell, mirror_x, angle_deg, zoom_scale, blush_strength)
POSTURE_EMOTION_SPECS = [
    # Nhóm 1: 9 Tư thế & Biểu cảm Chuẩn + Shocked
    ("neutral", "wave", False, 0.0, 1.03, 0.08),
    ("think", "think", False, 0.0, 1.00, 0.00),
    ("curious", "curious", False, 0.0, 1.00, 0.00),
    ("point", "point", False, 0.0, 1.00, 0.00),
    ("wave", "wave", False, 0.0, 1.00, 0.00),
    ("peace", "peace", False, 0.0, 1.00, 0.00),
    ("ok", "ok", False, 0.0, 1.00, 0.00),
    ("heart", "heart", False, 0.0, 1.00, 0.00),
    ("touch", "touch", False, 0.0, 1.00, 0.00),
    ("shocked", "shocked", False, 0.0, 1.00, 0.00),

    # Nhóm 2: 9 Tư thế Đảo chiều & Nghiêng đầu Biểu cảm (Directional & Tilted)
    ("neutral-shy", "shocked", False, -3.2, 1.02, 0.00),
    ("think-left", "think", True, 3.0, 1.00, 0.08),
    ("curious-tilt", "curious", False, -4.5, 1.02, 0.16),
    ("point-left", "point", True, 0.0, 1.00, 0.08),
    ("wave-left", "wave", True, 3.0, 1.00, 0.12),
    ("peace-left", "peace", True, -3.5, 1.00, 0.16),
    ("ok-right", "ok", True, -2.8, 1.00, 0.10),
    ("heart-left", "heart", True, 3.5, 1.01, 0.18),
    ("touch-left", "touch", True, -2.5, 1.00, 0.08),

    # Nhóm 3: 9 Biểu cảm Cận cảnh & Năng lượng (Close-Up Bust + Expressive Lean)
    ("neutral-attentive", "touch", False, 2.8, 1.07, 0.10),
    ("think-doubt", "shocked", False, 3.5, 1.07, 0.00),
    ("curious-surprised", "curious", False, 3.8, 1.08, 0.20),
    ("point-explain", "point", False, 3.4, 1.07, 0.12),
    ("wave-cheer", "wave", False, -3.8, 1.07, 0.18),
    ("peace-playful", "peace", False, 4.0, 1.07, 0.20),
    ("ok-confident", "ok", False, 3.0, 1.07, 0.12),
    ("heart-closeup", "heart", False, -3.5, 1.09, 0.22),
    ("touch-cool", "touch", False, -3.0, 1.06, 0.10),
]


def add_sticker_rim_and_clean_alpha(sub_rgb: np.ndarray, sub_fg: np.ndarray) -> np.ndarray:
    """
    Tạo viền cắt Sticker trắng mịn chuẩn PNGTuber (kiểu snaptik & Game Cực Hay)
    quanh nhân vật Chibi và các icon biểu cảm (?, ✦, ♥):
    - Đảm bảo 100% vùng bên trong nhân vật (áo trắng, mắt, răng, trang sách, hộp bỏng ngô) đặc hoàn toàn (alpha=255).
    - Bao ngoài nét mực đen bằng một viền sticker trắng mỏng sắc nét (4px) giúp nhân vật nổi bật trên mọi nền giấy
      và triệt tiêu hoàn toàn hiện tượng lem nền hay mờ viền.
    """
    r = sub_rgb[:, :, 0].astype(np.float32)
    g = sub_rgb[:, :, 1].astype(np.float32)
    b = sub_rgb[:, :, 2].astype(np.float32)
    min_c = np.minimum(np.minimum(r, g), b)
    max_c = np.maximum(np.maximum(r, g), b)
    warmth = r - b

    # Bỏ lớp nhiễu trắng JPG sát rìa ngoài của nét mực để lấy đúng lõi nét vẽ thật
    dist_in_raw = ndimage.distance_transform_edt(sub_fg)
    jpg_halo = (dist_in_raw <= 1.6) & (min_c >= 225) & ((max_c - min_c) <= 14) & (warmth <= 12)
    core_fg = sub_fg & (~jpg_halo)
    core_fg = ndimage.binary_fill_holes(core_fg)

    # Khoảng cách từ ngoài tính vào lõi nhân vật (để vẽ viền sticker trắng mỏng 3.5px bên ngoài nét mực)
    dist_out = ndimage.distance_transform_edt(~core_fg)
    sticker_radius = 3.6
    total_mask = dist_out <= sticker_radius

    # Độ trong suốt mượt ở rìa ngoài của viền sticker trắng
    alpha = np.zeros_like(r)
    alpha[core_fg] = 255.0
    rim_zone = (~core_fg) & (dist_out <= sticker_radius + 1.2)
    alpha[rim_zone] = np.clip((sticker_radius + 0.8 - dist_out[rim_zone]) / 1.4, 0.0, 1.0) * 255.0

    # Trong vùng viền sticker ngoài lõi (dist_out > 0) và vùng biên sát nét mực bị dính trắng JPG,
    # tô màu trắng kem sạch (#FFFDF9) để tạo viền sticker đồng nhất
    out_r = r.copy()
    out_g = g.copy()
    out_b = b.copy()

    outer_rim = ~core_fg
    out_r[outer_rim] = 255.0
    out_g[outer_rim] = 253.0
    out_b[outer_rim] = 249.0

    out_rgba = np.zeros((sub_rgb.shape[0], sub_rgb.shape[1], 4), dtype=np.uint8)
    out_rgba[:, :, 0] = np.clip(out_r, 0, 255).astype(np.uint8)
    out_rgba[:, :, 1] = np.clip(out_g, 0, 255).astype(np.uint8)
    out_rgba[:, :, 2] = np.clip(out_b, 0, 255).astype(np.uint8)
    out_rgba[:, :, 3] = np.clip(alpha, 0, 255).astype(np.uint8)
    out_rgba[out_rgba[:, :, 3] < 10] = 0
    return out_rgba


def extract_cell_sprite(cell_rgb: np.ndarray) -> Image.Image:
    """
    Tách nhân vật Chibi cùng toàn bộ icon đi kèm (?, ✦, ♥) trong 1 ô của lưới 3x3:
    - Tự động khoá đáy thân áo ở vùng trung tâm (0.25..0.75 chiều ngang ô) để áo trắng, sách
      và hộp bỏng ngô đặc 100%, đồng thời loại bỏ hoàn toàn các hốc nền trắng kẹt giữa tóc và bàn tay vẫy.
    """
    ch, cw, _ = cell_rgb.shape
    r = cell_rgb[:, :, 0].astype(np.int32)
    g = cell_rgb[:, :, 1].astype(np.int32)
    b = cell_rgb[:, :, 2].astype(np.int32)

    min_c = np.minimum(np.minimum(r, g), b)
    max_c = np.maximum(np.maximum(r, g), b)
    warmth = r - b

    # Điểm nền trắng tinh khiết
    is_pure_white = (min_c >= 238) & ((max_c - min_c) <= 12) & (warmth <= 10)
    non_white = ~is_pure_white

    # Xoá các hạt nhiễu cực nhỏ (< 18px) trên nền trắng
    lbl, num = ndimage.label(non_white)
    if num > 0:
        sizes = ndimage.sum(non_white, lbl, range(1, num + 1))
        keep_labels = [i + 1 for i, s in enumerate(sizes) if s >= 18]
        non_white = np.isin(lbl, keep_labels)

    # Tìm dòng đáy của nhân vật dựa vào nét mực đậm ở vùng thân giữa (24%..76% chiều ngang ô)
    dark_ink = non_white & (min_c < 145)
    center_x0, center_x1 = int(cw * 0.24), int(cw * 0.76)
    center_ink = np.zeros_like(dark_ink)
    center_ink[:, center_x0:center_x1] = dark_ink[:, center_x0:center_x1]
    ink_ys, ink_xs = np.where(center_ink)

    white_for_bg = is_pure_white & (~non_white)
    y_bottom = ch - 1
    if len(ink_ys) > 40:
        y_bottom = int(ink_ys.max())
        # Tìm đúng 2 đường viền đen của thân áo / sách / hộp bỏng ngô tại sát đáy (y_bottom - 3 .. y_bottom)
        shirt_x0, shirt_x1 = int(cw * 0.28), int(cw * 0.72)
        bottom_band = dark_ink[max(0, y_bottom - 6) : y_bottom + 1, shirt_x0:shirt_x1]
        _, bxs = np.where(bottom_band)
        if len(bxs) >= 2:
            x_left = shirt_x0 + int(np.percentile(bxs, 4))
            x_right = shirt_x0 + int(np.percentile(bxs, 96))
            if x_right > x_left + 16:
                # Chỉ chặn đúng 2px tại đường cắt đáy thân áo (không lấy phần trắng bên dưới y_bottom)
                white_for_bg[max(0, y_bottom - 2) : y_bottom + 1, x_left : x_right + 1] = False

    # Flood-fill nền trắng từ 4 biên của ô
    w_lbl, w_num = ndimage.label(white_for_bg)
    border_mask = np.zeros((ch, cw), dtype=bool)
    border_mask[0, :] = border_mask[-1, :] = border_mask[:, 0] = border_mask[:, -1] = True
    ext_labels = set(np.unique(w_lbl[border_mask])) - {0}
    ext_bg = np.isin(w_lbl, list(ext_labels))

    # Mọi vùng không phải nền ngoài và nằm từ y_bottom trở lên đều thuộc nhân vật
    fg_mask = ~ext_bg
    if y_bottom + 1 < ch:
        fg_mask[y_bottom + 1 :, :] = False

    # Kiểm tra các hốc trắng kẹt giữa bàn tay giơ ngang (wave/peace/heart) và mái tóc ở rìa hai bên
    trapped_white = is_pure_white & fg_mask
    t_lbl, t_num = ndimage.label(trapped_white)
    for tl in range(1, t_num + 1):
        reg = t_lbl == tl
        area = int(reg.sum())
        if area < 28:
            continue
        rys, rxs = np.where(reg)
        cy_px, cx_px = float(rys.mean()), float(rxs.mean())
        # Bảo vệ tuyệt đối toàn bộ vùng khuôn mặt, mắt, răng, sách, bỏng ngô và thân áo giữa
        if (0.28 * cw <= cx_px <= 0.72 * cw) and (cy_px >= 0.18 * ch):
            continue
        # Nếu là hốc trắng nằm lệch hẳn ra rìa ngoài (kẹt giữa cánh tay vẫy và mái tóc tối màu)
        dil = ndimage.binary_dilation(reg, iterations=2) & (~reg)
        dark_hair_border = (max_c[dil] < 115).mean() if dil.any() else 0.0
        if (cx_px < 0.27 * cw or cx_px > 0.73 * cw) and (cy_px < 0.88 * ch) and dark_hair_border > 0.35:
            fg_mask[reg] = False

    ys, xs = np.where(fg_mask)
    if len(ys) == 0:
        return Image.fromarray(np.zeros((ch, cw, 4), dtype=np.uint8), mode="RGBA")

    pad = 10
    y0, y1 = max(0, int(ys.min()) - pad), min(ch, int(ys.max()) + pad + 1)
    x0, x1 = max(0, int(xs.min()) - pad), min(cw, int(xs.max()) + pad + 1)

    sub_rgb = cell_rgb[y0:y1, x0:x1].copy()
    sub_fg = fg_mask[y0:y1, x0:x1].copy()

    out_rgba = add_sticker_rim_and_clean_alpha(sub_rgb, sub_fg)
    return Image.fromarray(out_rgba, mode="RGBA")


def extract_nine_figures(sheet_rgb: np.ndarray):
    """
    Tìm chính xác 2 đường rãnh ngang và 2 đường rãnh dọc chia lưới 3x3,
    sau đó tách trọn vẹn từng ô (gồm cả nhân vật và các ký hiệu ?, ✦, ♥).
    """
    h, w, _ = sheet_rgb.shape
    min_c = sheet_rgb.min(axis=2)
    fg_rough = min_c < 232

    y_split1 = 290 + int(np.argmin(fg_rough[290:390, :].sum(axis=1)))
    y_split2 = 630 + int(np.argmin(fg_rough[630:730, :].sum(axis=1)))
    x_split1 = 290 + int(np.argmin(fg_rough[:, 290:390].sum(axis=0)))
    x_split2 = 630 + int(np.argmin(fg_rough[:, 630:730].sum(axis=0)))

    y_bounds = [(0, y_split1), (y_split1, y_split2), (y_split2, h)]
    x_bounds = [(0, x_split1), (x_split1, x_split2), (x_split2, w)]

    sprites = []
    for r_idx in range(3):
        for c_idx in range(3):
            y0, y1 = y_bounds[r_idx]
            x0, x1 = x_bounds[c_idx]
            cell_rgb = sheet_rgb[y0:y1, x0:x1]
            sprites.append(extract_cell_sprite(cell_rgb))
    return sprites


def align_to_1024(sprite: Image.Image) -> Image.Image:
    """
    Đặt nhân vật Chibi lên khung 1024x1024 trong suốt, căn đáy sát mép dưới hơn
    để khi ghim ở góc màn hình (kiểu Game Cực Hay) hoặc giữa khung (kiểu snaptik)
    nhân vật bám gọn và sắc nét.
    """
    arr = np.array(sprite)
    alpha = arr[:, :, 3]
    ys, xs = np.where(alpha > 32)
    if len(ys) == 0:
        return sprite.resize((1024, 1024), Image.Resampling.LANCZOS)

    y_min, y_max = int(ys.min()), int(ys.max())
    x_min, x_max = int(xs.min()), int(xs.max())

    fig_h = max(1, y_max - y_min)
    fig_w = max(1, x_max - x_min)

    target_h = 880
    scale = target_h / float(fig_h)
    if fig_w * scale > 930:
        scale = 930.0 / float(fig_w)

    new_w = max(1, int(round(sprite.width * scale)))
    new_h = max(1, int(round(sprite.height * scale)))
    resized = sprite.resize((new_w, new_h), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    scaled_w = fig_w * scale
    scaled_h = fig_h * scale
    scaled_x_min = x_min * scale
    scaled_y_min = y_min * scale

    paste_x = int(round((1024 - scaled_w) * 0.5 - scaled_x_min))
    # Đặt đáy nhân vật ở y = 964 để dễ dàng neo ở cạnh dưới khung hình
    paste_y = int(round(964 - scaled_h - scaled_y_min))

    canvas.paste(resized, (paste_x, paste_y), resized)

    # Làm sắc nét nét vẽ Chibi 2D
    r, g, b, a = canvas.split()
    rgb_sharp = Image.merge("RGB", (r, g, b)).filter(
        ImageFilter.UnsharpMask(radius=1.1, percent=105, threshold=4)
    )
    a_arr = np.array(a, dtype=np.float32)
    a_arr = np.clip((a_arr - 14.0) * (255.0 / (244.0 - 14.0)), 0.0, 255.0).astype(np.uint8)
    a_sharp = Image.fromarray(a_arr, mode="L")

    sr, sg, sb = rgb_sharp.split()
    out = Image.merge("RGBA", (sr, sg, sb, a_sharp))
    out_arr = np.array(out)
    out_arr[out_arr[:, :, 3] == 0] = 0
    return Image.fromarray(out_arr, mode="RGBA")


def apply_blush_and_posture_transform(
    aligned_1024: Image.Image,
    mirror_x: bool,
    angle_deg: float,
    zoom_scale: float,
    blush_strength: float,
) -> Image.Image:
    """
    Tạo biến thể tư thế & biểu cảm từ sprite Chibi gốc 1024x1024.
    Lưu ý: Không lật ngang các ô có chữ "Book" hoặc dấu "?" để chữ không bị ngược.
    """
    img = aligned_1024.copy()

    if blush_strength > 0.01:
        arr = np.array(img).astype(np.float32)
        r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]

        yy, xx = np.mgrid[0:1024, 0:1024]
        face_band = (yy >= 280) & (yy <= 660) & (xx >= 240) & (xx <= 784) & (a > 200)
        skin_mask = (
            face_band
            & (r > 210)
            & (g > 165)
            & (b > 145)
            & ((r - b) > 14)
            & ((r - g) > 8)
        )

        if skin_mask.sum() > 200:
            sys, sxs = np.where(skin_mask)
            cy = float(np.percentile(sys, 58))
            cx = float(sxs.mean())
            face_w = max(120.0, float(np.percentile(sxs, 92) - np.percentile(sxs, 8)))

            lx = cx - face_w * 0.28
            rx = cx + face_w * 0.28
            sigma_x = face_w * 0.14
            sigma_y = face_w * 0.10

            g_left = np.exp(-(((xx - lx) / sigma_x) ** 2 + ((yy - cy) / sigma_y) ** 2))
            g_right = np.exp(-(((xx - rx) / sigma_x) ** 2 + ((yy - cy) / sigma_y) ** 2))
            cheek_field = np.clip(g_left + g_right, 0.0, 1.0) * skin_mask.astype(np.float32)
            cheek_field = ndimage.gaussian_filter(cheek_field, sigma=2.5) * blush_strength

            arr[:, :, 0] = np.clip(r * (1.0 - cheek_field * 0.22) + 255.0 * (cheek_field * 0.22), 0, 255)
            arr[:, :, 1] = np.clip(g * (1.0 - cheek_field * 0.60) + 120.0 * (cheek_field * 0.60), 0, 255)
            arr[:, :, 2] = np.clip(b * (1.0 - cheek_field * 0.50) + 135.0 * (cheek_field * 0.50), 0, 255)
            img = Image.fromarray(arr.astype(np.uint8), mode="RGBA")

    if mirror_x:
        img = img.transpose(Image.Transpose.FLIP_LEFT_RIGHT)

    needs_resample = False
    if abs(angle_deg) > 0.05:
        img = img.rotate(
            angle_deg,
            resample=Image.Resampling.BICUBIC,
            expand=False,
            center=(512, 620),
        )
        needs_resample = True

    if abs(zoom_scale - 1.0) > 0.005:
        zw = int(round(1024 * zoom_scale))
        zh = int(round(1024 * zoom_scale))
        zoomed = img.resize((zw, zh), Image.Resampling.LANCZOS)
        crop_x = int(round((zw - 1024) * 0.5))
        crop_y = int(round((zh - 1024) * 0.55))
        img = zoomed.crop((crop_x, crop_y, crop_x + 1024, crop_y + 1024))
        needs_resample = True

    if needs_resample:
        r, g, b, a = img.split()
        rgb = Image.merge("RGB", (r, g, b)).filter(
            ImageFilter.UnsharpMask(radius=0.8, percent=60, threshold=2)
        )
        sr, sg, sb = rgb.split()
        img = Image.merge("RGBA", (sr, sg, sb, a))

    arr_out = np.array(img)
    arr_out[arr_out[:, :, 3] < 10] = 0
    return Image.fromarray(arr_out, mode="RGBA")


def process_one_sheet(sheet_path: Path, out_subdir: Path):
    im = Image.open(sheet_path).convert("RGB")
    if im.size != (1024, 1024):
        im = im.resize((1024, 1024), Image.Resampling.LANCZOS)
    arr = np.array(im)

    sprites = extract_nine_figures(arr)
    out_subdir.mkdir(parents=True, exist_ok=True)

    aligned_map = {}
    for cell_name, clean_sprite in zip(GRID_CELL_NAMES, sprites):
        aligned_map[cell_name] = align_to_1024(clean_sprite)

    saved = 0
    for pose_id, source_cell, mirror_x, angle_deg, zoom_scale, blush in POSTURE_EMOTION_SPECS:
        # Không lật ngang ô đọc sách ("touch") hoặc ô dấu hỏi ("think") để chữ Book và dấu ? luôn thuận chiều
        effective_mirror = False if source_cell in ("touch", "think") else mirror_x
        variant_img = apply_blush_and_posture_transform(
            aligned_map[source_cell],
            mirror_x=effective_mirror,
            angle_deg=angle_deg,
            zoom_scale=zoom_scale,
            blush_strength=blush,
        )
        variant_img.save(out_subdir / f"{pose_id}.png", "PNG", compress_level=6)
        saved += 1
    return saved


def main():
    import sys
    force_all = "--all" in sys.argv

    # Xoá ảnh sheet MỰC cũ (nhân vật từ video khác) nếu còn tồn tại
    old_muc = BRAIN_DIR / "chibi_mascot_muc_expression_sheet_3x3_1794283233194.jpg"
    if old_muc.exists():
        old_muc.unlink()

    total_son = 0
    for item in STYLE_SHEETS:
        style = item["style"]
        style_dir = SON_DIR / style
        if not force_all and (style_dir / "heart-closeup.png").exists():
            total_son += len(POSTURE_EMOTION_SPECS)
            continue
        cnt = process_one_sheet(item["file"], style_dir)
        total_son += cnt
        print(f"[OK] Processed Chibi style '{style}': {cnt} PNGs saved.")

    muc_cnt = process_one_sheet(MUC_SHEET, MUC_DIR)
    print(f"[OK] Processed Chibi Daniel Park host 'muc': {muc_cnt} PNGs saved.")
    print(f"Total SON sprites: {total_son} | Total MUC (Daniel Park) sprites: {muc_cnt}")

    # Tạo bảng preview kiểm tra toàn bộ 8 style của SON + MỰC trên nền giấy ấm và nền tối
    cols = 9
    rows = len(STYLE_SHEETS) + 1
    cell = 180
    preview = Image.new("RGBA", (cols * cell, rows * cell), (245, 241, 236, 255))
    for r_idx, item in enumerate(STYLE_SHEETS):
        style = item["style"]
        for c_idx, cell_name in enumerate(GRID_CELL_NAMES):
            p = SON_DIR / style / f"{cell_name}.png"
            thumb = Image.open(p).resize((cell, cell), Image.Resampling.LANCZOS)
            preview.paste(thumb, (c_idx * cell, r_idx * cell), thumb)

    for c_idx, cell_name in enumerate(GRID_CELL_NAMES):
        p = MUC_DIR / f"{cell_name}.png"
        thumb = Image.open(p).resize((cell, cell), Image.Resampling.LANCZOS)
        preview.paste(thumb, (c_idx * cell, len(STYLE_SHEETS) * cell), thumb)

    preview_path = BRAIN_DIR / "scratch" / "chibi_all_styles_preview.png"
    preview.convert("RGB").save(preview_path, "PNG")
    print(f"Saved 9x9 Chibi verification grid to {preview_path}")


if __name__ == "__main__":
    main()
