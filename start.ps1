param(
  [string]$DbPath = "$PSScriptRoot\data"
)

$ErrorActionPreference = "Stop"
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

if (-not (Test-Path $DbPath)) {
  New-Item -ItemType Directory -Path $DbPath -Force | Out-Null
}

Write-Host "================================" -ForegroundColor Cyan
Write-Host "   SQA Ticket Tracker Launcher  " -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 1. Start MongoDB
Write-Host "[1/3] Starting MongoDB..." -ForegroundColor Yellow
$mongoLog = "$rootDir\data\mongod.log"
$mongoJob = Start-Job -ScriptBlock {
  param($path, $log)
  mongod --dbpath $path 2>&1 | Out-File -FilePath $log -Encoding utf8 -Append
} -ArgumentList $DbPath, $mongoLog

# Wait a few seconds for Mongo to initialize
Start-Sleep -Seconds 3

# Check if Mongo is actually running
$mongoRunning = Get-Process mongod -ErrorAction SilentlyContinue
if (-not $mongoRunning) {
  Write-Host "  MongoDB failed to start. Check: $mongoLog" -ForegroundColor Red
  Write-Host "  Make sure the directory '$DbPath' exists." -ForegroundColor Red
  exit 1
}
Write-Host "  MongoDB started successfully (PID: $($mongoRunning.Id))" -ForegroundColor Green

# 2. Start Backend
Write-Host "[2/3] Starting Backend (port 5000)..." -ForegroundColor Yellow
$serverJob = Start-Job -ScriptBlock {
  Set-Location "$using:rootDir\server"
  npm.cmd run dev 2>&1
}
Start-Sleep -Seconds 4
Write-Host "  Backend server starting..." -ForegroundColor Green

# 3. Start Frontend
Write-Host "[3/3] Starting Frontend (port 3000)..." -ForegroundColor Yellow
$clientJob = Start-Job -ScriptBlock {
  Set-Location "$using:rootDir\client"
  npm.cmd run dev 2>&1
}
Start-Sleep -Seconds 2
Write-Host "  Frontend server starting..." -ForegroundColor Green

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  All services launched!        " -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Frontend : http://localhost:3000" -ForegroundColor White
Write-Host "  Backend  : http://localhost:5000" -ForegroundColor White
Write-Host "  MongoDB  : mongodb://localhost:27017" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Magenta
Write-Host ""

# Monitor jobs and show their output
try {
  while ($true) {
    $allStopped = $true
    foreach ($job in @($mongoJob, $serverJob, $clientJob)) {
      $jb = $job | Receive-Job
      if ($jb) { Write-Host $jb -ForegroundColor Gray }
      if ($job.State -eq 'Running') { $allStopped = $false }
    }
    if ($allStopped) { break }
    Start-Sleep -Seconds 2
  }
}
finally {
  Write-Host "`nShutting down all services..." -ForegroundColor Yellow
  $mongoJob | Stop-Job -PassThru | Remove-Job
  $serverJob | Stop-Job -PassThru | Remove-Job
  $clientJob | Stop-Job -PassThru | Remove-Job
  Get-Process mongod -ErrorAction SilentlyContinue | Stop-Process -Force
  Write-Host "All services stopped." -ForegroundColor Green
}
