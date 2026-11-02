param(
  [string]$DbPath = "$PSScriptRoot\data",
  [int]$MongoPort = 27017
)

$ErrorActionPreference = "Stop"
$rootDir = $PSScriptRoot

function Test-PortListening([int]$Port) {
  $client = New-Object System.Net.Sockets.TcpClient
  try {
    $client.Connect("127.0.0.1", $Port)
    return $true
  } catch {
    return $false
  } finally {
    $client.Close()
  }
}

# Locate npm (npm.cmd on a standard install, npm.exe under some Node version managers such as nvm-windows)
$npmCmd = Get-Command npm.cmd, npm.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $npmCmd) {
  Write-Host "npm was not found on PATH. Install Node.js and try again." -ForegroundColor Red
  exit 1
}
$npmPath = $npmCmd.Source

Write-Host "================================" -ForegroundColor Cyan
Write-Host "   SQA Ticket Tracker Launcher  " -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$mongoProc = $null   # only set when this script starts its own mongod
$serverJob = $null
$clientJob = $null

try {
  # 1. MongoDB
  Write-Host "[1/3] Starting MongoDB..." -ForegroundColor Yellow
  if (Test-PortListening $MongoPort) {
    Write-Host "  MongoDB is already running on port $MongoPort - using it (data path ignored)." -ForegroundColor Green
  } else {
    $mongod = Get-Command mongod -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $mongod) {
      Write-Host "  mongod was not found on PATH. Install MongoDB or start it yourself." -ForegroundColor Red
      exit 1
    }
    if (-not (Test-Path $DbPath)) {
      New-Item -ItemType Directory -Path $DbPath -Force | Out-Null
    }
    $mongoLog = Join-Path $DbPath "mongod.log"
    $mongoProc = Start-Process -FilePath $mongod.Source `
      -ArgumentList @("--dbpath", "`"$DbPath`"", "--port", $MongoPort, "--logpath", "`"$mongoLog`"") `
      -WindowStyle Hidden -PassThru

    $ready = $false
    for ($i = 0; $i -lt 20; $i++) {
      Start-Sleep -Milliseconds 500
      if ($mongoProc.HasExited) { break }
      if (Test-PortListening $MongoPort) { $ready = $true; break }
    }
    if (-not $ready) {
      Write-Host "  MongoDB failed to start. Check: $mongoLog" -ForegroundColor Red
      exit 1
    }
    Write-Host "  MongoDB started (PID: $($mongoProc.Id), data: $DbPath)" -ForegroundColor Green
  }

  # 2. Backend
  Write-Host "[2/3] Starting Backend (port 5000)..." -ForegroundColor Yellow
  $serverJob = Start-Job -ScriptBlock {
    param($dir, $npm)
    Set-Location $dir
    & $npm run dev 2>&1
  } -ArgumentList "$rootDir\server", $npmPath
  Start-Sleep -Seconds 4
  Write-Host "  Backend server starting..." -ForegroundColor Green

  # 3. Frontend
  Write-Host "[3/3] Starting Frontend (port 3000)..." -ForegroundColor Yellow
  $clientJob = Start-Job -ScriptBlock {
    param($dir, $npm)
    Set-Location $dir
    & $npm run dev 2>&1
  } -ArgumentList "$rootDir\client", $npmPath
  Start-Sleep -Seconds 2
  Write-Host "  Frontend server starting..." -ForegroundColor Green

  Write-Host ""
  Write-Host "================================" -ForegroundColor Cyan
  Write-Host "  All services launched!        " -ForegroundColor Cyan
  Write-Host "================================" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "  Frontend : http://localhost:3000" -ForegroundColor White
  Write-Host "  Backend  : http://localhost:5000" -ForegroundColor White
  Write-Host "  MongoDB  : mongodb://localhost:$MongoPort" -ForegroundColor White
  Write-Host ""
  Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Magenta
  Write-Host ""

  # Monitor jobs and show their output. A failing job is reported, not fatal to the launcher.
  $reported = @{}
  while ($true) {
    $anyRunning = $false
    foreach ($entry in @(@{ Name = "Backend"; Job = $serverJob }, @{ Name = "Frontend"; Job = $clientJob })) {
      $job = $entry.Job
      $output = Receive-Job $job -ErrorAction Continue 2>&1
      if ($output) { Write-Host ($output | Out-String).TrimEnd() -ForegroundColor Gray }
      if ($job.State -eq 'Running') {
        $anyRunning = $true
      } elseif (-not $reported[$entry.Name]) {
        $reported[$entry.Name] = $true
        Write-Host "$($entry.Name) stopped unexpectedly (job state: $($job.State))." -ForegroundColor Red
      }
    }
    if (-not $anyRunning) { break }
    Start-Sleep -Seconds 2
  }
}
finally {
  Write-Host "`nShutting down all services..." -ForegroundColor Yellow
  foreach ($job in @($serverJob, $clientJob)) {
    if ($job) { $job | Stop-Job -PassThru -ErrorAction SilentlyContinue | Remove-Job -Force -ErrorAction SilentlyContinue }
  }
  # Only stop a MongoDB this script started; never touch an existing instance or Windows service.
  if ($mongoProc -and -not $mongoProc.HasExited) {
    Stop-Process -Id $mongoProc.Id -Force -ErrorAction SilentlyContinue
  }
  Write-Host "All services stopped." -ForegroundColor Green
}
