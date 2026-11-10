import { loadFont } from "@remotion/google-fonts/BeVietnamPro";
import { useVideoConfig } from "remotion";

export const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "800"],
  subsets: ["latin", "latin-ext", "vietnamese"],
});

/** Trang giáo trình in: mực trên giấy ấm. Không dùng xám trung tính ở đâu cả. */
export const theme = {
  fontFamily,
  paper: "#F5F1EC",
  paperDeep: "#EDE6DC",
  ink: "#2B2520",
  inkSoft: "#6B6054",
  accent: "#C8613C",
  accentSoft: "#E8D5CB",
  ask: "#7E4F63",
  askSoft: "#E4D2D8",
  askPaper: "#F7EBE6",
  rule: "#DED5C8",
  fps: 30,
  width: 1920,
  height: 1080,
  defaultTailSeconds: 0.4,
  /** Dùng bộ ảnh nhân vật trong public/characters/ (đặt false để lùi về bản SVG) */
  useCharacterImages: true,
  /** Nhãn tên dưới nhân vật. Tắt vì chính nhân vật đã nói lên ai đang nói. */
  showSpeakerName: false,
  /** Tạo hình mặc định cho bạn nữ SON ("auto" sẽ tự đổi theo part/scene giữa 8 style gốc) */
  defaultSonOutfit: "auto" as
    | "beret"
    | "cardigan"
    | "preppy"
    | "bun-bow"
    | "braid-rose"
    | "maroon-tee"
    | "black-cami"
    | "bus-polo"
    | "auto",
  /**
   * Chế độ nhân vật dẫn chuyện xuyên suốt (kiểu Game Cực Hay / snaptik):
   * - "by-speaker": Chibi MỰC (Daniel Park) dẫn chuyện xuyên suốt các scene host, Chibi SON xuất hiện ở các scene ask.
   * - "son-always": Bạn nữ Chibi SON xuất hiện xuyên suốt ở mọi scene.
   */
  mascotMode: "by-speaker" as "son-always" | "by-speaker",
  /** Đã có đủ bộ ảnh Chibi PNGTuber cho cả SON (8 style × 28 pose) và MỰC (28 pose) */
  hasMucImages: true,
};

export type Layout = ReturnType<typeof useLayout>;

/**
 * Một bố cục cho hai tỉ lệ. Bản ngang là trang sách mở, bản dọc là cột chữ hẹp:
 * lề co lại, chữ to lên theo chiều rộng khung, phụ đề đẩy lên cao hơn mép dưới.
 */
export const useLayout = () => {
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  const k = width / 1920;

  return {
    vertical,
    width,
    height,
    /** nhân cỡ chữ theo khung, bản dọc đọc ở xa nên chữ to tương đối hơn */
    s: (px: number) => Math.round(px * (vertical ? k * 1.72 : k)),
    padX: vertical ? Math.round(width * 0.075) : Math.round(width * 0.083),
    padTop: vertical ? Math.round(height * 0.14) : Math.round(height * 0.15),
    // Khổ dọc đẩy phụ đề lên 17%: vừa chừa chỗ cho nhân vật ở góc dưới phải, vừa tránh
    // dải giao diện của TikTok (nút và caption của app chiếm khoảng 15% đáy màn hình).
    captionBottom: vertical ? Math.round(height * 0.17) : Math.round(height * 0.055),
    captionWidth: vertical ? Math.round(width * 0.86) : Math.round(width * 0.68),
  };
};
