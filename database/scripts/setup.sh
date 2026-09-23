#!/bin/bash
echo "🌱 Iniciando Setup do Banco (Supabase)..."
cd "$(dirname "$0")/../../backend"
npx prisma db push
npx prisma db seed
echo "✅ Banco sincronizado!"
