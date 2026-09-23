# Script de Setup do Banco de Dados HopeMind (PostgreSQL / Supabase) - SafeMindLive
Write-Host "🌱 Iniciando Setup do Banco de Dados (Supabase)..." -ForegroundColor Green

Set-Location -Path "$PSScriptRoot\..\..\backend"
npx prisma db push
npx prisma db seed

Write-Host "✅ Banco sincronizado e dados demonstrativos populados com sucesso!" -ForegroundColor Green
