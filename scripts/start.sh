#!/bin/bash
# Sobe o backend admin (porta 3001) com PM2 e recarrega o Nginx.

set -e

APP_DIR=/home/ubuntu/clinica-admin

# Permite que o Nginx (www-data) leia o build do frontend admin
chmod o+x /home/ubuntu
chmod -R o+rX "$APP_DIR/frontend/dist"

cd "$APP_DIR/backend"

if pm2 describe iaso-admin-backend > /dev/null 2>&1; then
  pm2 restart iaso-admin-backend --update-env
else
  pm2 start src/server.js --name iaso-admin-backend
fi

pm2 save

nginx -t && systemctl reload nginx

exit 0
