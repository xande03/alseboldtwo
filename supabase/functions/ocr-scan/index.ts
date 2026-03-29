// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface RequestPayload {
  imageBase64: string;
}

console.info('ocr-scan function started');

Deno.serve(async (req: Request) => {
  try {
    const { imageBase64 }: RequestPayload = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Imagem é necessária' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Performing OCR scan');

    // TODO: Integrar com API de OCR (ex: Google Cloud Vision, Tesseract, Azure)
    // Por enquanto, retornando texto mockado
    const extractedText = 'Texto extraído da imagem (OCR não implementado ainda)';

    return new Response(
      JSON.stringify({ text: extractedText }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Connection': 'keep-alive'
        }
      }
    );

  } catch (error) {
    console.error('Error performing OCR:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao realizar OCR' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
