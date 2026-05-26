@echo off
REM Database migration script for Dash platform
REM This script updates the database schema to support the new features

echo Starting database migration for Dash platform...

REM Generate Prisma client
echo.
echo Generating Prisma client...
call npx prisma generate

REM Create migration
echo.
echo Creating migration...
call npx prisma migrate dev --name comprehensive_schema_update

REM Sync database with schema
echo.
echo Syncing database...
call npx prisma db push --force-reset

echo.
echo Migration complete!
pause
