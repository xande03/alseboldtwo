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

    // TODO: Integrar com API de remoção de fundo (ex: remove.bg, Replicate)
    // Por enquanto, retornando a mesma imagem
    const resultUrl = imageBase64;

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
