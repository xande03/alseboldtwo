#!/usr/bin/env pwsh

Write-Host "TESTE IMAGEM PARA QR CODE" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

$supabaseUrl = "https://zfstmsgevfhdkhesatzm.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw"

# Test 1: Image with text extraction
Write-Host "1. Testando conversao de imagem para QR (com extracao de texto)..." -ForegroundColor Yellow

# Create a simple test image with text (base64 encoded)
$testImageWithText = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

$imagePayload = @{
    imageBase64 = $testImageWithText
    extractText = $true
    qrSize = 512
} | ConvertTo-Json

try {
    $imageResponse = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/image-to-qr" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $anonKey"
        } `
        -Body $imagePayload

    Write-Host "Imagem para QR (texto): SUCESSO" -ForegroundColor Green
    Write-Host "Sucesso: $($imageResponse.success)" -ForegroundColor Gray
    Write-Host "Metodo: $($imageResponse.method)" -ForegroundColor Gray
    Write-Host "Texto extraido: $($imageResponse.extractedText)" -ForegroundColor Gray
    Write-Host "QR Code gerado: $(if($imageResponse.qrCodeUrl) { 'SIM' } else { 'NAO' })" -ForegroundColor Gray
} catch {
    Write-Host "Imagem para QR (texto): ERRO" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to get error details
    if ($_.Exception.Response) {
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorBody = $reader.ReadToEnd()
            Write-Host "Detalhes: $errorBody" -ForegroundColor Red
        } catch {
            Write-Host "Nao foi possivel ler detalhes do erro" -ForegroundColor Red
        }
    }
}

Write-Host ""

# Test 2: Image without text extraction
Write-Host "2. Testando conversao de imagem para QR (sem extracao de texto)..." -ForegroundColor Yellow

$imagePayload2 = @{
    imageBase64 = $testImageWithText
    extractText = $false
    qrSize = 256
} | ConvertTo-Json

try {
    $imageResponse2 = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/image-to-qr" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $anonKey"
        } `
        -Body $imagePayload2

    Write-Host "Imagem para QR (dados): SUCESSO" -ForegroundColor Green
    Write-Host "Sucesso: $($imageResponse2.success)" -ForegroundColor Gray
    Write-Host "Metodo: $($imageResponse2.method)" -ForegroundColor Gray
    Write-Host "Tamanho QR: $($imageResponse2.size)x$($imageResponse2.size)" -ForegroundColor Gray
    Write-Host "QR Code gerado: $(if($imageResponse2.qrCodeUrl) { 'SIM' } else { 'NAO' })" -ForegroundColor Gray
} catch {
    Write-Host "Imagem para QR (dados): ERRO" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Check function status
Write-Host "3. Verificando status da funcao..." -ForegroundColor Yellow

try {
    $functionsList = npx supabase functions list 2>$null
    if ($functionsList -match "image-to-qr.*ACTIVE") {
        Write-Host "image-to-qr: ATIVA" -ForegroundColor Green
    } else {
        Write-Host "image-to-qr: INATIVA OU NAO ENCONTRADA" -ForegroundColor Red
    }
} catch {
    Write-Host "Erro ao verificar status da funcao" -ForegroundColor Red
}

Write-Host ""

# Summary
Write-Host "RESUMO DO TESTE" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host ""

$textExtractionWorking = $imageResponse -and $imageResponse.success
$imageDataWorking = $imageResponse2 -and $imageResponse2.success

if ($textExtractionWorking) {
    Write-Host "Conversao com extracao de texto: FUNCIONANDO" -ForegroundColor Green
} else {
    Write-Host "Conversao com extracao de texto: FALHANDO" -ForegroundColor Red
}

if ($imageDataWorking) {
    Write-Host "Conversao com dados da imagem: FUNCIONANDO" -ForegroundColor Green
} else {
    Write-Host "Conversao com dados da imagem: FALHANDO" -ForegroundColor Red
}

Write-Host ""

if ($textExtractionWorking -or $imageDataWorking) {
    Write-Host "RESULTADO: FUNCIONALIDADE IMAGEM->QR FUNCIONANDO!" -ForegroundColor Green
    Write-Host ""
    Write-Host "COMO USAR:" -ForegroundColor Cyan
    Write-Host "1. Execute: npm run dev" -ForegroundColor White
    Write-Host "2. Acesse: http://localhost:5173" -ForegroundColor White
    Write-Host "3. Clique em 'Imagem->QR' no menu lateral" -ForegroundColor White
    Write-Host "4. Faca upload de uma imagem" -ForegroundColor White
    Write-Host "5. Escolha se quer extrair texto ou usar dados da imagem" -ForegroundColor White
    Write-Host "6. Clique em 'Converter para QR Code'" -ForegroundColor White
} else {
    Write-Host "RESULTADO: PROBLEMAS ENCONTRADOS" -ForegroundColor Red
    Write-Host "Verifique os erros acima para mais detalhes" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "FUNCIONALIDADES DA CONVERSAO IMAGEM->QR:" -ForegroundColor White
Write-Host "- Extracao automatica de texto usando IA" -ForegroundColor Gray
Write-Host "- Conversao de dados da imagem diretamente" -ForegroundColor Gray
Write-Host "- Tamanhos personalizaveis de QR Code" -ForegroundColor Gray
Write-Host "- Suporte a multiplos formatos de imagem" -ForegroundColor Gray