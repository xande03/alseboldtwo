#!/usr/bin/env pwsh

Write-Host "TESTE UPSCALE DE IMAGENS E DOWNLOAD YOUTUBE" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

$supabaseUrl = "https://zfstmsgevfhdkhesatzm.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw"

# Test 1: Upscale Image Function
Write-Host "1. Testando funcao de upscale de imagem..." -ForegroundColor Yellow

$testImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

$upscalePayload = @{
    imageBase64 = $testImage
    scale = 2
} | ConvertTo-Json

try {
    $upscaleResponse = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/upscale-image" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $anonKey"
        } `
        -Body $upscalePayload

    Write-Host "Upscale Function: FUNCIONANDO" -ForegroundColor Green
    Write-Host "Metodo: $($upscaleResponse.method)" -ForegroundColor Gray
    Write-Host "Scale: $($upscaleResponse.scale)" -ForegroundColor Gray
    if ($upscaleResponse.note) {
        Write-Host "Nota: $($upscaleResponse.note)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Upscale Function: ERRO" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: YouTube Music Analysis
Write-Host "2. Testando analise de musica do YouTube..." -ForegroundColor Yellow

$testYouTubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

$musicPayload = @{
    link = $testYouTubeUrl
    action = "analyze"
} | ConvertTo-Json

try {
    $musicResponse = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/analyze-music" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $anonKey"
        } `
        -Body $musicPayload

    Write-Host "Music Analysis: FUNCIONANDO" -ForegroundColor Green
    Write-Host "Titulo: $($musicResponse.title)" -ForegroundColor Gray
    Write-Host "Artista: $($musicResponse.artist)" -ForegroundColor Gray
    Write-Host "Genero: $($musicResponse.genre)" -ForegroundColor Gray
    Write-Host "YouTube: $($musicResponse.isYouTube)" -ForegroundColor Gray
    if ($musicResponse.downloadOptions) {
        Write-Host "Opcoes de download disponiveis" -ForegroundColor Green
    }
} catch {
    Write-Host "Music Analysis: ERRO" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: YouTube Music Download
Write-Host "3. Testando download de musica do YouTube..." -ForegroundColor Yellow

$downloadPayload = @{
    youtubeUrl = $testYouTubeUrl
    format = "mp3"
    quality = "high"
} | ConvertTo-Json

try {
    $downloadResponse = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/download-youtube-music" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $anonKey"
        } `
        -Body $downloadPayload

    Write-Host "YouTube Download: FUNCIONANDO" -ForegroundColor Green
    Write-Host "Status: $($downloadResponse.status)" -ForegroundColor Gray
    
    if ($downloadResponse.downloadUrl) {
        Write-Host "URL de download disponivel" -ForegroundColor Green
    } elseif ($downloadResponse.manualDownloadOptions) {
        Write-Host "Opcoes de download manual:" -ForegroundColor Yellow
        Write-Host "- yt.mp3: $($downloadResponse.manualDownloadOptions.ytMp3)" -ForegroundColor Gray
        Write-Host "- y2mate: $($downloadResponse.manualDownloadOptions.y2mate)" -ForegroundColor Gray
        Write-Host "- savefrom: $($downloadResponse.manualDownloadOptions.savefrom)" -ForegroundColor Gray
    }
} catch {
    Write-Host "YouTube Download: ERRO" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Check functions status
Write-Host "4. Verificando status das funcoes..." -ForegroundColor Yellow

try {
    $functionsList = npx supabase functions list 2>$null
    if ($functionsList -match "upscale-image.*ACTIVE") {
        Write-Host "upscale-image: ATIVA" -ForegroundColor Green
    }
    if ($functionsList -match "analyze-music.*ACTIVE") {
        Write-Host "analyze-music: ATIVA" -ForegroundColor Green
    }
    if ($functionsList -match "download-youtube-music.*ACTIVE") {
        Write-Host "download-youtube-music: ATIVA" -ForegroundColor Green
    }
} catch {
    Write-Host "Erro ao verificar status das funcoes" -ForegroundColor Red
}

Write-Host ""

# Summary
Write-Host "RESUMO DOS TESTES" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan
Write-Host ""
Write-Host "UPSCALE DE IMAGENS:" -ForegroundColor White
Write-Host "- Metodo 1: Replicate Real-ESRGAN (premium)" -ForegroundColor Gray
Write-Host "- Metodo 2: Waifu2x API (gratuito)" -ForegroundColor Gray
Write-Host "- Metodo 3: Fallback com imagem original" -ForegroundColor Gray
Write-Host ""
Write-Host "DOWNLOAD YOUTUBE:" -ForegroundColor White
Write-Host "- Metodo 1: yt.mp3 API (automatico)" -ForegroundColor Gray
Write-Host "- Metodo 2: APIs alternativas" -ForegroundColor Gray
Write-Host "- Metodo 3: Links manuais (yt.mp3.org, y2mate, savefrom)" -ForegroundColor Gray
Write-Host ""
Write-Host "ANALISE DE MUSICA:" -ForegroundColor White
Write-Host "- Groq AI para extrair informacoes" -ForegroundColor Gray
Write-Host "- Deteccao automatica de YouTube" -ForegroundColor Gray
Write-Host "- Opcoes de download integradas" -ForegroundColor Gray
Write-Host ""
Write-Host "Para testar na interface:" -ForegroundColor Yellow
Write-Host "npm run dev" -ForegroundColor Cyan
Write-Host "Acesse: http://localhost:5173" -ForegroundColor Cyan