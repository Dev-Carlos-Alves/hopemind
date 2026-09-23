# Contexto — HopeMind

## Objetivo

Ajudar pessoas a encontrar um(a) psicólogo(a) **compatível com o que buscam, com o jeito como gostam de ser acompanhadas e com a própria rotina**, e marcar a primeira sessão sem fricção.

O HopeMind **não faz diagnóstico** nem substitui avaliação psicológica: o match estima compatibilidade de preferências, experiência e logística (ver [`requisitos/`](requisitos/)).

## Usuários

| Perfil | O que faz |
|---|---|
| **Paciente** | Responde o questionário (demandas, estilo, relação, rotina), vê recomendações explicadas e agenda sessões |
| **Psicólogo(a)** | Cadastra CRP, responde o perfil de atendimento (experiência por demanda, estilo, agenda) e acompanha a agenda |
| **Equipe clínica** *(futuro)* | Acompanha alertas de segurança e valida perguntas e pesos |

## Escopo atual

- Cadastro e login (paciente / psicólogo com CRP obrigatório)
- Questionários versionados e fluxo de segurança para respostas de risco
- Match determinístico e explicável (filtros + 7 componentes ponderados)
- Agendamento de sessões de 50 min sem conflito de horário
- PWA responsiva com tema claro/escuro

## Fora do escopo (por enquanto)

- Pagamento, videochamada e prontuário
- Painel da equipe clínica para `safety_alerts`
- Match dinâmico após o início da terapia (seção 10 do documento de requisitos)
