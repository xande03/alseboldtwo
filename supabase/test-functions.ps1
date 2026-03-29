# Script para testar todas as Edge Functions do Supabase
# Execute com: .\test-functions.ps1

$SUPABASE_URL = "https://zfstmsgevfhdkhesatzm.supabase.co"
$ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw"

$headers = @{
    'Authorization' = "Bearer $ANON_KEY"
    'apikey' = $ANON_KEY
    'Content-Type' = 'application/json'
}

Write-Host "=== Testando Edge Functions ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: clever-handler
Write-Host "1. Testando clever-handler..." -ForegroundColor Yellow
$body = '{"name":"Teste"}'
try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/clever-handler" -Method Post -Headers $headers -Body $body
    Write-Host "✓ Sucesso: $($response | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "✗ Erro: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: generate-image
Write-Host "2. Testando generate-image..." -ForegroundColor Yellow
$body = '{"prompt":"Um gato astronauta","creationMode":"livre"}'
try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/generate-image" -Method Post -Headers $headers -Body $body
    Write-Host "✓ Sucesso: $($response | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "✗ Erro: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: summarize-text
Write-Host "3. Testando summarize-text..." -ForegroundColor Yellow
$body = '{"text":"Este é um texto de exemplo para testar a função de resumo","outputType":"breve"}'
try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/summarize-text" -Method Post -Headers $headers -Body $body
    Write-Host "✓ Sucesso: $($response | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "✗ Erro: $_" -ForegroundColor Red
}
Write-Host ""

# Test 4: analyze-music
Write-Host "4. Testando analyze-music..." -ForegroundColor Yellow
$body = '{"link":"https://open.spotify.com/track/example"}'
try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/analyze-music" -Method Post -Headers $headers -Body $body
    Write-Host "✓ Sucesso: $($response | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "✗ Erro: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== Testes Concluídos ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Nota: As funções de imagem (upscale-image, remove-background, edit-image, ocr-scan)" -ForegroundColor Yellow
Write-Host "requerem dados base64 de imagens e não foram testadas neste script." -ForegroundColor Yellow
