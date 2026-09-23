# Segurança — HopeMind

O HopeMind lida com **dados de saúde mental**, que a LGPD trata como dados sensíveis. Esta página descreve o que já está implementado e o que falta antes de qualquer uso real.

## Implementado

| Tema | Como |
|---|---|
| Sessão | JWT em cookies `httpOnly` + `sameSite=lax` (+ `secure` em produção). O token **não** volta no corpo do login, então não fica acessível a JavaScript |
| Renovação | `/api/auth/refresh` emite novos tokens a partir do cookie de refresh; o front renova sozinho ao receber 401 |
| Segredos | `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET` são obrigatórios — a API não sobe sem eles (não há valor padrão no código) |
| Senhas | bcrypt (custo 10), mínimo de 8 caracteres |
| Força bruta | `ThrottlerGuard` global (100 req/min) e 5 req/min em cadastro e login |
| Autorização | Guard JWT global; paciente só lê as **próprias** recomendações; o paciente do agendamento vem do token, nunca do corpo da requisição |
| Validação | `ValidationPipe` global com DTOs (`whitelist` + `forbidNonWhitelisted`); respostas do questionário validadas contra a definição versionada |
| Profissionais | Cadastro de psicólogo exige CRP no formato oficial e único |
| Cabeçalhos | `helmet` |
| Risco clínico | Respostas de risco abrem `safety_alerts` e mostram canais de apoio (CVV 188, SAMU 192); nunca alteram o ranking |

## Antes de produção

- Termo de consentimento específico para dados de saúde e política de retenção/exclusão (LGPD, art. 11)
- Protocolo clínico para `safety_alerts`: quem é avisado e em quanto tempo
- Verificação do CRP junto ao conselho (hoje só o formato é validado)
- HTTPS obrigatório, segredos gerenciados fora do repositório e rotação periódica
- Revogação de refresh tokens (lista de sessões) e registro em `audit_logs` dos acessos a dados sensíveis

## Boas práticas do repositório

- `.env` nunca é versionado (ver `.gitignore`); use `.env.example` como modelo
- Não coloque tokens do GitHub na URL do remote (`git remote -v` os expõe); prefira o Git Credential Manager ou SSH
