# Padrão de telas — HopeMind

Padrões visuais e de componentes: [design-system.md](design-system.md).

| Tipo de tela | Padrão |
|---|---|
| Autenticação | `AuthLayout`: marca à esquerda (some no celular), formulário à direita |
| Tela logada | `AppShell` (sidebar no desktop, tab bar no celular) + `PageHeader` com título grande |
| Listas | Cartões (`.grid-cards`) ou lista agrupada (`.group`) — sem tabelas densas |
| Detalhe / ação | `Sheet` (diálogo no desktop, bottom sheet no celular) |
| Formulários longos | Uma seção por etapa, com barra de progresso e validação ao avançar |
| Feedback | `useToast` para sucesso/erro; banners para avisos persistentes |
| Carregamento | `Skeleton` com o formato do conteúdo |
| Vazio | `EmptyState` com o mascote e uma ação clara |

Nomenclatura: rotas de tela em português (`/triagem`, `/consultas`, `/configuracoes`), código e banco em inglês.
