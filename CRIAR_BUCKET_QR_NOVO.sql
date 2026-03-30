-- =====================================================
-- CRIAR BUCKET E CONFIGURAR QR CODE - VERSÃO NOVA
-- =====================================================

-- 1. CRIAR TABELA PARA CONTROLE DE ARQUIVOS TEMPORÁRIOS
CREATE TABLE IF NOT EXISTS public.temp_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_path TEXT NOT NULL,
    bucket_name TEXT NOT NULL DEFAULT 'qr-storage',
    original_name TEXT,
    content_type TEXT,
    file_size BIGINT,
    expires_at TIMESTAMP WITH TIME ZONE,
    auto_delete BOOLEAN DEFAULT true,
    user_session TEXT,
    qr_code_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_temp_files_expires_at ON public.temp_files(expires_at);
CREATE INDEX IF NOT EXISTS idx_temp_files_bucket_path ON public.temp_files(bucket_name, file_path);
CREATE INDEX IF NOT EXISTS idx_temp_files_user_session ON public.temp_files(user_session);

-- 3. HABILITAR RLS (Row Level Security)
ALTER TABLE public.temp_files ENABLE ROW LEVEL SECURITY;

-- 4. CRIAR POLÍTICAS DE SEGURANÇA
CREATE POLICY "Permitir inserção para todos" ON public.temp_files
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir leitura para todos" ON public.temp_files
    FOR SELECT USING (true);

CREATE POLICY "Permitir atualização para todos" ON public.temp_files
    FOR UPDATE USING (true);

CREATE POLICY "Permitir exclusão para todos" ON public.temp_files
    FOR DELETE USING (true);

-- 5. CRIAR FUNÇÃO PARA LIMPEZA AUTOMÁTICA
CREATE OR REPLACE FUNCTION cleanup_expired_files()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Deletar registros expirados
    DELETE FROM public.temp_files 
    WHERE expires_at < NOW() 
    AND auto_delete = true;
    
    RAISE NOTICE 'Limpeza automática executada em %', NOW();
END;
$$;

-- 6. CRIAR TRIGGER PARA ATUALIZAR updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_temp_files_updated_at 
    BEFORE UPDATE ON public.temp_files 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON TABLE public.temp_files IS 'Tabela para controle de arquivos temporários do sistema QR Code';
COMMENT ON COLUMN public.temp_files.file_path IS 'Caminho do arquivo no storage';
COMMENT ON COLUMN public.temp_files.bucket_name IS 'Nome do bucket onde o arquivo está armazenado';
COMMENT ON COLUMN public.temp_files.expires_at IS 'Data e hora de expiração do arquivo';
COMMENT ON COLUMN public.temp_files.auto_delete IS 'Se o arquivo deve ser excluído automaticamente';

-- 8. INSERIR DADOS DE TESTE (OPCIONAL)
INSERT INTO public.temp_files (
    file_path, 
    bucket_name, 
    original_name, 
    content_type, 
    file_size, 
    expires_at, 
    auto_delete, 
    user_session, 
    qr_code_generated
) VALUES (
    'test/sample.txt',
    'qr-storage',
    'sample.txt',
    'text/plain',
    1024,
    NOW() + INTERVAL '1 hour',
    true,
    'test-session',
    true
) ON CONFLICT DO NOTHING;

-- =====================================================
-- INSTRUÇÕES PARA EXECUÇÃO:
-- =====================================================
-- 1. Execute este SQL no Supabase SQL Editor
-- 2. Crie o bucket 'qr-storage' no Storage (público)
-- 3. Configure as variáveis de ambiente
-- 4. Teste o sistema
-- =====================================================