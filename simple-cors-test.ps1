# Simple CORS test
$response = Invoke-WebRequest -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/process-article' -Method OPTIONS
Write-Host "Status: $($response.StatusCode)"
Write-Host "CORS Headers found:"
$response.Headers | ForEach-Object {
    if ($_.Key -like "*Access-Control*") {
        Write-Host "$($_.Key): $($_.Value)"
    }
}
