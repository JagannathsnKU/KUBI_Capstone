#!/bin/bash
echo "========================================"
echo "   Starting KUBI Dashboard Backends"
echo "========================================"
echo ""
echo "Starting Node.js Backend (port 3003)..."
cd plaid_node
npm start &
NODE_PID=$!
echo ""
echo "Starting Python Flask Backend (port 5000)..."
python generate_quests_api.py &
PYTHON_PID=$!
echo ""
echo "========================================"
echo "   Both backends are running!"
echo "========================================"
echo ""
echo "Node.js Backend: http://localhost:3003 (PID: $NODE_PID)"
echo "Python Backend:  http://localhost:5000 (PID: $PYTHON_PID)"
echo ""
echo "Press Ctrl+C to stop both servers"
wait

