#!/usr/bin/env pwsh

Write-Host "TESTE GERACAO DE IMAGENS - CONEXOES EXTERNAS" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$supabaseUrl = "https://zfstmsgevfhdkhesatzm.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw"

# Test 1: Generate Image
Write-Host "1. Testando geracao de imagem..." -ForegroundColor Yellow

$imagePayload = @{
    prompt = "A beautiful sunset over mountains, digital art"
    creationMode = "livre"
    aspectRatio = "1:1"
} | ConvertTo-Json

try {
    $imageResponse = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/generate-image" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $anonKey"
        } `
        -Body $imagePayload `
        -TimeoutSec 60

    Write-Host "Geracao de Imagem: SUCESSO" -ForegroundColor Green
    Write-Host "URL da imagem: $($imageResponse.imageUrl)" -ForegroundColor Gray
    
    # Test if image URL is accessible
    if ($imageResponse.imageUrl) {
        try {
            $imageTest = Invoke-WebRequest -Uri $imageResponse.imageUrl -Method HEAD -UseBasicParsing -TimeoutSec 10
            Write-Host "Imagem acessivel: SIM (Status: $($imageTest.StatusCode))" -ForegroundColor Green
        } catch {
            Write-Host "Imagem acessivel: NAO" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "Geracao de Imagem: ERRO" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Generate QR Code
Write-Host "2. Testando geracao de QR Code..." -ForegroundColor Yellow

$qrPayload = @{
    content = "https://www.example.com/test"
    type = "url"
} | ConvertTo-Json

try {
    $qrResponse = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/generate-qrcode" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $anonKey"
        } `
        -Body $qrPayload `
        -TimeoutSec 30

    Write-Host "Geracao de QR: SUCESSO" -ForegroundColor Green
    Write-Host "QR Code gerado: $(if($qrResponse.qrCodeUrl) { 'SIM' } else { 'NAO' })" -ForegroundColor Gray
    Write-Host "Conteudo: $($qrResponse.content)" -ForegroundColor Gray
} catch {
    Write-Host "Geracao de QR: ERRO" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Test external APIs directly
Write-Host "3. Testando APIs externas diretamente..." -ForegroundColor Yellow

# Test Pollinations.ai (fallback for image generation)
try {
    $pollinationsUrl = "https://image.pollinations.ai/prompt/beautiful%20sunset?width=512&height=512&nologo=true"
    $pollinationsTest = Invoke-WebRequest -Uri $pollinationsUrl -Method HEAD -UseBasicParsing -TimeoutSec 15
    Write-Host "Pollinations.ai: FUNCIONANDO (Status: $($pollinationsTest.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "Pollinations.ai: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

# Test QR Server API
try {
    $qrServerUrl = "https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=test"
    $qrServerTest = Invoke-WebRequest -Uri $qrServerUrl -Method HEAD -UseBasicParsing -TimeoutSec 10
    Write-Host "QR Server API: FUNCIONANDO (Status: $($qrServerTest.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "QR Server API: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Check function response times
Write-Host "4. Testando tempos de resposta..." -ForegroundColor Yellow

$startTime = Get-Date

# Quick QR test
try {
    $quickQR = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/generate-qrcode" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $anonKey"
        } `
        -Body '{"content":"speed test","type":"text"}' `
        -TimeoutSec 15

    $qrTime = (Get-Date) - $startTime
    Write-Host "QR Code tempo de resposta: $($qrTime.TotalSeconds) segundos" -ForegroundColor Gray
} catch {
    Write-Host "QR Code tempo de resposta: TIMEOUT ou ERRO" -ForegroundColor Red
}

Write-Host ""

# Summary
Write-Host "RESUMO DOS TESTES" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan
Write-Host ""

$imageWorking = $imageResponse -and $imageResponse.imageUrl
$qrWorking = $qrResponse -and $qrResponse.success

Write-Host "STATUS DAS FUNCIONALIDADES:" -ForegroundColor White
if ($imageWorking) {
    Write-Host "- Geracao de Imagens: FUNCIONANDO" -ForegroundColor Green
} else {
    Write-Host "- Geracao de Imagens: PROBLEMAS" -ForegroundColor Red
}

if ($qrWorking) {
    Write-Host "- Geracao de QR Code: FUNCIONANDO" -ForegroundColor Green
} else {
    Write-Host "- Geracao de QR Code: PROBLEMAS" -ForegroundColor Red
}

Write-Host ""

if ($imageWorking -and $qrWorking) {
    Write-Host "RESULTADO FINAL: AMBAS FUNCIONANDO!" -ForegroundColor Green
    Write-Host "Sistema pronto para uso em producao" -ForegroundColor Green
} else {
    Write-Host "RESULTADO FINAL: NECESSITA OTIMIZACAO" -ForegroundColor Yellow
    Write-Host "Algumas funcionalidades precisam de ajustes" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "PROXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Otimizar conexoes externas" -ForegroundColor Gray
Write-Host "2. Implementar cache para melhor performance" -ForegroundColor Gray
Write-Host "3. Adicionar fallbacks robustos" -ForegroundColor Gray
Write-Host "4. Melhorar tratamento de erros" -ForegroundColor Gray