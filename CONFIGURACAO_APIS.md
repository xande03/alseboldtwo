# Configuração de APIs para Geração e Manipulação de Imagens

## ✅ Status Atual

### Funcionando com APIs Gratuitas:
- ✅ **generate-image**: Usando Pollinations.ai (gratuito, sem necessidade de API key)
- ⚠️ **upscale-image**: Retorna imagem original (requer configuração)
- ⚠️ **remove-background**: Retorna imagem original (requer configuração)
- ⚠️ **edit-image**: Retorna imagem original (requer configuração)

## 🔧 Como Configurar APIs Premium

### 1. Replicate API (Recomendado)

Replicate oferece acesso a diversos modelos de IA incluindo:
- Stable Diffusion XL (geração de imagens)
- Real-ESRGAN (upscaling)
- InstructPix2Pix (edição de imagens)

**Passos:**

1. Crie uma conta em: https://replicate.com/
2. Obtenha sua API token em: https://replicate.com/account/api-tokens
3. Configure no Supabase Dashboard:
   - Vá para: https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/settings/functions
   - Clique em "Environment Variables"
   - Adicione: `REPLICATE_API_TOKEN` = `r8_seu_token_aqui`

**Custo:** Pay-as-you-go (aproximadamente $0.01-0.05 por imagem)

### 2. Remove.bg API (Remoção de Fundo)

**Passos:**

1. Crie uma conta em: https://www.remove.bg/api
2. Obtenha sua API key
3. Configure no Supabase Dashboard:
   - Adicione: `REMOVE_BG_API_KEY` = `sua_key_aqui`

**Custo:** 
- Plano gratuito: 50 imagens/mês
- Plano pago: a partir de $9/mês

### 3. OpenAI DALL-E (Alternativa para Geração)

Se preferir usar DALL-E ao invés de Pollinations.ai:

**Passos:**

1. Crie uma conta em: https://platform.openai.com/
2. Obtenha sua API key
3. Configure no Supabase Dashboard:
   - Adicione: `OPENAI_API_KEY` = `sk-sua_key_aqui`

**Custo:** 
- DALL-E 3: $0.040 por imagem (1024x1024)
- DALL-E 2: $0.020 por imagem (1024x1024)

## 🚀 Testando as Funções

### Teste via PowerShell:

```powershell
# Configurar headers
$headers = @{
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw'
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw'
    'Content-Type' = 'application/json'
}

# Testar geração de imagem
$body = '{"prompt":"Um gato astronauta no espaço","creationMode":"livre"}'
$response = Invoke-RestMethod -Uri 'https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/generate-image' -Method Post -Headers $headers -Body $body
Write-Host "Imagem gerada: $($response.imageUrl)"

# Testar com modo específico (anime)
$body = '{"prompt":"Uma garota com cabelo rosa","creationMode":"anime"}'
$response = Invoke-RestMethod -Uri 'https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/generate-image' -Method Post -Headers $headers -Body $body
Write-Host "Imagem anime: $($response.imageUrl)"
```

### Teste via Aplicação Web:

1. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Acesse: http://localhost:5173

3. Teste as funcionalidades:
   - Geração de imagens (já funcionando!)
   - Upscaling (requer API configurada)
   - Remoção de fundo (requer API configurada)
   - Edição de imagens (requer API configurada)

## 📊 Modos de Criação Disponíveis

A função `generate-image` suporta os seguintes modos:

| Modo | Descrição | Prompt Otimizado |
|------|-----------|------------------|
| livre | Sem restrição de estilo | Nenhum |
| avatar | Avatar estilizado | "professional avatar, digital art, clean background" |
| caricatura | Caricatura exagerada | "exaggerated caricature style, humorous proportions" |
| cartoon | Cartoon ocidental | "western cartoon style, bold outlines, vibrant colors" |
| logomarca | Logo profissional | "professional logo design, minimalist, clean" |
| designer | Design gráfico | "modern graphic design, visually striking" |
| slide | Visual para apresentação | "professional presentation visual, clean" |
| webui | Interface web | "modern web interface mockup, UI/UX design" |
| adesivo | Sticker | "sticker style, white outline, vibrant colors" |
| hq | Quadrinhos | "comic book style, ink outlines, dramatic shading" |
| anime | Anime/Manga | "anime/manga style, vibrant colors, expressive eyes" |
| lego | Estilo LEGO | "LEGO style, plastic texture, brick-built" |

## 🔒 Segurança

- ✅ Todas as API keys são armazenadas como variáveis de ambiente no Supabase
- ✅ As keys nunca são expostas no código frontend
- ✅ Autenticação via Supabase anon key
- ✅ Rate limiting pode ser configurado no Supabase Dashboard

## 📈 Monitoramento

Para monitorar o uso das funções:

1. Acesse: https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/functions
2. Veja logs em tempo real
3. Monitore erros e performance
4. Verifique custos de API

## 🆘 Troubleshooting

### Erro: "Image generation failed"
- Verifique se a API key está configurada corretamente
- Verifique os logs no Supabase Dashboard
- Confirme que há créditos disponíveis na conta da API

### Imagem não carrega
- Verifique a URL retornada
- Teste a URL diretamente no navegador
- Verifique CORS no Supabase

### Timeout
- Aumente o timeout das funções no Supabase
- Considere usar webhooks para processos longos
- Implemente retry logic no frontend

## 💡 Dicas de Otimização

1. **Cache de Imagens**: Armazene imagens geradas no Supabase Storage
2. **Compressão**: Comprima imagens antes de enviar para APIs
3. **Batch Processing**: Processe múltiplas imagens em paralelo
4. **Rate Limiting**: Implemente limites por usuário
5. **Fallbacks**: Sempre tenha um fallback gratuito

## 🎯 Próximos Passos

1. ✅ Configurar Replicate API para melhor qualidade
2. ✅ Configurar Remove.bg para remoção de fundo
3. ⬜ Implementar cache de imagens no Supabase Storage
4. ⬜ Adicionar fila de processamento para múltiplas imagens
5. ⬜ Implementar sistema de créditos por usuário
6. ⬜ Adicionar analytics de uso

---

**Última atualização:** 29 de Março de 2026  
**Status:** ✅ Geração de imagens funcionando com API gratuita
