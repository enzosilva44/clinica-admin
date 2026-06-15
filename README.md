# Clinica Admin App

Backoffice interno da Iaso/Iasoclin.

Este projeto é independente do `clinica-app` na interface e no backend, mas não replica o banco do produto.
O backend do admin funciona como uma API gateway/BFF:

```text
clinica-admin-app/frontend -> clinica-admin-app/backend -> clinica-app/backend
```

## Responsabilidades

- `clinica-app`: produto usado pelas clínicas e fonte oficial de usuários, planos e features.
- `clinica-admin-app`: operação interna, painel admin e futuro CRM/ERP da Iaso.

## Variáveis

Backend:

```env
PORT=3001
CLINICA_APP_API_URL=http://localhost:3000
```

Frontend:

```env
VITE_API_URL=http://localhost:3001
```
