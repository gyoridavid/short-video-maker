/* eslint-disable @remotion/deterministic-randomness */
import { logger } from "../../logger";
import type { Video } from "../../types/shorts";

const jokerTerms: string[] = ["nature", "globe", "space", "ocean"];
const durationBufferSeconds = 3;

export class PexelsAPI {
  constructor(private API_KEY: string) {}

  private async _findVideo(
    searchTerm: string,
    minDurationSeconds: number,
    excludeIds: string[],
  ): Promise<Video> {
    if (!this.API_KEY) {
      throw new Error("API key not set");
    }
    const headers = new Headers();
    headers.append("Authorization", this.API_KEY);
    const response = await fetch(
      `https://api.pexels.com/videos/search?orientation=portrait&size=medium&per_page=80&query=${encodeURIComponent(searchTerm)}`,
      {
        method: "GET",
        headers,
        redirect: "follow",
      },
    )
      .then((res) => res.json())
      .catch((err) => {
        logger.error(err, "Error fetching videos from Pexels API");
        throw err;
      });
    const videos = response.videos as {
      id: string;
      duration: number;
      video_files: {
        fps: number;
        quality: string;
        width: number;
        height: number;
        id: string;
        link: string;
      }[];
    }[];

    if (!videos || videos.length === 0) {
      logger.error({ searchTerm }, "No videos found in Pexels API");
      throw new Error("No videos found");
    }

    // find all the videos that fits the criteria, then select one randomly
    const filteredVideos = videos
      .map((video) => {
        if (excludeIds.includes(video.id)) {
          return;
        }
        if (!video.video_files.length) {
          return;
        }

        // calculate the real duration of the video by converting the FPS to 25
        const fps = video.video_files[0].fps;
        const duration = video.duration * (fps / 25);

        if (duration >= minDurationSeconds + durationBufferSeconds) {
          for (const file of video.video_files) {
            if (
              file.quality === "hd" &&
              file.width === 1080 &&
              file.height === 1920
            ) {
              return {
                id: video.id,
                url: file.link,
                width: file.width,
                height: file.height,
              };
            }
          }
        }
      })
      .filter(Boolean);
    if (!filteredVideos.length) {
      logger.error({ searchTerm }, "No videos found in Pexels API");
      throw new Error("No videos found");
    }

    return filteredVideos[
      Math.floor(Math.random() * filteredVideos.length)
    ] as Video;
  }

  async findVideo(
    searchTerms: string[],
    minDurationSeconds: number,
    excludeIds: string[],
  ): Promise<Video> {
    // shuffle the search terms to randomize the search order
    const shuffledJollyJokerTerms = jokerTerms.sort(() => Math.random() - 0.5);
    const shuffledSearchTerms = searchTerms.sort(() => Math.random() - 0.5);

    for (const searchTerm of [
      ...shuffledSearchTerms,
      ...shuffledJollyJokerTerms,
    ]) {
      try {
        return await this._findVideo(
          searchTerm,
          minDurationSeconds,
          excludeIds,
        );
      } catch (e) {
        logger.error(
          { error: e, term: searchTerm },
          "Error finding video in Pexels API for term",
        );
      }
    }
    logger.error(
      { searchTerms },
      "No videos found in Pexels API for the given terms",
    );
    throw new Error("No videos found in Pexels API");
  }
}
