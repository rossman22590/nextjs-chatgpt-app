interface ProdiaModelDescription {
  id: string;          // The inference path
  label: string;       // Display name
  type: 'image' | 'video';  // Media type
  time: string;        // Approximate processing time
  priority?: number;   // Priority for sorting
}

export const HARDCODED_MODELS: { models: ProdiaModelDescription[] } = {
  models: [
    // Image Generation Models
    {
      id: 'inference.flux.schnell.txt2img.v1',
      label: 'Flux Schnell',
      type: 'image',
      time: '1.5s',
      priority: 20
    },
    {
      id: 'inference.sd15.txt2img.v1',
      label: 'Stable Diffusion 1.5',
      type: 'image',
      time: '1.2s',
      priority: 15
    },
    {
      id: 'inference.sdxl.txt2img.v1',
      label: 'Stable Diffusion XL',
      type: 'image',
      time: '1.8s',
      priority: 18
    },
    {
      id: 'inference.flux.dev.txt2img.v1',
      label: 'Flux Dev',
      type: 'image',
      time: '6.5s',
      priority: 10
    },
    {
      id: 'inference.recraft.txt2img.v1',
      label: 'Recraft',
      type: 'image',
      time: '10s'
    },
    {
      id: 'inference.flux.pro.txt2img.v1',
      label: 'Flux Pro',
      type: 'image',
      time: '14s'
    },

    // Video Generation Models
    // {
    //   id: 'inference.mochi1.txt2vid.v1',
    //   label: 'Mochi 1',
    //   type: 'video',
    //   time: '75s'
    // },
    // {
    //   id: 'inference.kling.txt2vid.v1',
    //   label: 'Kling',
    //   type: 'video',
    //   time: '5m'
    // },

    // Utility Models
    // {
    //   id: 'inference.facerestore.upscale.v1',
    //   label: 'Facerestore',
    //   type: 'image',
    //   time: '2.0s'
    // },
    // {
    //   id: 'inference.faceswap.v1',
    //   label: 'Faceswap',
    //   type: 'image',
    //   time: '3.0s'
    // },
    // {
    //   id: 'inference.upscale.v1',
    //   label: 'Upscale',
    //   type: 'image',
    //   time: '1.3s'
    // }
  ],
};

// Helper function to get only image generation models
export const getImageGenerationModels = () => 
  HARDCODED_MODELS.models.filter(m => 
    m.type === 'image' && m.id.includes('txt2img')
  );

// Helper function to get only video generation models
export const getVideoGenerationModels = () => 
  HARDCODED_MODELS.models.filter(m => 
    m.type === 'video'
  );

// Helper function to get utility models
export const getUtilityModels = () => 
  HARDCODED_MODELS.models.filter(m => 
    m.type === 'image' && !m.id.includes('txt2img')
  );
