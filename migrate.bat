@echo off
REM Database migration script for Dash platform
REM This script updates the database schema to support the new features

echo Starting database migration for Dash platform...

REM Generate Prisma client
echo.
echo Generating Prisma client...
call npx prisma generate

REM Apply migrations (uses DIRECT_URL from .env.local when set)
echo.
echo Applying migrations (DIRECT_URL or DATABASE_URL)...
call npx prisma migrate deploy

echo.
echo Migration complete!
pause
