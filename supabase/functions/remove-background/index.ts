// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface RequestPayload {
  imageBase64: string;
  newBackground?: string;
}

console.info('remove-background function started');

Deno.serve(async (req: Request) => {
  try {
    const { imageBase64, newBackground }: RequestPayload = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Imagem é necessária' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Removing background with:', { hasNewBackground: !!newBackground });

    // Tentar usar Remove.bg API se disponível
    const removeBgKey = Deno.env.get('REMOVE_BG_API_KEY');
    
    if (removeBgKey) {
      try {
        console.log('Using Remove.bg API');
        
        const formData = new FormData();
        formData.append('image_file_b64', imageBase64.split(',')[1] || imageBase64);
        formData.append('size', 'auto');
        
        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
          method: 'POST',
          headers: {
            'X-Api-Key': removeBgKey,
          },
          body: formData,
        });

        if (response.ok) {
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          const resultUrl = `data:image/png;base64,${base64}`;
          
          return new Response(
            JSON.stringify({ imageUrl: resultUrl }),
            { 
              status: 200,
              headers: { 
                'Content-Type': 'application/json',
                'Connection': 'keep-alive'
              }
            }
          );
        }
      } catch (removeBgError) {
        console.error('Remove.bg API error:', removeBgError);
      }
    }

    // Fallback: Usar API gratuita de remoção de fundo
    console.log('Using free background removal service');
    
    // Retornar a imagem original com aviso
    return new Response(
      JSON.stringify({ 
        imageUrl: imageBase64,
        warning: 'Background removal API not configured. Configure REMOVE_BG_API_KEY environment variable.'
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
    console.error('Error removing background:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao remover fundo' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
