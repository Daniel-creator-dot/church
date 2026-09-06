# Configure Intek SMS env vars on the Render API service (churchapi).
# Usage:
#   $env:RENDER_API_KEY = "rnd_..."
#   $env:INTEK_API_KEY = "INTEK_..."   # optional if already in env
#   .\scripts\configure-render-sms.ps1
#
# Or pass keys as parameters (avoid saving in shell history):
#   .\scripts\configure-render-sms.ps1 -RenderApiKey "rnd_..." -IntekApiKey "INTEK_..."

param(
  [string]$RenderApiKey = $env:RENDER_API_KEY,
  [string]$IntekApiKey = $env:INTEK_API_KEY,
  [string]$ServiceHint = "churchapi",
  [switch]$SkipDeploy
)

$ErrorActionPreference = "Stop"

if (-not $RenderApiKey) {
  Write-Error @"
RENDER_API_KEY is required.
Get one from Render Dashboard -> Account Settings -> API Keys, then run:
  `$env:RENDER_API_KEY = 'rnd_...'
  .\scripts\configure-render-sms.ps1
"@
}

if (-not $IntekApiKey) {
  Write-Error "INTEK_API_KEY is required (set `$env:INTEK_API_KEY or pass -IntekApiKey)."
}

$headers = @{
  Authorization = "Bearer $RenderApiKey"
  Accept        = "application/json"
  "Content-Type" = "application/json"
}

$desired = [ordered]@{
  MESSAGING_PROVIDER = "intek"
  SMS_ENABLED        = "true"
  INTEK_API_KEY      = $IntekApiKey
  INTEK_SENDER       = "mychurch"
  INTEK_API_URL      = "https://www.inteksms.top/api/v1"
  CHURCH_NAME        = "Liberty Assemblies of God"
  APP_URL            = "https://church-ae7v.onrender.com"
}

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
    $url = $svc.serviceDetails.url
    $name = $svc.name
    if ($name -like "*$ServiceHint*" -or $url -like "*churchapi*") {
      $serviceId = $svc.id
      $serviceName = $name
      break
    }
  }
  $cursor = $page[-1].cursor
} while (-not $serviceId -and $cursor)

if (-not $serviceId) {
  Write-Error "Could not find a Render service matching '$ServiceHint'. Check your API key and service name."
}

Write-Host "Found service: $serviceName ($serviceId)"

$existing = @{}
$envUri = "https://api.render.com/v1/services/$serviceId/env-vars?limit=100"
$envPage = Invoke-RestMethod -Uri $envUri -Headers $headers -Method Get
foreach ($row in $envPage) {
  $ev = $row.envVar
  if ($ev) { $existing[$ev.key] = $ev.id }
}

$set = @()
foreach ($entry in $desired.GetEnumerator()) {
  $key = $entry.Key
  $value = $entry.Value
  if ($existing.ContainsKey($key)) {
    $id = $existing[$key]
    $body = @{ value = $value } | ConvertTo-Json
    Invoke-RestMethod -Uri "https://api.render.com/v1/services/$serviceId/env-vars/$id" -Headers $headers -Method Put -Body $body | Out-Null
    $set += "$key (updated)"
  } else {
    $body = @{ key = $key; value = $value } | ConvertTo-Json
    Invoke-RestMethod -Uri "https://api.render.com/v1/services/$serviceId/env-vars" -Headers $headers -Method Post -Body $body | Out-Null
    $set += "$key (created)"
  }
}

Write-Host "Environment variables configured:"
$set | ForEach-Object { Write-Host "  - $_" }

if (-not $SkipDeploy) {
  Write-Host "Triggering deploy..."
  $deployBody = @{ clearCache = "do_not_clear" } | ConvertTo-Json
  $deploy = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$serviceId/deploys" -Headers $headers -Method Post -Body $deployBody
  $deployId = $deploy.id
  Write-Host "Deploy started: $deployId"
  Write-Host "Verify after deploy: https://churchapi-o3pk.onrender.com/api/messaging/config"
} else {
  Write-Host "Skipped deploy (-SkipDeploy). Render may still redeploy when env vars change."
}

Write-Host "Done."
