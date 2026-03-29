// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface RequestPayload {
  imageBase64: string;
  prompt: string;
}

console.info('edit-image function started');

Deno.serve(async (req: Request) => {
  try {
    const { imageBase64, prompt }: RequestPayload = await req.json();

    if (!imageBase64 || !prompt) {
      return new Response(
        JSON.stringify({ error: 'Imagem e prompt são necessários' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Editing image with prompt:', prompt);

    // Tentar usar Replicate API para edição de imagens
    const replicateToken = Deno.env.get('REPLICATE_API_TOKEN');
    
    if (replicateToken) {
      try {
        console.log('Using Replicate API for image editing');
        
        // Usar InstructPix2Pix para edição guiada por texto
        const response = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${replicateToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            version: "30c1d0b916a6f8efce20493f5d61ee27491ab2a60437c13c588468b9810ec23f", // InstructPix2Pix
            input: {
              image: imageBase64,
              prompt: prompt,
              num_inference_steps: 20,
              guidance_scale: 7.5,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Replicate API error: ${response.status}`);
        }

        const prediction = await response.json();
        
        // Aguardar a edição (polling)
        let editedUrl = null;
        let attempts = 0;
        const maxAttempts = 60;
        
        while (!editedUrl && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const statusResponse = await fetch(prediction.urls.get, {
            headers: {
              'Authorization': `Token ${replicateToken}`,
            },
          });
          
          const status = await statusResponse.json();
          
          if (status.status === 'succeeded' && status.output) {
            editedUrl = Array.isArray(status.output) ? status.output[0] : status.output;
            break;
          } else if (status.status === 'failed') {
            throw new Error('Image editing failed');
          }
          
          attempts++;
        }

        if (editedUrl) {
          return new Response(
            JSON.stringify({ imageUrl: editedUrl }),
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
    console.log('Image editing API not configured, returning original image');
    return new Response(
      JSON.stringify({ 
        imageUrl: imageBase64,
        warning: 'Image editing API not configured. Configure REPLICATE_API_TOKEN environment variable.'
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
    console.error('Error editing image:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao editar imagem' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
