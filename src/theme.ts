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
  askPaper: "#F7EBE6",
  rule: "#DED5C8",
  fps: 30,
  width: 1920,
  height: 1080,
  defaultTailSeconds: 0.4,
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
    captionBottom: vertical ? Math.round(height * 0.11) : Math.round(height * 0.055),
    captionWidth: vertical ? Math.round(width * 0.86) : Math.round(width * 0.68),
  };
};
