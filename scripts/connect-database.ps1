# Connect Supabase DB (liberty-aog-church) to Render churchapi service.
#
# 1) In Supabase: Project Settings → Database → Reset database password
# 2) Run:
#    $env:RENDER_API_KEY = "rnd_..."
#    $env:SUPABASE_DB_PASSWORD = "the-password-you-just-set"
#    .\scripts\connect-database.ps1

param(
  [string]$RenderApiKey = $env:RENDER_API_KEY,
  [string]$DbPassword = $env:SUPABASE_DB_PASSWORD,
  [string]$ProjectRef = "kfhnohvhtfxsuvhihlcs",
  [string]$ServiceHint = "churchapi"
)

$ErrorActionPreference = "Stop"

if (-not $RenderApiKey) {
  Write-Error "Set RENDER_API_KEY (Render Dashboard → Account Settings → API Keys)."
}
if (-not $DbPassword) {
  Write-Error "Set SUPABASE_DB_PASSWORD (Supabase → Project Settings → Database → Reset password)."
}

$headers = @{
  Authorization  = "Bearer $RenderApiKey"
  Accept         = "application/json"
  "Content-Type" = "application/json"
}

# Prefer pooler URI for Render (IPv4-friendly)
$databaseUrl = "postgresql://postgres.${ProjectRef}:${DbPassword}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"

Write-Host "Finding Render service matching '$ServiceHint'..."

$serviceId = $null
$serviceName = $null
$cursor = $null

do {
  $uri = "https://api.render.com/v1/services?limit=100"
  if ($cursor) { $uri += "&cursor=$cursor" }
  $page = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get
  foreach ($item in $page) {
    $svc = $item.service
    if (-not $svc) { continue }
    if ($svc.name -like "*$ServiceHint*" -or $svc.serviceDetails.url -like "*churchapi*") {
      $serviceId = $svc.id
      $serviceName = $svc.name
      break
    }
  }
  if ($page.Count -gt 0) { $cursor = $page[-1].cursor } else { $cursor = $null }
} while (-not $serviceId -and $cursor)

if (-not $serviceId) {
  Write-Error "Could not find Render service matching '$ServiceHint'."
}

Write-Host "Found: $serviceName ($serviceId)"

$desired = [ordered]@{
  DATABASE_URL           = $databaseUrl
  NODE_ENV               = "production"
  CHURCH_NAME            = "Liberty Assemblies of God"
  APP_URL                = "https://church-ae7v.onrender.com"
  BOOTSTRAP_ADMIN_EMAIL  = "dnkansah29@gmail.com"
  BOOTSTRAP_ADMIN_PASSWORD = "ChurchAdmin2026!"
}

$existing = @{}
$envPage = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$serviceId/env-vars?limit=100" -Headers $headers -Method Get
foreach ($row in $envPage) {
  if ($row.envVar) { $existing[$row.envVar.key] = $row.envVar.id }
}

foreach ($entry in $desired.GetEnumerator()) {
  $key = $entry.Key
  $value = $entry.Value
  if ($existing.ContainsKey($key)) {
    $body = @{ value = $value } | ConvertTo-Json
    Invoke-RestMethod -Uri "https://api.render.com/v1/services/$serviceId/env-vars/$($existing[$key])" -Headers $headers -Method Put -Body $body | Out-Null
    Write-Host "Updated $key"
  } else {
    $body = @{ key = $key; value = $value } | ConvertTo-Json
    Invoke-RestMethod -Uri "https://api.render.com/v1/services/$serviceId/env-vars" -Headers $headers -Method Post -Body $body | Out-Null
    Write-Host "Created $key"
  }
}

$deployBody = @{ clearCache = "clear" } | ConvertTo-Json
$deploy = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$serviceId/deploys" -Headers $headers -Method Post -Body $deployBody
Write-Host "Deploy started: $($deploy.id)"
Write-Host "Wait ~2 minutes, then open: https://churchapi-o3pk.onrender.com/api/health"
Write-Host "Login: dnkansah29@gmail.com / ChurchAdmin2026!"
