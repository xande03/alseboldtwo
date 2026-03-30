# 🔧 CONFIGURAÇÃO MANUAL SIMPLES - 3 PASSOS

## ✅ STATUS ATUAL

**Funções QR Code:** ✅ Funcionando (texto e URLs)  
**Upload de arquivos:** ⚠️ Precisa de configuração manual  
**Sistema básico:** ✅ 100% operacional  

---

## 🚀 PASSO 1: EXECUTAR SQL (2 minutos)

### 1.1 Abra o SQL Editor:
**Link:** https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/sql/new

### 1.2 Cole este SQL simplificado:

```sql
-- Criar tabela para arquivos temporários
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_temp_files_expires ON temp_files(expires_at);
CREATE INDEX IF NOT EXISTS idx_temp_files_path ON temp_files(file_path);

-- Políticas de segurança
ALTER TABLE temp_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access" ON temp_files FOR ALL USING (true);

-- Grants
GRANT ALL ON temp_files TO anon, authenticated, service_role;
```

### 1.3 Clique em "RUN"

---

## 🗂️ PASSO 2: CRIAR BUCKET (1 minuto)

### 2.1 Abra Storage:
**Link:** https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/storage/buckets

### 2.2 Clique em "New bucket"

### 2.3 Configure:
- **Name:** `qr-files`
- **Public bucket:** ✅ **MARQUE ESTA OPÇÃO**
- **File size limit:** 50 MB

### 2.4 Clique em "Create bucket"

---

## ⚙️ PASSO 3: CONFIGURAR VARIÁVEIS (2 minutos)

### 3.1 Obter Service Role Key:
1. **Abra:** https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/settings/api
2. **Copie** a "service_role" key (clique no ícone de olho)

### 3.2 Configurar Variáveis:
1. **Abra:** https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/settings/functions
2. **Adicione estas variáveis:**

**SUPABASE_URL:**
- Name: `SUPABASE_URL`
- Value: `https://zfstmsgevfhdkhesatzm.supabase.co`

**SUPABASE_SERVICE_ROLE_KEY:**
- Name: `SUPABASE_SERVICE_ROLE_KEY`
- Value: [Cole a service role key que você copiou]

### 3.3 Clique em "Save"

---

## 🧪 TESTE APÓS CONFIGURAÇÃO

Execute este comando no PowerShell:

```powershell
$headers = @{
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw'
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw'
    'Content-Type' = 'application/json'
}

# Teste básico
$body = '{"content":"Teste após configuração","type":"text"}'
$result = Invoke-RestMethod -Uri 'https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/generate-qrcode' -Method Post -Headers $headers -Body $body

Write-Host "✅ Sistema funcionando: $($result.success)"
Write-Host "QR Code: $($result.qrCodeUrl.Substring(0, 50))..."
```

---

## 🎯 RESULTADO ESPERADO

Após a configuração:

✅ **QR Code para texto:** Funcionando  
✅ **QR Code para URLs:** Funcionando  
✅ **QR Code para arquivos:** Funcionando com expiração  
✅ **Upload temporário:** Funcionando  
✅ **Deleção manual:** Funcionando  
✅ **Limpeza automática:** Funcionando  

---

## 🎉 SISTEMA COMPLETO

### Recursos Disponíveis:

1. **Geração de QR Code** para qualquer conteúdo
2. **Upload de arquivos** (PDF, imagens, documentos)
3. **Opções de expiração:**
   - Imediata (5 minutos)
   - 1 hora (padrão)
   - Permanente (1 ano)
4. **Deleção manual** pelo usuário
5. **Limpeza automática** de arquivos expirados

### Como Usar no Frontend:

```javascript
// Gerar QR Code com arquivo
const response = await fetch('/functions/v1/generate-qrcode', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: '',
    type: 'file',
    fileData: 'data:application/pdf;base64,...',
    fileName: 'documento.pdf',
    expirationOption: '1hour', // ou 'immediate' ou 'permanent'
    userSession: 'user-123'
  })
});

const result = await response.json();
console.log('QR Code:', result.qrCodeUrl);
console.log('Arquivo expira em:', result.expiration.expiresAt);
```

---

**⏱️ Tempo total:** 5 minutos  
**🎯 Resultado:** Sistema QR Code completo com storage e expiração  
**📱 Teste:** Funciona em qualquer dispositivo com câmera