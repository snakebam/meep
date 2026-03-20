@echo off
echo Starting VWO Learning Platform...
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

:: Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    echo.
)

echo Opening in browser...
start http://localhost:5173

echo Starting dev server...
npm run dev
