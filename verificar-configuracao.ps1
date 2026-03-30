# Script para verificar se a configuração foi feita corretamente
# Execute: .\verificar-configuracao.ps1

Write-Host "🔍 VERIFICAÇÃO DA CONFIGURAÇÃO QR CODE STORAGE" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

$headers = @{
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw'
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw'
    'Content-Type' = 'application/json'
}

$checks = @()

# Verificação 1: Tabela temp_files
Write-Host "📋 Verificação 1: Tabela temp_files" -ForegroundColor Yellow
try {
    $tableCheck = Invoke-RestMethod -Uri 'https://zfstmsgevfhdkhesatzm.supabase.co/rest/v1/temp_files?select=count' -Method Get -Headers $headers
    Write-Host "✅ Tabela temp_files: EXISTE" -ForegroundColor Green
    $checks += @{name="Tabela temp_files"; status="OK"}
} catch {
    Write-Host "❌ Tabela temp_files: NÃO EXISTE" -ForegroundColor Red
    Write-Host "   Execute o SQL do PASSO 1" -ForegroundColor Yellow
    $checks += @{name="Tabela temp_files"; status="ERRO"}
}

Write-Host ""

# Verificação 2: Bucket qr-files
Write-Host "🗂️ Verificação 2: Bucket qr-files" -ForegroundColor Yellow
try {
    $buckets = Invoke-RestMethod -Uri 'https://zfstmsgevfhdkhesatzm.supabase.co/storage/v1/bucket' -Method Get -Headers $headers
    $bucketExists = $false
    foreach ($bucket in $buckets) {
        if ($bucket.name -eq "qr-files") {
            $bucketExists = $true
            Write-Host "✅ Bucket qr-files: EXISTE (público: $($bucket.public))" -ForegroundColor Green
            $checks += @{name="Bucket qr-files"; status="OK"}
            break
        }
    }
    if (-not $bucketExists) {
        Write-Host "❌ Bucket qr-files: NÃO EXISTE" -ForegroundColor Red
        Write-Host "   Crie o bucket no PASSO 2" -ForegroundColor Yellow
        $checks += @{name="Bucket qr-files"; status="ERRO"}
    }
} catch {
    Write-Host "❌ Erro ao verificar buckets: $($_.Exception.Message)" -ForegroundColor Red
    $checks += @{name="Bucket qr-files"; status="ERRO"}
}

Write-Host ""

# Verificação 3: Função generate-qrcode
Write-Host "⚙️ Verificação 3: Função generate-qrcode" -ForegroundColor Yellow
try {
    $funcTest = Invoke-RestMethod -Uri 'https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/generate-qrcode' -Method Post -Headers $headers -Body '{"content":"Teste verificação","type":"text"}' -TimeoutSec 10
    if ($funcTest.success) {
        Write-Host "✅ Função generate-qrcode: FUNCIONANDO" -ForegroundColor Green
        $checks += @{name="Função generate-qrcode"; status="OK"}
    } else {
        Write-Host "⚠️ Função generate-qrcode: RESPONDENDO MAS COM ERRO" -ForegroundColor Yellow
        $checks += @{name="Função generate-qrcode"; status="PARCIAL"}
    }
} catch {
    Write-Host "❌ Função generate-qrcode: NÃO FUNCIONANDO" -ForegroundColor Red
    $checks += @{name="Função generate-qrcode"; status="ERRO"}
}

Write-Host ""

# Verificação 4: Função cleanup-expired-files
Write-Host "🧹 Verificação 4: Função cleanup-expired-files" -ForegroundColor Yellow
try {
    $cleanupTest = Invoke-RestMethod -Uri 'https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/cleanup-expired-files' -Method Post -Headers $headers -TimeoutSec 10
    if ($cleanupTest.success) {
        Write-Host "✅ Função cleanup-expired-files: FUNCIONANDO" -ForegroundColor Green
        $checks += @{name="Função cleanup"; status="OK"}
    } else {
        Write-Host "⚠️ Função cleanup-expired-files: RESPONDENDO MAS COM ERRO" -ForegroundColor Yellow
        $checks += @{name="Função cleanup"; status="PARCIAL"}
    }
} catch {
    Write-Host "❌ Função cleanup-expired-files: NÃO FUNCIONANDO" -ForegroundColor Red
    $checks += @{name="Função cleanup"; status="ERRO"}
}

Write-Host ""

# Verificação 5: Teste de upload (se tudo estiver OK)
$canTestUpload = ($checks | Where-Object {$_.name -eq "Tabela temp_files" -and $_.status -eq "OK"}) -and 
                 ($checks | Where-Object {$_.name -eq "Bucket qr-files" -and $_.status -eq "OK"})

if ($canTestUpload) {
    Write-Host "📄 Verificação 5: Teste de upload" -ForegroundColor Yellow
    
    $pdfBase64 = "JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoxMDAgNzAwIFRkCihIZWxsbyBXb3JsZCkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCjAwMDAwMDAyNDUgMDAwMDAgbiAKMDAwMDAwMDMxNiAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDYKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQxMAolJUVPRg=="
    
    $uploadBody = @{
        content = ""
        type = "file"
        fileData = "data:application/pdf;base64,$pdfBase64"
        fileName = "teste-verificacao.pdf"
        expirationOption = "immediate"
        userSession = "verification-test"
    } | ConvertTo-Json
    
    try {
        $uploadTest = Invoke-RestMethod -Uri 'https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/generate-qrcode' -Method Post -Headers $headers -Body $uploadBody -TimeoutSec 15
        if ($uploadTest.success -and $uploadTest.fileUrl) {
            Write-Host "✅ Upload de arquivo: FUNCIONANDO" -ForegroundColor Green
            Write-Host "   Arquivo: $($uploadTest.fileUrl)" -ForegroundColor White
            Write-Host "   Expira: $($uploadTest.expiration.expiresAt)" -ForegroundColor White
            $checks += @{name="Upload arquivo"; status="OK"}
        } else {
            Write-Host "⚠️ Upload de arquivo: PARCIAL" -ForegroundColor Yellow
            $checks += @{name="Upload arquivo"; status="PARCIAL"}
        }
    } catch {
        Write-Host "❌ Upload de arquivo: FALHOU" -ForegroundColor Red
        Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Yellow
        $checks += @{name="Upload arquivo"; status="ERRO"}
    }
} else {
    Write-Host "⏭️ Verificação 5: PULADA (dependências não atendidas)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📊 RESUMO DA VERIFICAÇÃO:" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

$okCount = ($checks | Where-Object {$_.status -eq "OK"}).Count
$partialCount = ($checks | Where-Object {$_.status -eq "PARCIAL"}).Count
$errorCount = ($checks | Where-Object {$_.status -eq "ERRO"}).Count
$totalCount = $checks.Count

foreach ($check in $checks) {
    $color = switch ($check.status) {
        "OK" { "Green" }
        "PARCIAL" { "Yellow" }
        "ERRO" { "Red" }
    }
    $icon = switch ($check.status) {
        "OK" { "✅" }
        "PARCIAL" { "⚠️" }
        "ERRO" { "❌" }
    }
    Write-Host "$icon $($check.name): $($check.status)" -ForegroundColor $color
}

Write-Host ""
Write-Host "Total: $totalCount | OK: $okCount | Parcial: $partialCount | Erro: $errorCount" -ForegroundColor White

if ($errorCount -eq 0 -and $partialCount -eq 0) {
    Write-Host ""
    Write-Host "🎉 CONFIGURAÇÃO PERFEITA!" -ForegroundColor Green
    Write-Host "Sistema QR Code com storage funcionando 100%!" -ForegroundColor Green
} elseif ($errorCount -eq 0) {
    Write-Host ""
    Write-Host "✅ CONFIGURAÇÃO BOA!" -ForegroundColor Yellow
    Write-Host "Sistema funcionando com algumas limitações." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "⚠️ CONFIGURAÇÃO INCOMPLETA!" -ForegroundColor Red
    Write-Host "Siga os passos em CONFIGURACAO_MANUAL_SIMPLES.md" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Corrija os itens com erro" -ForegroundColor White
Write-Host "2. Execute este script novamente" -ForegroundColor White
Write-Host "3. Teste no frontend quando tudo estiver OK" -ForegroundColor White