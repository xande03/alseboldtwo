// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface RequestPayload {
  prompt: string;
  creationMode?: string;
  imageBase64?: string;
}

console.info('generate-image function started');

// Mapeamento de modos de criação para prompts otimizados
const modePrompts: Record<string, string> = {
  avatar: "professional avatar, digital art, clean background, portrait style",
  caricatura: "exaggerated caricature style, humorous proportions, cartoon",
  cartoon: "western cartoon style, bold outlines, vibrant colors",
  logomarca: "professional logo design, minimalist, clean, vector style",
  designer: "modern graphic design, visually striking, artistic composition",
  slide: "professional presentation visual, clean, corporate style",
  webui: "modern web interface mockup, UI/UX design, clean layout",
  adesivo: "sticker style, white outline, vibrant colors, cartoon",
  hq: "comic book style, ink outlines, dramatic shading, graphic novel",
  anime: "anime/manga style, vibrant colors, expressive eyes, Japanese animation",
  lego: "LEGO style, plastic texture, brick-built, primary colors",
};

Deno.serve(async (req: Request) => {
  try {
    const { prompt, creationMode = "livre", imageBase64 }: RequestPayload = await req.json();

    if (!prompt && !imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Prompt ou imagem são necessários' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating image with:', { prompt, creationMode, hasImage: !!imageBase64 });

    // Construir prompt otimizado baseado no modo
    let finalPrompt = prompt;
    if (creationMode !== "livre" && modePrompts[creationMode]) {
      finalPrompt = `${prompt}, ${modePrompts[creationMode]}`;
    }

    // Tentar usar Replicate API se disponível
    const replicateToken = Deno.env.get('REPLICATE_API_TOKEN');
    
    if (replicateToken) {
      try {
        console.log('Using Replicate API for image generation');
        
        // Usar SDXL (Stable Diffusion XL) via Replicate
        const response = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${replicateToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b", // SDXL
            input: {
              prompt: finalPrompt,
              negative_prompt: "ugly, blurry, low quality, distorted",
              width: 1024,
              height: 1024,
              num_outputs: 1,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Replicate API error: ${response.status}`);
        }

        const prediction = await response.json();
        
        // Aguardar a geração (polling)
        let imageUrl = null;
        let attempts = 0;
        const maxAttempts = 60; // 60 segundos máximo
        
        while (!imageUrl && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const statusResponse = await fetch(prediction.urls.get, {
            headers: {
              'Authorization': `Token ${replicateToken}`,
            },
          });
          
          const status = await statusResponse.json();
          
          if (status.status === 'succeeded' && status.output && status.output.length > 0) {
            imageUrl = status.output[0];
            break;
          } else if (status.status === 'failed') {
            throw new Error('Image generation failed');
          }
          
          attempts++;
        }

        if (imageUrl) {
          return new Response(
            JSON.stringify({ imageUrl }),
            { 
              status: 200,
              headers: { 
                'Content-Type': 'application/json',
                'Connection': 'keep-alive'
              }
            }
          );
        }
      } catch (replicateError) {
        console.error('Replicate API error:', replicateError);
        // Continuar para fallback
      }
    }

    // Fallback: Usar API gratuita de geração de imagens (Pollinations.ai)
    console.log('Using Pollinations.ai as fallback');
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&nologo=true`;
    
    return new Response(
      JSON.stringify({ imageUrl: pollinationsUrl }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Connection': 'keep-alive'
        }
      }
    );

  } catch (error) {
    console.error('Error generating image:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao gerar imagem' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
