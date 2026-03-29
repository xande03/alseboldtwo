-- =====================================================
-- COPIE E EXECUTE ESTE SQL NO SUPABASE DASHBOARD
-- Link: https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/sql/new
-- =====================================================

-- 1. Tabela de cache de imagens
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_image_cache_prompt ON image_cache(prompt, creation_mode);
CREATE INDEX IF NOT EXISTS idx_image_cache_created ON image_cache(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_image_cache_accessed ON image_cache(accessed_at DESC);

-- 2. Tabela de créditos
CREATE TABLE IF NOT EXISTS user_credits (
  user_id UUID PRIMARY KEY,
  credits INTEGER DEFAULT 100,
  total_used INTEGER DEFAULT 0,
  last_refill TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credits_refill ON user_credits(last_refill);

-- 3. Tabela de rate limiting
CREATE TABLE IF NOT EXISTS user_rate_limit (
  user_id UUID PRIMARY KEY,
  requests_count INTEGER DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_request TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_window ON user_rate_limit(window_start);

-- 4. Tabela de histórico
CREATE TABLE IF NOT EXISTS usage_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  function_name TEXT NOT NULL,
  credits_used INTEGER DEFAULT 1,
  api_used TEXT,
  cached BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_user ON usage_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_function ON usage_history(function_name, created_at DESC);

-- 5. Políticas de segurança
ALTER TABLE image_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rate_limit ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_history ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler o cache
DROP POLICY IF EXISTS "Public read access" ON image_cache;
CREATE POLICY "Public read access" ON image_cache
  FOR SELECT USING (true);

-- Política: Service role pode escrever
DROP POLICY IF EXISTS "Service role write access" ON image_cache;
CREATE POLICY "Service role write access" ON image_cache
  FOR ALL USING (auth.role() = 'service_role');

-- Política: Usuários veem seus créditos
DROP POLICY IF EXISTS "Users can view own credits" ON user_credits;
CREATE POLICY "Users can view own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

-- Política: Usuários veem seu histórico
DROP POLICY IF EXISTS "Users can view own history" ON usage_history;
CREATE POLICY "Users can view own history" ON usage_history
  FOR SELECT USING (auth.uid() = user_id);

-- 6. Grants
GRANT SELECT ON image_cache TO anon, authenticated;
GRANT SELECT ON user_credits TO authenticated;
GRANT SELECT ON usage_history TO authenticated;

-- 7. View de estatísticas
CREATE OR REPLACE VIEW cache_stats AS
SELECT 
  creation_mode,
  COUNT(*) as total_images,
  SUM(access_count) as total_accesses,
  AVG(access_count)::NUMERIC(10,2) as avg_accesses,
  MAX(access_count) as max_accesses,
  COUNT(CASE WHEN api_used = 'replicate' THEN 1 END) as replicate_count,
  COUNT(CASE WHEN api_used = 'pollinations' THEN 1 END) as pollinations_count
FROM image_cache
GROUP BY creation_mode;

GRANT SELECT ON cache_stats TO anon, authenticated;

-- =====================================================
-- PRONTO! Setup concluído com sucesso
-- =====================================================

-- Verificar se tudo foi criado
SELECT 
  'image_cache' as table_name,
  COUNT(*) as row_count
FROM image_cache
UNION ALL
SELECT 
  'user_credits' as table_name,
  COUNT(*) as row_count
FROM user_credits
UNION ALL
SELECT 
  'user_rate_limit' as table_name,
  COUNT(*) as row_count
FROM user_rate_limit
UNION ALL
SELECT 
  'usage_history' as table_name,
  COUNT(*) as row_count
FROM usage_history;
