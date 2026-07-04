@echo off
REM Start the Klaud / Agent OS dashboard. Double-click this file, then open
REM http://localhost:4317 in your browser. Close this window to stop the server.
cd /d "%~dp0dashboard"

if not exist node_modules (
  echo First run: installing dependencies...
  call npm install
  echo.
)

echo ============================================================
echo   Klaud dashboard starting...
echo   Your browser will open http://localhost:4317 shortly.
echo   Keep this window open. Close it to stop the server.
echo ============================================================
echo.

REM Open the browser once the server has had a moment to start (detached).
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 4; Start-Process 'http://localhost:4317'"

call npm start

echo.
echo Server stopped.
pause
