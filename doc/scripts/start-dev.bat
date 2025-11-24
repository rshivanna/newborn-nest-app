@echo off
echo ========================================
echo Starting Newborn Nest Application
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing frontend dependencies...
    call npm install
)

if not exist "backend\node_modules\" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

REM Check if data folder exists
if not exist "data\" (
    echo Creating data folder...
    mkdir data
)

echo.
echo Starting backend server...
start "Backend Server" cmd /k "cd backend && npm start"

timeout /t 3 /nobreak >nul

echo Starting frontend server...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ========================================
echo Servers are starting...
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:8080
echo ========================================
echo.
echo Press Ctrl+C in each window to stop the servers
