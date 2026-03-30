# Script de teste para QR Code Generator
# Execute: .\teste-qr-code.ps1

Write-Host "🧪 TESTE RÁPIDO - QR CODE GENERATOR" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

$headers = @{
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw'
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw'
    'Content-Type' = 'application/json'
}

$testes = @(
    @{
        nome = "Website"
        icone = "🌐"
        body = '{"content":"https://www.google.com","type":"url"}'
    },
    @{
        nome = "Texto"
        icone = "📝"
        body = '{"content":"Olá! QR Code funcionando perfeitamente!","type":"text"}'
    },
    @{
        nome = "Email"
        icone = "📧"
        body = '{"content":"mailto:contato@empresa.com?subject=Teste QR Code","type":"url"}'
    },
    @{
        nome = "WhatsApp"
        icone = "💬"
        body = '{"content":"https://wa.me/5511999999999?text=Olá via QR Code!","type":"url"}'
    },
    @{
        nome = "WiFi"
        icone = "📶"
        body = '{"content":"WIFI:T:WPA;S:MinhaRede;P:senha123;H:false;;","type":"text"}'
    }
)

$sucessos = 0
$total = $testes.Count

foreach ($teste in $testes) {
    Write-Host "$($teste.icone) Testando: $($teste.nome)" -ForegroundColor Yellow
    
    try {
        $result = Invoke-RestMethod -Uri 'https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/generate-qrcode' -Method Post -Headers $headers -Body $teste.body -TimeoutSec 15
        
        if ($result.success) {
            Write-Host "   ✅ Sucesso!" -ForegroundColor Green
            $sucessos++
            
            # Verificar se é um QR code válido
            if ($result.qrCodeUrl -like "data:image/png;base64,*") {
                Write-Host "   📱 QR Code PNG válido gerado" -ForegroundColor White
            }
        } else {
            Write-Host "   ❌ Falhou: $($result.error)" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "🎯 RESULTADO FINAL:" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host "Testes realizados: $total"
Write-Host "Sucessos: $sucessos" -ForegroundColor Green
Write-Host "Falhas: $($total - $sucessos)" -ForegroundColor Red

$percentual = [math]::Round(($sucessos / $total) * 100, 1)
Write-Host "Taxa de sucesso: $percentual%" -ForegroundColor White

Write-Host ""

if ($sucessos -eq $total) {
    Write-Host "🎉 PERFEITO! Todos os testes passaram!" -ForegroundColor Green
    Write-Host "O sistema de QR Code está funcionando 100%!" -ForegroundColor Green
} elseif ($sucessos -gt ($total / 2)) {
    Write-Host "✅ BOM! Maioria dos testes passou." -ForegroundColor Yellow
    Write-Host "Sistema funcional com algumas limitações." -ForegroundColor Yellow
} else {
    Write-Host "❌ PROBLEMA! Muitos testes falharam." -ForegroundColor Red
    Write-Host "Verifique a configuração do sistema." -ForegroundColor Red
}

Write-Host ""
Write-Host "📱 Para testar no celular:" -ForegroundColor Cyan
Write-Host "1. Acesse a aplicação web" -ForegroundColor White
Write-Host "2. Vá para 'QR Code Generator'" -ForegroundColor White
Write-Host "3. Gere um QR Code" -ForegroundColor White
Write-Host "4. Escaneie com a câmera do celular" -ForegroundColor White