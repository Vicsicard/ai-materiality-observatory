# Test Frontend Runtime
Write-Host "=== Testing Frontend (/) ==="
try {
    $response = Invoke-WebRequest -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/' -Method GET
    Write-Host "Status Code:" $response.StatusCode
    Write-Host "Server:" $response.Headers['Server']
    Write-Host "X-Powered-By:" $response.Headers['X-Powered-By']
    Write-Host "CF-Ray:" $response.Headers['CF-Ray']
    Write-Host "Content-Length:" $response.Headers['Content-Length']
    Write-Host "Response starts with:" $response.Content.Substring(0, 200)
} catch {
    Write-Host "Frontend Error:" $_.Exception.Message
}

Write-Host "`n=== Testing Process Article API (/api/process-article) ==="
try {
    $body = @{ url = 'https://www.aljazeera.com/economy/2026/6/2/google-parent-alphabet-to-sell-80bn-in-stock-to-fund-ai-plans' } | ConvertTo-Json
    $response = Invoke-WebRequest -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/process-article' -Method POST -ContentType 'application/json' -Body $body
    Write-Host "Status Code:" $response.StatusCode
    Write-Host "Server:" $response.Headers['Server']
    Write-Host "X-Powered-By:" $response.Headers['X-Powered-By']
    Write-Host "CF-Ray:" $response.Headers['CF-Ray']
    Write-Host "Response starts with:" $response.Content.Substring(0, 200)
} catch {
    Write-Host "Process Article API Error:" $_.Exception.Message
}

Write-Host "`n=== Testing Observations API (/api/observations) ==="
try {
    $response = Invoke-WebRequest -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/observations' -Method GET
    Write-Host "Status Code:" $response.StatusCode
    Write-Host "Server:" $response.Headers['Server']
    Write-Host "X-Powered-By:" $response.Headers['X-Powered-By']
    Write-Host "CF-Ray:" $response.Headers['CF-Ray']
    Write-Host "Response starts with:" $response.Content.Substring(0, 200)
} catch {
    Write-Host "Observations API Error:" $_.Exception.Message
}

Write-Host "`n=== Testing Observation Detail (/observations/event-detected) ==="
try {
    $response = Invoke-WebRequest -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/observations/event-detected' -Method GET
    Write-Host "Status Code:" $response.StatusCode
    Write-Host "Server:" $response.Headers['Server']
    Write-Host "X-Powered-By:" $response.Headers['X-Powered-By']
    Write-Host "CF-Ray:" $response.Headers['CF-Ray']
    Write-Host "Response starts with:" $response.Content.Substring(0, 200)
} catch {
    Write-Host "Observation Detail Error:" $_.Exception.Message
}
