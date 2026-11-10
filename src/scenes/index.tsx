import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import katex from "katex";
import "katex/dist/katex.min.css";
import type { CharacterOutfit, Scene } from "../types";
import { theme, useLayout } from "../theme";
import {
  Avatar,
  CAST,
  resolveCharacterPose,
  resolveMascotRole,
  resolveSonOutfit,
} from "../components/SpeakerBadge";
import { diagrams } from "../diagrams";

/** Cột nội dung: lề rộng như trang sách, chừa đáy cho phụ đề. */
const Page: React.FC<{ children: React.ReactNode; center?: boolean; anchorTop?: boolean }> = ({
  children,
  center,
  anchorTop,
}) => {
  const L = useLayout();
  return (
    <AbsoluteFill
      style={{
        padding: center
          ? `${Math.round(L.height * 0.11)}px ${L.padX}px ${Math.round(L.height * 0.18)}px`
          : `${L.padTop}px ${L.padX}px ${Math.round(L.height * 0.22)}px`,
        justifyContent: anchorTop ? "flex-start" : "center",
        alignItems: "stretch",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const Heading: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const L = useLayout();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 18 });
  return (
    <h2
      style={{
        fontSize: L.s(60),
        fontWeight: 800,
        letterSpacing: "-0.02em",
        lineHeight: 1.12,
        margin: 0,
        maxWidth: L.vertical ? "100%" : "80%",
        opacity: t,
        transform: `translateY(${interpolate(t, [0, 1], [14, 0])}px)`,
      }}
    >
      {children}
    </h2>
  );
};

/** Tiêu đề tập: chữ dâng lên từ dưới một đường kẻ, kiểu trang bìa sách. */
const TitleScene: React.FC<{ scene: Extract<Scene, { type: "title" }> }> = ({ scene }) => {
  const L = useLayout();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 26 });
  const rule = interpolate(t, [0, 1], [0, 1]);
  return (
    <Page anchorTop>
      <div style={{ marginTop: L.vertical ? L.height * 0.16 : L.height * 0.1 }}>
        <div
          style={{
            height: 4,
            width: `${rule * (L.vertical ? 46 : 28)}%`,
            backgroundColor: theme.accent,
            marginBottom: L.s(44),
          }}
        />
        <div style={{ overflow: "hidden" }}>
          <h1
            style={{
              fontSize: L.s(96),
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              margin: 0,
              transform: `translateY(${interpolate(t, [0, 1], [100, 0])}%)`,
            }}
          >
            {scene.title}
          </h1>
        </div>
        {scene.subtitle ? (
          <p
            style={{
              fontSize: L.s(34),
              color: theme.inkSoft,
              marginTop: L.s(28),
              opacity: interpolate(t, [0.4, 1], [0, 1], { extrapolateLeft: "clamp" }),
            }}
          >
            {scene.subtitle}
          </p>
        ) : null}
      </div>
    </Page>
  );
};

/**
 * Bullet hiện ra đúng lúc người giảng nói tới nó: mốc lấy từ timing lời nói
 * (manifest.cues), lùi trước một nhịp ngắn để chữ kịp vào trước tiếng.
 */
const LEAD_MS = 220;

const cueFrame = (cues: number[] | undefined, i: number, fps: number, fallback: number) =>
  cues && cues[i] != null ? Math.max(0, ((cues[i] - LEAD_MS) / 1000) * fps) : fallback;

const BulletsScene: React.FC<{
  scene: Extract<Scene, { type: "bullets" }>;
  durationInFrames: number;
  cues?: number[];
}> = ({ scene, durationInFrames, cues }) => {
  const L = useLayout();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const step = (durationInFrames * 0.62) / Math.max(scene.bullets.length, 1);

  return (
    <Page>
      <div>
      <Heading>{scene.heading}</Heading>
      <div
        style={{
          marginTop: L.s(52),
          display: "flex",
          flexDirection: "column",
          gap: L.s(30),
        }}
      >
        {scene.bullets.map((b, i) => {
          const t = spring({
            frame: frame - cueFrame(cues, i, fps, 10 + i * step),
            fps,
            config: { damping: 200 },
            durationInFrames: 18,
          });
          return (
            <div
              key={i}
              style={{
                display: "flex",
                gap: L.s(26),
                alignItems: "baseline",
                opacity: t,
                transform: `translateX(${interpolate(t, [0, 1], [-22, 0])}px)`,
              }}
            >
              <span
                style={{
                  fontSize: L.s(38),
                  fontWeight: 700,
                  color: theme.accent,
                  minWidth: L.s(32),
                }}
              >
                {i + 1}
              </span>
              <p
                style={{
                  fontSize: L.s(40),
                  lineHeight: 1.35,
                  margin: 0,
                  maxWidth: L.vertical ? "100%" : "78%",
                }}
              >
                {b}
              </p>
            </div>
          );
        })}
      </div>
      </div>
    </Page>
  );
};

const FormulaScene: React.FC<{ scene: Extract<Scene, { type: "formula" }> }> = ({ scene }) => {
  const L = useLayout();
  const html = katex.renderToString(scene.latex, { throwOnError: false, displayMode: true });
  return (
    <Page center>
      <div>
        {scene.heading ? <Heading>{scene.heading}</Heading> : null}
        <div
          style={{ marginTop: L.s(44), fontSize: L.s(52), color: theme.ink }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {scene.caption ? (
          <p style={{ fontSize: L.s(30), color: theme.inkSoft, marginTop: L.s(36) }}>
            {scene.caption}
          </p>
        ) : null}
      </div>
    </Page>
  );
};

/** Ảnh sơ đồ gốc từ slide: nền trắng của nó hoà thẳng vào giấy, chỉ cần bóng rất nhẹ. */
const ImageScene: React.FC<{ scene: Extract<Scene, { type: "image" }> }> = ({ scene }) => {
  const L = useLayout();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 22 });
  const scale = interpolate(frame, [0, 300], [1, 1.035], { extrapolateRight: "clamp" });
  return (
    <Page center>
      <div style={{ textAlign: "center", opacity: t }}>
        <Img
          src={scene.src.startsWith("http") ? scene.src : staticFile(scene.src)}
          style={{
            maxWidth: "100%",
            maxHeight: L.vertical ? L.height * 0.42 : L.height * 0.56,
            objectFit: "contain",
            transform: `scale(${scale * interpolate(t, [0, 1], [0.97, 1])})`,
            // Sơ đồ trích từ slide có nền trắng: nhân màu để nền biến mất,
            // chỉ còn nét mực nằm thẳng trên giấy — không cần bọc card.
            mixBlendMode: "multiply",
          }}
        />
        {scene.caption ? (
          <p style={{ fontSize: L.s(28), color: theme.inkSoft, marginTop: L.s(34) }}>
            {scene.caption}
          </p>
        ) : null}
      </div>
    </Page>
  );
};

/** Sơ đồ vẽ lại bằng code, dựng dần theo lời giảng. */
const DiagramScene: React.FC<{
  scene: Extract<Scene, { type: "diagram" }>;
  durationInFrames: number;
  cues?: number[];
}> = ({ scene, durationInFrames, cues }) => {
  const L = useLayout();
  const Component = diagrams[scene.name];
  if (!Component) {
    return (
      <Page center>
        <p style={{ fontSize: L.s(34), color: theme.accent }}>
          Chưa có sơ đồ tên “{scene.name}” trong src/diagrams
        </p>
      </Page>
    );
  }
  return (
    <Page center>
      <div>
        {scene.heading ? (
          <h2
            style={{
              fontSize: L.s(40),
              fontWeight: 700,
              margin: `0 0 ${L.s(20)}px`,
              color: theme.ink,
              textAlign: "left",
            }}
          >
            {scene.heading}
          </h2>
        ) : null}
        <div style={{ height: L.vertical ? L.height * 0.6 : L.height * 0.66 }}>
          <Component
            durationInFrames={durationInFrames}
            vertical={L.vertical}
            cues={cues}
          />
        </div>
      </div>
    </Page>
  );
};

const QuoteScene: React.FC<{ scene: Extract<Scene, { type: "quote" }> }> = ({ scene }) => {
  const L = useLayout();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 24 });
  return (
    <Page center>
      <div style={{ opacity: t }}>
        <p
          style={{
            fontSize: L.s(52),
            fontWeight: 600,
            lineHeight: 1.3,
            margin: 0,
            maxWidth: L.vertical ? "100%" : "86%",
            borderTop: `2px solid ${theme.rule}`,
            borderBottom: `2px solid ${theme.rule}`,
            padding: `${L.s(40)}px 0`,
          }}
        >
          {scene.text}
        </p>
        {scene.author ? (
          <p style={{ fontSize: L.s(28), color: theme.inkSoft, marginTop: L.s(26) }}>
            {scene.author}
          </p>
        ) : null}
      </div>
    </Page>
  );
};

/**
 * Câu hỏi của vai SON (ask): giấy đổi màu ở Frame, nhân vật bán thân hiện lớn cùng cử chỉ
 * (ôm má tò mò / chống cằm suy tư / chạm vành mũ) bên cạnh câu hỏi phản biện.
 */
const QuestionScene: React.FC<{
  scene: Extract<Scene, { type: "question" }>;
  sceneIndex?: number;
  episodeOutfit?: CharacterOutfit | "auto";
}> = ({ scene, sceneIndex, episodeOutfit }) => {
  const L = useLayout();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({ frame, fps, config: { damping: 180 }, durationInFrames: 20 });
  const role = scene.speaker === "host" ? "host" : "ask";
  const outfit = resolveSonOutfit(scene.outfit, episodeOutfit, scene.part, sceneIndex);
  const pose = resolveCharacterPose({
    pose: scene.pose,
    sceneType: "question",
    narration: scene.narration,
  });
  const charSize = L.s(L.vertical ? 340 : 340);

  // Nhân vật đã hiện hình nên không cần nhãn tên: nền đổi màu và người đổi mặt là đủ.
  // Bật lại bằng theme.showSpeakerName — xem ghi chú trong SpeakerBadge.tsx.
  const badgeTag = !theme.showSpeakerName ? null : (
    <span
      style={{
        display: "inline-block",
        fontSize: L.s(20),
        fontWeight: 800,
        letterSpacing: L.s(3),
        color: CAST[role].color,
        padding: `${L.s(4)}px ${L.s(14)}px`,
        borderRadius: L.s(999),
        backgroundColor: CAST[role].soft,
        border: `1.5px solid ${theme.rule}`,
      }}
    >
      {CAST[role].name} · HỎI
    </span>
  );

  if (L.vertical) {
    return (
      <Page center>
        <div
          style={{
            opacity: t,
            transform: `scale(${interpolate(t, [0, 1], [0.965, 1])})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: L.s(18),
              marginBottom: L.s(24),
            }}
          >
            <Avatar
              role={role}
              size={charSize}
              pose={pose}
              outfit={outfit}
            />
            <div style={{ marginBottom: L.s(18) }}>{badgeTag}</div>
          </div>
          <p
            style={{
              fontSize: L.s(64),
              fontWeight: 800,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              margin: 0,
              color: theme.ask,
              maxWidth: "100%",
            }}
          >
            {scene.question}
          </p>
          {scene.hint ? (
            <p style={{ fontSize: L.s(28), color: theme.inkSoft, marginTop: L.s(26) }}>
              {scene.hint}
            </p>
          ) : null}
        </div>
      </Page>
    );
  }

  return (
    <Page center>
      <div
        style={{
          opacity: t,
          transform: `scale(${interpolate(t, [0, 1], [0.965, 1])})`,
          display: "flex",
          alignItems: "center",
          gap: L.s(56),
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: L.s(10),
            flexShrink: 0,
          }}
        >
          <Avatar
            role={role}
            size={charSize}
            pose={pose}
            outfit={outfit}
          />
          {badgeTag}
        </div>
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontSize: L.s(66),
              fontWeight: 800,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              margin: 0,
              color: theme.ask,
              maxWidth: "92%",
            }}
          >
            {scene.question}
          </p>
          {scene.hint ? (
            <p style={{ fontSize: L.s(28), color: theme.inkSoft, marginTop: L.s(30) }}>
              {scene.hint}
            </p>
          ) : null}
        </div>
      </div>
    </Page>
  );
};

const OutroScene: React.FC<{ scene: Extract<Scene, { type: "outro" }> }> = ({ scene }) => {
  const L = useLayout();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 22 });
  return (
    <Page center>
      <div style={{ opacity: t }}>
        <Heading>{scene.heading}</Heading>
        {scene.points ? (
          <ol
            style={{
              margin: `${L.s(40)}px 0 0`,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: L.s(22),
            }}
          >
            {scene.points.map((p, i) => (
              <li key={i} style={{ fontSize: L.s(36), lineHeight: 1.35, display: "flex", gap: L.s(20) }}>
                <span style={{ color: theme.accent, fontWeight: 700 }}>{i + 1}</span>
                <span>{p}</span>
              </li>
            ))}
          </ol>
        ) : null}
        {scene.next ? (
          <p
            style={{
              fontSize: L.s(34),
              color: theme.accent,
              marginTop: L.s(44),
              paddingTop: L.s(26),
              borderTop: `2px solid ${theme.rule}`,
              fontWeight: 600,
            }}
          >
            {scene.next}
          </p>
        ) : null}
      </div>
    </Page>
  );
};

/**
 * Hook mở đầu một video dọc. Người lướt TikTok rơi thẳng vào đây, không có bối cảnh,
 * nên câu này phải tự đứng được và đọc hết trong 2–4 giây.
 */
/**
 * Hook mở đầu một video dọc. Hai nhịp, cố ý:
 * nhịp một là câu hỏi tạo khoảng trống kiến thức, nhịp hai là lời hứa "xem xong làm được gì".
 * Chỉ có nhịp một thì người xem biết mình chưa biết, nhưng không biết ở lại thì được gì.
 * Nhân vật to hẳn ở đây vì màn hình còn trống — đây là chỗ nhân vật đáng tiền nhất.
 */
const HookScene: React.FC<{
  scene: Extract<Scene, { type: "hook" }>;
  durationInFrames: number;
  sceneIndex?: number;
  episodeOutfit?: CharacterOutfit | "auto";
}> = ({ scene, durationInFrames, sceneIndex, episodeOutfit }) => {
  const L = useLayout();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({ frame, fps, config: { damping: 170 }, durationInFrames: 16 });
  // nhịp hai vào ở 42% thời lượng scene: đủ để câu hỏi kịp đọng, chưa đủ để người xem lướt
  const beat2 = spring({
    frame: frame - Math.round(durationInFrames * 0.42),
    fps,
    config: { damping: 170 },
    durationInFrames: 16,
  });
  const bob = Math.sin(frame / 9) * L.s(5);
  const role = resolveMascotRole(scene.speaker);
  const outfit = resolveSonOutfit(scene.outfit, episodeOutfit, scene.part, sceneIndex);
  const pose = resolveCharacterPose({
    pose: scene.pose,
    sceneType: "hook",
    narration: scene.narration,
  });

  return (
    <Page center>
      <div style={{ opacity: t, transform: `translateY(${interpolate(t, [0, 1], [26, 0])}px)` }}>
        <div style={{ transform: `translateY(${bob}px)`, marginBottom: L.s(28) }}>
          <Avatar
            role={role}
            size={L.s(360)}
            pose={pose}
            outfit={outfit}
          />
        </div>
        <div
          style={{
            height: 5,
            width: `${interpolate(t, [0, 1], [0, 34])}%`,
            backgroundColor: theme.accent,
            marginBottom: L.s(32),
          }}
        />
        <p
          style={{
            fontSize: L.s(74),
            fontWeight: 800,
            letterSpacing: "-0.025em",
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          {scene.hook}
        </p>
        {scene.promise ? (
          <p
            style={{
              fontSize: L.s(40),
              fontWeight: 600,
              lineHeight: 1.3,
              color: theme.accent,
              margin: `${L.s(30)}px 0 0`,
              opacity: beat2,
              transform: `translateY(${interpolate(beat2, [0, 1], [20, 0])}px)`,
            }}
          >
            {scene.promise}
          </p>
        ) : null}
        {scene.context ? (
          <p style={{ fontSize: L.s(28), color: theme.inkSoft, marginTop: L.s(28) }}>
            {scene.context}
          </p>
        ) : null}
      </div>
    </Page>
  );
};

/**
 * Thẻ kết của một video dọc: trỏ sang phần sau. Có lời thoại — thẻ kết im lặng thì mất
 * đúng hai giây quan trọng nhất cho việc kêu gọi theo dõi.
 */
const EndCardScene: React.FC<{
  scene: Extract<Scene, { type: "endcard" }>;
  durationInFrames: number;
  episodeOutfit?: CharacterOutfit | "auto";
}> = ({ scene, durationInFrames, episodeOutfit }) => {
  const L = useLayout();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 18 });
  const ctaIn = spring({
    frame: frame - Math.round(durationInFrames * 0.45),
    fps,
    config: { damping: 200 },
    durationInFrames: 14,
  });
  // tay vẫy qua lại suốt thẻ kết, tốc độ chậm để không giật
  const wave = (Math.sin(frame / 6) + 1) / 2;
  const role = resolveMascotRole(scene.speaker);
  const outfit = resolveSonOutfit(scene.outfit, episodeOutfit, scene.part);
  const pose = resolveCharacterPose({
    pose: scene.pose,
    sceneType: "endcard",
    narration: scene.narration,
  });

  return (
    <Page center>
      <div style={{ opacity: t }}>
        <div style={{ marginBottom: L.s(26) }}>
          <Avatar
            role={role}
            size={L.s(340)}
            wave={wave}
            pose={pose}
            outfit={outfit}
          />
        </div>
        <p
          style={{
            fontSize: L.s(30),
            letterSpacing: L.s(3),
            textTransform: "uppercase",
            color: theme.accent,
            margin: 0,
          }}
        >
          Phần sau
        </p>
        <p
          style={{
            fontSize: L.s(58),
            fontWeight: 800,
            lineHeight: 1.2,
            margin: `${L.s(22)}px 0 0`,
            transform: `translateX(${interpolate(t, [0, 1], [-18, 0])}px)`,
          }}
        >
          {scene.next}
        </p>
        <div
          style={{
            marginTop: L.s(36),
            paddingTop: L.s(22),
            borderTop: `2px solid ${theme.rule}`,
            opacity: ctaIn,
          }}
        >
          <span style={{ fontSize: L.s(34), fontWeight: 700, color: theme.ink }}>
            {scene.cta ?? "Theo dõi để xem tiếp"}
          </span>
          <div
            style={{
              height: 4,
              marginTop: L.s(10),
              width: `${ctaIn * 100}%`,
              maxWidth: L.s(300),
              backgroundColor: theme.accent,
            }}
          />
        </div>
      </div>
    </Page>
  );
};

export const SceneRenderer: React.FC<{
  scene: Scene;
  durationInFrames: number;
  cues?: number[];
  sceneIndex?: number;
  episodeOutfit?: CharacterOutfit | "auto";
}> = ({ scene, durationInFrames, cues, sceneIndex, episodeOutfit }) => {
  switch (scene.type) {
    case "title":
      return <TitleScene scene={scene} />;
    case "bullets":
      return <BulletsScene scene={scene} durationInFrames={durationInFrames} cues={cues} />;
    case "formula":
      return <FormulaScene scene={scene} />;
    case "image":
      return <ImageScene scene={scene} />;
    case "diagram":
      return <DiagramScene scene={scene} durationInFrames={durationInFrames} cues={cues} />;
    case "quote":
      return <QuoteScene scene={scene} />;
    case "question":
      return (
        <QuestionScene
          scene={scene}
          sceneIndex={sceneIndex}
          episodeOutfit={episodeOutfit}
        />
      );
    case "hook":
      return (
        <HookScene
          scene={scene}
          durationInFrames={durationInFrames}
          sceneIndex={sceneIndex}
          episodeOutfit={episodeOutfit}
        />
      );
    case "endcard":
      return (
        <EndCardScene
          scene={scene}
          durationInFrames={durationInFrames}
          episodeOutfit={episodeOutfit}
        />
      );
    case "outro":
      return <OutroScene scene={scene} />;
    default:
      return null;
  }
};
