import { apiAsync } from '~/common/util/trpc.client';
import { useProdiaStore } from './store-module-prodia';
import type { T2iCreateImageOutput } from '../t2i.server';

export async function prodiaGenerateImages(imageText: string, count: number): Promise<T2iCreateImageOutput[]> {
  // Use the most current model and settings from state
  const {
    prodiaApiKey: prodiaKey, prodiaModelId, prodiaModelGen,
    prodiaNegativePrompt: negativePrompt, prodiaSteps: steps, prodiaCfgScale: cfgScale,
    prodiaAspectRatio: aspectRatio, prodiaUpscale: upscale,
    prodiaResolution: resolution,
    prodiaSeed: seed,
  } = useProdiaStore.getState();

  // Function to generate a single image
  const generateImage = async (): Promise<T2iCreateImageOutput[]> => {
    const generatedImages = await apiAsync.prodia.createImage.query({
      ...(!!prodiaKey && { prodiaKey }),
      prodiaModel: prodiaModelId || 'sd_xl_base_1.0.safetensors [be9edd61]', // default model fallback
      prodiaGen: prodiaModelGen || 'sd', // version fix
      prompt: imageText,
      ...(!!negativePrompt && { negativePrompt }),
      ...(!!steps && { steps }),
      ...(!!cfgScale && { cfgScale }),
      ...(!!aspectRatio && aspectRatio !== 'square' && { aspectRatio }),
      ...(upscale && { upscale }),
      ...(!!resolution && { resolution }),
      ...(!!seed && { seed }),
    });

    if (generatedImages.length !== 1)
      throw new Error('Prodia image generation failed - expected 1 image, got ' + generatedImages.length);

    return generatedImages;
  };

  // Run multiple image generations in parallel
  const imagePromises = Array.from({ length: count }, generateImage);
  const results = await Promise.allSettled(imagePromises);

  // Return only the successful results
  return results
    .filter(result => result.status === 'fulfilled')
    .map(result => (result as PromiseFulfilledResult<T2iCreateImageOutput[]>).value)
    .flat();
}
