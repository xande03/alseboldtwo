// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface RequestPayload {
  prompt: string;
  creationMode?: string;
  imageBase64?: string;
  useCache?: boolean;
}

console.info('generate-image function started');

// Inicializar cliente Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseKey);

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
    const { prompt, creationMode = "livre", imageBase64, useCache = true }: RequestPayload = await req.json();

    if (!prompt && !imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Prompt ou imagem são necessários' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating image with:', { prompt, creationMode, hasImage: !!imageBase64, useCache });

    // Verificar cache primeiro (se habilitado)
    if (useCache && supabaseUrl && supabaseKey) {
      try {
        const { data: cachedImage, error: cacheError } = await supabase
          .from('image_cache')
          .select('image_url, storage_path, access_count')
          .eq('prompt', prompt)
          .eq('creation_mode', creationMode)
          .single();

        if (cachedImage && !cacheError) {
          console.log('Cache hit! Returning cached image');
          
          // Atualizar contador de acesso
          await supabase
            .from('image_cache')
            .update({ 
              accessed_at: new Date().toISOString(),
              access_count: cachedImage.access_count + 1
            })
            .eq('prompt', prompt)
            .eq('creation_mode', creationMode);

          return new Response(
            JSON.stringify({ 
              imageUrl: cachedImage.image_url,
              cached: true,
              accessCount: cachedImage.access_count + 1
            }),
            { 
              status: 200,
              headers: { 
                'Content-Type': 'application/json',
                'Connection': 'keep-alive',
                'X-Cache': 'HIT'
              }
            }
          );
        }
      } catch (cacheCheckError) {
        console.log('Cache check failed, continuing with generation:', cacheCheckError);
      }
    }

    // Construir prompt otimizado baseado no modo
    let finalPrompt = prompt;
    if (creationMode !== "livre" && modePrompts[creationMode]) {
      finalPrompt = `${prompt}, ${modePrompts[creationMode]}`;
    }

    let imageUrl = null;
    let usingReplicate = false;

    // Tentar usar Replicate API se disponível
    const replicateToken = Deno.env.get('REPLICATE_API_TOKEN');
    
    if (replicateToken) {
      try {
        console.log('Using Replicate API for image generation');
        usingReplicate = true;
        
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
      } catch (replicateError) {
        console.error('Replicate API error:', replicateError);
        usingReplicate = false;
      }
    }

    // Fallback: Usar API gratuita de geração de imagens (Pollinations.ai)
    if (!imageUrl) {
      console.log('Using Pollinations.ai as fallback');
      imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&nologo=true`;
    }

    // Salvar no cache (se configurado)
    if (useCache && supabaseUrl && supabaseKey && imageUrl) {
      try {
        // Fazer download da imagem
        const imageResponse = await fetch(imageUrl);
        const imageBlob = await imageResponse.blob();
        const imageBuffer = await imageBlob.arrayBuffer();
        
        // Gerar nome único para o arquivo
        const timestamp = Date.now();
        const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(prompt + creationMode));
        const hashArray = Array.from(new Uint8Array(hash));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
        const fileName = `${creationMode}/${hashHex}_${timestamp}.png`;
        
        // Upload para Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('generated-images')
          .upload(fileName, imageBuffer, {
            contentType: 'image/png',
            cacheControl: '31536000', // 1 ano
          });

        if (!uploadError && uploadData) {
          // Obter URL pública
          const { data: publicUrlData } = supabase.storage
            .from('generated-images')
            .getPublicUrl(fileName);

          const storageUrl = publicUrlData.publicUrl;

          // Salvar no cache database
          await supabase
            .from('image_cache')
            .insert({
              prompt,
              creation_mode: creationMode,
              image_url: storageUrl,
              storage_path: fileName,
              api_used: usingReplicate ? 'replicate' : 'pollinations'
            });

          console.log('Image cached successfully');
          imageUrl = storageUrl; // Usar URL do storage
        }
      } catch (cacheError) {
        console.error('Failed to cache image:', cacheError);
        // Continuar mesmo se o cache falhar
      }
    }

    return new Response(
      JSON.stringify({ 
        imageUrl,
        cached: false,
        apiUsed: usingReplicate ? 'replicate' : 'pollinations'
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Connection': 'keep-alive',
          'X-Cache': 'MISS'
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
