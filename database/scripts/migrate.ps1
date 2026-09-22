# Script de Migração do Banco HopeMind (MariaDB)
Set-Location -Path "$PSScriptRoot\..\..\backend"
npx prisma db push
