@echo off
REM Authenticate the Agent OS "brain" one time, using the claude CLI on PATH
REM (install it with:  npm install -g @anthropic-ai/claude-code ).
where claude >nul 2>nul
if %errorlevel%==0 (
  echo A browser will open. Log in with your Claude subscription, then close this window.
  echo.
  claude setup-token
  echo.
  pause
  exit /b 0
)

echo The 'claude' command was not found on your PATH.
echo Install it first, then run this again:
echo.
echo     npm install -g @anthropic-ai/claude-code
echo.
pause
exit /b 1
