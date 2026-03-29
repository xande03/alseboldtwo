// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface RequestPayload {
  link: string;
}

console.info('analyze-music function started');

Deno.serve(async (req: Request) => {
  try {
    const { link }: RequestPayload = await req.json();

    if (!link) {
      return new Response(
        JSON.stringify({ error: 'Link é necessário' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing music from link:', link);

    // TODO: Integrar com API de análise de música (ex: Spotify API, Last.fm, MusicBrainz)
    // Por enquanto, retornando dados mockados
    const analysis = {
      title: 'Música Exemplo',
      artist: 'Artista Exemplo',
      genre: 'Pop',
      tempo: 120,
      key: 'C Major',
      energy: 0.8,
      danceability: 0.7,
      valence: 0.6
    };

    return new Response(
      JSON.stringify(analysis),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Connection': 'keep-alive'
        }
      }
    );

  } catch (error) {
    console.error('Error analyzing music:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao analisar música' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
