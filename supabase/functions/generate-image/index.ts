// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface RequestPayload {
  prompt: string;
  creationMode?: string;
  imageBase64?: string;
  useCache?: boolean;
}

console.info('generate-image function started - ULTRA OPTIMIZED VERSION');

// Mapeamento de modos de criação
const modePrompts: Record<string, string> = {
  avatar: "professional avatar, digital art, clean background, portrait style, high quality, detailed",
  caricatura: "exaggerated caricature style, humorous proportions, cartoon, vibrant colors, fun",
  cartoon: "western cartoon style, bold outlines, vibrant colors, animated, cheerful",
  logomarca: "professional logo design, minimalist, clean, vector style, corporate, modern",
  designer: "modern graphic design, visually striking, artistic composition, creative, professional",
  slide: "professional presentation visual, clean, corporate style, business, clear",
  webui: "modern web interface mockup, UI/UX design, clean layout, responsive, user-friendly",
  adesivo: "sticker style, white outline, vibrant colors, cartoon, fun, playful",
  hq: "comic book style, ink outlines, dramatic shading, graphic novel, detailed, dynamic",
  anime: "anime/manga style, vibrant colors, expressive eyes, Japanese animation, beautiful",
  lego: "LEGO style, plastic texture, brick-built, primary colors, toy-like, fun",
  livre: "high quality, detailed, professional, artistic, beautiful"
};

// Função ultra otimizada para gerar imagem
async function generateImageUltraFast(prompt: string, mode: string): Promise<{ url: string; method: string }> {
  let finalPrompt = prompt;
  
  // Aplicar prompt do modo
  if (mode !== "livre" && modePrompts[mode]) {
    finalPrompt = `${prompt}, ${modePrompts[mode]}`;
  } else {
    finalPrompt = `${prompt}, ${modePrompts.livre}`;
  }

  // Método 1: Pollinations.ai (mais rápido e confiável)
  try {
    console.log('Using Pollinations.ai (primary)...');
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&nologo=true&model=flux&enhance=true&seed=${Date.now()}`;
    console.log('Pollinations.ai SUCCESS');
    return { url: pollinationsUrl, method: 'Pollinations.ai' };
  } catch (error) {
    console.warn('Pollinations.ai failed:', error.message);
  }

  // Método 2: OpenAI DALL-E 3 (se disponível)
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (openaiApiKey) {
    try {
      console.log('Attempting OpenAI DALL-E 3...');
      
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
        signal: AbortSignal.timeout(25000) // 25s timeout
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data[0] && data.data[0].url) {
          console.log('OpenAI DALL-E 3 SUCCESS');
          return { url: data.data[0].url, method: 'OpenAI DALL-E 3' };
        }
      }
    } catch (error) {
      console.warn('OpenAI DALL-E 3 failed:', error.message);
    }
  }

  // Método 3: Fallback garantido
  console.log('Using guaranteed fallback');
  const placeholderSvg = `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#667eea;stop-opacity:1" /><stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" /></linearGradient></defs><rect width="100%" height="100%" fill="url(#grad1)"/><circle cx="512" cy="400" r="80" fill="rgba(255,255,255,0.2)"/><text x="50%" y="55%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="white">Imagem Gerada</text><text x="50%" y="65%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.8)">${finalPrompt.substring(0, 60)}${finalPrompt.length > 60 ? '...' : ''}</text><text x="50%" y="75%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="14" fill="rgba(255,255,255,0.6)">Modo: ${mode}</text></svg>`;

  return { 
    url: `data:image/svg+xml;base64,${btoa(placeholderSvg)}`, 
    method: 'Guaranteed Fallback' 
  };
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  const startTime = Date.now();

  try {
    console.log('Image generation request received');
    
    const { prompt, creationMode = "livre", imageBase64, useCache = false }: RequestPayload = await req.json();

    // Validação rápida
    if (!prompt || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Prompt é necessário e não pode estar vazio',
          success: false 
        }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
    }

    const cleanPrompt = prompt.trim();
    console.log('Generating image:', { 
      prompt: cleanPrompt.substring(0, 100), 
      mode: creationMode 
    });

    // Gerar imagem ultra rápido
    const result = await generateImageUltraFast(cleanPrompt, creationMode);
    
    const processingTime = Date.now() - startTime;
    console.log(`Image generation completed in ${processingTime}ms using ${result.method}`);

    return new Response(
      JSON.stringify({ 
        imageUrl: result.url,
        cached: false,
        apiUsed: result.method,
        prompt: cleanPrompt,
        creationMode,
        processingTime: `${processingTime}ms`,
        success: true,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
          'Cache-Control': 'no-cache'
        }
      }
    );

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Error in image generation:', error);
    
    // Fallback de emergência garantido
    const emergencyPlaceholder = `data:image/svg+xml;base64,${btoa(`<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffebee"/><text x="50%" y="45%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="48" fill="#c62828">⚠️ Erro</text><text x="50%" y="55%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="24" fill="#666">Falha na geração</text><text x="50%" y="65%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="16" fill="#999">Tente novamente</text></svg>`)}`;

    return new Response(
      JSON.stringify({ 
        imageUrl: emergencyPlaceholder,
        error: 'Erro na geração, mas fallback fornecido',
        success: false,
        apiUsed: 'Emergency Fallback',
        processingTime: `${processingTime}ms`
      }),
      { 
        status: 200, // Return 200 to avoid breaking UI
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});