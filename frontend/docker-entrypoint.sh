#!/bin/sh
set -e
if [ -n "${NEXTAUTH_SECRET_FILE:-}" ] && [ -r "${NEXTAUTH_SECRET_FILE}" ]; then
  export NEXTAUTH_SECRET="$(tr -d '\n\r' < "${NEXTAUTH_SECRET_FILE}")"
fi
exec "$@"
