import React from "react";
import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";
import type { AudioManifest, Episode, EpisodeProps, Scene } from "./types";
import { theme } from "./theme";
import { Frame } from "./components/Frame";
import { Captions } from "./components/Captions";
import { SceneRenderer } from "./scenes";

/** Tag cảm xúc của Gemini là chỉ dẫn cho engine, không bao giờ hiện lên phụ đề. */
const stripTags = (t: string) => t.replace(/<[^>]{1,24}>/g, " ").replace(/\s+/g, " ").trim();

/** Ước lượng thời lượng khi chưa có audio (để xem trước trong Studio). */
const estimateSeconds = (narration: string, type?: string) =>
  type === "endcard" ? 3.0 : Math.max(2.5, narration.length / 15.5);

export const scenesOfPart = (episode: Episode, part?: number | null) => {
  // part == null nghĩa là bản 16:9 đầy đủ; có part là một video dọc cho TikTok.
  const vertical = part != null;
  return episode.scenes.filter((s) => {
    const where = s.renderIn ?? "all";
    if (where === "vertical" && !vertical) return false;
    if (where === "horizontal" && vertical) return false;
    return vertical ? (s.part ?? 1) === part : true;
  });
};

export const partsOf = (episode: Episode) => {
  const set = new Set(episode.scenes.map((s) => s.part ?? 1));
  return Array.from(set).sort((a, b) => a - b);
};

export const sceneDurationsInFrames = (
  scenes: Scene[],
  manifest: AudioManifest | null,
  fps: number,
) =>
  scenes.map((scene) => {
    const entry = manifest?.scenes?.[scene.id];
    const seconds = entry?.durationSeconds ?? estimateSeconds(scene.narration, scene.type);
    const tail = scene.tailSeconds ?? theme.defaultTailSeconds;
    return Math.max(1, Math.round((seconds + tail) * fps));
  });

export const calculateEpisodeMetadata: CalculateMetadataFunction<EpisodeProps> = async ({
  props,
}) => {
  let manifest: AudioManifest | null = null;
  try {
    const res = await fetch(staticFile(`voice/${props.episode.id}/manifest.json`));
    if (res.ok) manifest = (await res.json()) as AudioManifest;
  } catch {
    manifest = null;
  }

  const scenes = scenesOfPart(props.episode, props.part);
  const durations = sceneDurationsInFrames(scenes, manifest, theme.fps);

  return {
    durationInFrames: durations.reduce((a, b) => a + b, 0),
    props: { ...props, manifest },
  };
};

/**
 * Hiệu ứng âm thanh của một scene. Mỗi tiếng gắn vào một sự kiện người xem nhìn thấy:
 * whoosh lúc chuyển cảnh, pop lúc một bullet hiện ra, block lúc một khối sơ đồ bật lên.
 * Mốc lấy từ chính cues của animation nên tiếng và hình luôn trùng nhau.
 *
 * Bộ tiếng sinh bằng `python -I -X utf8 scripts/make_sfx.py` và nằm trong dải
 * 800Hz - 4kHz. Lý do viết rõ ở đầu script đó: dưới 300Hz loa điện thoại không phát,
 * nên bộ tiếng đầu tiên đặt ở 52Hz đo đỉnh rất to mà người xem không nghe được gì.
 */
const SFX_LEAD_MS = 220; // animation vào sớm hơn lời nói đúng chừng này

// Bốn cao độ đi lên: bullet thứ nhất tới thứ tư nghe thành một câu nhạc, không phải bốn tiếng giống nhau.
const POP = ["pop1", "pop2", "pop3", "pop4"].map((n) => `sfx/ui/${n}.mp3`);
const BLOCK = ["block1", "block2", "block3", "block4"].map((n) => `sfx/ui/${n}.mp3`);

/** Mức trộn: đỉnh mỗi file đã chuẩn hoá về -1dBFS, nên các số này là mức nghe thật. */
const SFX_VOLUME = {
  pop: 0.38,
  block: 0.42,
  whoosh: 0.34,
  ask: 0.34,
  hook: 0.62,
  endcard: 0.62,
};

const SceneSfx: React.FC<{ scene: Scene; first: boolean; cues?: number[] }> = ({
  scene,
  first,
  cues,
}) => {
  const { fps } = useVideoConfig();
  const frameAt = (ms: number) => Math.max(0, Math.round(((ms - SFX_LEAD_MS) / 1000) * fps));
  const hit = (key: string, src: string, volume: number, from = 0) => (
    <Sequence
      key={key}
      from={from}
      durationInFrames={Math.round(fps * 3)}
      name={`sfx ${key}`}
    >
      <Audio src={staticFile(src)} volume={volume} />
    </Sequence>
  );

  if (scene.type === "hook") return hit("hook", "sfx/ui/hook-sting.mp3", SFX_VOLUME.hook);
  if (scene.type === "endcard") return hit("endcard", "sfx/ui/endcard.mp3", SFX_VOLUME.endcard);

  const sounds: React.ReactNode[] = [];
  if (!first) sounds.push(hit("whoosh", "sfx/ui/whoosh.mp3", SFX_VOLUME.whoosh));
  // Giọng hỏi vào thì đổi màu nền; thêm một chuông nhẹ để tai cũng nhận ra, không chỉ mắt.
  if (scene.speaker === "ask") sounds.push(hit("ask", "sfx/ui/ask-chime.mp3", SFX_VOLUME.ask));

  const beats = cues ?? [];
  if (scene.type === "bullets") {
    beats.forEach((ms, k) =>
      sounds.push(hit(`pop-${k}`, POP[k % POP.length], SFX_VOLUME.pop, frameAt(ms))),
    );
  } else if (scene.type === "diagram") {
    beats.forEach((ms, k) =>
      sounds.push(hit(`block-${k}`, BLOCK[k % BLOCK.length], SFX_VOLUME.block, frameAt(ms))),
    );
  } else if (scene.type === "image" || scene.type === "formula") {
    // Hình trích từ slide và công thức chỉ hiện một lần — một tiếng đặt xuống là đủ.
    sounds.push(hit("land", BLOCK[1], SFX_VOLUME.block, frameAt(420)));
  }

  return <>{sounds}</>;
};

export const EpisodeVideo: React.FC<EpisodeProps> = ({ episode, manifest, part }) => {
  const scenes = scenesOfPart(episode, part);
  const durations = sceneDurationsInFrames(scenes, manifest, theme.fps);
  const total = durations.reduce((a, b) => a + b, 0);
  const parts = partsOf(episode);
  const episodeLabel =
    part == null
      ? `${scenes.length} phần`
      : `Phần ${parts.indexOf(part) + 1}/${parts.length}`;

  let offset = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.paper }}>
      {scenes.map((scene: Scene, i: number) => {
        const from = offset;
        const durationInFrames = durations[i];
        offset += durationInFrames;
        const entry = manifest?.scenes?.[scene.id];

        return (
          <Sequence
            key={scene.id}
            from={from}
            durationInFrames={durationInFrames}
            name={`${scene.id} · ${scene.type}`}
          >
            {entry ? <Audio src={staticFile(entry.file)} /> : null}
            {episode.sfx !== false ? (
              <SceneSfx scene={scene} first={i === 0} cues={entry?.cues} />
            ) : null}
            <Frame
              chapter={episode.seriesTitle}
              episodeLabel={part == null ? `Tập ${episode.episodeNumber}` : episodeLabel}
              sceneDurationInFrames={durationInFrames}
              progress={(from + durationInFrames / 2) / Math.max(total, 1)}
              speaker={scene.speaker}
              pose={scene.pose}
              poses={scene.poses}
              outfit={scene.outfit}
              episodeOutfit={episode.outfit}
              part={scene.part ?? part ?? 1}
              sceneType={scene.type}
              narration={scene.narration}
              words={entry?.words}
              sceneIndex={i}
              showBadge={
                scene.type !== "hook" &&
                scene.type !== "endcard" &&
                scene.type !== "question"
              }
            >
              <SceneRenderer
                scene={scene}
                durationInFrames={durationInFrames}
                cues={entry?.cues}
                sceneIndex={i}
                episodeOutfit={episode.outfit}
              />
              <Captions words={entry?.words} fallbackText={stripTags(scene.narration)} />
            </Frame>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
