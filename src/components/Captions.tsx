import React from "react";
import { interpolate, interpolateColors, useCurrentFrame, useVideoConfig } from "remotion";
import type { Word } from "../types";
import { theme, useLayout } from "../theme";

/**
 * Phụ đề luôn hiện (nhiều người xem tắt tiếng). Chữ đã nói đậm mực, chữ chưa nói nhạt đi —
 * tô bằng chính mực của trang chứ không dùng xám trung tính.
 */
export const Captions: React.FC<{
  words?: Word[];
  fallbackText?: string;
  wordsPerLine?: number;
}> = ({ words, fallbackText, wordsPerLine }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const ms = (frame / fps) * 1000;
  // Hiện trọn một mệnh đề rồi để khung tự xuống dòng, thay vì cắt cửa sổ N từ —
  // cắt theo số từ sẽ giấu mất nửa sau của cụm ("một kiến | trúc").
  const maxWords = wordsPerLine ?? (L.vertical ? 14 : 18);

  let content: React.ReactNode = null;
  let swap = 1;

  if (words && words.length > 0) {
    const lines: Word[][] = [];
    let current: Word[] = [];
    for (const w of words) {
      current.push(w);
      const endsSentence = /[.!?…]$/.test(w.text);
      const endsClause = /[,;:]$/.test(w.text);
      if (
        (endsSentence && current.length >= 2) ||
        (endsClause && current.length >= Math.ceil(maxWords * 0.5)) ||
        current.length >= maxWords
      ) {
        lines.push(current);
        current = [];
      }
    }
    if (current.length) lines.push(current);
    // Giữ mệnh đề đang hiện cho tới khi mệnh đề sau bắt đầu. Trước đây dùng một khoảng
    // bám [start, end+250ms] rồi rơi về mệnh đề CUỐI khi không khớp — nên ở mỗi khoảng
    // lặng giữa hai câu, phụ đề nháy sang câu cuối của cả scene vài frame rồi nhảy ngược
    // lại. Đó mới là cú giật rõ nhất, không phải lỗi timing.
    let idx = 0;
    for (let i = 0; i < lines.length; i++) {
      if (ms >= lines[i][0].startMs) idx = i;
    }
    const activeLine = lines[idx];
    // Đổi mệnh đề bằng một nhịp mờ ngắn. Cắt phụt sang mệnh đề mới thì mắt đọc ra là giật.
    swap = interpolate(ms, [activeLine[0].startMs - 50, activeLine[0].startMs + 90], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    content = (
      <>
        {activeLine.map((w, i) => {
          // Chữ sáng dần trong ~150ms quanh lúc được nói, không bật tắt đột ngột
          const p = interpolate(ms, [w.startMs - 40, w.startMs + 150], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <span
              key={`${w.text}-${i}`}
              style={{ color: interpolateColors(p, [0, 1], [theme.inkSoft, theme.ink]) }}
            >
              {w.text}{" "}
            </span>
          );
        })}
      </>
    );
  } else if (fallbackText) {
    content = <span style={{ color: theme.ink }}>{fallbackText}</span>;
  }

  if (!content) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: L.captionBottom,
        display: "flex",
        justifyContent: "center",
        padding: `0 ${L.padX}px`,
      }}
    >
      <div
        style={{
          fontFamily: theme.fontFamily,
          fontSize: L.s(36),
          // Nét chữ cố định cho MỌI từ, đã nói hay chưa. Trước đây từ đang nói nhảy từ
          // nét 500 sang 700 tức thì; nét đậm rộng hơn nên cả dòng căn giữa bị xô ngang
          // mỗi lần một từ sáng lên — đo được bề rộng đổi 66px trong 33 frame. Chỉ đổi
          // màu thì bề rộng không bao giờ đổi, và chữ đứng yên tuyệt đối.
          fontWeight: 700,
          lineHeight: 1.35,
          textAlign: "center",
          maxWidth: L.captionWidth,
          // Chừa sẵn chỗ cho hai dòng: mệnh đề một dòng đổi sang hai dòng mà không
          // chừa chỗ thì cả khối nhảy dựng lên.
          minHeight: Math.round(L.s(36) * 1.35 * 2),
          opacity: swap,
        }}
      >
        {content}
      </div>
    </div>
  );
};
