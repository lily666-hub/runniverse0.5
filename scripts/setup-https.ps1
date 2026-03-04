# Setup HTTPS certificates using mkcert for local development
param(
  [string]$CertDir = "certs",
  [string]$ServerHost = "localhost",
  [string]$Port = "5173"
)

Write-Host "Starting local HTTPS certificate setup..." -ForegroundColor Cyan

function Ensure-Mkcert {
  $mkcertCmd = Get-Command mkcert -ErrorAction SilentlyContinue
  if (-not $mkcertCmd) {
    Write-Host "mkcert not found. Please install mkcert first." -ForegroundColor Red
    Write-Host "Windows install via Chocolatey: choco install mkcert" -ForegroundColor Yellow
    exit 1
  }
  $version = & mkcert -version
  Write-Host "mkcert detected: $version" -ForegroundColor Green
}

function Ensure-CertDir($dir) {
  if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir | Out-Null
    Write-Host "Created directory: $dir" -ForegroundColor Green
  } else {
    Write-Host "Directory exists: $dir" -ForegroundColor Green
  }
}

function Ensure-LocalCA {
  Write-Host "Installing local CA (mkcert -install)..." -ForegroundColor Cyan
  & mkcert -install | Out-Null
  Write-Host "Local CA installed." -ForegroundColor Green
}

function Generate-Cert($dir) {
  $certPath = Join-Path $dir "localhost.pem"
  $keyPath  = Join-Path $dir "localhost-key.pem"

  if ((Test-Path $certPath) -and (Test-Path $keyPath)) {
    Write-Host "Certificate already exists: $certPath" -ForegroundColor Yellow
    return @{ cert = $certPath; key = $keyPath }
  }

  Write-Host "Generating certificate for hosts: localhost, 127.0.0.1, ::1" -ForegroundColor Cyan
  Push-Location $dir
  & mkcert localhost 127.0.0.1 ::1 | Out-Null
  Pop-Location

  if ((Test-Path $certPath) -and (Test-Path $keyPath)) {
    Write-Host "Certificate generated successfully." -ForegroundColor Green
    return @{ cert = $certPath; key = $keyPath }
  } else {
    Write-Host "Certificate generation failed." -ForegroundColor Red
    exit 1
  }
}

Ensure-Mkcert
Ensure-CertDir -dir $CertDir
Ensure-LocalCA
$paths = Generate-Cert -dir $CertDir

Write-Host "Vite config example:" -ForegroundColor Cyan
Write-Host "server: { https: { key: fs.readFileSync('$($paths.key)'), cert: fs.readFileSync('$($paths.cert)') }, host: '$ServerHost', port: $Port }" -ForegroundColor Green
Write-Host "Done. Restart dev server and check Chrome lock icon." -ForegroundColor Green