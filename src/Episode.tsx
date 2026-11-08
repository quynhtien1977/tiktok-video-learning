import React from "react";
import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
  Sequence,
  staticFile,
} from "remotion";
import type { AudioManifest, Episode, EpisodeProps, Scene } from "./types";
import { theme } from "./theme";
import { Frame } from "./components/Frame";
import { Captions } from "./components/Captions";
import { SceneRenderer } from "./scenes";

/** Tag cảm xúc của Gemini là chỉ dẫn cho engine, không bao giờ hiện lên phụ đề. */
const stripTags = (t: string) => t.replace(/<[^>]{1,24}>/g, " ").replace(/\s+/g, " ").trim();

/** Ước lượng thời lượng khi chưa có audio (để xem trước trong Studio). */
const estimateSeconds = (narration: string) => Math.max(2.5, narration.length / 15.5);

export const scenesOfPart = (episode: Episode, part?: number | null) =>
  part == null ? episode.scenes : episode.scenes.filter((s) => (s.part ?? 1) === part);

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
    const seconds = entry?.durationSeconds ?? estimateSeconds(scene.narration);
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
            <Frame
              chapter={episode.seriesTitle}
              episodeLabel={part == null ? `Tập ${episode.episodeNumber}` : episodeLabel}
              sceneDurationInFrames={durationInFrames}
              progress={(from + durationInFrames / 2) / Math.max(total, 1)}
              speaker={scene.speaker}
            >
              <SceneRenderer
                scene={scene}
                durationInFrames={durationInFrames}
                cues={entry?.cues}
              />
              <Captions words={entry?.words} fallbackText={stripTags(scene.narration)} />
            </Frame>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
