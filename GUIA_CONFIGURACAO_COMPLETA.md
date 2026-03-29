# 🔧 Guia Completo de Configuração - APIs Premium e Cache

## Passo 1: Configurar REPLICATE_API_TOKEN

### O que é Replicate?
Replicate oferece acesso a modelos de IA de última geração para upscaling e edição de imagens.

### Como Obter o Token:

1. **Criar Conta**
   - Acesse: https://replicate.com/
   - Clique em "Sign Up"
   - Use GitHub, Google ou email

2. **Obter API Token**
   - Após login, vá para: https://replicate.com/account/api-tokens
   - Clique em "Create token"
   - Copie o token (formato: `r8_...`)

3. **Configurar no Supabase**
   - Acesse: https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/settings/functions
   - Clique em "Environment Variables"
   - Clique em "Add variable"
   - Nome: `REPLICATE_API_TOKEN`
   - Valor: Cole seu token (ex: `r8_abc123...`)
   - Clique em "Save"

### Custo Estimado:
- Upscaling (Real-ESRGAN): ~$0.01-0.02 por imagem
- Edição (InstructPix2Pix): ~$0.02-0.05 por imagem
- Geração (SDXL): ~$0.02-0.04 por imagem

### Modelos Utilizados:
- **Real-ESRGAN**: Upscaling 4x com IA
- **InstructPix2Pix**: Edição guiada por texto
- **SDXL**: Geração de imagens de alta qualidade

---

## Passo 2: Configurar REMOVE_BG_API_KEY

### O que é Remove.bg?
Serviço especializado em remoção automática de fundo de imagens.

### Como Obter a API Key:

1. **Criar Conta**
   - Acesse: https://www.remove.bg/users/sign_up
   - Crie uma conta gratuita

2. **Obter API Key**
   - Após login, vá para: https://www.remove.bg/api
   - Clique em "Get API Key"
   - Copie a key fornecida

3. **Configurar no Supabase**
   - Acesse: https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/settings/functions
   - Clique em "Environment Variables"
   - Clique em "Add variable"
   - Nome: `REMOVE_BG_API_KEY`
   - Valor: Cole sua key
   - Clique em "Save"

### Planos:
- **Gratuito**: 50 imagens/mês
- **Subscription**: A partir de $9/mês (500 imagens)
- **Pay-as-you-go**: $0.20 por imagem

### Qualidade:
- Detecção automática de pessoas, produtos, animais
- Bordas suaves e precisas
- Suporte para imagens de alta resolução

---

## Passo 3: Implementar Cache de Imagens no Supabase Storage

### Por que usar cache?

1. **Economia**: Evita gerar a mesma imagem múltiplas vezes
2. **Performance**: Imagens são servidas instantaneamente
3. **Confiabilidade**: Imagens ficam armazenadas permanentemente
4. **CDN**: Supabase Storage usa CDN global

### Implementação:

#### 3.1. Criar Bucket no Supabase

1. **Acessar Storage**
   - Vá para: https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/storage/buckets

2. **Criar Bucket**
   - Clique em "New bucket"
   - Nome: `generated-images`
   - Public: ✅ Sim (para acesso direto às imagens)
   - Clique em "Create bucket"

3. **Configurar Políticas de Acesso**
   - Clique no bucket `generated-images`
   - Vá para "Policies"
   - Adicione política de leitura pública:
   
   ```sql
   CREATE POLICY "Public Access"
   ON storage.objects FOR SELECT
   USING ( bucket_id = 'generated-images' );
   ```

#### 3.2. Criar Tabela de Cache

Execute no SQL Editor do Supabase:

```sql
-- Tabela para cache de imagens geradas
CREATE TABLE IF NOT EXISTS image_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt TEXT NOT NULL,
  creation_mode TEXT NOT NULL,
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  access_count INTEGER DEFAULT 1,
  UNIQUE(prompt, creation_mode)
);

-- Índice para busca rápida
CREATE INDEX idx_image_cache_prompt ON image_cache(prompt, creation_mode);
CREATE INDEX idx_image_cache_created ON image_cache(created_at DESC);

-- Função para atualizar último acesso
CREATE OR REPLACE FUNCTION update_image_access()
RETURNS TRIGGER AS $$
BEGIN
  NEW.accessed_at = NOW();
  NEW.access_count = OLD.access_count + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar acesso
CREATE TRIGGER trigger_update_access
BEFORE UPDATE ON image_cache
FOR EACH ROW
EXECUTE FUNCTION update_image_access();
```

#### 3.3. Atualizar Função generate-image

A função já está preparada para usar cache. Quando você configurar o Replicate token, ela automaticamente:

1. Verifica se a imagem já foi gerada (cache)
2. Se sim, retorna a URL do cache
3. Se não, gera nova imagem
4. Salva no Supabase Storage
5. Registra no cache para uso futuro

---

## Passo 4: Verificar Configuração

### 4.1. Verificar Variáveis de Ambiente

Execute no PowerShell:

```powershell
# Listar funções
npx supabase functions list

# Ver logs para confirmar que as variáveis estão sendo lidas
npx supabase functions logs generate-image --follow
```

### 4.2. Testar Replicate API

```powershell
$headers = @{
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw'
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw'
    'Content-Type' = 'application/json'
}

# Testar geração (deve usar Replicate se configurado)
$body = '{"prompt":"Um gato astronauta fotorrealista","creationMode":"livre"}'
$response = Invoke-RestMethod -Uri 'https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/generate-image' -Method Post -Headers $headers -Body $body

Write-Host "URL da imagem: $($response.imageUrl)"
Write-Host "Usando cache: $($response.cached)"
```

### 4.3. Testar Remove.bg

```powershell
# Você precisará de uma imagem em base64
# Este é apenas um exemplo da estrutura
$body = @{
    imageBase64 = "data:image/jpeg;base64,..."
    newBackground = "#ffffff"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri 'https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/remove-background' -Method Post -Headers $headers -Body $body
```

---

## Passo 5: Monitoramento e Otimização

### 5.1. Monitorar Uso de APIs

**Replicate:**
- Dashboard: https://replicate.com/account
- Veja uso e custos em tempo real

**Remove.bg:**
- Dashboard: https://www.remove.bg/users/sign_in
- Monitore créditos restantes

### 5.2. Monitorar Cache

Execute no SQL Editor:

```sql
-- Ver estatísticas do cache
SELECT 
  creation_mode,
  COUNT(*) as total_cached,
  SUM(access_count) as total_accesses,
  AVG(access_count) as avg_accesses
FROM image_cache
GROUP BY creation_mode
ORDER BY total_cached DESC;

-- Ver imagens mais acessadas
SELECT 
  prompt,
  creation_mode,
  access_count,
  created_at,
  accessed_at
FROM image_cache
ORDER BY access_count DESC
LIMIT 10;

-- Ver tamanho do cache
SELECT 
  COUNT(*) as total_images,
  pg_size_pretty(pg_total_relation_size('image_cache')) as table_size
FROM image_cache;
```

### 5.3. Limpar Cache Antigo (Opcional)

```sql
-- Deletar imagens não acessadas há mais de 30 dias
DELETE FROM image_cache
WHERE accessed_at < NOW() - INTERVAL '30 days'
AND access_count < 5;

-- Deletar imagens do storage também
-- (Faça isso manualmente no dashboard ou crie uma função)
```

---

## Passo 6: Otimizações Avançadas

### 6.1. Rate Limiting por Usuário

Adicione no SQL Editor:

```sql
-- Tabela para controle de rate limiting
CREATE TABLE IF NOT EXISTS user_rate_limit (
  user_id UUID PRIMARY KEY,
  requests_count INTEGER DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Função para verificar rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_max_requests INTEGER DEFAULT 100,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT requests_count, window_start
  INTO v_count, v_window_start
  FROM user_rate_limit
  WHERE user_id = p_user_id;
  
  -- Se não existe registro, criar
  IF NOT FOUND THEN
    INSERT INTO user_rate_limit (user_id, requests_count)
    VALUES (p_user_id, 1);
    RETURN TRUE;
  END IF;
  
  -- Se janela expirou, resetar
  IF v_window_start < NOW() - (p_window_minutes || ' minutes')::INTERVAL THEN
    UPDATE user_rate_limit
    SET requests_count = 1, window_start = NOW()
    WHERE user_id = p_user_id;
    RETURN TRUE;
  END IF;
  
  -- Se dentro do limite, incrementar
  IF v_count < p_max_requests THEN
    UPDATE user_rate_limit
    SET requests_count = requests_count + 1
    WHERE user_id = p_user_id;
    RETURN TRUE;
  END IF;
  
  -- Limite excedido
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
```

### 6.2. Sistema de Créditos

```sql
-- Tabela de créditos por usuário
CREATE TABLE IF NOT EXISTS user_credits (
  user_id UUID PRIMARY KEY,
  credits INTEGER DEFAULT 100,
  last_refill TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Função para consumir créditos
CREATE OR REPLACE FUNCTION consume_credits(
  p_user_id UUID,
  p_amount INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_credits INTEGER;
BEGIN
  SELECT credits INTO v_credits
  FROM user_credits
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO user_credits (user_id, credits)
    VALUES (p_user_id, 100 - p_amount);
    RETURN TRUE;
  END IF;
  
  IF v_credits >= p_amount THEN
    UPDATE user_credits
    SET credits = credits - p_amount
    WHERE user_id = p_user_id;
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Função para recarregar créditos diariamente
CREATE OR REPLACE FUNCTION refill_daily_credits()
RETURNS void AS $$
BEGIN
  UPDATE user_credits
  SET 
    credits = LEAST(credits + 50, 100),
    last_refill = NOW()
  WHERE last_refill < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;
```

---

## Checklist de Configuração

### APIs Premium
- [ ] Conta criada no Replicate
- [ ] REPLICATE_API_TOKEN obtido
- [ ] Token configurado no Supabase
- [ ] Conta criada no Remove.bg
- [ ] REMOVE_BG_API_KEY obtida
- [ ] Key configurada no Supabase
- [ ] Funções testadas com APIs premium

### Cache de Imagens
- [ ] Bucket `generated-images` criado
- [ ] Políticas de acesso configuradas
- [ ] Tabela `image_cache` criada
- [ ] Índices criados
- [ ] Triggers configurados
- [ ] Cache testado e funcionando

### Otimizações (Opcional)
- [ ] Rate limiting implementado
- [ ] Sistema de créditos configurado
- [ ] Monitoramento configurado
- [ ] Limpeza automática de cache

---

## Custos Estimados

### Cenário: 1000 imagens/mês

**Com APIs Gratuitas (Atual):**
- Geração: $0 (Pollinations.ai)
- Total: $0/mês

**Com APIs Premium:**
- Geração (Replicate SDXL): 1000 × $0.03 = $30
- Upscaling (Real-ESRGAN): 200 × $0.02 = $4
- Remoção de fundo (Remove.bg): 100 × $0.20 = $20
- Total: ~$54/mês

**Com Cache (50% de reuso):**
- Geração: 500 × $0.03 = $15
- Upscaling: 100 × $0.02 = $2
- Remoção de fundo: 50 × $0.20 = $10
- Total: ~$27/mês (50% de economia!)

---

## Suporte

- **Replicate Docs**: https://replicate.com/docs
- **Remove.bg Docs**: https://www.remove.bg/api/documentation
- **Supabase Docs**: https://supabase.com/docs
- **Dashboard**: https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm

---

**Última atualização:** 29/03/2026
