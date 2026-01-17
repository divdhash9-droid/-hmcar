# [[ARABIC_HEADER]] هذا الملف (scripts/clean-project.ps1) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

# Clean Project Script (Windows PowerShell)
# تنظيف جميع البيانات القديمة من المشروع

Write-Host "🧹 Starting project cleanup..." -ForegroundColor Yellow

# 1. Clean node_modules
Write-Host "📦 Cleaning node_modules..." -ForegroundColor Cyan
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
}

# 2. Clean logs directory
Write-Host "📝 Cleaning logs..." -ForegroundColor Cyan
if (Test-Path "logs") {
    Remove-Item -Recurse -Force "logs"
}
New-Item -ItemType Directory -Force -Path "logs" | Out-Null
New-Item -ItemType File -Force -Path "logs\.gitkeep" | Out-Null

# 3. Clean uploads directory
Write-Host "🖼️  Cleaning uploads..." -ForegroundColor Cyan
if (Test-Path "uploads") {
    Get-ChildItem -Path "uploads" -Recurse | Remove-Item -Force -Recurse
}
if (-not (Test-Path "uploads")) {
    New-Item -ItemType Directory -Force -Path "uploads" | Out-Null
}
New-Item -ItemType File -Force -Path "uploads\.gitkeep" | Out-Null

# 4. Clean public images
Write-Host "🖼️  Cleaning public images..." -ForegroundColor Cyan
if (Test-Path "public\images") {
    Get-ChildItem -Path "public\images" -Recurse | Remove-Item -Force -Recurse
}
New-Item -ItemType File -Force -Path "public\images\.gitkeep" | Out-Null

# 5. Clean coverage reports
Write-Host "📊 Cleaning coverage reports..." -ForegroundColor Cyan
if (Test-Path "coverage") {
    Remove-Item -Recurse -Force "coverage"
}
if (Test-Path ".nyc_output") {
    Remove-Item -Recurse -Force ".nyc_output"
}

# 6. Clean PM2 (if installed)
Write-Host "🔧 Cleaning PM2 files..." -ForegroundColor Cyan
if (Get-Command pm2 -ErrorAction SilentlyContinue) {
    pm2 delete all 2>$null
    pm2 save --force 2>$null
}

# 7. Clean Docker (optional)
Write-Host "🐳 Cleaning Docker (optional)..." -ForegroundColor Cyan
if (Get-Command docker -ErrorAction SilentlyContinue) {
    docker-compose down -v 2>$null
}

# 8. Clean temporary files
Write-Host "🗑️  Cleaning temporary files..." -ForegroundColor Cyan
Get-ChildItem -Path . -Include "*.log" -Recurse -File | Remove-Item -Force
Get-ChildItem -Path . -Include ".DS_Store" -Recurse -File | Remove-Item -Force
Get-ChildItem -Path . -Include "Thumbs.db" -Recurse -File | Remove-Item -Force

Write-Host ""
Write-Host "✅ Cleanup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. npm install"
Write-Host "2. Copy .env.example to .env and configure"
Write-Host "3. npm run dev"
