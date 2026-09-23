# Script de Migração do Banco HopeMind (PostgreSQL / Supabase)
Set-Location -Path "$PSScriptRoot\..\..\backend"
npx prisma db push
