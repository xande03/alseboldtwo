# Script de teste para geração de imagens
# Execute: .\teste-geracao-imagem.ps1

Write-Host "🧪 TESTE DE GERAÇÃO DE IMAGEM" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$headers = @{
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw'
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw'
    'Content-Type' = 'application/json'
}

# Teste 1: Geração básica
Write-Host "📝 Teste 1: Geração básica" -ForegroundColor Yellow
$body1 = '{"prompt":"um gato fofo","creationMode":"livre"}'

try {
    $result1 = Invoke-RestMethod -Uri 'https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/generate-image' -Method Post -Headers $headers -Body $body1 -TimeoutSec 30
    
    if ($result1.success) {
        Write-Host "✅ Sucesso!" -ForegroundColor Green
        Write-Host "   API: $($result1.apiUsed)"
        Write-Host "   URL: $($result1.imageUrl.Substring(0, 80))..."
    } else {
        Write-Host "❌ Falhou: $($result1.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Teste 2: Modo cartoon
Write-Host "🎨 Teste 2: Modo cartoon" -ForegroundColor Yellow
$body2 = '{"prompt":"um cachorro feliz","creationMode":"cartoon"}'

try {
    $result2 = Invoke-RestMethod -Uri 'https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/generate-image' -Method Post -Headers $headers -Body $body2 -TimeoutSec 30
    
    if ($result2.success) {
        Write-Host "✅ Sucesso!" -ForegroundColor Green
        Write-Host "   API: $($result2.apiUsed)"
        Write-Host "   Prompt otimizado: $($result2.prompt)"
    } else {
        Write-Host "❌ Falhou: $($result2.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Teste 3: Modo anime
Write-Host "🌸 Teste 3: Modo anime" -ForegroundColor Yellow
$body3 = '{"prompt":"uma menina sorrindo","creationMode":"anime"}'

try {
    $result3 = Invoke-RestMethod -Uri 'https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/generate-image' -Method Post -Headers $headers -Body $body3 -TimeoutSec 30
    
    if ($result3.success) {
        Write-Host "✅ Sucesso!" -ForegroundColor Green
        Write-Host "   API: $($result3.apiUsed)"
        Write-Host "   URL: $($result3.imageUrl.Substring(0, 80))..."
    } else {
        Write-Host "❌ Falhou: $($result3.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 RESUMO DOS TESTES:" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan

$sucessos = 0
if ($result1.success) { $sucessos++ }
if ($result2.success) { $sucessos++ }
if ($result3.success) { $sucessos++ }

Write-Host "Testes realizados: 3"
Write-Host "Sucessos: $sucessos" -ForegroundColor Green
Write-Host "Falhas: $(3 - $sucessos)" -ForegroundColor Red

if ($sucessos -eq 3) {
    Write-Host ""
    Write-Host "🎉 TODOS OS TESTES PASSARAM!" -ForegroundColor Green
    Write-Host "O sistema de geração de imagens está funcionando perfeitamente!" -ForegroundColor Green
} elseif ($sucessos -gt 0) {
    Write-Host ""
    Write-Host "⚠️ ALGUNS TESTES FALHARAM" -ForegroundColor Yellow
    Write-Host "Verifique a conexão e tente novamente." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ TODOS OS TESTES FALHARAM" -ForegroundColor Red
    Write-Host "Verifique a configuração do Supabase." -ForegroundColor Red
}

Write-Host ""
Write-Host "Para testar no navegador, acesse o frontend e use a funcao 'Gerar Imagem'." -ForegroundColor Cyan