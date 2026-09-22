# Script de Setup do Banco de Dados HopeMind (MariaDB) - SafeMindLive
Write-Host "🌱 Iniciando Setup do Banco de Dados MariaDB..." -ForegroundColor Green

Set-Location -Path "$PSScriptRoot\..\..\backend"
npx prisma db push
npx prisma db seed

Write-Host "✅ Banco MariaDB sincronizado e dados demonstrativos populados com sucesso!" -ForegroundColor Green
