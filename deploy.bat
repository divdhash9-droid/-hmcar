@echo off
REM HM CAR Deployment Script for Windows

echo 🚀 Starting HM CAR Deployment...

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Vercel CLI not found. Installing...
    npm install -g vercel
)

REM Login to Vercel
echo 🔐 Logging into Vercel...
vercel login

REM Deploy to production
echo 📦 Deploying to production...
vercel --prod

echo ✅ Deployment completed!
echo 🌐 Your app should be available at: https://-hmcar.vercel.app
echo 📋 Don't forget to run the checklist in DEPLOYMENT_CHECKLIST.md

pause
