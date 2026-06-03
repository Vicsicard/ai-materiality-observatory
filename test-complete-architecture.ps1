# Test complete architecture: Vercel Frontend + Cloudflare Worker API + D1

Write-Host "=== Testing Cloudflare Worker API Endpoints ==="

# Test 1: GET /api/observations
Write-Host "`n1. Testing GET /api/observations"
try {
    $response = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/observations' -Method GET
    Write-Host "SUCCESS: Observations API working"
    Write-Host "Observations count:" $response.Count
    if ($response.Count -gt 0) {
        Write-Host "First observation ID:" $response[0].id
        Write-Host "First observation title:" $response[0].title
        Write-Host "First observation slug:" $response[0].slug
    }
} catch {
    Write-Host "FAILED: Observations API error - $($_.Exception.Message)"
}

# Test 2: GET /api/observations/:slug (if we have observations)
Write-Host "`n2. Testing GET /api/observations/:slug"
try {
    $response = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/observations/event-detected' -Method GET
    Write-Host "SUCCESS: Observation detail API working"
    Write-Host "Article ID:" $response.id
    Write-Host "Article title:" $response.title
    Write-Host "Content length:" $response.content.length
} catch {
    Write-Host "FAILED: Observation detail API error - $($_.Exception.Message)"
}

# Test 3: POST /api/process-article (duplicate test)
Write-Host "`n3. Testing POST /api/process-article (duplicate detection)"
try {
    $body = @{ url = 'https://www.aljazeera.com/economy/2026/6/2/google-parent-alphabet-to-sell-80bn-in-stock-to-fund-ai-plans' } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/process-article' -Method POST -ContentType 'application/json' -Body $body
    Write-Host "SUCCESS: Process article API working"
    Write-Host "Status:" $response.status
    Write-Host "Approved:" $response.approved
    if ($response.status -eq "already_exists") {
        Write-Host "Duplicate detection working - Event ID:" $response.eventId
    }
} catch {
    Write-Host "FAILED: Process article API error - $($_.Exception.Message)"
}

Write-Host "`n=== Architecture Verification Complete ==="
