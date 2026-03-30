#!/usr/bin/env pwsh

Write-Host "TESTE NOVO BUCKET QR-STORAGE" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

$supabaseUrl = "https://zfstmsgevfhdkhesatzm.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw"

Write-Host "INSTRUCOES ANTES DO TESTE:" -ForegroundColor Yellow
Write-Host "1. Execute o SQL: CRIAR_BUCKET_QR_NOVO.sql" -ForegroundColor Gray
Write-Host "2. Crie o bucket 'qr-storage' (publico)" -ForegroundColor Gray
Write-Host "3. Configure as politicas de storage" -ForegroundColor Gray
Write-Host ""

# Test 1: Simple text QR code
Write-Host "1. Testando QR code texto com novo bucket..." -ForegroundColor Yellow

$textPayload = @{
    content = "Teste com novo bucket qr-storage"
    type = "text"
    expirationOption = "1hour"
    userSession = "test-novo-bucket"
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
    
    # Try to get error details
    if ($_.Exception.Response) {
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorBody = $reader.ReadToEnd()
            Write-Host "Detalhes do erro: $errorBody" -ForegroundColor Red
        } catch {
            Write-Host "Nao foi possivel ler detalhes do erro" -ForegroundColor Red
        }
    }
}

Write-Host ""

# Test 2: File upload QR code
Write-Host "2. Testando QR code arquivo com novo bucket..." -ForegroundColor Yellow

$filePayload = @{
    content = ""
    type = "file"
    fileData = "data:text/plain;base64,VGVzdGUgZGUgYXJxdWl2byBjb20gbm92byBidWNrZXQgcXItc3RvcmFnZQ=="
    fileName = "teste-novo-bucket.txt"
    expirationOption = "1hour"
    userSession = "test-novo-bucket"
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
    Write-Host "QR Code URL: $($fileResponse.qrCodeUrl)" -ForegroundColor Gray
    Write-Host "Expiracao: $($fileResponse.expiration.option)" -ForegroundColor Gray
    Write-Host "File ID: $($fileResponse.expiration.fileId)" -ForegroundColor Gray
} catch {
    Write-Host "QR Arquivo: ERRO" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to get error details
    if ($_.Exception.Response) {
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorBody = $reader.ReadToEnd()
            Write-Host "Detalhes do erro: $errorBody" -ForegroundColor Red
        } catch {
            Write-Host "Nao foi possivel ler detalhes do erro" -ForegroundColor Red
        }
    }
}

Write-Host ""

# Test 3: Check if bucket exists via API
Write-Host "3. Verificando se bucket existe..." -ForegroundColor Yellow

try {
    # Try to list files in the bucket (this will fail if bucket doesn't exist)
    $listResponse = Invoke-RestMethod -Uri "$supabaseUrl/storage/v1/object/list/qr-storage" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $anonKey"
        } `
        -Body '{"limit": 1}'

    Write-Host "Bucket qr-storage: EXISTE" -ForegroundColor Green
    Write-Host "Arquivos encontrados: $($listResponse.Count)" -ForegroundColor Gray
} catch {
    Write-Host "Bucket qr-storage: NAO EXISTE OU SEM ACESSO" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Summary
Write-Host "RESUMO DO DIAGNOSTICO" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host ""

if ($textResponse -and $textResponse.success) {
    Write-Host "QR Code de texto: FUNCIONANDO" -ForegroundColor Green
} else {
    Write-Host "QR Code de texto: FALHANDO" -ForegroundColor Red
}

if ($fileResponse -and $fileResponse.success) {
    Write-Host "QR Code de arquivo: FUNCIONANDO" -ForegroundColor Green
} else {
    Write-Host "QR Code de arquivo: FALHANDO" -ForegroundColor Red
}

Write-Host ""
Write-Host "PROXIMOS PASSOS SE HOUVER ERRO:" -ForegroundColor Yellow
Write-Host "1. Executar SQL: CRIAR_BUCKET_QR_NOVO.sql" -ForegroundColor Gray
Write-Host "2. Criar bucket 'qr-storage' no Supabase Dashboard" -ForegroundColor Gray
Write-Host "3. Marcar bucket como PUBLICO" -ForegroundColor Gray
Write-Host "4. Configurar politicas de storage" -ForegroundColor Gray
Write-Host "5. Verificar variaveis de ambiente" -ForegroundColor Gray