# Status do protótipo — HopeMind

## Pronto
- Cadastro de paciente e psicólogo (CRP obrigatório), login, renovação de sessão, logout
- Questionários do paciente (P01–P30) e do psicólogo (S01–S21), versionados, com validação no servidor
- Match com filtros e 7 componentes ponderados, razões explicadas, registro em `match_runs`
- Fluxo de segurança com canais de apoio e `safety_alerts`
- Agendamento de sessões de 50 min com bloqueio de conflito
- Interface responsiva (PWA), claro/escuro

## Próximos passos
1. Validar perguntas, categorias e pesos com psicólogo(a) responsável
2. Painel da equipe clínica para `safety_alerts` e protocolo de resposta
3. Cancelar/reagendar sessões; psicólogo confirmar horários
4. Match dinâmico após as primeiras sessões (seção 10 do documento de requisitos)
5. Editar dados pessoais em Ajustes
6. Homologação: HTTPS, CI, revogação de refresh token, termo de consentimento (LGPD)
