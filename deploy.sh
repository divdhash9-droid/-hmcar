#!/bin/bash
# [[ARABIC_HEADER]] هذا الملف (deploy.sh) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

# HM CAR Deployment Script
# This script automates the deployment process

echo "🚀 Starting HM CAR Deployment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Login to Vercel
echo "🔐 Logging into Vercel..."
vercel login

# Deploy to production
echo "📦 Deploying to production..."
vercel --prod

echo "✅ Deployment completed!"
echo "🌐 Your app should be available at: https://-hmcar.vercel.app"
echo "📋 Don't forget to run the checklist in DEPLOYMENT_CHECKLIST.md"
