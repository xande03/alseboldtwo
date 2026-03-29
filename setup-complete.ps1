# =====================================================
# SCRIPT DE CONFIGURAÇÃO COMPLETA
# =====================================================
# Este script configura:
# 1. Bucket de storage para imagens
# 2. Tabelas de cache e créditos
# 3. Deploy das funções atualizadas
# =====================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURAÇÃO COMPLETA - ALSE BOLD" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está logado no Supabase
Write-Host "1. Verificando login no Supabase..." -ForegroundColor Yellow
try {
    $loginCheck = npx supabase projects list 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ✗ Não está logado. Fazendo login..." -ForegroundColor Red
        npx supabase login
    } else {
        Write-Host "   ✓ Já está logado" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠ Erro ao verificar login" -ForegroundColor Yellow
}
Write-Host ""

# Aplicar migrations SQL
Write-Host "2. Aplicando migrations do banco de dados..." -ForegroundColor Yellow
Write-Host "   Você precisa executar o SQL manualmente no dashboard:" -ForegroundColor Gray
Write-Host "   https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/sql/new" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Copie e execute o conteúdo de:" -ForegroundColor Gray
Write-Host "   supabase/migrations/001_setup_cache.sql" -ForegroundColor White
Write-Host ""
$response = Read-Host "   Pressione ENTER quando terminar de executar o SQL"
Write-Host ""

# Criar bucket de storage
Write-Host "3. Configurando Storage Bucket..." -ForegroundColor Yellow
Write-Host "   Você precisa criar o bucket manualmente:" -ForegroundColor Gray
Write-Host "   1. Acesse: https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/storage/buckets" -ForegroundColor Cyan
Write-Host "   2. Clique em 'New bucket'" -ForegroundColor Gray
Write-Host "   3. Nome: generated-images" -ForegroundColor White
Write-Host "   4. Public: ✓ Sim" -ForegroundColor White
Write-Host "   5. Clique em 'Create bucket'" -ForegroundColor Gray
Write-Host ""
$response = Read-Host "   Pressione ENTER quando terminar de criar o bucket"
Write-Host ""

# Deploy das funções atualizadas
Write-Host "4. Fazendo deploy das funções atualizadas..." -ForegroundColor Yellow

Write-Host "   Deployando generate-image..." -ForegroundColor Gray
npx supabase functions deploy generate-image
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ generate-image deployada" -ForegroundColor Green
} else {
    Write-Host "   ✗ Erro ao deployar generate-image" -ForegroundColor Red
}

Write-Host "   Deployando remove-background..." -ForegroundColor Gray
npx supabase functions deploy remove-background
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ remove-background deployada" -ForegroundColor Green
} else {
    Write-Host "   ✗ Erro ao deployar remove-background" -ForegroundColor Red
}

Write-Host "   Deployando upscale-image..." -ForegroundColor Gray
npx supabase functions deploy upscale-image
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ upscale-image deployada" -ForegroundColor Green
} else {
    Write-Host "   ✗ Erro ao deployar upscale-image" -ForegroundColor Red
}

Write-Host "   Deployando edit-image..." -ForegroundColor Gray
npx supabase functions deploy edit-image
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ edit-image deployada" -ForegroundColor Green
} else {
    Write-Host "   ✗ Erro ao deployar edit-image" -ForegroundColor Red
}

Write-Host ""

# Listar funções
Write-Host "5. Verificando funções deployadas..." -ForegroundColor Yellow
npx supabase functions list
Write-Host ""

# Instruções para configurar APIs
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PRÓXIMOS PASSOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Setup básico concluído!" -ForegroundColor Green
Write-Host ""

Write-Host "Para habilitar APIs premium:" -ForegroundColor Yellow
Write-Host ""

Write-Host "1. REPLICATE API (Upscaling e Edição)" -ForegroundColor White
Write-Host "   • Criar conta: https://replicate.com/" -ForegroundColor Gray
Write-Host "   • Obter token: https://replicate.com/account/api-tokens" -ForegroundColor Gray
Write-Host "   • Configurar: https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/settings/functions" -ForegroundColor Gray
Write-Host "   • Nome: REPLICATE_API_TOKEN" -ForegroundColor Cyan
Write-Host "   • Valor: r8_..." -ForegroundColor Cyan
Write-Host ""

Write-Host "2. REMOVE.BG API (Remoção de Fundo)" -ForegroundColor White
Write-Host "   • Criar conta: https://www.remove.bg/users/sign_up" -ForegroundColor Gray
Write-Host "   • Obter key: https://www.remove.bg/api" -ForegroundColor Gray
Write-Host "   • Configurar: https://supabase.com/dashboard/project/zfstmsgevfhdkhesatzm/settings/functions" -ForegroundColor Gray
Write-Host "   • Nome: REMOVE_BG_API_KEY" -ForegroundColor Cyan
Write-Host "   • Valor: sua_key" -ForegroundColor Cyan
Write-Host ""

Write-Host "📚 Documentação completa:" -ForegroundColor Yellow
Write-Host "   • GUIA_CONFIGURACAO_COMPLETA.md" -ForegroundColor Cyan
Write-Host "   • CONFIGURACAO_APIS.md" -ForegroundColor Cyan
Write-Host ""

Write-Host "🧪 Testar o sistema:" -ForegroundColor Yellow
Write-Host "   .\test-image-functions.ps1" -ForegroundColor Cyan
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
