$ErrorActionPreference = 'Stop'

$wordsPath = Resolve-Path (Join-Path $PSScriptRoot '..\..\2027\sources\words.txt')
$words = @(Get-Content -Encoding utf8 $wordsPath | ForEach-Object { $_.Trim() } | Where-Object { $_ })
if ($words.Count -eq 0) {
  throw "No words found in $wordsPath"
}

$username = Read-Host 'Username'
if ([string]::IsNullOrWhiteSpace($username)) {
  throw 'Username cannot be empty.'
}

$securePassword = Read-Host 'Password' -AsSecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
  $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
  $body = ConvertTo-Json -InputObject @{ username = $username.Trim(); password = $password; words = $words } -Depth 3 -Compress
  $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)
  $result = Invoke-RestMethod `
    -Method Post `
    -Uri 'https://seeduserwords-set3zd5v2q-uc.a.run.app' `
    -ContentType 'application/json; charset=utf-8' `
    -Body $bodyBytes
}
finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
}

if (-not $result.success) {
  throw 'The word seeding API did not report success.'
}

Write-Output "Seeded $($result.count) word counters for $($result.user)."
