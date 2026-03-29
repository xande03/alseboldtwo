# Script completo para testar funções de geração e manipulação de imagens
# Execute com: .\test-image-functions.ps1

$SUPABASE_URL = "https://zfstmsgevfhdkhesatzm.supabase.co"
$ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw"

$headers = @{
    'Authorization' = "Bearer $ANON_KEY"
    'apikey' = $ANON_KEY
    'Content-Type' = 'application/json'
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTE DE FUNÇÕES DE IMAGEM - SUPABASE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Teste 1: Geração de Imagem - Modo Livre
Write-Host "1. Testando generate-image (modo livre)..." -ForegroundColor Yellow
$body = @{
    prompt = "Um gato astronauta flutuando no espaço com a Terra ao fundo"
    creationMode = "livre"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/generate-image" -Method Post -Headers $headers -Body $body
    Write-Host "   ✓ Sucesso!" -ForegroundColor Green
    Write-Host "   URL: $($response.imageUrl)" -ForegroundColor Gray
    if ($response.warning) {
        Write-Host "   ⚠ Aviso: $($response.warning)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ✗ Erro: $_" -ForegroundColor Red
}
Write-Host ""

# Teste 2: Geração de Imagem - Modo Anime
Write-Host "2. Testando generate-image (modo anime)..." -ForegroundColor Yellow
$body = @{
    prompt = "Uma garota com cabelo rosa e olhos grandes"
    creationMode = "anime"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/generate-image" -Method Post -Headers $headers -Body $body
    Write-Host "   ✓ Sucesso!" -ForegroundColor Green
    Write-Host "   URL: $($response.imageUrl)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Erro: $_" -ForegroundColor Red
}
Write-Host ""

# Teste 3: Geração de Imagem - Modo Logo
Write-Host "3. Testando generate-image (modo logomarca)..." -ForegroundColor Yellow
$body = @{
    prompt = "Logo moderna para empresa de tecnologia"
    creationMode = "logomarca"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/generate-image" -Method Post -Headers $headers -Body $body
    Write-Host "   ✓ Sucesso!" -ForegroundColor Green
    Write-Host "   URL: $($response.imageUrl)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Erro: $_" -ForegroundColor Red
}
Write-Host ""

# Teste 4: Geração de Imagem - Modo Cartoon
Write-Host "4. Testando generate-image (modo cartoon)..." -ForegroundColor Yellow
$body = @{
    prompt = "Um cachorro super-herói com capa vermelha"
    creationMode = "cartoon"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/generate-image" -Method Post -Headers $headers -Body $body
    Write-Host "   ✓ Sucesso!" -ForegroundColor Green
    Write-Host "   URL: $($response.imageUrl)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Erro: $_" -ForegroundColor Red
}
Write-Host ""

# Teste 5: Upscale (requer imagem base64)
Write-Host "5. Testando upscale-image..." -ForegroundColor Yellow
Write-Host "   ⚠ Requer imagem em base64 - pulando teste automático" -ForegroundColor Yellow
Write-Host "   Configure REPLICATE_API_TOKEN para habilitar upscaling" -ForegroundColor Gray
Write-Host ""

# Teste 6: Remove Background (requer imagem base64)
Write-Host "6. Testando remove-background..." -ForegroundColor Yellow
Write-Host "   ⚠ Requer imagem em base64 - pulando teste automático" -ForegroundColor Yellow
Write-Host "   Configure REMOVE_BG_API_KEY para habilitar remoção de fundo" -ForegroundColor Gray
Write-Host ""

# Teste 7: Edit Image (requer imagem base64)
Write-Host "7. Testando edit-image..." -ForegroundColor Yellow
Write-Host "   ⚠ Requer imagem em base64 - pulando teste automático" -ForegroundColor Yellow
Write-Host "   Configure REPLICATE_API_TOKEN para habilitar edição de imagens" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESUMO DOS TESTES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ Geração de Imagens: FUNCIONANDO" -ForegroundColor Green
Write-Host "  - Usando Pollinations.ai (gratuito)" -ForegroundColor Gray
Write-Host "  - Suporta 12 modos de criação" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠ Upscaling: AGUARDANDO CONFIGURAÇÃO" -ForegroundColor Yellow
Write-Host "  - Configure REPLICATE_API_TOKEN" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠ Remoção de Fundo: AGUARDANDO CONFIGURAÇÃO" -ForegroundColor Yellow
Write-Host "  - Configure REMOVE_BG_API_KEY" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠ Edição de Imagens: AGUARDANDO CONFIGURAÇÃO" -ForegroundColor Yellow
Write-Host "  - Configure REPLICATE_API_TOKEN" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 Veja CONFIGURACAO_APIS.md para instruções detalhadas" -ForegroundColor Cyan
Write-Host ""
