#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/var/www/mushroomie"
BACKUP_DIR="$PROJECT_DIR/backups"
UPLOADS_DIR="$PROJECT_DIR/public/uploads"
DATE="$(date +%F-%H%M%S)"

mkdir -p "$BACKUP_DIR/uploads" "$BACKUP_DIR/db" "$BACKUP_DIR/logs"

echo "[$(date)] Starting Mushroomie backup..."

cd "$PROJECT_DIR"

if [ -d "$UPLOADS_DIR" ]; then
  tar -czf "$BACKUP_DIR/uploads/uploads-$DATE.tar.gz" public/uploads
  echo "[$(date)] Uploads backup created: uploads-$DATE.tar.gz"
else
  echo "[$(date)] ERROR: uploads directory not found: $UPLOADS_DIR"
  exit 1
fi

# Extract database URL from .env safely
DB_URL=""
if [ -f "$PROJECT_DIR/.env" ]; then
  DB_URL=$(grep "DATABASE_URL=" "$PROJECT_DIR/.env" | cut -d '"' -f 2)
fi

if [ -z "$DB_URL" ]; then
  echo "[$(date)] WARNING: DATABASE_URL is missing. Skipping DB backup."
else
  # Using standard mysqldump with the parsed URL components could be tricky if it has special characters.
  # We will just write a wrapper instruction or execute mysqldump.
  # Assuming the URL is "mysql://user:pass@host:port/dbname"
  # Since extracting complex DB credentials from standard URL via bash is error-prone,
  # it's better to manually specify the variables, but here we can try a basic extraction
  
  DB_USER=$(echo "$DB_URL" | sed -E 's/mysql:\/\/([^:]+):.*/\1/')
  DB_PASS=$(echo "$DB_URL" | sed -E 's/mysql:\/\/[^:]+:([^@]+)@.*/\1/')
  DB_HOST=$(echo "$DB_URL" | sed -E 's/mysql:\/\/[^@]+@([^:]+):.*/\1/')
  DB_PORT=$(echo "$DB_URL" | sed -E 's/mysql:\/\/[^@]+@[^:]+:([0-9]+)\/.*/\1/')
  DB_NAME=$(echo "$DB_URL" | sed -E 's/mysql:\/\/[^\/]+\/(.*)/\1/' | cut -d '?' -f 1)
  
  # URL Decode the password if necessary
  # Note: The decoded password might need to be explicitly set in a .my.cnf or safely passed.
  
  # A safer way without echoing the password into the command line is using an environment variable
  export MYSQL_PWD=$(printf '%b' "${DB_PASS//%/\\x}")
  
  mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/db/mysql-$DATE.sql.gz"
  echo "[$(date)] Database backup created: mysql-$DATE.sql.gz"
  
  unset MYSQL_PWD
fi

# Retention: delete backups older than 30 days
find "$BACKUP_DIR/uploads" -type f -name "*.tar.gz" -mtime +30 -delete
find "$BACKUP_DIR/db" -type f -name "*.sql.gz" -mtime +30 -delete

echo "[$(date)] Mushroomie backup completed."
