# 🚀 CONFIGURAR OPENAI E APIS PREMIUM - AGORA

## ⚠️ STATUS ATUAL

**Geração de Imagens:** ✅ Funcionando com Pollinations.ai (gratuito)  
**APIs Premium:** ❌ NÃO CONFIGURADAS  
**Cache:** ❌ NÃO CONFIGURADO (precisa do SQL)

---

## 🎯 AÇÃO IMEDIATA NECESSÁRIA

### PASSO 1: Configurar Cache (OBRIGATÓRIO)

**⏱️ Tempo: 2 minutos**

1. **Abra:** https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/sql/new

2. **Execute este SQL:**
```sql
-- Tabela de cache de imagens
CREATE TABLE IF NOT EXISTS image_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt TEXT NOT NULL,
  creation_mode TEXT NOT NULL DEFAULT 'livre',
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  api_used TEXT DEFAULT 'pollinations',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  access_count INTEGER DEFAULT 1,
  UNIQUE(prompt, creation_mode)
);

-- Políticas de segurança
ALTER TABLE image_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON image_cache FOR SELECT USING (true);
CREATE POLICY "Service role write access" ON image_cache FOR ALL USING (auth.role() = 'service_role');
GRANT SELECT ON image_cache TO anon, authenticated;
```

### PASSO 2: Criar Bucket de Storage (OBRIGATÓRIO)

**⏱️ Tempo: 1 minuto**

1. **Abra:** https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/storage/buckets

2. **Clique em "New bucket"**

3. **Configure:**
   - Name: `generated-images`
   - Public bucket: ✅ **MARQUE ESTA OPÇÃO**

4. **Clique em "Create bucket"**

### PASSO 3: Configurar Variáveis de Ambiente (OBRIGATÓRIO)

**⏱️ Tempo: 3 minutos**

1. **Abra:** https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/settings/api

2. **Copie a "service_role" key** (clique no ícone de olho)

3. **Abra:** https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/settings/functions

4. **Adicione estas variáveis:**

   **SUPABASE_URL:**
   - Name: `SUPABASE_URL`
   - Value: `https://zfstmsgevfhdkhesatzm.supabase.co`

   **SUPABASE_SERVICE_ROLE_KEY:**
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: [Cole a service role key que você copiou]

---

## 🔥 CONFIGURAR OPENAI (OPCIONAL - MELHOR QUALIDADE)

### PASSO 4: Obter OpenAI API Key

**⏱️ Tempo: 5 minutos**

1. **Criar conta:** https://platform.openai.com/signup

2. **Adicionar créditos:** https://platform.openai.com/account/billing
   - Mínimo: $5 USD
   - Recomendado: $20 USD

3. **Obter API Key:** https://platform.openai.com/api-keys
   - Clique em "Create new secret key"
   - Copie a key (formato: `sk-...`)

4. **Configurar no Supabase:**
   - Vá para: https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/settings/functions
   - Adicione variável:
     - Name: `OPENAI_API_KEY`
     - Value: [Cole sua key]

### PASSO 5: Configurar Replicate (OPCIONAL - UPSCALING)

**⏱️ Tempo: 3 minutos**

1. **Criar conta:** https://replicate.com/

2. **Obter token:** https://replicate.com/account/api-tokens
   - Clique em "Create token"
   - Copie o token (formato: `r8_...`)

3. **Adicionar créditos:** https://replicate.com/account/billing
   - Mínimo: $10 USD

4. **Configurar no Supabase:**
   - Name: `REPLICATE_API_TOKEN`
   - Value: [Cole seu token]

---

## 🧪 TESTAR APÓS CONFIGURAÇÃO

Execute no PowerShell:

```powershell
# Testar geração
$headers = @{
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw'
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw'
    'Content-Type' = 'application/json'
}

$body = '{"prompt":"Teste com cache","creationMode":"livre"}'
$r = Invoke-RestMethod -Uri 'https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/generate-image' -Method Post -Headers $headers -Body $body

Write-Host "API usada: $($r.apiUsed)"
Write-Host "Cached: $($r.cached)"
Write-Host "URL: $($r.imageUrl)"
```

---

## 📊 CUSTOS ESTIMADOS

### Sem APIs Premium (Atual)
- **Custo:** $0/mês
- **Qualidade:** Boa
- **Limitações:** Sem upscaling, sem edição avançada

### Com OpenAI DALL-E 3
- **Custo:** $0.040 por imagem (1024x1024)
- **Qualidade:** Excelente
- **Benefícios:** Melhor qualidade, mais controle

### Com Replicate (SDXL + Upscaling)
- **Geração:** $0.02-0.04 por imagem
- **Upscaling:** $0.01-0.02 por imagem
- **Qualidade:** Profissional

### Com Cache (50% reuso)
- **Economia:** 50% dos custos
- **Performance:** 95% mais rápido

---

## ⚡ RESUMO DE AÇÕES

### OBRIGATÓRIO (para cache funcionar):
- [ ] Executar SQL no dashboard
- [ ] Criar bucket `generated-images`
- [ ] Configurar `SUPABASE_URL`
- [ ] Configurar `SUPABASE_SERVICE_ROLE_KEY`

### OPCIONAL (para melhor qualidade):
- [ ] Configurar `OPENAI_API_KEY`
- [ ] Configurar `REPLICATE_API_TOKEN`

### RESULTADO:
- ✅ Cache funcionando (economia + performance)
- ✅ Geração com qualidade premium (se APIs configuradas)
- ✅ Upscaling 4x (se Replicate configurado)

---

## 🆘 PROBLEMAS?

### Cache não funciona:
- Verifique se executou o SQL
- Verifique se criou o bucket público
- Verifique se configurou SUPABASE_SERVICE_ROLE_KEY

### OpenAI não funciona:
- Verifique se tem créditos na conta
- Verifique se a key está correta
- Aguarde 1-2 minutos após configurar

### Replicate não funciona:
- Verifique se tem créditos na conta
- Verifique se o token está correto
- Aguarde 1-2 minutos após configurar

---

**⏰ Tempo total:** 5-15 minutos  
**💰 Custo mínimo:** $0 (só cache) ou $5-20 (com APIs premium)  
**🎯 Resultado:** Sistema completo funcionando