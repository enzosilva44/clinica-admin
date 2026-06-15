#!/bin/bash
# Gera o backend/.env do admin a partir das variáveis do CodeBuild.

set -e

{
  echo "PORT=3001"
  echo "DATABASE_URL=${DATABASE_URL}"
  echo "JWT_SECRET=${JWT_SECRET}"
  echo "CORE_API_URL=${CORE_API_URL}"
} > backend/.env

echo "backend/.env gerado com $(wc -l < backend/.env) linhas"
