#!/bin/bash
# Ajusta dono dos arquivos. .env e dist/ já vêm prontos do CodeBuild.
set -e
chown -R ubuntu:ubuntu /home/ubuntu/clinica-admin
exit 0
