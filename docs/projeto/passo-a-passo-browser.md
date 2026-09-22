# Passo a passo no browser — Distac

Pré-requisito: API em `http://localhost:3000/api` e interface em `http://localhost:5173`. Para o fluxo completo, consulte [`fluxo-aplicacao.md`](fluxo-aplicacao.md).

1. O navegador abre o Vite, que serve `frontend/index.html`; `src/main.tsx` monta React e carrega os estilos.
2. `App.tsx` define `/login` como pública e as demais páginas sob a área protegida.
3. `AuthContext` chama `GET /api/auth/me` com `credentials: 'include'`.
4. Sem sessão, `ProtectedRoute` envia para `/login`. A tela envia `POST /api/auth/login`; a API valida credenciais e grava cookies httpOnly.
5. Com sessão, `AppShell` exibe o Hub e a navegação para Clientes, Produtos, Pedidos e Usuários.
6. Cada tela usa `FilterBar`, `DataTable` e `Modal`; as chamadas seguem o prefixo `/api`, por exemplo `GET /api/clients`.
7. Em 401, o cliente tenta uma vez `POST /api/auth/refresh` antes de propagar o erro.
8. Ao sair, `POST /api/auth/logout` limpa os cookies e o estado de sessão.

```text
Browser → main.tsx → App/AuthContext → /api/auth/me
  ├─ sem cookie → LoginPage → /api/auth/login
  └─ com cookie → ProtectedRoute → AppShell → Hub / CRUDs
```

O token nunca fica em `localStorage`; a segurança de rota da API é garantida pelo `JwtAuthGuard` global.
