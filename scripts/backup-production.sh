#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/var/www/mushroomie"
BACKUP_DIR="$PROJECT_DIR/backups"
UPLOADS_DIR="$PROJECT_DIR/public/uploads"
DATE="$(date -u +%Y%m%dT%H%M%SZ)"
DB_FINAL="$BACKUP_DIR/db/mysql-$DATE.sql.gz"
DB_PARTIAL="$DB_FINAL.partial"
UPLOAD_FINAL="$BACKUP_DIR/uploads/uploads-$DATE.tar.gz"
UPLOAD_PARTIAL="$UPLOAD_FINAL.partial"

umask 077

fail() {
  printf '%s\n' "$1" >&2
  exit 1
}

cleanup_partial_artifacts() {
  rm -f -- "$DB_PARTIAL" "$UPLOAD_PARTIAL"
}

trap cleanup_partial_artifacts EXIT

test -d "$PROJECT_DIR" || fail "SEO_DISCOVERY_BACKUP_PROJECT_DIR_MISSING"
test -d "$UPLOADS_DIR" || fail "SEO_DISCOVERY_BACKUP_UPLOADS_DIR_MISSING"
test -f "$PROJECT_DIR/.env" || fail "SEO_DISCOVERY_BACKUP_ENV_MISSING"
command -v node >/dev/null || fail "SEO_DISCOVERY_BACKUP_NODE_MISSING"
command -v mysqldump >/dev/null || fail "SEO_DISCOVERY_BACKUP_MYSQLDUMP_MISSING"
command -v gzip >/dev/null || fail "SEO_DISCOVERY_BACKUP_GZIP_MISSING"
command -v tar >/dev/null || fail "SEO_DISCOVERY_BACKUP_TAR_MISSING"
command -v base64 >/dev/null || fail "SEO_DISCOVERY_BACKUP_BASE64_MISSING"

mkdir -p "$BACKUP_DIR/uploads" "$BACKUP_DIR/db"

# Parse .env without sourcing it, then use the WHATWG URL parser so encoded
# credentials and reserved characters are handled structurally.
DB_URL="$(
  cd "$PROJECT_DIR"
  node --input-type=module -e "
    import { readFileSync } from 'node:fs'
    import { parse } from 'dotenv'
    const value = parse(readFileSync('.env')).DATABASE_URL
    if (typeof value === 'string') process.stdout.write(value)
  "
)"
test -n "$DB_URL" || fail "SEO_DISCOVERY_BACKUP_DATABASE_URL_REQUIRED"

mapfile -t DB_PARTS < <(
  DATABASE_URL="$DB_URL" node -e '
    const parsed = new URL(process.env.DATABASE_URL)
    if (parsed.protocol !== "mysql:") process.exit(2)
    const values = [
      decodeURIComponent(parsed.username),
      decodeURIComponent(parsed.password),
      parsed.hostname,
      parsed.port || "3306",
      decodeURIComponent(parsed.pathname.replace(/^\//, "")),
    ]
    if (values.some((value) => value.length === 0 || value.includes("\n"))) process.exit(2)
    for (const value of values) console.log(Buffer.from(value).toString("base64"))
  '
)
test "${#DB_PARTS[@]}" -eq 5 || fail "SEO_DISCOVERY_BACKUP_DATABASE_URL_INVALID"

decode_part() {
  printf '%s' "$1" | base64 --decode
}

DB_USER="$(decode_part "${DB_PARTS[0]}")"
DB_PASS="$(decode_part "${DB_PARTS[1]}")"
DB_HOST="$(decode_part "${DB_PARTS[2]}")"
DB_PORT="$(decode_part "${DB_PARTS[3]}")"
DB_NAME="$(decode_part "${DB_PARTS[4]}")"

printf '[%s] Creating database backup...\n' "$(date -Is)"
MYSQL_PWD="$DB_PASS" mysqldump --single-transaction --quick --no-tablespaces --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" "$DB_NAME" | gzip -c > "$DB_PARTIAL"
test -s "$DB_PARTIAL" || fail "SEO_DISCOVERY_BACKUP_DATABASE_EMPTY"
gzip -t "$DB_PARTIAL" || fail "SEO_DISCOVERY_BACKUP_DATABASE_INVALID"

printf '[%s] Creating uploads backup...\n' "$(date -Is)"
tar -czf "$UPLOAD_PARTIAL" -C "$PROJECT_DIR" public/uploads
test -s "$UPLOAD_PARTIAL" || fail "SEO_DISCOVERY_BACKUP_UPLOADS_EMPTY"
tar -tzf "$UPLOAD_PARTIAL" >/dev/null || fail "SEO_DISCOVERY_BACKUP_UPLOADS_INVALID"

# Publish only fully validated artifacts. Existing backups are never pruned or
# overwritten by this script; retention is an explicit operator task.
mv -- "$DB_PARTIAL" "$DB_FINAL"
mv -- "$UPLOAD_PARTIAL" "$UPLOAD_FINAL"
trap - EXIT

printf 'SEO_DISCOVERY_BACKUP_DATABASE=%s\n' "$DB_FINAL"
printf 'SEO_DISCOVERY_BACKUP_UPLOADS=%s\n' "$UPLOAD_FINAL"
printf 'SEO_DISCOVERY_BACKUP_COMPLETE\n'
