@echo off
echo ========================================
echo   Starting KUBI Dashboard Backends
echo ========================================
echo.
echo Starting Node.js Backend (port 3003)...
start "Node.js Backend" cmd /k "cd plaid_node && npm start"
echo.
echo Starting Python Flask Backend (port 5000)...
start "Python Flask Backend" cmd /k "cd plaid_node && python generate_quests_api.py"
echo.
echo ========================================
echo   Both backends are starting!
echo ========================================
echo.
echo Node.js Backend: http://localhost:3003
echo Python Backend:  http://localhost:5000
echo.
echo Keep both terminal windows open!
echo Press any key to exit this launcher...
pause >nul

