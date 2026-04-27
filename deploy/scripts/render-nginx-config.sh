#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${DEPLOY_DIR}/.env.server"
OUTPUT_DIR="${DEPLOY_DIR}/generated"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}"
  echo "Copy deploy/.env.server.example to deploy/.env.server first."
  exit 1
fi

APP_DOMAIN="$(
  grep '^APP_DOMAIN=' "${ENV_FILE}" | head -n 1 | cut -d '=' -f 2-
)"

if [[ -z "${APP_DOMAIN}" ]]; then
  echo "APP_DOMAIN is empty in ${ENV_FILE}"
  exit 1
fi

mkdir -p "${OUTPUT_DIR}"

sed "s/__APP_DOMAIN__/${APP_DOMAIN}/g" "${DEPLOY_DIR}/nginx/campus-match.http.conf" > "${OUTPUT_DIR}/campus-match.http.conf"
sed "s/__APP_DOMAIN__/${APP_DOMAIN}/g" "${DEPLOY_DIR}/nginx/campus-match.https.conf" > "${OUTPUT_DIR}/campus-match.https.conf"

echo "Generated:"
echo "  ${OUTPUT_DIR}/campus-match.http.conf"
echo "  ${OUTPUT_DIR}/campus-match.https.conf"
