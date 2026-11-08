import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { theme, useLayout } from "../theme";

/**
 * Khung chung của mọi scene: giấy ấm, nhãn chương ở góc, thanh tiến độ ở mép dưới.
 * Scene của giọng hỏi đổi sang giấy tím nhạt — đổi cả nền chứ không kẻ viền màu.
 */
export const Frame: React.FC<{
  children: React.ReactNode;
  chapter: string;
  episodeLabel: string;
  sceneDurationInFrames: number;
  /** tiến độ của cả tập, 0–1, vẽ thành thanh mảnh ở đáy khung */
  progress: number;
  speaker?: string;
}> = ({ children, chapter, episodeLabel, sceneDurationInFrames, progress, speaker }) => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const isAsk = speaker === "ask";

  const enter = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exit = interpolate(
    frame,
    [sceneDurationInFrames - 8, sceneDurationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: isAsk ? theme.askPaper : theme.paper,
        fontFamily: theme.fontFamily,
        color: theme.ink,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: L.vertical ? L.padX : Math.round(L.height * 0.055),
          left: L.padX,
          right: L.padX,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          fontSize: L.s(22),
          letterSpacing: L.s(3),
          textTransform: "uppercase",
          color: isAsk ? theme.ask : theme.inkSoft,
        }}
      >
        <span>{chapter}</span>
        <span style={{ letterSpacing: L.s(2) }}>{episodeLabel}</span>
      </div>

      <AbsoluteFill style={{ opacity: Math.min(enter, exit) }}>{children}</AbsoluteFill>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 3,
          backgroundColor: theme.rule,
        }}
      >
        <div
          style={{
            width: `${Math.min(Math.max(progress, 0), 1) * 100}%`,
            height: "100%",
            backgroundColor: isAsk ? theme.ask : theme.accent,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
