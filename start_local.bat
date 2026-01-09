@echo off
echo Starting Meganalise Pro Local Environment...
echo.

cd client

:: Check if node_modules exists, install if not
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

:: Start the dev server
echo Starting Vite Dev Server...
call npm run dev -- --open
