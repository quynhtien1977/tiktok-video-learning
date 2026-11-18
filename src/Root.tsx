import "./index.css";
import React from "react";
import { Composition } from "remotion";
import { EpisodeVideo, calculateEpisodeMetadata, partsOf } from "./Episode";
import { theme } from "./theme";
import type { Episode } from "./types";

// Thêm 1 dòng import cho mỗi tập mới. Tên theo chương: cCCeEE (c18e01 = Chapter 18, tập 1)
import ep00 from "../content/ep00.json";
import c18e01 from "../content/c18e01.json";
import c18e02 from "../content/c18e02.json";
import c18e03 from "../content/c18e03.json";
import c18e04 from "../content/c18e04.json";
import c18e05 from "../content/c18e05.json";
import c18e06 from "../content/c18e06.json";

const episodes = [c18e01, c18e02, c18e03, c18e04, c18e05, c18e06, ep00] as unknown as Episode[];

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
