# [[ARABIC_HEADER]] هذا الملف (scripts/install-mongodb.ps1) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

# MongoDB Installation Script for Windows
Write-Host "Installing MongoDB Community Edition..."

# Download MongoDB
$mongoUrl = "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.5-signed.msi"
$installerPath = "$env:TEMP\mongodb.msi"

Write-Host "Downloading MongoDB..."
Invoke-WebRequest -Uri $mongoUrl -OutFile $installerPath

Write-Host "Installing MongoDB..."
Start-Process msiexec.exe -ArgumentList "/i `"$installerPath`" /quiet /norestart" -Wait

# Add MongoDB to PATH
$mongoPath = "C:\Program Files\MongoDB\Server\7.0\bin"
$env:PATH += ";$mongoPath"
[Environment]::SetEnvironmentVariable("PATH", $env:PATH, "Machine")

Write-Host "Creating MongoDB data directory..."
New-Item -ItemType Directory -Force -Path "C:\data\db"

Write-Host "Starting MongoDB service..."
Start-Service -Name "MongoDB"

Write-Host "MongoDB installation completed!"
Write-Host "MongoDB is running on mongodb://localhost:27017"

# Clean up
Remove-Item $installerPath -Force
