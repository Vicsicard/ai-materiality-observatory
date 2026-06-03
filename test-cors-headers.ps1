# Test CORS headers in detail

Write-Host "=== CORS HEADERS VERIFICATION ==="
Write-Host ""

# Test OPTIONS /api/process-article with detailed headers
Write-Host "TEST 1: OPTIONS /api/process-article - Detailed Headers"
try {
    $response = Invoke-WebRequest -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/process-article' -Method OPTIONS
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "All Headers:"
    $response.Headers | ForEach-Object {
        Write-Host "  $($_.Key): $($_.Value)"
    }
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)"
}

Write-Host ""

# Test POST /api/process-article to verify full CORS flow
Write-Host "TEST 2: POST /api/process-article - Full CORS Flow"
try {
    $body = @{ url = 'https://example.com/test' } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/process-article' -Method POST -ContentType 'application/json' -Body $body
    Write-Host "✅ POST request successful - CORS working"
    Write-Host "Response: $($response | ConvertTo-Json -Compress)"
} catch {
    Write-Host "❌ POST ERROR: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode)"
        Write-Host "This indicates CORS preflight worked but main request failed"
    }
}

Write-Host ""
Write-Host "=== CORS HEADERS VERIFICATION COMPLETE ==="
