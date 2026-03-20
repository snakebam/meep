@echo off
echo ========================================
echo   VWO Leerplatform - Opstarten...
echo ========================================
echo.

:: First-time setup: connect this folder to GitHub (no cloning!)
if not exist ".git" (
    echo Eerste keer opstarten - git instellen...
    git init
    git remote add origin https://github.com/snakebam/meep.git
    git fetch origin
    git reset origin/master
    echo.
)

:: Auto-update from GitHub
echo Controleren op updates...
git pull origin master
echo.

:: Create .env if missing
if not exist ".env" (
    echo Config bestand aanmaken...
    (
        echo VITE_SUPABASE_URL=https://aorbstadcwyijinhdpzn.supabase.co
        echo VITE_SUPABASE_ANON_KEY=sb_publishable_KcP423K5D3ZdLCpu_0cgmw_hPTuQtpQ
        echo VITE_APP_PASSWORD=3333PYwz
    ) > .env
    echo.
)

:: Install/update dependencies
if not exist "node_modules" (
    echo Dependencies installeren dit duurt even...
    npm install
    echo.
)

echo Browser openen...
start http://localhost:5173

echo Server starten...
npm run dev
