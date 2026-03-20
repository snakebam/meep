@echo off
echo Starting VWO Learning Platform...
echo.

:: First-time setup: if not a git repo, clone it properly
if not exist ".git" (
    echo First-time setup — downloading app...
    cd ..
    ren meep meep-old
    git clone https://github.com/snakebam/meep.git meep
    :: Copy uploads folder from old install if it existed
    if exist "meep-old\uploads" (
        xcopy /E /I /Y "meep-old\uploads" "meep\uploads"
    )
    rmdir /S /Q meep-old
    cd meep
    echo.
)

:: Auto-update from GitHub
echo Checking for updates...
git pull
echo.

:: Create .env if missing
if not exist ".env" (
    echo Creating config file...
    (
        echo VITE_SUPABASE_URL=https://aorbstadcwyijinhdpzn.supabase.co
        echo VITE_SUPABASE_ANON_KEY=sb_publishable_KcP423K5D3ZdLCpu_0cgmw_hPTuQtpQ
        echo VITE_APP_PASSWORD=3333PYwz
    ) > .env
    echo.
)

:: Install/update dependencies
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    echo.
)

echo Opening in browser...
start http://localhost:5173

echo Starting dev server...
npm run dev
