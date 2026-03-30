// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface RequestPayload {
  prompt: string;
  creationMode?: string;
  imageBase64?: string;
  useCache?: boolean;
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
    console.log('Request received');
    
    const { prompt, creationMode = "livre", imageBase64, useCache = false }: RequestPayload = await req.json();

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

    let imageUrl = null;
    let usingAPI = 'pollinations';

    // Tentar usar OpenAI DALL-E se disponível
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (openaiApiKey) {
      try {
        console.log('Using OpenAI DALL-E for image generation');
        usingAPI = 'openai';
        
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: finalPrompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
            response_format: "url"
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        if (data.data && data.data.length > 0) {
          imageUrl = data.data[0].url;
        }
      } catch (openaiError) {
        console.error('OpenAI API error:', openaiError);
        usingAPI = 'pollinations';
      }
    }

    // Fallback: Usar Pollinations.ai (API gratuita confiável)
    if (!imageUrl) {
      console.log('Using Pollinations.ai for image generation');
      
      // Usar Pollinations.ai com parâmetros otimizados
      const encodedPrompt = encodeURIComponent(finalPrompt);
      imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&model=flux&enhance=true&seed=${Date.now()}`;
      usingAPI = 'pollinations';
    }

    console.log('Generated image URL:', imageUrl);

    return new Response(
      JSON.stringify({ 
        imageUrl,
        cached: false,
        apiUsed: usingAPI,
        prompt: finalPrompt,
        success: true
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
        }
      }
    );

  } catch (error) {
    console.error('Error generating image:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao gerar imagem',
        success: false
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});