# 🔧 CONFIGURAÇÃO COMPLETA QR CODE - NOVA VERSÃO

## ❌ PROBLEMA IDENTIFICADO
**Erro:** "Bucket not found"  
**Causa:** Bucket `qr-files` não existe ou não está configurado corretamente

## ✅ SOLUÇÃO COMPLETA

### **PASSO 1: EXECUTAR SQL**
1. Acesse: https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/sql/new
2. Cole e execute o conteúdo do arquivo: `CRIAR_BUCKET_QR_NOVO.sql`
3. Clique em **RUN** para executar

### **PASSO 2: CRIAR BUCKET DE STORAGE**
1. Acesse: https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/storage/buckets
2. Clique em **"New bucket"**
3. Configure:
   - **Name:** `qr-storage`
   - **Public bucket:** ✅ **MARCAR COMO PÚBLICO**
   - **File size limit:** 50 MB
   - **Allowed MIME types:** Deixar vazio (aceitar todos)
4. Clique em **"Create bucket"**

### **PASSO 3: CONFIGURAR POLÍTICAS DO BUCKET**
1. No bucket `qr-storage`, clique em **"Settings"**
2. Vá para **"Policies"**
3. Adicione estas políticas:

#### **Política de Upload:**
```sql
CREATE POLICY "Permitir upload para todos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'qr-storage');
```

#### **Política de Leitura:**
```sql
CREATE POLICY "Permitir leitura pública" ON storage.objects
FOR SELECT USING (bucket_id = 'qr-storage');
```

#### **Política de Exclusão:**
```sql
CREATE POLICY "Permitir exclusão para todos" ON storage.objects
FOR DELETE USING (bucket_id = 'qr-storage');
```

### **PASSO 4: VERIFICAR VARIÁVEIS DE AMBIENTE**
1. Acesse: https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/settings/functions
2. Verifique se existem:
   - `SUPABASE_URL`: https://zfstmsgevfhdkhesatzm.supabase.co
   - `SUPABASE_SERVICE_ROLE_KEY`: [sua chave service role]

### **PASSO 5: ATUALIZAR FUNÇÃO QR CODE**
Execute este comando para atualizar a função:
```bash
npx supabase functions deploy generate-qrcode
```

## 🧪 TESTE RÁPIDO

Execute este PowerShell para testar:

```powershell
# Teste simples de QR Code
$payload = @{
    content = "Teste novo bucket"
    type = "text"
    expirationOption = "1hour"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/generate-qrcode" `
    -Method POST `
    -Headers @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw"
    } `
    -Body $payload

Write-Host "Resultado: $($response.success)"
```

## 🔄 ALTERNATIVA: USAR BUCKET EXISTENTE

Se preferir usar um bucket que já existe:

1. **Verificar buckets existentes:**
   - Acesse: https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/storage/buckets
   - Veja quais buckets já existem

2. **Atualizar função para usar bucket existente:**
   - Edite `supabase/functions/generate-qrcode/index.ts`
   - Mude `'qr-files'` para o nome do bucket existente
   - Execute: `npx supabase functions deploy generate-qrcode`

## 📋 CHECKLIST DE VERIFICAÇÃO

- [ ] SQL executado com sucesso
- [ ] Bucket `qr-storage` criado e público
- [ ] Políticas de storage configuradas
- [ ] Variáveis de ambiente verificadas
- [ ] Função QR code atualizada
- [ ] Teste executado com sucesso

## 🆘 SE AINDA HOUVER PROBLEMAS

Execute este diagnóstico completo:

```powershell
# Verificar buckets existentes
npx supabase storage ls

# Verificar funções ativas
npx supabase functions list

# Testar conectividade
curl -X POST "https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/generate-qrcode" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw" \
  -d '{"content":"teste","type":"text"}'
```

## 🎯 RESULTADO ESPERADO

Após seguir todos os passos:
- ✅ QR Code Generator funcionando
- ✅ Upload de arquivos funcionando
- ✅ Sistema de expiração ativo
- ✅ Sem erros de "Bucket not found"