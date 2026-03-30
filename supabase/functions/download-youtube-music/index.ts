// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface RequestPayload {
  youtubeUrl: string;
  format?: 'mp3' | 'mp4';
  quality?: 'high' | 'medium' | 'low';
}

interface DownloadResponse {
  downloadUrl?: string;
  title?: string;
  duration?: string;
  thumbnail?: string;
  error?: string;
  status: 'success' | 'processing' | 'error';
}

console.info('download-youtube-music function started');

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
    const { youtubeUrl, format = 'mp3', quality = 'high' }: RequestPayload = await req.json();

    if (!youtubeUrl) {
      return new Response(
        JSON.stringify({ 
          error: 'URL do YouTube é necessária',
          status: 'error'
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

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)/;
    if (!youtubeRegex.test(youtubeUrl)) {
      return new Response(
        JSON.stringify({ 
          error: 'URL inválida. Use uma URL válida do YouTube.',
          status: 'error'
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

    console.log('Processing YouTube URL:', youtubeUrl);

    // Method 1: Try yt.mp3 API
    try {
      console.log('Using yt.mp3 API for download');
      
      // First, get video info
      const infoResponse = await fetch('https://yt.mp3.org/api/info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        body: JSON.stringify({
          url: youtubeUrl,
          format: format
        }),
      });

      if (infoResponse.ok) {
        const info = await infoResponse.json();
        
        if (info.status === 'success') {
          // Request conversion
          const convertResponse = await fetch('https://yt.mp3.org/api/convert', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            body: JSON.stringify({
              url: youtubeUrl,
              format: format,
              quality: quality,
              id: info.id
            }),
          });

          if (convertResponse.ok) {
            const result = await convertResponse.json();
            
            if (result.status === 'success' && result.downloadUrl) {
              return new Response(
                JSON.stringify({
                  status: 'success',
                  downloadUrl: result.downloadUrl,
                  title: result.title || info.title,
                  duration: result.duration || info.duration,
                  thumbnail: result.thumbnail || info.thumbnail,
                  format: format,
                  quality: quality,
                  method: 'yt.mp3'
                }),
                { 
                  status: 200,
                  headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  }
                }
              );
            }
          }
        }
      }
    } catch (ytMp3Error) {
      console.error('yt.mp3 API error:', ytMp3Error);
    }

    // Method 2: Try alternative YouTube downloader API
    try {
      console.log('Using alternative YouTube downloader');
      
      const altResponse = await fetch('https://api.youtubedl.org/api/info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: youtubeUrl,
          format: format === 'mp3' ? 'bestaudio' : 'best'
        }),
      });

      if (altResponse.ok) {
        const altResult = await altResponse.json();
        
        if (altResult.success && altResult.data) {
          return new Response(
            JSON.stringify({
              status: 'success',
              downloadUrl: altResult.data.url,
              title: altResult.data.title,
              duration: altResult.data.duration,
              thumbnail: altResult.data.thumbnail,
              format: format,
              method: 'Alternative API'
            }),
            { 
              status: 200,
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            }
          );
        }
      }
    } catch (altError) {
      console.error('Alternative API error:', altError);
    }

    // Method 3: Extract video ID and provide manual download instructions
    const videoIdMatch = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    if (videoId) {
      // Provide manual download options
      const manualOptions = {
        ytMp3: `https://yt.mp3.org/?url=${encodeURIComponent(youtubeUrl)}`,
        y2mate: `https://www.y2mate.com/youtube/${videoId}`,
        savefrom: `https://savefrom.net/#url=${encodeURIComponent(youtubeUrl)}`,
        onlineVideoConverter: `https://www.onlinevideoconverter.com/youtube-converter?url=${encodeURIComponent(youtubeUrl)}`
      };

      return new Response(
        JSON.stringify({
          status: 'processing',
          videoId: videoId,
          message: 'Download automático indisponível. Use uma das opções manuais abaixo:',
          manualDownloadOptions: manualOptions,
          instructions: [
            '1. Clique em um dos links de download manual',
            '2. Cole a URL do YouTube no site',
            '3. Escolha o formato (MP3 para áudio)',
            '4. Clique em Download'
          ],
          originalUrl: youtubeUrl
        }),
        { 
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // If all methods fail
    return new Response(
      JSON.stringify({
        status: 'error',
        error: 'Não foi possível processar o download. Verifique se a URL é válida.',
        suggestion: 'Tente usar yt.mp3.org manualmente para fazer o download.'
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
    console.error('Error downloading YouTube music:', error);
    return new Response(
      JSON.stringify({
        status: 'error',
        error: 'Erro interno no processamento do download',
        details: error.message
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});