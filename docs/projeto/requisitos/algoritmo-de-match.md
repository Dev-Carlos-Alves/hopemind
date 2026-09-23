# Algoritmo de match — implementação

Base: [`HopeMind_Formularios_e_Algoritmo_de_Match.docx`](HopeMind_Formularios_e_Algoritmo_de_Match.docx).
Este arquivo mostra **onde cada seção do documento está no código** e registra as decisões tomadas onde o documento deixava espaço para interpretação.

Versões atuais: questionários `hm-paciente-2026.2` / `hm-psicologo-2026.2`, algoritmo `hm-match-1.1.0` (1.1: localização pelo CEP do cadastro e distância no score).

---

## Rastreabilidade

| Seção do documento | Onde está |
|---|---|
| 1. Princípios de segurança | Perguntas de risco fora do score: [`match/safety.ts`](../../../backend/src/triage/match/safety.ts); UI de apoio: [`SafetyPanel.tsx`](../../../frontend/src/components/SafetyPanel.tsx) |
| 2. Arquitetura (camadas) | `hardFilter` e `scoreComponents` em [`match/match-engine.ts`](../../../backend/src/triage/match/match-engine.ts) |
| 3. Formulário do paciente (P01–P27) | [`questionnaire/patient.ts`](../../../backend/src/triage/questionnaire/patient.ts) |
| 4. Formulário do psicólogo (S01–S18) | [`questionnaire/psychologist.ts`](../../../backend/src/triage/questionnaire/psychologist.ts) |
| 5. Perguntas espelhadas | P28–P30 e S19–S21 (ver decisões) + mapeamento em `scoreComponents` |
| 6. Pesos iniciais + hard filters | `WEIGHTS` e `hardFilter` em `match-engine.ts` |
| 7. Fórmula `1 − |p − s| / 4` | `similarity` em `match-engine.ts` |
| 8. Pseudocódigo | `findMatches` em `match-engine.ts` |
| 9. Resultado ao usuário (sem “94%”) | Faixas + razões: `band`/`explain`; UI: [`MatchesPage.tsx`](../../../frontend/src/pages/MatchesPage.tsx) (10 melhores + “ver mais”) |
| 12. Versionar questionário e algoritmo | `triage_submissions.questionnaire_version` e `match_runs.algorithm_version` |

Testes que verificam cada regra: [`match-engine.spec.ts`](../../../backend/src/triage/match/match-engine.spec.ts) (`cd backend && npx jest`).

---

## Como o score é calculado

1. **Hard filters** — o profissional sai da lista (e é contado em `excluded`) se:
   - modalidade incompatível (`P20` × `S14`); presencial exige o consultório a **até 25 km** do paciente (coordenadas dos CEPs; sem coordenadas, vale a mesma cidade). Em “tanto faz”, basta atender online **ou** estar a até 25 km;
   - a faixa etária do paciente (pela data de nascimento) não está em `S02`;
   - alguma demanda **prioritária** (`P01`) está em `S13` (não atende);
   - não existe nenhum período em comum (`P22` × `S16`);
   - o paciente indicou risco e o profissional declarou que encaminha esses casos (`S18`) — roteamento de segurança, não pontuação.
2. **Componentes (0 a 1)** com os pesos da seção 6:

| Componente | Peso | Cálculo |
|---|---|---|
| Demanda | 25% | Fração das demandas do paciente cobertas por `S03`. `P01` (prioridade) pesa 2, `P19` pesa 1 |
| Estilo terapêutico | 18% | Média da `similarity` entre: `6−P06`↔`S06` (estrutura), `P05`↔`S09`, `P11`↔`S08`, `P07`↔`S07`, `P10`↔`S12`, `P09`↔`S11`, `P08`↔`S10` |
| Experiência específica | 14% | 85% nível declarado em `S04` nas demandas do paciente (mesmos pesos) + 15% tempo de prática (`S01`) |
| Relação terapêutica | 13% | `P28`(+`P12`)↔`S19`, `P29`↔`S20`, `P30`(+`P03`)↔`S21`, `P15`↔`S20` (½), `P16`↔`S09` (½) |
| Disponibilidade | 10% | `min(1, períodos em comum / 3)` |
| Formato e distância (`localizacao`) | 15% | Online: 1. Presencial: proximidade — 1 até 1,5 km, caindo linear até 0,3 em 12 km (0,6 se a distância for desconhecida). “Tanto faz”: o maior entre 0,8 (se atende online) e 0,55 + 0,45 × proximidade (se o consultório está ao alcance) |
| Preferências pessoais | 5% | Fração das preferências declaradas (`P17`, `P18`) atendidas; 1 se não houver preferência |

3. **Score** = soma ponderada → ordena a lista (empate: consultório mais perto primeiro). A interface mostra só a **faixa** (alta ≥ 0,75 · boa ≥ 0,55 · possível) e as **razões**, nunca uma porcentagem.

Só entram no cálculo as dimensões respondidas pelos dois lados (“compatibilidades válidas”, seção 7). Sem nenhuma dimensão válida, o componente vale 0,5 (neutro).

---

## Decisões de interpretação

- **Perguntas espelhadas que faltavam.** A seção 5 pede que acolhimento, comunicação direta e objetivos claros existam nos dois formulários, mas as seções 3 e 4 não as trazem. Foram adicionadas como `P28–P30` e `S19–S21`.
- **Estrutura do paciente.** Não há pergunta “quanto prefere sessões estruturadas”; usamos o inverso de `P06` (“prefiro conversar livremente”).
- **Localização pelo CEP (substitui `P20A`/`S15`).** O endereço fica no cadastro (`users.cep`, bairro, cidade, `latitude`/`longitude`). O CEP é resolvido no servidor: ViaCEP (com BrasilAPI de reserva) para o endereço e OpenStreetMap/Nominatim para o **centro do bairro** — as coordenadas da BrasilAPI costumam ser o centro da cidade, o que deixaria todas as distâncias iguais. Distância em linha reta (Haversine). O paciente vê só o bairro e a distância do consultório, nunca a rua. Peso da localização subiu de 10% para 15% porque a proximidade pesa na adesão ao presencial.
- **Máximo de 3 demandas em `P01`.** O documento fala em “demandas prioritárias”; limitar a 3 mantém o sentido de prioridade.
- **Não pontuadas por falta de pergunta equivalente do psicólogo:** `P04`, `P13`, `P14`, `P21`, `P23–P25`. Continuam salvas e podem alimentar o match dinâmico (seção 10).
- **`S18` estruturado.** O documento diz “conforme protocolo definido pela equipe clínica”; a versão atual tem duas opções (atende com protocolo / encaminha). O protocolo final precisa ser definido pela equipe.
- **Segurança (`P26`, `P27`).** `P27 = sim` → `IMMEDIATE`; `P26 = sim` ou `P27 = não sei` → `ELEVATED`; `P26 = conversar com profissional` → `WANTS_TALK`. Em qualquer nível, a pessoa vê canais de apoio (CVV 188, SAMU 192, UPA) e é aberto um `safety_alert`. O score **não muda** (há teste garantindo isso).

---

## Como ajustar

- **Pesos:** `WEIGHTS` em `match-engine.ts`. Suba `ALGORITHM_VERSION` a cada mudança para que `match_runs` permita comparar versões.
- **Perguntas:** edite `patient.ts` / `psychologist.ts` e suba a `version`. O frontend renderiza o que a API devolver — não há pergunta fixa no front.
- **Faixas exibidas:** função `band` em `match-engine.ts`.

## Pendências (seções 10–12)

- Validar perguntas, categorias e pesos com psicólogo(a) responsável.
- Definir o protocolo clínico para `safety_alerts` (quem é notificado, em quanto tempo) e uma tela para a equipe acompanhá-los.
- Match dinâmico pós-início (seção 10): perguntas de acompanhamento após as primeiras sessões.
- Piloto com dados simulados antes de usar dados reais; revisão de LGPD (dados de saúde são sensíveis).
