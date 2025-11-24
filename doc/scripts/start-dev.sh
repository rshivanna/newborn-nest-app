#!/bin/bash

echo "========================================"
echo "Starting Newborn Nest Application"
echo "========================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

# Check if data folder exists
if [ ! -d "data" ]; then
    echo "Creating data folder..."
    mkdir -p data
fi

echo ""
echo "Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

echo "Waiting for backend to start..."
sleep 3

echo "Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "Servers are running..."
echo "Backend:  http://localhost:5000"
echo "Frontend: http://localhost:8080"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop all servers"

# Trap Ctrl+C and kill both processes
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT

# Wait for processes
wait
