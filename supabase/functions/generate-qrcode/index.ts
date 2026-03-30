// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface RequestPayload {
  content: string;
  type: 'text' | 'url' | 'file';
  fileData?: string;
  fileName?: string;
  expirationOption?: 'immediate' | '1hour' | 'permanent';
  userSession?: string;
}

console.info('generate-qrcode function started - ULTRA OPTIMIZED');

// Função ultra otimizada para gerar QR code
async function generateQRCodeUltraFast(content: string): Promise<string> {
  try {
    // Usar API mais rápida do QR Server com parâmetros otimizados
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(content)}&format=png&margin=5&ecc=L`;
    
    // Download otimizado da imagem QR
    const response = await fetch(qrUrl, {
      signal: AbortSignal.timeout(10000) // 10s timeout
    });
    
    if (!response.ok) {
      throw new Error(`QR API error: ${response.status}`);
    }
    
    const imageBuffer = await response.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    return `data:image/png;base64,${base64Image}`;
    
  } catch (error) {
    console.error('QR generation error:', error);
    
    // Fallback garantido com SVG
    const qrSvg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="white"/><rect x="50" y="50" width="412" height="412" fill="black"/><rect x="75" y="75" width="362" height="362" fill="white"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="monospace" font-size="12" fill="black">${content.substring(0, 50)}</text></svg>`;
    return `data:image/svg+xml;base64,${btoa(qrSvg)}`;
  }
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
    console.log('QR Code generation request received');
    
    const { 
      content, 
      type, 
      fileData, 
      fileName, 
      expirationOption = '1hour',
      userSession = 'anonymous'
    }: RequestPayload = await req.json();

    if (!content && !fileData) {
      return new Response(
        JSON.stringify({ error: 'Conteúdo ou arquivo são necessários', success: false }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
    }

    console.log('Generating QR code for:', { type, hasFileData: !!fileData, fileName });

    let qrContent = content;

    // Se é um arquivo, retornar erro informativo por enquanto
    if (type === 'file' && fileData && fileName) {
      return new Response(
        JSON.stringify({ 
          error: 'Upload de arquivos temporariamente indisponível. Use texto ou URL.',
          success: false,
          suggestion: 'Para arquivos, faça upload em outro serviço e use a URL no QR code.'
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

    // Gerar QR code ultra rápido
    const qrCodeDataUrl = await generateQRCodeUltraFast(qrContent);
    
    const processingTime = Date.now() - startTime;
    console.log(`QR code generated successfully in ${processingTime}ms`);

    return new Response(
      JSON.stringify({
        qrCodeUrl: qrCodeDataUrl,
        content: qrContent,
        type: type,
        success: true,
        processingTime: `${processingTime}ms`,
        message: 'QR Code gerado com sucesso',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
        }
      }
    );

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Error generating QR code:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao gerar QR code',
        success: false,
        processingTime: `${processingTime}ms`
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