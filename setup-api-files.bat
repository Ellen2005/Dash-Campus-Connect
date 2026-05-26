@echo off
REM Setup Dash API routes on Windows

setlocal enabledelayedexpansion

echo Creating API route directories...
mkdir src\app\api\admin\fields 2>nul
mkdir src\app\api\admin\levels 2>nul
mkdir src\app\api\admin\students 2>nul
mkdir src\app\api\communities 2>nul
mkdir src\app\api\auth\registration-fields 2>nul

echo.
echo Creating API files...

REM This batch file approach is limited for large files, so I'll provide manual instructions instead
echo.
echo ❌ Batch file approach is limited for creating large TypeScript files.
echo.
echo Please use one of the following options:
echo.
echo Option 1: Use Git Bash (if installed)
echo   1. Right-click and select "Git Bash Here"
echo   2. Run: bash setup-api-files.sh
echo.
echo Option 2: Use the Node.js setup script
echo   1. Run: node setup-all.js
echo.
echo Option 3: Manual creation
echo   Copy the content from the documentation below and create each file manually
echo   OR run the TypeScript-based setup shown in the next instructions.
echo.
pause
