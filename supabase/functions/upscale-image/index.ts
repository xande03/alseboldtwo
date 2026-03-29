// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface RequestPayload {
  imageBase64: string;
  prompt?: string;
  historyId?: string;
  aspectRatio?: string;
}

console.info('upscale-image function started');

Deno.serve(async (req: Request) => {
  try {
    const { imageBase64, prompt, historyId, aspectRatio }: RequestPayload = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Imagem é necessária' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Upscaling image with:', { prompt, historyId, aspectRatio });

    // Tentar usar Replicate API para upscaling
    const replicateToken = Deno.env.get('REPLICATE_API_TOKEN');
    
    if (replicateToken) {
      try {
        console.log('Using Replicate API for upscaling');
        
        // Usar Real-ESRGAN para upscaling
        const response = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${replicateToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            version: "42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b", // Real-ESRGAN
            input: {
              image: imageBase64,
              scale: 4,
              face_enhance: true,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Replicate API error: ${response.status}`);
        }

        const prediction = await response.json();
        
        // Aguardar o upscaling (polling)
        let upscaledUrl = null;
        let attempts = 0;
        const maxAttempts = 60;
        
        while (!upscaledUrl && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const statusResponse = await fetch(prediction.urls.get, {
            headers: {
              'Authorization': `Token ${replicateToken}`,
            },
          });
          
          const status = await statusResponse.json();
          
          if (status.status === 'succeeded' && status.output) {
            upscaledUrl = status.output;
            break;
          } else if (status.status === 'failed') {
            throw new Error('Upscaling failed');
          }
          
          attempts++;
        }

        if (upscaledUrl) {
          return new Response(
            JSON.stringify({ imageUrl: upscaledUrl }),
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
      }
    }

    // Fallback: retornar imagem original
    console.log('Upscaling API not configured, returning original image');
    return new Response(
      JSON.stringify({ 
        imageUrl: imageBase64,
        warning: 'Upscaling API not configured. Configure REPLICATE_API_TOKEN environment variable.'
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Connection': 'keep-alive'
        }
      }
    );

  } catch (error) {
    console.error('Error upscaling image:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao fazer upscale da imagem' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
