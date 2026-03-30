#!/usr/bin/env pwsh

Write-Host "TESTE DO CONVERSOR DE DOCUMENTOS" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Test OCR function
Write-Host "1. Testando funcao OCR..." -ForegroundColor Yellow

$testImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

$ocrPayload = @{
    imageBase64 = $testImage
} | ConvertTo-Json

try {
    $ocrResponse = Invoke-RestMethod -Uri "https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/ocr-scan" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw"
        } `
        -Body $ocrPayload

    Write-Host "OCR Function: FUNCIONANDO" -ForegroundColor Green
    Write-Host "Resposta: $($ocrResponse.text)" -ForegroundColor Gray
} catch {
    Write-Host "OCR Function: ERRO" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Check dependencies
Write-Host "2. Verificando dependencias..." -ForegroundColor Yellow

$dependencies = @("jspdf", "docx", "pdfjs-dist", "file-saver")
$packageJson = Get-Content "package.json" | ConvertFrom-Json

foreach ($dep in $dependencies) {
    if ($packageJson.dependencies.$dep) {
        Write-Host "$dep : $($packageJson.dependencies.$dep)" -ForegroundColor Green
    } else {
        Write-Host "$dep : NAO ENCONTRADO" -ForegroundColor Red
    }
}

Write-Host ""

# Check if node_modules exist
Write-Host "3. Verificando instalacao..." -ForegroundColor Yellow

if (Test-Path "node_modules") {
    $nodeModulesCount = (Get-ChildItem "node_modules" -Directory).Count
    Write-Host "node_modules: $nodeModulesCount pacotes instalados" -ForegroundColor Green
} else {
    Write-Host "node_modules: NAO ENCONTRADO" -ForegroundColor Red
}

Write-Host ""

# Test component compilation
Write-Host "4. Verificando componente..." -ForegroundColor Yellow

if (Test-Path "src/components/DocumentConverter.tsx") {
    Write-Host "DocumentConverter.tsx: ENCONTRADO" -ForegroundColor Green
    
    # Check for imports
    $componentContent = Get-Content "src/components/DocumentConverter.tsx" -Raw
    $requiredImports = @("jsPDF", "Document", "Packer", "saveAs")
    
    foreach ($import in $requiredImports) {
        if ($componentContent -match $import) {
            Write-Host "Import $import : OK" -ForegroundColor Green
        } else {
            Write-Host "Import $import : NAO ENCONTRADO" -ForegroundColor Red
        }
    }
} else {
    Write-Host "DocumentConverter.tsx: NAO ENCONTRADO" -ForegroundColor Red
}

Write-Host ""

# Summary
Write-Host "RESUMO DO TESTE" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host "OCR: Funcao Supabase com Groq Vision" -ForegroundColor White
Write-Host "Image->PDF: jsPDF para conversao" -ForegroundColor White
Write-Host "PDF->Word: pdfjs-dist + docx para conversao" -ForegroundColor White
Write-Host "Exportacao: file-saver para downloads" -ForegroundColor White
Write-Host ""
Write-Host "FUNCIONALIDADES DISPONIVEIS:" -ForegroundColor Green
Write-Host "1. Upload de multiplas imagens -> PDF" -ForegroundColor Gray
Write-Host "2. Upload de PDF -> extracao de texto -> Word" -ForegroundColor Gray
Write-Host "3. Upload de imagem -> OCR -> exportar TXT/PDF/Word" -ForegroundColor Gray
Write-Host ""
Write-Host "Para testar na interface:" -ForegroundColor Yellow
Write-Host "npm run dev" -ForegroundColor Cyan
Write-Host "Acesse: http://localhost:5173" -ForegroundColor Cyan