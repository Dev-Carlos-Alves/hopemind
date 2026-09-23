# Módulos — HopeMind

| Módulo | Backend | Frontend | Status |
|---|---|---|---|
| Autenticação | `backend/src/auth` | `LoginPage`, `RegisterPage`, `AuthContext` | Pronto |
| Home institucional | — | `HomePage` | Pronto |
| Questionário e match | `backend/src/triage` | `MatchesPage` (paciente, com o questionário expansível), `TriagePage` (psicólogo) | Pronto (pesos a validar) |
| Endereço / CEP | `backend/src/geo` | `CepField`, `AddressCard` | Pronto (ViaCEP + OpenStreetMap) |
| Agendamento | `backend/src/appointments` | `BookingSheet`, `AppointmentsPage` | Pronto (sem cancelamento) |
| Ajustes | `/api/auth/me` | `SettingsPage` | Somente leitura |
| Segurança clínica | `safety_alerts` | `SafetyPanel` | Alertas gravados; falta painel da equipe |

Status detalhado: [STATUS_PROTOTIPO.md](STATUS_PROTOTIPO.md).
