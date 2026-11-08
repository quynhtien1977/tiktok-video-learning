import "./index.css";
import React from "react";
import { Composition } from "remotion";
import { EpisodeVideo, calculateEpisodeMetadata, partsOf } from "./Episode";
import { theme } from "./theme";
import type { Episode } from "./types";

// Thêm 1 dòng import cho mỗi tập mới
import ep00 from "../content/ep00.json";
import ep01 from "../content/ep01.json";

const episodes = [ep01, ep00] as unknown as Episode[];

/**
 * Mỗi tập sinh ra:
 *   <id>          bản đầy đủ 16:9  (YouTube / ôn tập)
 *   <id>-v-pN     từng phần 9:16   (TikTok), chỉ khi tập có đánh dấu part
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      {episodes.map((episode) => {
        const parts = partsOf(episode);
        return (
          <React.Fragment key={episode.id}>
            <Composition
              id={episode.id}
              component={EpisodeVideo}
              durationInFrames={30 * 60}
              fps={theme.fps}
              width={theme.width}
              height={theme.height}
              defaultProps={{ episode, manifest: null, part: null }}
              calculateMetadata={calculateEpisodeMetadata}
            />
            {parts.length > 1
              ? parts.map((part) => (
                  <Composition
                    key={`${episode.id}-v-p${part}`}
                    id={`${episode.id}-v-p${part}`}
                    component={EpisodeVideo}
                    durationInFrames={30 * 60}
                    fps={theme.fps}
                    width={1080}
                    height={1920}
                    defaultProps={{ episode, manifest: null, part }}
                    calculateMetadata={calculateEpisodeMetadata}
                  />
                ))
              : null}
          </React.Fragment>
        );
      })}
    </>
  );
};
