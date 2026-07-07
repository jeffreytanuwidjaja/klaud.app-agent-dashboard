@echo off
REM Start the Klaud / Agent OS dashboard. Double-click this file; it opens
REM http://localhost:4317 for you. Close this window to stop the server.
cd /d "%~dp0dashboard"

REM Free port 4317 first — kill any stale server still running old code,
REM otherwise the browser loads new files against an outdated backend.
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":4317 " ^| findstr LISTENING') do (
  echo Stopping a previous Klaud server (PID %%p)...
  taskkill /PID %%p /F >nul 2>nul
)

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
