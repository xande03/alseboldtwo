-- =====================================================
-- SETUP DE CACHE DE IMAGENS E SISTEMA DE CRÉDITOS
-- =====================================================

-- 1. Criar bucket de storage (execute manualmente no dashboard se necessário)
-- Nome: generated-images
-- Public: true

-- 2. Tabela para cache de imagens geradas
CREATE TABLE IF NOT EXISTS image_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt TEXT NOT NULL,
  creation_mode TEXT NOT NULL,
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  api_used TEXT DEFAULT 'pollinations',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  access_count INTEGER DEFAULT 1,
  UNIQUE(prompt, creation_mode)
);

-- Comentários
COMMENT ON TABLE image_cache IS 'Cache de imagens geradas para evitar regeneração';
COMMENT ON COLUMN image_cache.prompt IS 'Prompt usado para gerar a imagem';
COMMENT ON COLUMN image_cache.creation_mode IS 'Modo de criação (livre, anime, cartoon, etc)';
COMMENT ON COLUMN image_cache.image_url IS 'URL pública da imagem no Supabase Storage';
COMMENT ON COLUMN image_cache.storage_path IS 'Caminho do arquivo no storage';
COMMENT ON COLUMN image_cache.api_used IS 'API usada (replicate, pollinations, etc)';
COMMENT ON COLUMN image_cache.access_count IS 'Número de vezes que a imagem foi acessada';

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_image_cache_prompt ON image_cache(prompt, creation_mode);
CREATE INDEX IF NOT EXISTS idx_image_cache_created ON image_cache(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_image_cache_accessed ON image_cache(accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_image_cache_api ON image_cache(api_used);

-- 3. Função para atualizar último acesso
CREATE OR REPLACE FUNCTION update_image_access()
RETURNS TRIGGER AS $$
BEGIN
  NEW.accessed_at = NOW();
  NEW.access_count = OLD.access_count + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_image_access() IS 'Atualiza timestamp e contador de acesso automaticamente';

-- 4. Trigger para atualizar acesso
DROP TRIGGER IF EXISTS trigger_update_access ON image_cache;
CREATE TRIGGER trigger_update_access
BEFORE UPDATE ON image_cache
FOR EACH ROW
WHEN (OLD.accessed_at IS DISTINCT FROM NEW.accessed_at)
EXECUTE FUNCTION update_image_access();

-- 5. Tabela para controle de rate limiting
CREATE TABLE IF NOT EXISTS user_rate_limit (
  user_id UUID PRIMARY KEY,
  requests_count INTEGER DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_request TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE user_rate_limit IS 'Controle de rate limiting por usuário';

-- Índice
CREATE INDEX IF NOT EXISTS idx_rate_limit_window ON user_rate_limit(window_start);

-- 6. Função para verificar rate limit
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
  -- Buscar registro do usuário
  SELECT requests_count, window_start
  INTO v_count, v_window_start
  FROM user_rate_limit
  WHERE user_id = p_user_id;
  
  -- Se não existe registro, criar
  IF NOT FOUND THEN
    INSERT INTO user_rate_limit (user_id, requests_count, window_start, last_request)
    VALUES (p_user_id, 1, NOW(), NOW());
    RETURN TRUE;
  END IF;
  
  -- Se janela expirou, resetar
  IF v_window_start < NOW() - (p_window_minutes || ' minutes')::INTERVAL THEN
    UPDATE user_rate_limit
    SET 
      requests_count = 1,
      window_start = NOW(),
      last_request = NOW()
    WHERE user_id = p_user_id;
    RETURN TRUE;
  END IF;
  
  -- Se dentro do limite, incrementar
  IF v_count < p_max_requests THEN
    UPDATE user_rate_limit
    SET 
      requests_count = requests_count + 1,
      last_request = NOW()
    WHERE user_id = p_user_id;
    RETURN TRUE;
  END IF;
  
  -- Limite excedido
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_rate_limit IS 'Verifica se usuário está dentro do limite de requisições';

-- 7. Tabela de créditos por usuário
CREATE TABLE IF NOT EXISTS user_credits (
  user_id UUID PRIMARY KEY,
  credits INTEGER DEFAULT 100,
  total_used INTEGER DEFAULT 0,
  last_refill TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE user_credits IS 'Sistema de créditos por usuário';
COMMENT ON COLUMN user_credits.credits IS 'Créditos disponíveis';
COMMENT ON COLUMN user_credits.total_used IS 'Total de créditos já utilizados';

-- Índice
CREATE INDEX IF NOT EXISTS idx_credits_refill ON user_credits(last_refill);

-- 8. Função para consumir créditos
CREATE OR REPLACE FUNCTION consume_credits(
  p_user_id UUID,
  p_amount INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_credits INTEGER;
BEGIN
  -- Buscar créditos do usuário
  SELECT credits INTO v_credits
  FROM user_credits
  WHERE user_id = p_user_id;
  
  -- Se não existe registro, criar com créditos iniciais
  IF NOT FOUND THEN
    INSERT INTO user_credits (user_id, credits, total_used)
    VALUES (p_user_id, 100 - p_amount, p_amount);
    RETURN TRUE;
  END IF;
  
  -- Verificar se tem créditos suficientes
  IF v_credits >= p_amount THEN
    UPDATE user_credits
    SET 
      credits = credits - p_amount,
      total_used = total_used + p_amount
    WHERE user_id = p_user_id;
    RETURN TRUE;
  END IF;
  
  -- Créditos insuficientes
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION consume_credits IS 'Consome créditos do usuário';

-- 9. Função para recarregar créditos diariamente
CREATE OR REPLACE FUNCTION refill_daily_credits()
RETURNS INTEGER AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE user_credits
  SET 
    credits = LEAST(credits + 50, 100),
    last_refill = NOW()
  WHERE last_refill < NOW() - INTERVAL '1 day';
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refill_daily_credits IS 'Recarrega 50 créditos diários (máximo 100)';

-- 10. Tabela de histórico de uso
CREATE TABLE IF NOT EXISTS usage_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  function_name TEXT NOT NULL,
  credits_used INTEGER DEFAULT 1,
  api_used TEXT,
  cached BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE usage_history IS 'Histórico de uso das funções';

-- Índices
CREATE INDEX IF NOT EXISTS idx_usage_user ON usage_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_function ON usage_history(function_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_created ON usage_history(created_at DESC);

-- 11. View para estatísticas de cache
CREATE OR REPLACE VIEW cache_stats AS
SELECT 
  creation_mode,
  COUNT(*) as total_images,
  SUM(access_count) as total_accesses,
  AVG(access_count)::NUMERIC(10,2) as avg_accesses,
  MAX(access_count) as max_accesses,
  MIN(created_at) as oldest_image,
  MAX(created_at) as newest_image,
  COUNT(CASE WHEN api_used = 'replicate' THEN 1 END) as replicate_count,
  COUNT(CASE WHEN api_used = 'pollinations' THEN 1 END) as pollinations_count
FROM image_cache
GROUP BY creation_mode
ORDER BY total_images DESC;

COMMENT ON VIEW cache_stats IS 'Estatísticas do cache de imagens';

-- 12. View para estatísticas de usuários
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  uc.user_id,
  uc.credits,
  uc.total_used,
  uc.last_refill,
  COUNT(uh.id) as total_requests,
  COUNT(CASE WHEN uh.cached THEN 1 END) as cached_requests,
  SUM(uh.credits_used) as credits_consumed
FROM user_credits uc
LEFT JOIN usage_history uh ON uc.user_id = uh.user_id
GROUP BY uc.user_id, uc.credits, uc.total_used, uc.last_refill;

COMMENT ON VIEW user_stats IS 'Estatísticas de uso por usuário';

-- 13. Função para limpar cache antigo
CREATE OR REPLACE FUNCTION cleanup_old_cache(
  p_days INTEGER DEFAULT 30,
  p_min_access_count INTEGER DEFAULT 2
)
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM image_cache
  WHERE 
    accessed_at < NOW() - (p_days || ' days')::INTERVAL
    AND access_count < p_min_access_count;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_cache IS 'Remove imagens antigas do cache com poucos acessos';

-- 14. Políticas RLS (Row Level Security)
ALTER TABLE image_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rate_limit ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_history ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler o cache
CREATE POLICY "Public read access" ON image_cache
  FOR SELECT USING (true);

-- Política: Apenas service role pode escrever no cache
CREATE POLICY "Service role write access" ON image_cache
  FOR ALL USING (auth.role() = 'service_role');

-- Política: Usuários podem ver seus próprios créditos
CREATE POLICY "Users can view own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

-- Política: Usuários podem ver seu próprio histórico
CREATE POLICY "Users can view own history" ON usage_history
  FOR SELECT USING (auth.uid() = user_id);

-- 15. Grants
GRANT SELECT ON image_cache TO anon, authenticated;
GRANT SELECT ON cache_stats TO anon, authenticated;
GRANT SELECT ON user_credits TO authenticated;
GRANT SELECT ON user_stats TO authenticated;
GRANT SELECT ON usage_history TO authenticated;

-- =====================================================
-- FIM DO SETUP
-- =====================================================

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Setup de cache e créditos concluído com sucesso!';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '1. Criar bucket "generated-images" no Storage (se ainda não existe)';
  RAISE NOTICE '2. Configurar políticas de acesso público no bucket';
  RAISE NOTICE '3. Configurar variáveis de ambiente (REPLICATE_API_TOKEN, REMOVE_BG_API_KEY)';
  RAISE NOTICE '4. Fazer deploy das funções atualizadas';
END $$;
