#!/usr/bin/env pwsh

Write-Host "TESTE FINAL QR CODE - VERSAO FUNCIONANDO" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$supabaseUrl = "https://zfstmsgevfhdkhesatzm.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw"

# Test 1: Text QR Code
Write-Host "1. Testando QR code de TEXTO..." -ForegroundColor Yellow

$textPayload = @{
    content = "Ola! Este e um teste de QR Code funcionando perfeitamente!"
    type = "text"
} | ConvertTo-Json

try {
    $textResponse = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/generate-qrcode" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $anonKey"
        } `
        -Body $textPayload

    Write-Host "TEXTO: SUCESSO" -ForegroundColor Green
    Write-Host "Conteudo: $($textResponse.content)" -ForegroundColor Gray
    Write-Host "QR Code: $(if($textResponse.qrCodeUrl) { 'GERADO' } else { 'FALHOU' })" -ForegroundColor Gray
} catch {
    Write-Host "TEXTO: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: URL QR Code
Write-Host "2. Testando QR code de URL..." -ForegroundColor Yellow

$urlPayload = @{
    content = "https://github.com"
    type = "url"
} | ConvertTo-Json

try {
    $urlResponse = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/generate-qrcode" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $anonKey"
        } `
        -Body $urlPayload

    Write-Host "URL: SUCESSO" -ForegroundColor Green
    Write-Host "Link: $($urlResponse.content)" -ForegroundColor Gray
    Write-Host "QR Code: $(if($urlResponse.qrCodeUrl) { 'GERADO' } else { 'FALHOU' })" -ForegroundColor Gray
} catch {
    Write-Host "URL: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: File QR Code (should show informative error)
Write-Host "3. Testando QR code de ARQUIVO (deve mostrar mensagem informativa)..." -ForegroundColor Yellow

$filePayload = @{
    content = ""
    type = "file"
    fileData = "data:text/plain;base64,dGVzdGU="
    fileName = "teste.txt"
} | ConvertTo-Json

try {
    $fileResponse = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/generate-qrcode" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $anonKey"
        } `
        -Body $filePayload

    Write-Host "ARQUIVO: RESPOSTA RECEBIDA" -ForegroundColor Yellow
    Write-Host "Mensagem: $($fileResponse.error)" -ForegroundColor Gray
} catch {
    $errorDetails = $_.Exception.Message
    if ($_.Exception.Response) {
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorBody = $reader.ReadToEnd()
            $errorObj = $errorBody | ConvertFrom-Json
            Write-Host "ARQUIVO: MENSAGEM INFORMATIVA" -ForegroundColor Yellow
            Write-Host "Erro: $($errorObj.error)" -ForegroundColor Gray
            Write-Host "Sugestao: $($errorObj.suggestion)" -ForegroundColor Gray
        } catch {
            Write-Host "ARQUIVO: ERRO - $errorDetails" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "RESULTADO FINAL" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan

$textWorking = $textResponse -and $textResponse.success
$urlWorking = $urlResponse -and $urlResponse.success

if ($textWorking -and $urlWorking) {
    Write-Host ""
    Write-Host "PARABENS! QR CODE ESTA FUNCIONANDO!" -ForegroundColor Green
    Write-Host "=================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "FUNCIONALIDADES ATIVAS:" -ForegroundColor White
    Write-Host "- QR Code de TEXTO: FUNCIONANDO" -ForegroundColor Green
    Write-Host "- QR Code de URL: FUNCIONANDO" -ForegroundColor Green
    Write-Host "- QR Code de ARQUIVO: Temporariamente desabilitado" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "COMO USAR:" -ForegroundColor Cyan
    Write-Host "1. Execute: npm run dev" -ForegroundColor White
    Write-Host "2. Acesse: http://localhost:5173" -ForegroundColor White
    Write-Host "3. Va para a secao QR Code Generator" -ForegroundColor White
    Write-Host "4. Escolha TEXTO ou URL" -ForegroundColor White
    Write-Host "5. Digite o conteudo e clique em 'Gerar QR Code'" -ForegroundColor White
    Write-Host ""
    Write-Host "PROBLEMA RESOLVIDO!" -ForegroundColor Green
} else {
    Write-Host "AINDA HA PROBLEMAS:" -ForegroundColor Red
    if (-not $textWorking) { Write-Host "- QR Code de texto nao funcionando" -ForegroundColor Red }
    if (-not $urlWorking) { Write-Host "- QR Code de URL nao funcionando" -ForegroundColor Red }
}