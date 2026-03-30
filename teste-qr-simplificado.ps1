#!/usr/bin/env pwsh

Write-Host "TESTE QR CODE SIMPLIFICADO - BUCKET EXISTENTE" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$supabaseUrl = "https://zfstmsgevfhdkhesatzm.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw"

# Test 1: Text QR Code
Write-Host "1. Testando QR code de texto..." -ForegroundColor Yellow

$textPayload = @{
    content = "https://github.com/supabase/supabase"
    type = "text"
    expirationOption = "permanent"
} | ConvertTo-Json

try {
    $textResponse = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/generate-qrcode" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $anonKey"
        } `
        -Body $textPayload

    Write-Host "QR Texto: SUCESSO" -ForegroundColor Green
    Write-Host "Conteudo: $($textResponse.content)" -ForegroundColor Gray
    Write-Host "Sucesso: $($textResponse.success)" -ForegroundColor Gray
    Write-Host "QR Code gerado: $(if($textResponse.qrCodeUrl) { 'SIM' } else { 'NAO' })" -ForegroundColor Gray
} catch {
    Write-Host "QR Texto: ERRO" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: URL QR Code
Write-Host "2. Testando QR code de URL..." -ForegroundColor Yellow

$urlPayload = @{
    content = "https://www.google.com"
    type = "url"
    expirationOption = "permanent"
} | ConvertTo-Json

try {
    $urlResponse = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/generate-qrcode" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $anonKey"
        } `
        -Body $urlPayload

    Write-Host "QR URL: SUCESSO" -ForegroundColor Green
    Write-Host "URL: $($urlResponse.content)" -ForegroundColor Gray
    Write-Host "Sucesso: $($urlResponse.success)" -ForegroundColor Gray
} catch {
    Write-Host "QR URL: ERRO" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: File QR Code (small file)
Write-Host "3. Testando QR code de arquivo pequeno..." -ForegroundColor Yellow

$filePayload = @{
    content = ""
    type = "file"
    fileData = "data:text/plain;base64,SGVsbG8gV29ybGQgLSBUZXN0ZSBkZSBhcnF1aXZvIHBhcmEgUVIgQ29kZQ=="
    fileName = "teste-qr.txt"
    expirationOption = "1hour"
} | ConvertTo-Json

try {
    $fileResponse = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/generate-qrcode" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $anonKey"
        } `
        -Body $filePayload

    Write-Host "QR Arquivo: SUCESSO" -ForegroundColor Green
    Write-Host "Arquivo URL: $($fileResponse.fileUrl)" -ForegroundColor Gray
    Write-Host "QR Code URL: $(if($fileResponse.qrCodeUrl) { 'GERADO' } else { 'NAO GERADO' })" -ForegroundColor Gray
    Write-Host "Mensagem: $($fileResponse.message)" -ForegroundColor Gray
    
    # Test if file URL is accessible
    if ($fileResponse.fileUrl) {
        try {
            $fileTest = Invoke-WebRequest -Uri $fileResponse.fileUrl -Method HEAD -UseBasicParsing
            Write-Host "Arquivo acessivel: SIM (Status: $($fileTest.StatusCode))" -ForegroundColor Green
        } catch {
            Write-Host "Arquivo acessivel: NAO" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "QR Arquivo: ERRO" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Summary
Write-Host "RESUMO DO TESTE" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host ""

$allWorking = $true

if ($textResponse -and $textResponse.success) {
    Write-Host "QR Code Texto: FUNCIONANDO" -ForegroundColor Green
} else {
    Write-Host "QR Code Texto: FALHANDO" -ForegroundColor Red
    $allWorking = $false
}

if ($urlResponse -and $urlResponse.success) {
    Write-Host "QR Code URL: FUNCIONANDO" -ForegroundColor Green
} else {
    Write-Host "QR Code URL: FALHANDO" -ForegroundColor Red
    $allWorking = $false
}

if ($fileResponse -and $fileResponse.success) {
    Write-Host "QR Code Arquivo: FUNCIONANDO" -ForegroundColor Green
} else {
    Write-Host "QR Code Arquivo: FALHANDO" -ForegroundColor Red
    $allWorking = $false
}

Write-Host ""

if ($allWorking) {
    Write-Host "RESULTADO FINAL: TUDO FUNCIONANDO!" -ForegroundColor Green
    Write-Host "O QR Code Generator esta pronto para uso!" -ForegroundColor Green
} else {
    Write-Host "RESULTADO FINAL: ALGUNS PROBLEMAS ENCONTRADOS" -ForegroundColor Yellow
    Write-Host "Verifique os erros acima para mais detalhes" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Para testar na interface:" -ForegroundColor Cyan
Write-Host "npm run dev" -ForegroundColor White
Write-Host "Acesse: http://localhost:5173" -ForegroundColor White