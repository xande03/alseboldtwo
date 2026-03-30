-- =====================================================
-- CONFIGURAÇÃO COMPLETA DO STORAGE PARA QR CODE
-- Execute este SQL no Supabase Dashboard
-- Link: https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/sql/new
-- =====================================================

-- 1. Criar tabela para controle de arquivos temporários
CREATE TABLE IF NOT EXISTS temp_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL,
  bucket_name TEXT NOT NULL DEFAULT 'qr-files',
  original_name TEXT NOT NULL,
  content_type TEXT,
  file_size BIGINT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  auto_delete BOOLEAN DEFAULT true,
  user_session TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  qr_code_generated BOOLEAN DEFAULT false
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_temp_files_expires ON temp_files(expires_at);
CREATE INDEX IF NOT EXISTS idx_temp_files_path ON temp_files(file_path);
CREATE INDEX IF NOT EXISTS idx_temp_files_session ON temp_files(user_session);

-- 2. Função para limpeza automática de arquivos expirados
CREATE OR REPLACE FUNCTION cleanup_expired_files()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_file RECORD;
BEGIN
  -- Buscar arquivos expirados
  FOR expired_file IN 
    SELECT file_path, bucket_name 
    FROM temp_files 
    WHERE expires_at < NOW() AND auto_delete = true
  LOOP
    -- Tentar deletar do storage
    BEGIN
      PERFORM storage.delete_object(expired_file.bucket_name, expired_file.file_path);
    EXCEPTION WHEN OTHERS THEN
      -- Log do erro mas continua a limpeza
      RAISE NOTICE 'Erro ao deletar arquivo %: %', expired_file.file_path, SQLERRM;
    END;
  END LOOP;
  
  -- Remover registros expirados da tabela
  DELETE FROM temp_files 
  WHERE expires_at < NOW() AND auto_delete = true;
  
  RAISE NOTICE 'Limpeza de arquivos expirados concluída';
END;
$$;

-- 3. Função para agendar limpeza automática (executar a cada hora)
CREATE OR REPLACE FUNCTION schedule_cleanup()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Esta função será chamada por um cron job ou trigger
  PERFORM cleanup_expired_files();
END;
$$;

-- 4. Trigger para limpeza automática quando arquivos são inseridos
CREATE OR REPLACE FUNCTION trigger_cleanup()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Executar limpeza a cada 10 inserções para não sobrecarregar
  IF (SELECT COUNT(*) FROM temp_files WHERE created_at > NOW() - INTERVAL '1 minute') % 10 = 0 THEN
    PERFORM cleanup_expired_files();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS temp_files_cleanup_trigger ON temp_files;
CREATE TRIGGER temp_files_cleanup_trigger
  AFTER INSERT ON temp_files
  FOR EACH ROW
  EXECUTE FUNCTION trigger_cleanup();

-- 5. Políticas de segurança
ALTER TABLE temp_files ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seus próprios arquivos
DROP POLICY IF EXISTS "Users can view own temp files" ON temp_files;
CREATE POLICY "Users can view own temp files" ON temp_files
  FOR SELECT USING (
    user_session = current_setting('request.headers', true)::json->>'user-session'
    OR auth.role() = 'service_role'
  );

-- Política: Service role pode fazer tudo
DROP POLICY IF EXISTS "Service role full access" ON temp_files;
CREATE POLICY "Service role full access" ON temp_files
  FOR ALL USING (auth.role() = 'service_role');

-- Política: Inserção pública com session
DROP POLICY IF EXISTS "Public insert with session" ON temp_files;
CREATE POLICY "Public insert with session" ON temp_files
  FOR INSERT WITH CHECK (true);

-- 6. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON temp_files TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_files() TO service_role;
GRANT EXECUTE ON FUNCTION schedule_cleanup() TO service_role;

-- 7. View para estatísticas
CREATE OR REPLACE VIEW temp_files_stats AS
SELECT 
  bucket_name,
  COUNT(*) as total_files,
  COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as active_files,
  COUNT(CASE WHEN expires_at <= NOW() THEN 1 END) as expired_files,
  SUM(file_size) as total_size_bytes,
  AVG(file_size) as avg_size_bytes,
  MIN(created_at) as oldest_file,
  MAX(created_at) as newest_file
FROM temp_files
GROUP BY bucket_name;

GRANT SELECT ON temp_files_stats TO anon, authenticated;

-- 8. Função para deletar arquivo específico
CREATE OR REPLACE FUNCTION delete_temp_file(file_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  file_record RECORD;
  deleted BOOLEAN := false;
BEGIN
  -- Buscar o arquivo
  SELECT file_path, bucket_name INTO file_record
  FROM temp_files 
  WHERE id = file_id;
  
  IF FOUND THEN
    -- Deletar do storage
    BEGIN
      PERFORM storage.delete_object(file_record.bucket_name, file_record.file_path);
      deleted := true;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Erro ao deletar arquivo do storage: %', SQLERRM;
    END;
    
    -- Deletar registro da tabela
    DELETE FROM temp_files WHERE id = file_id;
  END IF;
  
  RETURN deleted;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_temp_file(UUID) TO anon, authenticated, service_role;

-- =====================================================
-- CONFIGURAÇÃO CONCLUÍDA
-- =====================================================

-- Verificar se tudo foi criado
SELECT 
  'temp_files' as table_name,
  COUNT(*) as row_count
FROM temp_files
UNION ALL
SELECT 
  'temp_files_stats' as table_name,
  COUNT(*) as row_count
FROM temp_files_stats;

-- Testar função de limpeza
SELECT cleanup_expired_files();

-- Mostrar estatísticas
SELECT * FROM temp_files_stats;