# Get actual response content for analysis
try {
    $response = Invoke-WebRequest -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/' -Method GET
    Write-Host "=== Frontend (/) Response ==="
    Write-Host "Status:" $response.StatusCode
    Write-Host "Server:" $response.Headers['Server']
    Write-Host "CF-Ray:" $response.Headers['CF-Ray']
    Write-Host "Content:" $response.Content
} catch {
    Write-Host "Frontend Error:" $_.Exception.Message
}

Write-Host "`n=== Process Article API (/api/process-article) ==="
try {
    $body = @{ url = 'https://www.aljazeera.com/economy/2026/6/2/google-parent-alphabet-to-sell-80bn-in-stock-to-fund-ai-plans' } | ConvertTo-Json
    $response = Invoke-WebRequest -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/process-article' -Method POST -ContentType 'application/json' -Body $body
    Write-Host "Status:" $response.StatusCode
    Write-Host "Server:" $response.Headers['Server']
    Write-Host "CF-Ray:" $response.Headers['CF-Ray']
    Write-Host "Content:" $response.Content.Substring(0, 300)
} catch {
    Write-Host "Process Article Error:" $_.Exception.Message
}

Write-Host "`n=== Observations API (/api/observations) ==="
try {
    $response = Invoke-WebRequest -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/observations' -Method GET
    Write-Host "Status:" $response.StatusCode
    Write-Host "Server:" $response.Headers['Server']
    Write-Host "CF-Ray:" $response.Headers['CF-Ray']
    Write-Host "Content:" $response.Content
} catch {
    Write-Host "Observations Error:" $_.Exception.Message
}

Write-Host "`n=== Observation Detail (/observations/event-detected) ==="
try {
    $response = Invoke-WebRequest -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/observations/event-detected' -Method GET
    Write-Host "Status:" $response.StatusCode
    Write-Host "Server:" $response.Headers['Server']
    Write-Host "CF-Ray:" $response.Headers['CF-Ray']
    Write-Host "Content:" $response.Content
} catch {
    Write-Host "Observation Detail Error:" $_.Exception.Message
}
