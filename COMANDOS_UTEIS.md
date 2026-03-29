# 📝 Comandos Úteis - Projeto Alse Bold

## 🚀 Desenvolvimento

### Iniciar servidor de desenvolvimento
```bash
npm run dev
```
Acessa em: http://localhost:8080

### Build para produção
```bash
npm run build
```

### Preview da build
```bash
npm run preview
```

### Executar testes
```bash
npm run test
```

### Lint do código
```bash
npm run lint
```

---

## 🔧 Supabase CLI

### Login no Supabase
```bash
npx supabase login
```

### Listar funções deployadas
```bash
npx supabase functions list
```

### Deploy de uma função específica
```bash
npx supabase functions deploy generate-image
```

### Deploy de todas as funções
```bash
npx supabase functions deploy
```

### Ver logs de uma função
```bash
npx supabase functions logs generate-image
```

### Baixar função do servidor
```bash
npx supabase functions download generate-image
```

---

## 🧪 Testes de API

### Testar generate-image (PowerShell)
```powershell
$headers = @{
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw'
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw'
    'Content-Type' = 'application/json'
}

$body = '{"prompt":"Um gato astronauta","creationMode":"livre"}'
Invoke-RestMethod -Uri 'https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/generate-image' -Method Post -Headers $headers -Body $body
```

### Testar com diferentes modos
```powershell
# Modo Anime
$body = '{"prompt":"Uma garota ninja","creationMode":"anime"}'
Invoke-RestMethod -Uri 'https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/generate-image' -Method Post -Headers $headers -Body $body

# Modo Cartoon
$body = '{"prompt":"Um cachorro super-herói","creationMode":"cartoon"}'
Invoke-RestMethod -Uri 'https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/generate-image' -Method Post -Headers $headers -Body $body

# Modo Logo
$body = '{"prompt":"Logo moderna tech","creationMode":"logomarca"}'
Invoke-RestMethod -Uri 'https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/generate-image' -Method Post -Headers $headers -Body $body
```

### Script de teste automatizado
```powershell
.\test-image-functions.ps1
```

---

## 📦 Gerenciamento de Dependências

### Instalar dependências
```bash
npm install
```

### Atualizar dependências
```bash
npm update
```

### Verificar dependências desatualizadas
```bash
npm outdated
```

### Limpar cache do npm
```bash
npm cache clean --force
```

---

## 🔍 Debugging

### Ver logs do Supabase (todas as funções)
```bash
npx supabase functions logs
```

### Ver logs de função específica
```bash
npx supabase functions logs generate-image --follow
```

### Verificar status do projeto
```bash
npx supabase status
```

### Verificar configuração
```bash
npx supabase projects list
```

---

## 🌐 URLs Importantes

### Dashboard do Supabase
```
https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm
```

### Functions Dashboard
```
https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/functions
```

### Settings - Environment Variables
```
https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/settings/functions
```

### Storage
```
https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/storage/buckets
```

### Database
```
https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/database/tables
```

---

## 🔐 Credenciais Rápidas

### Supabase URL
```
https://zfstmsgevfhdkhesatzm.supabase.co
```

### Anon Key (para uso no frontend)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw
```

### Service Role Token (para operações admin)
```
sbp_11c39c75edf66a9a4102ebc5c27bd0b7dbc0a876
```

---

## 🎨 Endpoints das Funções

### Generate Image
```
POST https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/generate-image
Body: {"prompt": "...", "creationMode": "livre"}
```

### Upscale Image
```
POST https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/upscale-image
Body: {"imageBase64": "...", "prompt": "..."}
```

### Remove Background
```
POST https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/remove-background
Body: {"imageBase64": "...", "newBackground": "..."}
```

### Edit Image
```
POST https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/edit-image
Body: {"imageBase64": "...", "prompt": "..."}
```

### OCR Scan
```
POST https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/ocr-scan
Body: {"imageBase64": "..."}
```

### Analyze Music
```
POST https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/analyze-music
Body: {"link": "https://..."}
```

### Summarize Text
```
POST https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/summarize-text
Body: {"text": "...", "outputType": "breve"}
```

---

## 🛠️ Troubleshooting Rápido

### Erro: "Command not found: supabase"
```bash
# Use npx
npx supabase --version
```

### Erro: "Not logged in"
```bash
npx supabase login
```

### Erro: "Project not linked"
```bash
npx supabase link --project-ref zfstmsgevfhdkhesatzm
```

### Erro: "Port already in use"
```bash
# Mude a porta no vite.config.ts ou mate o processo
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### Limpar tudo e recomeçar
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

---

## 📚 Documentação

- `RESUMO_FINAL.md` - Resumo completo do projeto
- `VERIFICACAO_FINAL.md` - Verificação de credenciais e funções
- `CONFIGURACAO_APIS.md` - Como configurar APIs premium
- `DEPLOYMENT_SUMMARY.md` - Resumo do deployment
- `supabase/functions/README.md` - Documentação das funções

---

## 💡 Dicas

1. **Sempre use npx** para comandos do Supabase se não tiver instalado globalmente
2. **Verifique os logs** no dashboard quando algo não funcionar
3. **Use o modo dev** para desenvolvimento rápido
4. **Configure variáveis de ambiente** no dashboard, não no código
5. **Teste as funções** via PowerShell antes de integrar no frontend

---

**Última atualização:** 29/03/2026
