@echo off
echo Setting up Git repository...
echo.

REM Initialize Git
git init

REM Add remote
git remote add origin https://github.com/Jukyung94/navigation-app.git

REM Add all files
git add .

REM Commit
git commit -m "Initial commit: Emergency Exit Compass app with real-time navigation"

REM Push to main branch
git push -u origin main

echo.
echo Done! Your project has been pushed to GitHub.
pause
