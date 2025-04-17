import { z } from 'zod';

import { createTRPCRouter, publicProcedure } from '~/server/trpc/trpc.server';
import { env } from '~/server/env.mjs';
import { fetchJsonOrTRPCThrow } from '~/server/trpc/trpc.router.fetchers';

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

interface ProdiaConfigBase {
  prompt: string;
  negative_prompt?: string;
  steps?: number;
  cfg_scale?: number;
  seed?: number;
}

interface ProdiaSDConfig extends ProdiaConfigBase {
  aspect_ratio?: 'square' | 'portrait' | 'landscape';
  upscale?: boolean;
}

interface ProdiaSDXLConfig extends ProdiaConfigBase {
  width?: number;
  height?: number;
}

interface ProdiaV2Request {
  type: string; 
  config: ProdiaConfigBase | ProdiaSDConfig | ProdiaSDXLConfig; 
}

export const prodiaRouter = createTRPCRouter({

  createImage: publicProcedure
    .input(createImageInputSchema)
    .output(t2iCreateImagesOutputSchema)
    .query(async ({ input }) => {

      const modelTypeId = 'inference.flux.pro.txt2img.v1';
      
      const config: any = {
        prompt: input.prompt,
      };
      
      if (input.steps) {
        config.steps = Math.max(1, Math.min(100, input.steps));
      }
      
      if (input.cfgScale) {
        config.guidance_scale = Math.max(2, Math.min(5, input.cfgScale));
      }
      
      if (input.seed) {
        config.seed = input.seed;
      }
      
      config.safety_tolerance = 4;
      
      let width = 1024;  
      let height = 768;  
      
      if (input.resolution) {
        const resTokens = input.resolution?.split('x');
        if (resTokens?.length === 2) {
          const parsedWidth = parseInt(resTokens[0], 10);
          const parsedHeight = parseInt(resTokens[1], 10);
          
          if (!isNaN(parsedWidth) && !isNaN(parsedHeight)) {
            width = Math.max(256, Math.min(1440, Math.floor(parsedWidth / 32) * 32));
            height = Math.max(256, Math.min(1440, Math.floor(parsedHeight / 32) * 32));
          }
        }
      }
      
      config.width = width;
      config.height = height;
      
      const requestBody = {
        type: modelTypeId,
        config,
      };

      const { url, headers } = prodiaAccessV2(input.prodiaKey);
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            ...headers,
            'Accept': 'image/png',
            'Content-Type': 'application/json', // Explicitly set Content-Type for proper negotiation
          },
          body: JSON.stringify(requestBody),
        });
        
        // Handle rate limiting with proper backoff
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const retrySeconds = retryAfter ? parseInt(retryAfter, 10) : 10; // Default to 10 seconds if not specified
          console.error(`Prodia rate limited. Retry after ${retrySeconds} seconds.`);
          throw new Error(`Prodia rate limited. Please try again in ${retrySeconds} seconds.`);
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Prodia v2 image generation failed:', response.status, errorText);
          console.error('Request body was:', JSON.stringify(requestBody, null, 2));
          
          // Parse error JSON if possible to get more detailed error message
          try {
            const errorJson = JSON.parse(errorText);
            const detailedError = errorJson.error || errorText;
            throw new Error(`Prodia image generation failed: ${response.status} ${detailedError}`);
          } catch (parseError) {
            // If JSON parsing fails, use the raw error text
            throw new Error(`Prodia image generation failed: ${response.status} ${errorText || 'Unknown error'}`);
          }
        }

        const imageBuffer = await response.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');

        const { width, height } = getPngDimensionsFromBytes(imageBuffer);

        const { prompt: altText, ...otherParameters } = requestBody.config;
        return [{
          mimeType: 'image/png',
          base64Data: base64Image,
          altText,
          width,
          height,
          generatorName: 'prodia-' + input.prodiaModel,
          parameters: otherParameters,
          generatedAt: new Date().toISOString(),
        }];
      } catch (error: unknown) {
        console.error('Prodia v2 API error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Prodia image generation failed: ${errorMessage}`);
      }
    }),

  listModels: publicProcedure
    .input(modelsInputSchema)
    .query(async ({ input }) => {
      return { models: HARDCODED_MODELS.models };
    }),

});

function prodiaAccessV2(_prodiaKey: string | undefined): { headers: HeadersInit, url: string } {
  const prodiaKey = (_prodiaKey || env.PRODIA_API_KEY || '').trim();
  if (!prodiaKey)
    throw new Error('Missing Prodia API Key. Add it on the UI (Setup) or server side (your deployment).');

  const prodiaUrl = 'https://inference.prodia.com/v2/job';

  return {
    headers: {
      'Authorization': `Bearer ${prodiaKey}`,
      'Content-Type': 'application/json',
    },
    url: prodiaUrl,
  };
}