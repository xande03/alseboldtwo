#!/usr/bin/env pwsh

Write-Host "TESTE QR CODE ATUALIZADO - SUPABASE FUNCTION" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$supabaseUrl = "https://zfstmsgevfhdkhesatzm.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw"

# Test 1: Text QR Code
Write-Host "1. Testando QR code de texto..." -ForegroundColor Yellow

$textPayload = @{
    content = "Teste de QR Code com texto simples"
    type = "text"
    expirationOption = "permanent"
    userSession = "test-user"
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
    Write-Host "Mensagem: $($textResponse.message)" -ForegroundColor Gray
} catch {
    Write-Host "QR Texto: ERRO" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: URL QR Code
Write-Host "2. Testando QR code de URL..." -ForegroundColor Yellow

$urlPayload = @{
    content = "https://www.github.com"
    type = "url"
    expirationOption = "permanent"
    userSession = "test-user"
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

# Test 3: File QR Code (simulated)
Write-Host "3. Testando QR code de arquivo (simulado)..." -ForegroundColor Yellow

$filePayload = @{
    content = ""
    type = "file"
    fileData = "data:text/plain;base64,SGVsbG8gV29ybGQgVGVzdCBGaWxl"
    fileName = "test.txt"
    expirationOption = "1hour"
    userSession = "test-user"
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
    Write-Host "Expiracao: $($fileResponse.expiration.option)" -ForegroundColor Gray
    Write-Host "Auto-delete: $($fileResponse.expiration.autoDelete)" -ForegroundColor Gray
    if ($fileResponse.expiration.fileId) {
        Write-Host "File ID: $($fileResponse.expiration.fileId)" -ForegroundColor Gray
    }
} catch {
    Write-Host "QR Arquivo: ERRO" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Check functions status
Write-Host "4. Verificando status das funcoes QR..." -ForegroundColor Yellow

try {
    $functionsList = npx supabase functions list 2>$null
    if ($functionsList -match "generate-qrcode.*ACTIVE") {
        Write-Host "generate-qrcode: ATIVA" -ForegroundColor Green
    }
    if ($functionsList -match "delete-temp-file.*ACTIVE") {
        Write-Host "delete-temp-file: ATIVA" -ForegroundColor Green
    }
    if ($functionsList -match "cleanup-expired-files.*ACTIVE") {
        Write-Host "cleanup-expired-files: ATIVA" -ForegroundColor Green
    }
} catch {
    Write-Host "Erro ao verificar status das funcoes" -ForegroundColor Red
}

Write-Host ""

# Summary
Write-Host "RESUMO DAS MELHORIAS" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""
Write-Host "FUNCIONALIDADES IMPLEMENTADAS:" -ForegroundColor White
Write-Host "- QR Code via Supabase Function (nao mais client-side)" -ForegroundColor Gray
Write-Host "- Sistema de expiracao de arquivos (5min, 1h, permanente)" -ForegroundColor Gray
Write-Host "- Upload de arquivos com storage gerenciado" -ForegroundColor Gray
Write-Host "- Exclusao manual de arquivos temporarios" -ForegroundColor Gray
Write-Host "- Interface premium com opcoes avancadas" -ForegroundColor Gray
Write-Host ""
Write-Host "TIPOS SUPORTADOS:" -ForegroundColor White
Write-Host "- Texto simples" -ForegroundColor Gray
Write-Host "- URLs e links" -ForegroundColor Gray
Write-Host "- Upload de arquivos (ate 50MB)" -ForegroundColor Gray
Write-Host ""
Write-Host "SISTEMA DE EXPIRACAO:" -ForegroundColor White
Write-Host "- Imediato: 5 minutos" -ForegroundColor Gray
Write-Host "- Temporario: 1 hora" -ForegroundColor Gray
Write-Host "- Permanente: 1 ano" -ForegroundColor Gray
Write-Host ""
Write-Host "Para testar na interface:" -ForegroundColor Yellow
Write-Host "npm run dev" -ForegroundColor Cyan
Write-Host "Acesse: http://localhost:5173" -ForegroundColor Cyan