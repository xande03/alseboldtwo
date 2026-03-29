// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface RequestPayload {
  text: string;
  outputType?: string;
}

console.info('summarize-text function started');

Deno.serve(async (req: Request) => {
  try {
    const { text, outputType }: RequestPayload = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Texto é necessário' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Summarizing text with output type:', outputType);

    // TODO: Integrar com API de IA para sumarização (ex: OpenAI GPT, Anthropic Claude)
    // Por enquanto, retornando um resumo mockado
    const summary = `Resumo do texto (${outputType || 'padrão'}): Este é um resumo automático do texto fornecido. A funcionalidade de sumarização ainda não foi implementada com uma API real de IA.`;

    return new Response(
      JSON.stringify({ summary }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Connection': 'keep-alive'
        }
      }
    );

  } catch (error) {
    console.error('Error summarizing text:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao resumir texto' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
