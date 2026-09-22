#!/bin/bash
echo "🌱 Iniciando Setup do Banco MariaDB..."
cd "$(dirname "$0")/../../backend"
npx prisma db push
npx prisma db seed
echo "✅ Banco sincronizado!"
