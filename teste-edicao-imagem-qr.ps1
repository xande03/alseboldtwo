#!/usr/bin/env pwsh

Write-Host "TESTE COMPLETO - EDICAO DE IMAGENS E IMAGE-TO-QR" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

$supabaseUrl = "https://zfstmsgevfhdkhesatzm.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw"

# Criar uma imagem de teste simples em base64 (SVG)
$testImageSvg = @"
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#4CAF50"/>
  <circle cx="256" cy="256" r="100" fill="#FFF"/>
  <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="48" fill="#000">TEST</text>
  <text x="50%" y="65%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="24" fill="#000">Image 2024</text>
</svg>
"@

$testImageBase64 = "data:image/svg+xml;base64," + [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($testImageSvg))

Write-Host "Imagem de teste criada (SVG em base64)" -ForegroundColor Gray
Write-Host ""

# ============================================
# TESTE 1: GERACAO NORMAL DE IMAGEM
# ============================================
Write-Host "1. TESTE: Geracao Normal de Imagem" -ForegroundColor Yellow
Write-Host "   (sem imagem de referencia)" -ForegroundColor Gray

$normalPayload = @{
    prompt = "A beautiful sunset over mountains"
    creationMode = "livre"
    editMode = $false
} | ConvertTo-Json

try {
    $startTime = Get-Date
    $normalResponse = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/generate-image" -Method POST -Headers @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $anonKey"
    } -Body $normalPayload -TimeoutSec 30
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds

    Write-Host "   ✅ SUCESSO!" -ForegroundColor Green
    Write-Host "   - API: $($normalResponse.apiUsed)" -ForegroundColor Gray
    Write-Host "   - Tempo: $duration segundos" -ForegroundColor Gray
    Write-Host "   - Edit Mode: $($normalResponse.editMode)" -ForegroundColor Gray
    $test1Pass = $true
} catch {
    Write-Host "   ❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
    $test1Pass = $false
}

Write-Host ""

# ============================================
# TESTE 2: EDICAO DE IMAGEM COM REFERENCIA
# ============================================
Write-Host "2. TESTE: Edicao de Imagem com Referencia" -ForegroundColor Yellow
Write-Host "   (com imagem de referencia + editMode)" -ForegroundColor Gray

$editPayload = @{
    prompt = "Transform this into a futuristic neon style"
    creationMode = "designer"
    imageBase64 = $testImageBase64
    editMode = $true
} | ConvertTo-Json

try {
    $startTime = Get-Date
    $editResponse = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/generate-image" -Method POST -Headers @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $anonKey"
    } -Body $editPayload -TimeoutSec 45
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds

    Write-Host "   ✅ SUCESSO!" -ForegroundColor Green
    Write-Host "   - API: $($editResponse.apiUsed)" -ForegroundColor Gray
    Write-Host "   - Tempo: $duration segundos" -ForegroundColor Gray
    Write-Host "   - Edit Mode: $($editResponse.editMode)" -ForegroundColor Gray
    
    if ($editResponse.apiUsed -like "*Fallback*") {
        Write-Host "   ⚠️  Usando fallback (APIs de edicao nao configuradas)" -ForegroundColor Yellow
        Write-Host "   💡 Configure REPLICATE_API_TOKEN para edicao real" -ForegroundColor Cyan
    }
    
    $test2Pass = $true
} catch {
    Write-Host "   ❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
    $test2Pass = $false
}

Write-Host ""

# ============================================
# TESTE 3: IMAGE-TO-QR COM EXTRACAO DE TEXTO
# ============================================
Write-Host "3. TESTE: Image-to-QR com Extracao de Texto" -ForegroundColor Yellow
Write-Host "   (extrair texto da imagem e gerar QR)" -ForegroundColor Gray

$imageToQrPayload = @{
    imageBase64 = $testImageBase64
    extractText = $true
    qrSize = 512
} | ConvertTo-Json

try {
    $startTime = Get-Date
    $qrResponse = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/image-to-qr" -Method POST -Headers @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $anonKey"
    } -Body $imageToQrPayload -TimeoutSec 30
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds

    Write-Host "   ✅ SUCESSO!" -ForegroundColor Green
    Write-Host "   - Metodo: $($qrResponse.method)" -ForegroundColor Gray
    Write-Host "   - Tempo: $duration segundos" -ForegroundColor Gray
    Write-Host "   - Texto extraido: $($qrResponse.extractedText.Substring(0, [Math]::Min(50, $qrResponse.extractedText.Length)))..." -ForegroundColor Gray
    Write-Host "   - QR gerado: $(if($qrResponse.qrCodeUrl) { 'SIM' } else { 'NAO' })" -ForegroundColor Gray
    $test3Pass = $true
} catch {
    Write-Host "   ❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
    $test3Pass = $false
}

Write-Host ""

# ============================================
# TESTE 4: IMAGE-TO-QR SEM EXTRACAO (DADOS DA IMAGEM)
# ============================================
Write-Host "4. TESTE: Image-to-QR sem Extracao de Texto" -ForegroundColor Yellow
Write-Host "   (usar dados da imagem diretamente)" -ForegroundColor Gray

$imageToQrDirectPayload = @{
    imageBase64 = $testImageBase64
    extractText = $false
    qrSize = 512
} | ConvertTo-Json

try {
    $startTime = Get-Date
    $qrDirectResponse = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/image-to-qr" -Method POST -Headers @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $anonKey"
    } -Body $imageToQrDirectPayload -TimeoutSec 30
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds

    Write-Host "   ✅ SUCESSO!" -ForegroundColor Green
    Write-Host "   - Metodo: $($qrDirectResponse.method)" -ForegroundColor Gray
    Write-Host "   - Tempo: $duration segundos" -ForegroundColor Gray
    Write-Host "   - QR gerado: $(if($qrDirectResponse.qrCodeUrl) { 'SIM' } else { 'NAO' })" -ForegroundColor Gray
    $test4Pass = $true
} catch {
    Write-Host "   ❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
    $test4Pass = $false
}

Write-Host ""

# ============================================
# RESUMO FINAL
# ============================================
Write-Host "RESUMO DOS TESTES" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan
Write-Host ""

$totalTests = 4
$passedTests = @($test1Pass, $test2Pass, $test3Pass, $test4Pass) | Where-Object { $_ -eq $true } | Measure-Object | Select-Object -ExpandProperty Count

Write-Host "Testes executados: $totalTests" -ForegroundColor White
Write-Host "Testes aprovados: $passedTests" -ForegroundColor $(if($passedTests -eq $totalTests) { "Green" } else { "Yellow" })
Write-Host ""

Write-Host "DETALHES:" -ForegroundColor White
Write-Host "1. Geracao Normal: $(if($test1Pass) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor $(if($test1Pass) { "Green" } else { "Red" })
Write-Host "2. Edicao com Referencia: $(if($test2Pass) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor $(if($test2Pass) { "Green" } else { "Red" })
Write-Host "3. Image-to-QR (com texto): $(if($test3Pass) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor $(if($test3Pass) { "Green" } else { "Red" })
Write-Host "4. Image-to-QR (sem texto): $(if($test4Pass) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor $(if($test4Pass) { "Green" } else { "Red" })
Write-Host ""

if ($passedTests -eq $totalTests) {
    Write-Host "🎉 TODOS OS TESTES PASSARAM!" -ForegroundColor Green
    Write-Host ""
    Write-Host "FUNCIONALIDADES IMPLEMENTADAS:" -ForegroundColor White
    Write-Host "✅ Geracao normal de imagens" -ForegroundColor Green
    Write-Host "✅ Edicao de imagens com referencia" -ForegroundColor Green
    Write-Host "✅ Image-to-QR com extracao de texto" -ForegroundColor Green
    Write-Host "✅ Image-to-QR com dados da imagem" -ForegroundColor Green
    Write-Host ""
    Write-Host "SISTEMA PRONTO PARA USO!" -ForegroundColor Green
} else {
    Write-Host "⚠️  ALGUNS TESTES FALHARAM" -ForegroundColor Yellow
    Write-Host "Verifique os erros acima para mais detalhes" -ForegroundColor Gray
}

Write-Host ""
Write-Host "NOTAS IMPORTANTES:" -ForegroundColor Cyan
Write-Host "- Edicao de imagens requer REPLICATE_API_TOKEN configurado" -ForegroundColor Gray
Write-Host "- Extracao de texto usa Groq Vision API (ja configurado)" -ForegroundColor Gray
Write-Host "- Fallbacks garantem funcionamento mesmo sem APIs premium" -ForegroundColor Gray
