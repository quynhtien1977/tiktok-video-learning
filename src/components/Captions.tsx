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
    const activeLine =
      lines.find((line) => ms >= line[0].startMs && ms <= line[line.length - 1].endMs + 250) ??
      (ms < words[0].startMs ? lines[0] : lines[lines.length - 1]);

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
              style={{
                color: interpolateColors(p, [0, 1], [theme.inkSoft, theme.ink]),
                fontWeight: p > 0.5 ? 700 : 500,
              }}
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
          fontWeight: 600,
          lineHeight: 1.35,
          textAlign: "center",
          maxWidth: L.captionWidth,
        }}
      >
        {content}
      </div>
    </div>
  );
};
