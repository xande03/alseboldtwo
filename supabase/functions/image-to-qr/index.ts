// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface RequestPayload {
  imageBase64: string;
  extractText?: boolean; // Se deve extrair texto da imagem
  qrSize?: number; // Tamanho do QR code
}

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') || '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';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

console.info('image-to-qr function started');

// Função para gerar QR code usando uma API externa
async function generateQRCode(content: string, size: number = 512): Promise<string> {
  try {
    // Usar API gratuita do QR Server
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(content)}&format=png&margin=10`;
    
    // Fazer download da imagem QR
    const response = await fetch(qrUrl);
    if (!response.ok) {
      throw new Error(`QR API error: ${response.status}`);
    }
    
    const imageBuffer = await response.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    return `data:image/png;base64,${base64Image}`;
    
  } catch (error) {
    console.error('QR generation error:', error);
    throw error;
  }
}

// Função para extrair texto de imagem usando Groq Vision
async function extractTextFromImage(imageBase64: string): Promise<string> {
  try {
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
                text: 'Extraia todo o texto visível nesta imagem. Se houver URLs, links, códigos, números importantes, inclua tudo. Retorne apenas o texto extraído, sem explicações.' 
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
      throw new Error(errorData.error?.message || `Groq API error ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || 'Nenhum texto encontrado na imagem';
  } catch (error) {
    console.error('Text extraction error:', error);
    throw error;
  }
}

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
    const { imageBase64, extractText = true, qrSize = 512 }: RequestPayload = await req.json();

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

    console.log('Processing image to QR conversion');

    // Validar formato da imagem
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

    let qrContent = '';
    let extractedText = '';
    let method = '';

    if (extractText) {
      try {
        // Extrair texto da imagem usando Groq Vision
        extractedText = await extractTextFromImage(imageBase64);
        qrContent = extractedText;
        method = 'Text extraction from image';
        console.log('Text extracted successfully:', extractedText.substring(0, 100) + '...');
      } catch (extractError) {
        console.error('Text extraction failed:', extractError);
        // Fallback: usar a própria imagem como conteúdo
        qrContent = imageBase64;
        method = 'Image as QR content (fallback)';
      }
    } else {
      // Usar a imagem diretamente como conteúdo do QR
      qrContent = imageBase64;
      method = 'Image as QR content';
    }

    // Gerar QR code
    const qrCodeDataUrl = await generateQRCode(qrContent, qrSize);
    
    console.log('QR code generated successfully from image');

    return new Response(
      JSON.stringify({
        success: true,
        qrCodeUrl: qrCodeDataUrl,
        originalImage: imageBase64,
        extractedText: extractedText || null,
        qrContent: extractText ? extractedText : 'Image data',
        method: method,
        size: qrSize,
        message: extractText ? 
          'QR code gerado com texto extraído da imagem' : 
          'QR code gerado com dados da imagem'
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('Error processing image to QR:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erro ao processar imagem para QR code',
        details: error.message
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