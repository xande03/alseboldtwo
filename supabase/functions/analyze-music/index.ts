// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface RequestPayload {
  link: string;
  action?: 'analyze' | 'download';
  format?: 'mp3' | 'mp4';
}

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') || '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';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

console.info('analyze-music function started');

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
    const { link, action = 'analyze', format = 'mp3' }: RequestPayload = await req.json();

    if (!link) {
      return new Response(
        JSON.stringify({ error: 'Link é necessário' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
    }

    console.log('Processing music link:', link, 'Action:', action);

    // Check if it's a YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)/;
    const isYouTube = youtubeRegex.test(link);

    if (action === 'download' && isYouTube) {
      // Redirect to download function
      try {
        const downloadResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/download-youtube-music`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('Authorization') || '',
          },
          body: JSON.stringify({
            youtubeUrl: link,
            format: format
          }),
        });

        const downloadResult = await downloadResponse.json();
        return new Response(
          JSON.stringify(downloadResult),
          { 
            status: 200,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      } catch (downloadError) {
        console.error('Download error:', downloadError);
      }
    }

    // Analyze music using Groq AI
    try {
      console.log('Analyzing music with Groq AI');
      
      const response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `Você é um especialista em música. Analise o link fornecido e extraia informações sobre a música. 
              Retorne um JSON com: title, artist, album, genre, year, duration, bpm (estimado), key (tom musical), 
              description (breve descrição), lyrics (se disponível, senão "Letra não disponível").
              Se for um link do YouTube, extraia informações do título e descrição.
              Retorne APENAS o JSON, sem markdown.`
            },
            { 
              role: 'user', 
              content: `Analise esta música: ${link}` 
            }
          ],
          max_tokens: 4096,
          response_format: { type: "json_object" },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const analysis = JSON.parse(data.choices[0].message.content);
        
        // Add additional metadata
        const result = {
          ...analysis,
          originalLink: link,
          isYouTube: isYouTube,
          timestamp: new Date().toISOString(),
          method: 'Groq AI Analysis'
        };

        // If it's YouTube, add download options
        if (isYouTube) {
          const videoIdMatch = link.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/);
          const videoId = videoIdMatch ? videoIdMatch[1] : null;
          
          if (videoId) {
            result.downloadOptions = {
              mp3: `${Deno.env.get('SUPABASE_URL')}/functions/v1/download-youtube-music`,
              manual: {
                ytMp3: `https://yt.mp3.org/?url=${encodeURIComponent(link)}`,
                y2mate: `https://www.y2mate.com/youtube/${videoId}`,
                savefrom: `https://savefrom.net/#url=${encodeURIComponent(link)}`
              }
            };
            result.videoId = videoId;
            result.thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
          }
        }

        return new Response(
          JSON.stringify(result),
          { 
            status: 200,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      }
    } catch (groqError) {
      console.error('Groq API error:', groqError);
    }

    // Fallback: Basic analysis
    const basicAnalysis = {
      title: 'Música não identificada',
      artist: 'Artista desconhecido',
      album: 'Álbum desconhecido',
      genre: 'Gênero não identificado',
      year: 'Ano desconhecido',
      duration: 'Duração não disponível',
      bpm: 'BPM não disponível',
      key: 'Tom não identificado',
      description: 'Análise automática não disponível para este link.',
      lyrics: 'Letra não disponível',
      originalLink: link,
      isYouTube: isYouTube,
      timestamp: new Date().toISOString(),
      method: 'Basic Fallback',
      note: 'Para análise completa, verifique se o link está acessível.'
    };

    if (isYouTube) {
      const videoIdMatch = link.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;
      
      if (videoId) {
        basicAnalysis.downloadOptions = {
          manual: {
            ytMp3: `https://yt.mp3.org/?url=${encodeURIComponent(link)}`,
            y2mate: `https://www.y2mate.com/youtube/${videoId}`,
            savefrom: `https://savefrom.net/#url=${encodeURIComponent(link)}`
          }
        };
        basicAnalysis.videoId = videoId;
        basicAnalysis.thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    }

    return new Response(
      JSON.stringify(basicAnalysis),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('Error analyzing music:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao analisar música',
        details: error.message,
        originalLink: req.body ? JSON.parse(await req.text()).link : 'unknown'
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
