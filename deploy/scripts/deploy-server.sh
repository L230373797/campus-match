#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
PROJECT_DIR="$(cd "${DEPLOY_DIR}/.." && pwd)"
ENV_FILE="${DEPLOY_DIR}/.env.server"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}"
  echo "Copy deploy/.env.server.example to deploy/.env.server and fill in real values first."
  exit 1
fi

cd "${PROJECT_DIR}"
docker compose -f deploy/docker-compose.server.yml --env-file "${ENV_FILE}" up -d --build
docker compose -f deploy/docker-compose.server.yml --env-file "${ENV_FILE}" ps
