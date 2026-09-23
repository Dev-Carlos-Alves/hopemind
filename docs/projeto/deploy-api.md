# Hospedar a API (Render)

Sem isso, a API só existe enquanto o `npm run dev` estiver rodando no seu PC — é o que faz o app
mobile e o site precisarem do seu computador ligado. Hospedando a API, ela fica no ar 24 horas,
de graça, e o banco (Supabase) já está pronto para isso.

## 1. Criar o serviço no Render

1. Crie uma conta gratuita em [render.com](https://render.com) e conecte ao seu GitHub.
2. **New → Blueprint**, aponte para o repositório `hopemind`. O Render lê o [`render.yaml`](../../render.yaml)
   da raiz e propõe criar o serviço `hopemind-api` automaticamente (plano Free, pasta `backend/`).
3. Antes de confirmar, preencha as variáveis marcadas como secretas:
   - `DATABASE_URL` e `DIRECT_URL` — as mesmas do `backend/.env`, copiadas do Supabase
     (painel → **Connect → ORMs → Prisma**; veja [`database/README.md`](../../database/README.md)).
   - `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET` — o Render já gera valores aleatórios sozinho
     (`generateValue: true` no blueprint); só confirme.
4. Deploy. A primeira build demora alguns minutos (`npm install`, `prisma generate`, `nest build`).

Sem `render.yaml`, o mesmo serviço pode ser criado manualmente (**New → Web Service**):
Root Directory `backend`, Build Command `npm install && npm run build`, Start Command
`npm run start:prod`, Health Check Path `/api/health`.

## 2. Confirmar que subiu

```bash
curl https://hopemind-api.onrender.com/api/health
# {"status":"ok"}
```

> **Plano gratuito:** o serviço "dorme" depois de uns 15 minutos sem receber requisições, e a
> primeira chamada depois disso demora uns 30-50s para acordar (as seguintes voltam ao normal).
> É esperado — não é um erro do app.

## 3. Apontar o site e o app para a API hospedada

- **Site:** em `frontend/.env` (ou `.env` na raiz), mude `VITE_API_URL` para
  `https://hopemind-api.onrender.com/api` e rode `npm run build` de novo. Se o site também for
  hospedado (Netlify, Vercel...), acrescente o domínio dele em `CORS_ORIGIN` nas variáveis de
  ambiente do serviço no Render (aceita várias, separadas por vírgula).
- **App mobile:** não precisa recompilar. Em **Ajustes → Servidor da API**, troque a URL local
  pela do Render (`https://hopemind-api.onrender.com/api/`, com a barra no final).

## Por que isso não muda o resto

O app e o site sempre falaram com a API por HTTP — nunca com o banco diretamente. Hospedar a API
só troca o endereço que eles chamam; toda a lógica (autenticação, match, agendamento) continua a
mesma. O Supabase (banco) já está hospedado desde antes disso.
