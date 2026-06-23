#!/bin/bash
# Database migration script for Dash platform
# This script updates the database schema to support the new features

echo "Starting database migration for Dash platform..."

cd "$(dirname "$0")"

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Create migration
echo "Creating migration..."
npx prisma migrate dev --name comprehensive_schema_update

# Sync database with schema
echo "Syncing database..."
npx prisma db push --force-reset

echo "Migration complete!"
