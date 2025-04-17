interface ProdiaModelDescription {
  id: string;
  label: string;
  gen: 'sd' | 'sdxl';
  priority?: number;
}

export const HARDCODED_MODELS: { models: ProdiaModelDescription[] } = {
  models: [
    // Only keeping Flux Pro model
    { id: 'inference.flux.pro.txt2img.v1', label: 'Flux Pro', gen: 'sd', priority: 20 },
  ],
};
