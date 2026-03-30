// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface RequestPayload {
  imageBase64: string;
}

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') || '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';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

console.info('ocr-scan function started');

Deno.serve(async (req: Request) => {
  // Handle CORS
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

  try {
    const { imageBase64 }: RequestPayload = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Imagem é necessária' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
    }

    console.log('Performing OCR scan with Groq Vision');

    // Validate image format
    if (!imageBase64.startsWith('data:image/')) {
      return new Response(
        JSON.stringify({ error: 'Formato de imagem inválido. Use data:image/...' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
    }

    // Use Groq's vision model for OCR
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.2-90b-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { 
                type: 'text', 
                text: 'Extraia todo o texto visível nesta imagem. Retorne apenas o texto extraído, sem explicações ou comentários adicionais. Se não houver texto, retorne "Nenhum texto encontrado".' 
              },
              { 
                type: 'image_url', 
                image_url: { url: imageBase64 } 
              },
            ],
          },
        ],
        max_tokens: 4096,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Groq API error:', errorData);
      
      // Fallback response for API errors
      return new Response(
        JSON.stringify({ 
          text: 'Erro na API de OCR. Tente novamente mais tarde.',
          error: `Groq API error: ${response.status}`
        }),
        { 
          status: 200, // Return 200 to avoid breaking the UI
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    const data = await response.json();
    const extractedText = data.choices?.[0]?.message?.content?.trim() || 'Nenhum texto encontrado';

    console.log('OCR completed successfully');

    return new Response(
      JSON.stringify({ text: extractedText }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('Error performing OCR:', error);
    
    // Return a user-friendly error instead of 500
    return new Response(
      JSON.stringify({ 
        text: 'Erro interno no processamento de OCR. Tente novamente.',
        error: 'Internal OCR processing error'
      }),
      { 
        status: 200, // Return 200 to avoid breaking the UI
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});
