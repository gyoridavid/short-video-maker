import z from "zod";

export enum MusicTagsEnum {
  cinematic = "cinematic",
  classical = "classical",
  pensive = "pensive",
  piano = "piano",
  dramatic = "dramatic",
  chill = "chill",
  lofi = "lo-fi",
  chillhop = "chillhop",
  energetic = "energetic",
  hiphop = "hip-hop",
  jazz = "jazz",
  smoothjazz = "smooth jazz",
  relaxing = "relaxing",
  softguitar = "soft guitar",
  corporate = "corporate",
  upbeat = "upbeat",
  inspiring = "inspiring",
  synthpop = "synth pop",
}

export type Scene = {
  captions: Caption[];
  video: string;
  audio: {
    dataUri: string;
    duration: number;
  };
};

export const sceneInput = z.object({
  text: z.string().describe("Text to be spoken in the video"),
  searchTerm: z
    .array(z.string())
    .describe(
      "Search term for video, max 2 words, at least 2-3 search terms should be provided for each scene",
    ),
});
export type SceneInput = z.infer<typeof sceneInput>;

export const renderConfig = z.object({
  paddingBack: z
    .number()
    .optional()
    .describe(
      "For how long the video should be playing after the speech is done, in milliseconds",
    ),
  music: z
    .nativeEnum(MusicTagsEnum)
    .optional()
    .describe("Music tag to be used to find the right music for the video"),
});
export type RenderConfig = z.infer<typeof renderConfig>;

export type Voices =
  | "af_heart"
  | "af_alloy"
  | "af_aoede"
  | "af_bella"
  | "af_jessica"
  | "af_kore"
  | "af_nicole"
  | "af_nova"
  | "af_river"
  | "af_sarah"
  | "af_sky"
  | "am_adam"
  | "am_echo"
  | "am_eric"
  | "am_fenrir"
  | "am_liam"
  | "am_michael"
  | "am_onyx"
  | "am_puck"
  | "am_santa"
  | "bf_emma"
  | "bf_isabella"
  | "bm_george"
  | "bm_lewis"
  | "bf_alice"
  | "bf_lily"
  | "bm_daniel"
  | "bm_fable";
export type Video = {
  id: string;
  url: string;
  width: number;
  height: number;
};
export type Caption = {
  text: string;
  startMs: number;
  endMs: number;
};

export type CaptionLine = {
  texts: Caption[];
};
export type CaptionPage = {
  startMs: number;
  endMs: number;
  lines: CaptionLine[];
};

export const createShortInput = z.object({
  scenes: z.array(sceneInput).describe("Each scene to be created"),
  config: renderConfig.describe("Configuration for rendering the video"),
});
export type CreateShortInput = z.infer<typeof createShortInput>;

export type VideoStatus = "processing" | "ready" | "failed";

export type MusicConfig = {
  file: string;
  duration: number;
  start: number;
  tags: MusicTag[];
};
export type Music = MusicConfig & {
  realDuration: number;
};

export type MusicTag = `${MusicTagsEnum}`;
