# Local web server for the project (no install needed; uses Windows PowerShell).
#
#   powershell -ExecutionPolicy Bypass -File serve.ps1            # http://localhost:8000
#   powershell -ExecutionPolicy Bypass -File serve.ps1 -Port 8080
#
# Why a server: the page reads the shared data files in data/shared/ with fetch(),
# which browsers block for pages opened from a file. Map tiles also need a normal
# Referer, which file:// pages don't send.
# "/" opens SPIRO.html. With Python, "python -m http.server 8000" works too.
param([int]$Port = 8000)
$root = (Resolve-Path $PSScriptRoot).Path
$types = @{
  ".html" = "text/html; charset=utf-8"; ".js" = "text/javascript; charset=utf-8"; ".css" = "text/css; charset=utf-8"
  ".json" = "application/json; charset=utf-8"; ".csv" = "text/csv; charset=utf-8"; ".md" = "text/markdown; charset=utf-8"
  ".svg" = "image/svg+xml"; ".png" = "image/png"; ".jpg" = "image/jpeg"; ".ico" = "image/x-icon"
}
# Folders that may be listed, so the page can tell a missing data file from a broken one.
$listable = '^(data/shared|tests/fixtures/[a-z0-9-]+)/?$'
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$Port/  (Ctrl+C to stop)"
try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $res = $ctx.Response
    try {
      $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart("/")
      if ($rel -eq "") { $rel = if (Test-Path (Join-Path $root "index.html")) { "index.html" } else { "SPIRO.html" } }
      $path = [IO.Path]::GetFullPath((Join-Path $root $rel))
      # Only files inside this folder; never .env files, hidden folders or backups.
      $blocked = -not $path.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -or $rel -match '(^|/)\.' -or $rel -match '\.env' -or $rel -match '^backup(/|$)'
      $bytes = $null
      if (-not $blocked -and (Test-Path $path -PathType Container)) {
        if ($rel.TrimEnd("/") -match $listable) {
          $names = Get-ChildItem $path -File | Where-Object { $_.Name -notmatch '^\.' -and $_.Name -notmatch '\.env' } | ForEach-Object { $n = [Uri]::EscapeDataString($_.Name); "<li><a href=""$n"">$([Net.WebUtility]::HtmlEncode($_.Name))</a></li>" }
          $res.ContentType = "text/html; charset=utf-8"; $res.Headers.Add("Cache-Control", "no-store")
          $bytes = [Text.Encoding]::UTF8.GetBytes("<!doctype html><title>Index of /$rel</title><ul>" + ($names -join "") + "</ul>")
        } elseif (Test-Path (Join-Path $path "index.html")) { $path = Join-Path $path "index.html" }
        else { $blocked = $true }
      }
      if ($null -eq $bytes) {
        if ($blocked -or -not (Test-Path $path -PathType Leaf)) {
          $res.StatusCode = 404; $bytes = [Text.Encoding]::UTF8.GetBytes("Not found")
        } else {
          $ext = [IO.Path]::GetExtension($path).ToLower()
          $res.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { "application/octet-stream" }
          $res.Headers.Add("Cache-Control", "no-cache")
          $bytes = [IO.File]::ReadAllBytes($path)
        }
      }
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
      Write-Host ("{0} {1} {2}" -f (Get-Date -Format "HH:mm:ss"), $res.StatusCode, $ctx.Request.Url.AbsolutePath)
    } catch { Write-Warning $_ } finally { $res.Close() }
  }
} finally { $listener.Stop() }
