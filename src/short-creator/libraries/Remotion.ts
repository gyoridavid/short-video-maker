import z from "zod";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, RenderMediaOnProgress } from "@remotion/renderer";
import path from "path";
import { ensureBrowser } from "@remotion/renderer";

import { Config } from "../../config";
import { shortVideoSchema } from "../../components/utils";
import { logger } from "../../logger";
import { OrientationEnum } from "../../types/shorts";
import { getOrientationConfig } from "../../components/utils";

// the component to render; it's not configurable (yet?)
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export class Remotion {
  constructor(
    private bundled: string,
    private config: Config,
  ) {}

  static async init(config: Config): Promise<Remotion> {
    try {
      await ensureBrowser();
      logger.debug("Browser instance ensured successfully");

      const bundled = await bundle({
          entryPoint: path.join(
          config.packageDirPath,
          config.devMode ? "src" : "dist",
          "components",
          "root",
          `index.${config.devMode ? "ts" : "js"}`,
        ),
      });
      logger.debug("Remotion bundle created successfully");
      return new Remotion(bundled, config);
    } catch (error) {
      logger.error({ error }, "Failed to initialize Remotion");
      throw error;
    }
  }

  private async renderWithRetry(
    composition: any,
    outputLocation: string,
    data: z.infer<typeof shortVideoSchema>,
    onProgress: RenderMediaOnProgress | undefined,
    retryCount = 0,
  ): Promise<void> {
    try {
      await renderMedia({
        codec: "h264",
        composition,
        serveUrl: this.bundled,
        outputLocation,
        inputProps: data,
        onProgress,
        concurrency: this.config.concurrency ?? 1,
        offthreadVideoCacheSizeInBytes: this.config.videoCacheSizeInBytes,
        timeoutInMilliseconds: 30000,
      });
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        logger.warn(
          { error, retryCount, outputLocation },
          "Render failed, retrying after delay",
        );
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        return this.renderWithRetry(composition, outputLocation, data, onProgress, retryCount + 1);
      }
      logger.error({ error, outputLocation, retryCount }, "Render failed after max retries");
      throw error;
    }
  }

  async render(
    data: z.infer<typeof shortVideoSchema>,
    id: string,
    orientation: OrientationEnum,
  ) {
    try {
      const { component } = getOrientationConfig(orientation);

      const composition = await selectComposition({
        serveUrl: this.bundled,
        id: component,
        inputProps: data,
      });

      logger.debug(
        { component, videoID: id, orientation },
        "Rendering video with Remotion",
      );

      const outputLocation = path.join(this.config.videosDirPath, `${id}.mp4`);
      
      const onProgressCallback: RenderMediaOnProgress = ({ progress }) => {
        logger.debug(
          {
            videoID: id,
            progress: Math.floor(progress * 100),
          },
          `Rendering ${id}`
        );
      };

      await this.renderWithRetry(composition, outputLocation, data, onProgressCallback);

      logger.debug(
        {
          outputLocation,
          component,
          videoID: id,
        },
        "Video rendered with Remotion",
      );
    } catch (error) {
      logger.error({ error, videoID: id }, "Failed to render video with Remotion");
      throw error;
    }
  }

  async testRender(outputLocation: string) {
    try {
      const composition = await selectComposition({
        serveUrl: this.bundled,
        id: "TestVideo",
      });

      const onProgressCallback: RenderMediaOnProgress = ({ progress }) => {
          logger.debug(
            `Rendering test video: ${Math.floor(progress * 100)}% complete`,
          );
      };

      await renderMedia({
        codec: "h264",
        composition,
        serveUrl: this.bundled,
        outputLocation,
        onProgress: onProgressCallback,
        concurrency: this.config.concurrency ?? 1,
        offthreadVideoCacheSizeInBytes: this.config.videoCacheSizeInBytes,
        timeoutInMilliseconds: 30000,
      });
      logger.debug({ outputLocation }, "Test video rendered successfully");
    } catch (error) {
      logger.error({ error, outputLocation }, "Failed to render test video");
      throw error;
    } 
  }
}