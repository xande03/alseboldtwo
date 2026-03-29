# Edge Functions - Supabase

Este diretório contém todas as Edge Functions deployadas no projeto Supabase.

## Funções Deployadas

### 1. generate-image
**Endpoint:** `https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/generate-image`

Gera imagens usando IA baseado em prompts de texto.

**Payload:**
```json
{
  "prompt": "Descrição da imagem",
  "creationMode": "livre|avatar|caricatura|cartoon|logomarca|designer|slide|webui|adesivo|hq|anime|lego",
  "imageBase64": "data:image/jpeg;base64,..." // opcional
}
```

**Resposta:**
```json
{
  "imageUrl": "https://..."
}
```

### 2. upscale-image
**Endpoint:** `https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/upscale-image`

Faz upscale de imagens para maior resolução.

**Payload:**
```json
{
  "imageBase64": "data:image/jpeg;base64,...",
  "prompt": "Descrição opcional",
  "historyId": "id-do-historico",
  "aspectRatio": "16:9"
}
```

### 3. remove-background
**Endpoint:** `https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/remove-background`

Remove o fundo de imagens.

**Payload:**
```json
{
  "imageBase64": "data:image/jpeg;base64,...",
  "newBackground": "cor ou imagem de fundo opcional"
}
```

### 4. edit-image
**Endpoint:** `https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/edit-image`

Edita imagens usando prompts de texto.

**Payload:**
```json
{
  "imageBase64": "data:image/jpeg;base64,...",
  "prompt": "Descrição da edição desejada"
}
```

### 5. ocr-scan
**Endpoint:** `https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/ocr-scan`

Extrai texto de imagens usando OCR.

**Payload:**
```json
{
  "imageBase64": "data:image/jpeg;base64,..."
}
```

**Resposta:**
```json
{
  "text": "Texto extraído da imagem"
}
```

### 6. analyze-music
**Endpoint:** `https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/analyze-music`

Analisa músicas a partir de links.

**Payload:**
```json
{
  "link": "https://spotify.com/..."
}
```

**Resposta:**
```json
{
  "title": "Nome da música",
  "artist": "Artista",
  "genre": "Gênero",
  "tempo": 120,
  "key": "C Major",
  "energy": 0.8,
  "danceability": 0.7,
  "valence": 0.6
}
```

### 7. summarize-text
**Endpoint:** `https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/summarize-text`

Resume textos longos.

**Payload:**
```json
{
  "text": "Texto longo para resumir",
  "outputType": "breve|detalhado|topicos"
}
```

**Resposta:**
```json
{
  "summary": "Resumo do texto"
}
```

### 8. clever-handler
**Endpoint:** `https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/clever-handler`

Função de exemplo/teste.

**Payload:**
```json
{
  "name": "Seu nome"
}
```

## Autenticação

Todas as funções requerem os seguintes headers:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw
Content-Type: application/json
```

## Deploy

Para fazer deploy de uma função:

```bash
npx supabase functions deploy <nome-da-funcao>
```

Para fazer deploy de todas as funções:

```bash
npx supabase functions deploy
```

## Desenvolvimento Local

Para testar localmente (requer Docker):

```bash
npx supabase functions serve <nome-da-funcao>
```

## Notas Importantes

⚠️ **As funções atualmente retornam dados mockados/placeholder.** Para produção, você precisa:

1. Integrar APIs reais de IA (OpenAI, Stability AI, Replicate, etc.)
2. Adicionar variáveis de ambiente no Supabase Dashboard
3. Implementar tratamento de erros robusto
4. Adicionar rate limiting e validações
5. Configurar CORS se necessário

## Variáveis de Ambiente

Configure no Supabase Dashboard em: Settings > Edge Functions > Environment Variables

Exemplos de variáveis necessárias:
- `OPENAI_API_KEY` - Para geração de imagens
- `REPLICATE_API_TOKEN` - Para upscaling e edição
- `REMOVE_BG_API_KEY` - Para remoção de fundo
- `GOOGLE_CLOUD_API_KEY` - Para OCR
- `SPOTIFY_CLIENT_ID` e `SPOTIFY_CLIENT_SECRET` - Para análise de música
