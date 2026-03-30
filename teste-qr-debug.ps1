#!/usr/bin/env pwsh

Write-Host "DEBUG QR CODE GENERATION" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

$supabaseUrl = "https://zfstmsgevfhdkhesatzm.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw"

# Test 1: Simple text QR code
Write-Host "1. Testando QR code simples (texto)..." -ForegroundColor Yellow

$textPayload = @{
    content = "Hello World Test"
    type = "text"
    expirationOption = "1hour"
} | ConvertTo-Json

try {
    $textResponse = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/generate-qrcode" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $anonKey"
        } `
        -Body $textPayload

    Write-Host "Texto QR: SUCESSO" -ForegroundColor Green
    Write-Host "Conteudo: $($textResponse.content)" -ForegroundColor Gray
    Write-Host "QR gerado: $($textResponse.success)" -ForegroundColor Gray
} catch {
    Write-Host "Texto QR: ERRO" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
    
    # Try to get more details
    if ($_.Exception.Response) {
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorBody = $reader.ReadToEnd()
            Write-Host "Error Body: $errorBody" -ForegroundColor Red
        } catch {
            Write-Host "Could not read error details" -ForegroundColor Red
        }
    }
}

Write-Host ""

# Test 2: URL QR code
Write-Host "2. Testando QR code URL..." -ForegroundColor Yellow

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

    Write-Host "URL QR: SUCESSO" -ForegroundColor Green
    Write-Host "URL: $($urlResponse.content)" -ForegroundColor Gray
    Write-Host "QR gerado: $($urlResponse.success)" -ForegroundColor Gray
} catch {
    Write-Host "URL QR: ERRO" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Check QR API directly
Write-Host "3. Testando API QR diretamente..." -ForegroundColor Yellow

try {
    $directQR = "https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=test&format=png"
    $directResponse = Invoke-WebRequest -Uri $directQR -Method GET
    
    if ($directResponse.StatusCode -eq 200) {
        Write-Host "API QR direta: FUNCIONANDO" -ForegroundColor Green
        Write-Host "Tamanho resposta: $($directResponse.Content.Length) bytes" -ForegroundColor Gray
    }
} catch {
    Write-Host "API QR direta: ERRO" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Check environment variables (if accessible)
Write-Host "4. Verificando configuracao..." -ForegroundColor Yellow

Write-Host "Supabase URL: $supabaseUrl" -ForegroundColor Gray
Write-Host "Anon Key: ${anonKey.Substring(0,20)}..." -ForegroundColor Gray

Write-Host ""
Write-Host "DIAGNOSTICO COMPLETO" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host "Se os testes falharam, possiveis causas:" -ForegroundColor Yellow
Write-Host "1. Problema na funcao Supabase" -ForegroundColor Gray
Write-Host "2. API QR externa indisponivel" -ForegroundColor Gray
Write-Host "3. Configuracao de CORS" -ForegroundColor Gray
Write-Host "4. Chave de autenticacao" -ForegroundColor Gray