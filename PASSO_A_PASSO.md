# 📋 Guia Passo a Passo - Configuração Completa

Siga este guia para configurar todas as APIs premium e o sistema de cache.

---

## ✅ PASSO 1: Configurar Banco de Dados (Cache e Créditos)

### 1.1. Acessar SQL Editor

🔗 **Link direto:** https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/sql/new

### 1.2. Executar SQL de Setup

1. Abra o arquivo: `supabase/migrations/001_setup_cache.sql`
2. Copie TODO o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em "Run" (ou pressione Ctrl+Enter)
5. Aguarde a mensagem de sucesso

**O que isso faz:**
- ✅ Cria tabela `image_cache` para armazenar imagens geradas
- ✅ Cria tabela `user_credits` para sistema de créditos
- ✅ Cria tabela `user_rate_limit` para controle de uso
- ✅ Cria tabela `usage_history` para histórico
- ✅ Cria funções auxiliares e triggers
- ✅ Configura políticas de segurança (RLS)

---

## ✅ PASSO 2: Criar Bucket de Storage

### 2.1. Acessar Storage

🔗 **Link direto:** https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/storage/buckets

### 2.2. Criar Novo Bucket

1. Clique no botão **"New bucket"**
2. Preencha:
   - **Name:** `generated-images`
   - **Public bucket:** ✅ **Marque esta opção** (importante!)
   - **File size limit:** 50 MB (padrão)
   - **Allowed MIME types:** Deixe vazio (aceita todos)
3. Clique em **"Create bucket"**

### 2.3. Verificar Políticas

1. Clique no bucket `generated-images`
2. Vá para a aba **"Policies"**
3. Deve ter uma política de leitura pública
4. Se não tiver, clique em **"New policy"**:
   - Template: **"Enable read access for all users"**
   - Clique em **"Review"** e depois **"Save policy"**

**O que isso faz:**
- ✅ Armazena imagens geradas permanentemente
- ✅ Permite acesso público às imagens via URL
- ✅ Usa CDN global do Supabase
- ✅ Economiza custos de APIs (cache)

---

## ✅ PASSO 3: Configurar REPLICATE_API_TOKEN

### 3.1. Criar Conta no Replicate

1. Acesse: https://replicate.com/
2. Clique em **"Sign up"**
3. Use GitHub, Google ou email para criar conta
4. Confirme seu email

### 3.2. Obter API Token

1. Após login, acesse: https://replicate.com/account/api-tokens
2. Clique em **"Create token"**
3. Dê um nome (ex: "Alse Bold Production")
4. Clique em **"Create"**
5. **COPIE O TOKEN** (formato: `r8_...`)
   - ⚠️ Você só verá o token uma vez!
   - Salve em local seguro

### 3.3. Adicionar Créditos (Opcional)

1. Vá para: https://replicate.com/account/billing
2. Adicione um método de pagamento
3. Adicione créditos (mínimo $10 recomendado)

**Custo estimado:**
- $0.02-0.04 por imagem gerada (SDXL)
- $0.01-0.02 por upscaling (Real-ESRGAN)
- $0.02-0.05 por edição (InstructPix2Pix)

### 3.4. Configurar no Supabase

1. Acesse: https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/settings/functions
2. Role até **"Environment Variables"**
3. Clique em **"Add variable"**
4. Preencha:
   - **Name:** `REPLICATE_API_TOKEN`
   - **Value:** Cole o token que você copiou (ex: `r8_abc123...`)
5. Clique em **"Save"**

**O que isso habilita:**
- ✅ Geração de imagens com SDXL (melhor qualidade)
- ✅ Upscaling 4x com Real-ESRGAN
- ✅ Edição de imagens com InstructPix2Pix

---

## ✅ PASSO 4: Configurar REMOVE_BG_API_KEY

### 4.1. Criar Conta no Remove.bg

1. Acesse: https://www.remove.bg/users/sign_up
2. Preencha o formulário de cadastro
3. Confirme seu email

### 4.2. Obter API Key

1. Após login, acesse: https://www.remove.bg/api
2. Clique em **"Get API Key"**
3. **COPIE A KEY** fornecida
4. Salve em local seguro

### 4.3. Escolher Plano

**Plano Gratuito:**
- 50 imagens/mês
- Ótimo para testes

**Plano Subscription ($9/mês):**
- 500 imagens/mês
- Melhor custo-benefício

**Pay-as-you-go:**
- $0.20 por imagem
- Sem compromisso mensal

### 4.4. Configurar no Supabase

1. Acesse: https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/settings/functions
2. Role até **"Environment Variables"**
3. Clique em **"Add variable"**
4. Preencha:
   - **Name:** `REMOVE_BG_API_KEY`
   - **Value:** Cole a key que você copiou
5. Clique em **"Save"**

**O que isso habilita:**
- ✅ Remoção automática de fundo
- ✅ Detecção inteligente de objetos
- ✅ Bordas suaves e precisas

---

## ✅ PASSO 5: Configurar SUPABASE_SERVICE_ROLE_KEY

Esta key é necessária para o sistema de cache funcionar.

### 5.1. Obter Service Role Key

1. Acesse: https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/settings/api
2. Role até **"Project API keys"**
3. Encontre **"service_role"** (secret)
4. Clique no ícone de olho para revelar
5. **COPIE A KEY**
   - ⚠️ Esta é uma key sensível! Nunca exponha no frontend

### 5.2. Configurar no Supabase

1. Acesse: https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/settings/functions
2. Role até **"Environment Variables"**
3. Clique em **"Add variable"**
4. Preencha:
   - **Name:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** Cole a service role key
5. Clique em **"Save"**

### 5.3. Adicionar SUPABASE_URL

1. No mesmo local, clique em **"Add variable"**
2. Preencha:
   - **Name:** `SUPABASE_URL`
   - **Value:** `https://zfstmsgevfhdkhesatzm.supabase.co`
3. Clique em **"Save"**

**O que isso habilita:**
- ✅ Sistema de cache de imagens
- ✅ Economia de custos de API
- ✅ Performance melhorada

---

## ✅ PASSO 6: Fazer Deploy das Funções Atualizadas

Execute no PowerShell:

```powershell
# Deploy de todas as funções
npx supabase functions deploy generate-image
npx supabase functions deploy upscale-image
npx supabase functions deploy remove-background
npx supabase functions deploy edit-image
```

Ou use o script automatizado:

```powershell
.\setup-complete.ps1
```

---

## ✅ PASSO 7: Testar Tudo

### 7.1. Testar Geração de Imagem

```powershell
$headers = @{
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw'
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw'
    'Content-Type' = 'application/json'
}

# Primeira chamada (deve gerar nova imagem)
$body = '{"prompt":"Um dragão vermelho voando","creationMode":"livre"}'
$r1 = Invoke-RestMethod -Uri 'https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/generate-image' -Method Post -Headers $headers -Body $body
Write-Host "Primeira chamada:"
Write-Host "URL: $($r1.imageUrl)"
Write-Host "Cached: $($r1.cached)"
Write-Host "API: $($r1.apiUsed)"
Write-Host ""

# Segunda chamada (deve usar cache)
Start-Sleep -Seconds 2
$r2 = Invoke-RestMethod -Uri 'https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/generate-image' -Method Post -Headers $headers -Body $body
Write-Host "Segunda chamada (mesmo prompt):"
Write-Host "URL: $($r2.imageUrl)"
Write-Host "Cached: $($r2.cached)"
Write-Host "Access Count: $($r2.accessCount)"
```

### 7.2. Verificar Cache no Banco

Execute no SQL Editor:

```sql
-- Ver imagens no cache
SELECT * FROM image_cache ORDER BY created_at DESC LIMIT 10;

-- Ver estatísticas
SELECT * FROM cache_stats;
```

### 7.3. Verificar Storage

1. Acesse: https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/storage/buckets/generated-images
2. Você deve ver as imagens geradas organizadas por modo
3. Clique em uma imagem para ver a URL pública

---

## 📊 Resumo das Variáveis de Ambiente

Após completar todos os passos, você deve ter estas variáveis configuradas:

| Nome | Obrigatório | Função |
|------|-------------|--------|
| `SUPABASE_URL` | ✅ Sim | URL do projeto |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Sim | Acesso ao cache |
| `REPLICATE_API_TOKEN` | ⚠️ Opcional | Geração/upscaling premium |
| `REMOVE_BG_API_KEY` | ⚠️ Opcional | Remoção de fundo |

**Verificar configuração:**
https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/settings/functions

---

## 🎯 Benefícios Após Configuração

### Com Cache Implementado:
- ✅ **50-80% de economia** em custos de API
- ✅ **Resposta instantânea** para imagens já geradas
- ✅ **Armazenamento permanente** de imagens
- ✅ **CDN global** para entrega rápida

### Com Replicate API:
- ✅ **Qualidade superior** de imagens (SDXL)
- ✅ **Upscaling 4x** com IA
- ✅ **Edição avançada** com comandos de texto

### Com Remove.bg API:
- ✅ **Remoção precisa** de fundos
- ✅ **Detecção inteligente** de objetos
- ✅ **Bordas suaves** e profissionais

---

## 🧪 Testes Recomendados

### Teste 1: Cache Funcionando
```powershell
# Gerar imagem pela primeira vez
$body = '{"prompt":"Teste de cache","creationMode":"livre"}'
$r1 = Invoke-RestMethod -Uri 'https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/generate-image' -Method Post -Headers $headers -Body $body

# Gerar mesma imagem novamente (deve vir do cache)
$r2 = Invoke-RestMethod -Uri 'https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/generate-image' -Method Post -Headers $headers -Body $body

# Verificar
if ($r2.cached -eq $true) {
    Write-Host "✓ Cache funcionando!" -ForegroundColor Green
} else {
    Write-Host "✗ Cache não está funcionando" -ForegroundColor Red
}
```

### Teste 2: Replicate API
```powershell
# Deve usar Replicate se configurado
$body = '{"prompt":"Fotografia profissional de um gato","creationMode":"livre"}'
$r = Invoke-RestMethod -Uri 'https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/generate-image' -Method Post -Headers $headers -Body $body

Write-Host "API usada: $($r.apiUsed)"
# Deve mostrar "replicate" se configurado, ou "pollinations" se não
```

### Teste 3: Remove.bg
```powershell
# Você precisará de uma imagem real em base64
# Teste via interface web é mais fácil
```

---

## 📈 Monitoramento

### Ver Estatísticas do Cache

Execute no SQL Editor:

```sql
-- Estatísticas gerais
SELECT * FROM cache_stats;

-- Imagens mais populares
SELECT 
  prompt,
  creation_mode,
  access_count,
  api_used,
  created_at
FROM image_cache
ORDER BY access_count DESC
LIMIT 20;

-- Taxa de cache hit
SELECT 
  COUNT(CASE WHEN cached THEN 1 END)::FLOAT / COUNT(*)::FLOAT * 100 as cache_hit_rate
FROM usage_history
WHERE function_name = 'generate-image';
```

### Ver Uso de Créditos

```sql
-- Créditos por usuário
SELECT * FROM user_credits ORDER BY total_used DESC;

-- Histórico de uso
SELECT * FROM usage_history ORDER BY created_at DESC LIMIT 50;
```

---

## 🔧 Manutenção

### Limpar Cache Antigo

Execute mensalmente no SQL Editor:

```sql
-- Remover imagens não acessadas há 30+ dias com menos de 2 acessos
SELECT cleanup_old_cache(30, 2);
```

### Recarregar Créditos Diários

Configure um cron job ou execute manualmente:

```sql
-- Recarregar créditos de todos os usuários
SELECT refill_daily_credits();
```

---

## ✅ Checklist Final

Marque conforme completa cada passo:

### Banco de Dados
- [ ] SQL de setup executado
- [ ] Tabelas criadas com sucesso
- [ ] Políticas RLS configuradas
- [ ] Funções e triggers criados

### Storage
- [ ] Bucket `generated-images` criado
- [ ] Bucket configurado como público
- [ ] Políticas de leitura configuradas

### APIs Premium
- [ ] Conta Replicate criada
- [ ] REPLICATE_API_TOKEN obtido e configurado
- [ ] Créditos adicionados no Replicate
- [ ] Conta Remove.bg criada
- [ ] REMOVE_BG_API_KEY obtida e configurada

### Variáveis de Ambiente
- [ ] SUPABASE_URL configurada
- [ ] SUPABASE_SERVICE_ROLE_KEY configurada
- [ ] REPLICATE_API_TOKEN configurada (opcional)
- [ ] REMOVE_BG_API_KEY configurada (opcional)

### Deploy e Testes
- [ ] Funções deployadas
- [ ] Teste de geração realizado
- [ ] Teste de cache realizado
- [ ] Verificação no storage realizada

---

## 🎉 Conclusão

Após completar todos os passos, você terá:

- ✅ Sistema de cache funcionando (economia de 50-80%)
- ✅ Geração de imagens com IA (gratuita ou premium)
- ✅ Upscaling de imagens (se Replicate configurado)
- ✅ Remoção de fundo (se Remove.bg configurado)
- ✅ Edição de imagens com IA (se Replicate configurado)
- ✅ Sistema de créditos por usuário
- ✅ Rate limiting
- ✅ Histórico de uso

---

## 🆘 Problemas Comuns

### "Cache não está funcionando"
- Verifique se SUPABASE_SERVICE_ROLE_KEY está configurada
- Verifique se SUPABASE_URL está configurada
- Verifique se a tabela image_cache existe
- Veja os logs: `npx supabase functions logs generate-image`

### "Replicate não está sendo usado"
- Verifique se REPLICATE_API_TOKEN está configurada corretamente
- Verifique se há créditos na conta Replicate
- Veja os logs para mensagens de erro

### "Remove.bg não funciona"
- Verifique se REMOVE_BG_API_KEY está configurada
- Verifique se há créditos disponíveis
- Teste a key diretamente na API do Remove.bg

### "Bucket não encontrado"
- Verifique se o bucket `generated-images` foi criado
- Verifique se está marcado como público
- Verifique as políticas de acesso

---

## 📞 Suporte

- **Dashboard Supabase:** https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm
- **Replicate Docs:** https://replicate.com/docs
- **Remove.bg Docs:** https://www.remove.bg/api/documentation
- **Documentação Local:** Veja os arquivos .md na raiz do projeto

---

**Tempo estimado:** 15-20 minutos  
**Dificuldade:** ⭐⭐ Intermediário  
**Última atualização:** 29/03/2026
