@echo off
echo Starting VWO Learning Platform...
echo.

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
