import { z } from 'zod';

import { createTRPCRouter, publicProcedure } from '~/server/trpc/trpc.server';
import { env } from '~/server/env.mjs';
import { getPngDimensionsFromBytes, t2iCreateImagesOutputSchema } from '../t2i.server';

import { HARDCODED_MODELS } from './prodia.models';

const createImageInputSchema = z.object({
  prodiaKey: z.string().optional(),
  prodiaModel: z.string(),
  prodiaGen: z.enum(['sd', 'sdxl']).optional(),
  prompt: z.string(),
  negativePrompt: z.string().optional(),
  steps: z.number().optional(),
  cfgScale: z.number().optional(),
  aspectRatio: z.enum(['square', 'portrait', 'landscape']).optional(),
  upscale: z.boolean().optional(),
  resolution: z.string().optional(),
  seed: z.number().optional(),
});

const modelsInputSchema = z.object({
  prodiaKey: z.string().optional(),
});

export const prodiaRouter = createTRPCRouter({
  /** [Prodia] Generate an image using the new inference API */
  createImage: publicProcedure
    .input(createImageInputSchema)
    .output(t2iCreateImagesOutputSchema)
    .query(async ({ input }) => {
      // Build common job parameters
      let jobParams: any = {
        model: input.prodiaModel,
        prompt: input.prompt,
        ...(input.negativePrompt && { negative_prompt: input.negativePrompt }),
        ...(input.steps && { steps: input.steps }),
        ...(input.cfgScale && { cfg_scale: input.cfgScale }),
        ...(input.seed && { seed: input.seed }),
      };

      if (input.prodiaGen === 'sdxl') {
        // For SDXL, parse resolution (expected format: "widthxheight")
        if (input.resolution) {
          const resTokens = input.resolution.split('x');
          const width = resTokens.length === 2 ? parseInt(resTokens[0], 10) : undefined;
          const height = resTokens.length === 2 ? parseInt(resTokens[1], 10) : undefined;
          if (width && height) {
            jobParams.width = width;
            jobParams.height = height;
          }
        }
      } else {
        // For SD, add optional aspect ratio and upscale
        if (input.aspectRatio && input.aspectRatio !== 'square') {
          jobParams.aspect_ratio = input.aspectRatio;
        }
        if (input.upscale) {
          jobParams.upscale = input.upscale;
        }
      }

      // Resolve the API key from input or environment
      const prodiaKey = input.prodiaKey || env.PRODIA_API_KEY;
      if (!prodiaKey || !prodiaKey.trim()) {
        throw new Error('Missing Prodia API Key. Add it on the UI (Setup) or server side (your deployment).');
      }

      // Call the new inference API (synchronously) to get the image buffer
      const imageBuffer = await createGenerationJob(
        prodiaKey.trim(),
        input.prodiaGen === 'sdxl',
        jobParams
      );

      // Convert the image to base64, determine dimensions, and return the result
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      const { width, height } = getPngDimensionsFromBytes(imageBuffer);
      const altText = input.prompt;

      return [{
        mimeType: 'image/png',
        base64Data: base64Image,
        altText,
        width,
        height,
        generatorName: 'prodia-' + input.prodiaModel,
        parameters: jobParams,
        generatedAt: new Date().toISOString(),
      }];
    }),

  /** List models – since the new inference API doesn’t support model listing, return the hardcoded list */
  listModels: publicProcedure
    .input(modelsInputSchema)
    .query(async () => {
      return { models: HARDCODED_MODELS.models };
    }),
});

// Updated createGenerationJob using the new inference API (synchronous)
async function createGenerationJob<TJobRequest>(
  apiKey: string,
  isGenSDXL: boolean,
  jobParams: TJobRequest
): Promise<ArrayBuffer> {
  const jobType = isGenSDXL
    ? "inference.flux.schnell.txt2img.sdxl.v1"
    : "inference.flux.schnell.txt2img.v1";

  const jobConfig = {
    type: jobType,
    config: jobParams,
  };

  const response = await fetch("https://inference.prodia.com/v2/job", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Accept": "image/png",
    },
    body: JSON.stringify(jobConfig),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Prodia image generation failed: ${response.status} ${errorText}`);
  }

  return await response.arrayBuffer();
}
