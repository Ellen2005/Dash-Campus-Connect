# Dash Demo Setup Script
# Run this before your presentation to set everything up

Write-Host "========================================"
Write-Host "  Dash Demo Setup"
Write-Host "========================================"
Write-Host ""

# Check .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "ERROR: .env.local not found! Copy .env.example to .env.local first."
    exit 1
}

Write-Host "Step 1: Installing dependencies..."
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "FAILED"; exit 1 }

Write-Host "Step 2: Generating Prisma client..."
npx prisma generate
if ($LASTEXITCODE -ne 0) { Write-Host "FAILED"; exit 1 }

Write-Host "Step 3: Pushing schema to database..."
npx prisma db push
if ($LASTEXITCODE -ne 0) { Write-Host "FAILED"; exit 1 }

Write-Host "Step 4: Seeding demo data..."
npx tsx prisma/seed.ts
if ($LASTEXITCODE -ne 0) { Write-Host "FAILED"; exit 1 }

Write-Host ""
Write-Host "========================================"
Write-Host "  Setup Complete!"
Write-Host "========================================"
Write-Host ""
Write-Host "Starting dev server in DEMO mode..."
Write-Host "  - Rate limits disabled (9999 req/min)"
Write-Host "  - Session keepalive every 5 min"
Write-Host "  - Health check at /api/health"
Write-Host ""
Write-Host "Demo accounts (all pre-seeded):"
Write-Host "  Admin:  admin@lourdes.edu / Admin123!"
Write-Host "  Demo:   alice.wonder@lourdes.edu / Demo123!"
Write-Host "  ClassRep: john.classrep@lourdes.edu / Demo123!"
Write-Host ""
Write-Host "========================================"

# Start in demo mode
$env:DEMO_MODE = "true"
$env:RATE_LIMIT_MAX = "9999"
npx next dev --turbopack -p 9002
