import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { CharacterOutfit, CharacterPose, Scene } from "../types";
import { theme, useLayout } from "../theme";
import { resolveCharacterPose, resolvePoseTimeline } from "../poses";

/**
 * Hai nhân vật biểu tượng Chibi PNGTuber của kênh (phong cách "Game Cực Hay" & "snaptik"):
 * - SON (vai `ask` & Mascot dẫn chuyện xuyên suốt, màu `theme.ask`): 8 tạo hình trang phục
 *   (`beret`, `cardigan`, `preppy`, `bun-bow`, `braid-rose`, `maroon-tee`, `black-cami`, `bus-polo`)
 *   × 28 tư thế & biểu cảm Chibi comic (`wave`, `touch`/`book`, `ok`/`popcorn`, `shocked`, `point`,
 *   `curious`/`sparkle`, `think`, `peace`, `heart`...).
 * - MỰC (vai `host`, màu `theme.ink`): dựng từ bộ tham chiếu Daniel Park (Lookism) trong
 *   `char_reference/man_speak` với kiểu tóc comma two-block đen và áo khoác đen trên nền áo thun trắng,
 *   đủ 28 tư thế & biểu cảm Chibi tại `public/characters/muc/`.
 */
export const CAST = {
  host: { name: "AN", color: theme.ink, soft: theme.accentSoft },
  ask: { name: "NỮ", color: theme.ask, soft: theme.askSoft },
} as const;

export type Role = keyof typeof CAST;

// Giữ lại đường xuất cũ để những chỗ đang import từ đây không phải sửa.
export { resolveCharacterPose, resolvePoseTimeline };

export const SON_OUTFIT_LIST: CharacterOutfit[] = [
  "beret",
  "cardigan",
  "preppy",
  "bun-bow",
  "braid-rose",
  "maroon-tee",
  "black-cami",
  "bus-polo",
];

/** Chọn vai nhân vật hiển thị trên màn hình theo chế độ `theme.mascotMode`. */
export const resolveMascotRole = (speaker?: string): Role => {
  if (theme.mascotMode === "son-always") {
    return "ask";
  }
  return speaker === "ask" ? "ask" : "host";
};

/** Chọn tạo hình trang phục cho bạn nữ SON (hỗ trợ cố định 1 trong 8 style hoặc tự đổi theo phần/scene). */
export const resolveSonOutfit = (
  sceneOutfit?: CharacterOutfit,
  episodeOutfit?: CharacterOutfit | "auto",
  part?: number,
  sceneIndex?: number,
): CharacterOutfit => {
  if (sceneOutfit) return sceneOutfit;
  const mode = episodeOutfit ?? theme.defaultSonOutfit;
  if (mode !== "auto") return mode;
  if (part != null && part >= 1) {
    return SON_OUTFIT_LIST[(part - 1) % SON_OUTFIT_LIST.length];
  }
  if (sceneIndex != null) {
    return SON_OUTFIT_LIST[sceneIndex % SON_OUTFIT_LIST.length];
  }
  return "beret";
};

/** Chuẩn hoá các tên pose alias về đúng tên file PNG trong `public/characters/`. */
export const normalizePoseFile = (pose: CharacterPose): string => {
  switch (pose) {
    case "hat-touch":
    case "book":
      return "touch";
    case "popcorn":
      return "ok";
    case "sparkle":
      return "curious";
    default:
      return pose;
  }
};

/**
 * Ánh xạ (outfit, pose) sang đường dẫn ảnh PNG 1024×1024 nền trong suốt trong `public/characters/`.
 */
export const getSonSpritePath = (outfit: CharacterOutfit, pose: CharacterPose): string => {
  return `characters/son/${outfit}/${normalizePoseFile(pose)}.png`;
};

export const getMucSpritePath = (pose: CharacterPose): string => {
  return `characters/muc/${normalizePoseFile(pose)}.png`;
};

/**
 * Tự động chọn chuỗi tư thế & biểu cảm Chibi PNGTuber đổi nhịp liên tục trong suốt scene
 * (như "Game Cực Hay" & "snaptik"): đọc sách -> chỉ tay giải thích -> ăn bỏng ngô / mắt sao ->
 * hoảng hốt đổ mồ hôi / chống cằm chấm hỏi -> cười tít mắt / bắn tim.
 */


/**
 * Bản vẽ SVG bán thân dự phòng khi `theme.useCharacterImages = false`.
 */
const SvgHalfBodyAvatar: React.FC<{
  role: Role;
  size: number;
  pose: CharacterPose;
  wave?: number;
}> = ({ role, size, pose, wave }) => {
  const { color } = CAST[role];
  const paper = theme.paper;
  const waveAngle = wave != null ? -18 + wave * 32 : 0;

  return (
    <svg width={size} height={size} viewBox="0 0 96 96" aria-hidden style={{ overflow: "visible" }}>
      <ellipse cx="48" cy="54" rx="34" ry="32" fill={CAST[role].soft} opacity={0.55} />
      <path d="M22 36 C20 55 18 72 22 86 L74 86 C78 72 76 55 74 36 Z" fill={color} />
      <circle cx="48" cy="36" r="20" fill={color} />
      <circle cx="40" cy="36" r="6" fill="none" stroke={paper} strokeWidth="2.2" />
      <circle cx="56" cy="36" r="6" fill="none" stroke={paper} strokeWidth="2.2" />
      <line x1="46" y1="36" x2="50" y2="36" stroke={paper} strokeWidth="2.2" />
      {pose === "wave" || wave != null ? (
        <g transform={`rotate(${waveAngle} 74 66)`}>
          <rect x="70" y="38" width="9" height="28" rx="4.5" fill={color} stroke={paper} strokeWidth="1.5" />
        </g>
      ) : null}
    </svg>
  );
};

/**
 * Nhân vật Chibi PNGTuber bán thân (Half-body Mascot) với chuyển động nhún nhảy theo nhịp nói,
 * nảy nhẹ mỗi khi đổi biểu cảm và nghiêng đầu tự nhiên như "Game Cực Hay" & "snaptik".
 */
export const Avatar: React.FC<{
  role: Role;
  size: number;
  wave?: number;
  pose?: CharacterPose;
  outfit?: CharacterOutfit;
}> = ({ role, size, wave, pose = "neutral", outfit = "beret" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const resolvedPose: CharacterPose = wave != null && pose === "neutral" ? "wave" : pose;
  const useImage =
    theme.useCharacterImages && (role === "ask" || (role === "host" && theme.hasMucImages));

  // Nhịp sống của nhân vật là THỞ, không phải nhảy. Mọi chu kỳ tính bằng giây nên đổi
  // fps không làm đổi nhịp.
  //
  // Bản trước nhún 1,7 lần/giây, bóp giãn 1 lần/giây, và riêng tư thế shocked/think-doubt
  // nghiêng 6,7 lần/giây (chu kỳ 0,15s). Ở cỡ 280px thì đó là rung chứ không phải chuyển
  // động — người xem đọc ra là nhân vật bị giật.
  const t = frame / fps;
  const breathe = Math.sin((t / 4) * Math.PI * 2); // một nhịp thở 4 giây
  const sway = Math.sin((t / 6) * Math.PI * 2); // đung đưa rất chậm
  const enter = spring({ frame, fps, config: { damping: 18, mass: 0.8 }, durationInFrames: 20 });

  const floatY = breathe * 1.5; // 1,5px, bằng một phần rất nhỏ chiều cao nhân vật
  const breathScale = 1 + breathe * 0.006; // phóng đều, không bóp méo hình
  const lively = resolvedPose === "wave" || resolvedPose === "wave-cheer" || wave != null;
  const tiltDeg = lively ? Math.sin((t / 1.6) * Math.PI * 2) * 2.5 : sway * 1;

  const nudgeX =
    resolvedPose === "point" || resolvedPose === "point-explain"
      ? interpolate(enter, [0, 1], [0, 4])
      : 0;

  if (!useImage) {
    return (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `translate(${nudgeX}px, ${floatY}px) scale(${enter * breathScale}) rotate(${tiltDeg}deg)`,
          transformOrigin: "center bottom",
        }}
      >
        <SvgHalfBodyAvatar role={role} size={size} pose={resolvedPose} wave={wave} />
      </div>
    );
  }

  const src =
    role === "ask"
      ? getSonSpritePath(outfit, resolvedPose)
      : getMucSpritePath(resolvedPose);

  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        transform: `translate(${nudgeX}px, ${floatY}px) scale(${enter * breathScale}) rotate(${tiltDeg}deg)`,
        transformOrigin: "center bottom",
      }}
    >
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          filter: "drop-shadow(0 8px 16px rgba(43, 37, 32, 0.16))",
        }}
      />
    </div>
  );
};

/**
 * Mascot Chibi PNGTuber dẫn chuyện xuyên suốt ở mọi scene (kiểu "Game Cực Hay" & "snaptik"):
 * - Bản ngang (16:9): Neo nổi bật ở góc phải dưới (cỡ lớn 276px) như mascot của "Game Cực Hay",
 *   không che chữ bên trái, liên tục đổi biểu cảm (đọc sách, ăn bỏng ngô, chỉ tay, mắt sao, đổ mồ hôi...).
 * - Bản dọc (9:16): Neo nổi bật ở góc dưới (cỡ 236px) kèm nhãn vai nói năng động.
 */
export const SpeakerBadge: React.FC<{
  speaker?: string;
  pose?: CharacterPose;
  poses?: { after: string; pose: CharacterPose }[];
  outfit?: CharacterOutfit;
  episodeOutfit?: CharacterOutfit | "auto";
  part?: number;
  sceneType?: Scene["type"];
  narration?: string;
  words?: { text: string; startMs: number }[];
  sceneDurationInFrames?: number;
  sceneIndex?: number;
}> = ({
  speaker,
  pose,
  poses,
  outfit,
  episodeOutfit,
  part,
  sceneType,
  narration,
  words,
  sceneDurationInFrames,
  sceneIndex,
}) => {
  const L = useLayout();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const mascotRole: Role = resolveMascotRole(speaker);
  const voiceRole: Role = speaker === "ask" ? "ask" : "host";
  const { name, color } = CAST[mascotRole];

  const resolvedOutfit = resolveSonOutfit(outfit, episodeOutfit, part, sceneIndex);
  // Lịch tư thế: tối đa 3 tư thế một scene, mỗi lần đổi neo vào đúng lúc giọng nói tới
  // từ khoá. Lấy tư thế cuối cùng đã tới lượt.
  const timeline = resolvePoseTimeline({
    pose,
    poses,
    sceneType,
    narration,
    words,
    sceneDurationMs: ((sceneDurationInFrames ?? 0) / fps) * 1000,
    sceneIndex,
  });
  const nowMs = (frame / fps) * 1000;
  let step = 0;
  for (let i = 0; i < timeline.length; i++) if (nowMs >= timeline[i].atMs) step = i;
  const resolvedPose = timeline[step].pose;
  // Đổi tư thế bằng một nhịp mờ 200ms — thay sprite phụt một cái thì mắt đọc ra là giật.
  const swapIn =
    step === 0
      ? 1
      : interpolate(nowMs, [timeline[step].atMs, timeline[step].atMs + 200], [0.25, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  const pop = spring({ frame, fps, config: { damping: 14, mass: 0.65 }, durationInFrames: 18 });
  // 228 ở khổ dọc cho ra người cao 181px = 9,4% khung — ở cỡ đó mặt chỉ còn ~70px
  // trên điện thoại, đọc ra là sticker dán góc chứ không phải người đang dẫn chuyện.
  const size = L.s(L.vertical ? 300 : 276);

  // Nhân vật đã hiện hình thì không cần nhãn tên nữa: hai người khác nhau rõ ở dáng ngoài,
  // cộng thêm nền đổi màu khi tới lượt vai hỏi. Giữ `name` lại cho chỗ khác dùng, và để
  // bật lại nhãn chỉ cần đặt theme.showSpeakerName = true.
  const badgeText =
    voiceRole === "ask" ? `${name} · HỎI` : `${name} · DẪN CHUYỆN`;

  const label = !theme.showSpeakerName ? null : (
    <span
      style={{
        fontSize: L.s(18),
        fontWeight: 800,
        letterSpacing: L.s(2.2),
        color,
        whiteSpace: "nowrap",
        padding: `${L.s(4)}px ${L.s(14)}px`,
        borderRadius: L.s(999),
        backgroundColor: voiceRole === "ask" ? theme.askSoft : theme.paperDeep,
        border: `1.5px solid ${theme.rule}`,
        boxShadow: "0 2px 6px rgba(43, 37, 32, 0.08)",
      }}
    >
      {badgeText}
    </span>
  );

  if (L.vertical) {
    return (
      <div
        style={{
          position: "absolute",
          right: Math.round(L.padX * 0.55),
          bottom: Math.round(L.height * 0.012),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: L.s(2),
          transform: `scale(${pop})`,
        opacity: swapIn,
          transformOrigin: "right bottom",
          pointerEvents: "none",
        }}
      >
        <Avatar
          role={mascotRole}
          size={size}
          pose={resolvedPose}
          outfit={resolvedOutfit}
        />
        <div style={{ marginTop: -L.s(10) }}>{label}</div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        right: Math.round(L.padX * 0.42),
        width: size,
        bottom: L.s(18),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: L.s(2),
        transform: `scale(${pop})`,
        opacity: swapIn,
        transformOrigin: "right bottom",
        pointerEvents: "none",
      }}
    >
      <Avatar
        role={mascotRole}
        size={size}
        pose={resolvedPose}
        outfit={resolvedOutfit}
      />
      <div style={{ marginTop: -L.s(8) }}>{label}</div>
    </div>
  );
};
