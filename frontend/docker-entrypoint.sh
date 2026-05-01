#!/bin/sh
set -e
if [ -n "${NEXTAUTH_SECRET_FILE:-}" ] && [ -r "${NEXTAUTH_SECRET_FILE}" ]; then
  export NEXTAUTH_SECRET="$(tr -d '\n\r' < "${NEXTAUTH_SECRET_FILE}")"
fi
if [ -z "${NEXTAUTH_SECRET:-}" ]; then
  export NEXTAUTH_SECRET="demo_nextauth_secret_change_me_0123456789abcdef"
fi
exec "$@"
