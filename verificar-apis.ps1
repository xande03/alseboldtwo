# Script para verificar todas as APIs e credenciais
Write-Host "=== VERIFICAÇÃO COMPLETA DE APIS ===" -ForegroundColor Cyan
Write-Host ""

$headers = @{
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw'
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw'
    'Content-Type' = 'application/json'
}

# Teste 1: Geração de Imagem
Write-Host "1. Testando geração de imagem..." -ForegroundColor Yellow
$body = '{"prompt":"Teste de API - um gato astronauta","creationMode":"livre"}'
try {
    $r = Invoke-RestMethod -Uri 'https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/generate-image' -Method Post -Headers $headers -Body $body
    Write-Host "   ✓ Geração funcionando" -ForegroundColor Green
    Write-Host "   API usada: $($r.apiUsed)" -ForegroundColor Gray
    Write-Host "   Cached: $($r.cached)" -ForegroundColor Gray
    Write-Host "   URL: $($r.imageUrl.Substring(0, 50))..." -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Erro na geração: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== RESULTADO ===" -ForegroundColor Cyan
Write-Host "Verifique os logs para mais detalhes:" -ForegroundColor Yellow
Write-Host "npx supabase functions logs generate-image" -ForegroundColor Cyan