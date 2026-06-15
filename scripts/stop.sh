#!/bin/bash
# Para o backend admin antes de substituir os arquivos.
set -e
pm2 stop iaso-admin-backend || true
exit 0
