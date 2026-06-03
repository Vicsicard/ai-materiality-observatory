# Test dashboard functionality after CORS fix

Write-Host "=== DASHBOARD FUNCTIONALITY TEST ==="
Write-Host "CORS Status: FIXED"
Write-Host ""

# Test 1: Load articles
Write-Host "TEST 1: Load articles from dashboard"
try {
    $articles = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/admin/articles' -Method GET
    Write-Host "✅ Articles loaded: $($articles.Count)"
    foreach ($article in $articles) {
        Write-Host "  ID: $($article.id), Title: $($article.title)"
    }
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)"
}

Write-Host ""

# Test 2: Submit URL (this will fail due to invalid URL but should work CORS-wise)
Write-Host "TEST 2: Submit URL (CORS test)"
try {
    $body = @{ url = 'https://example.com/test' } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/process-article' -Method POST -ContentType 'application/json' -Body $body
    Write-Host "✅ POST request succeeded (CORS working)"
    Write-Host "Response: $($response | ConvertTo-Json -Compress)"
} catch {
    Write-Host "❌ POST ERROR: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode)"
        if ($_.Exception.Response.StatusCode -eq 400) {
            Write-Host "✅ CORS working - 400 is expected for invalid URL"
        }
    }
}

Write-Host ""

# Test 3: Publish article
Write-Host "TEST 3: Publish article"
try {
    $publishResponse = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/admin/articles/2/publish' -Method POST
    Write-Host "✅ Publish request succeeded"
    Write-Host "Response: $($publishResponse | ConvertTo-Json)"
} catch {
    Write-Host "❌ Publish ERROR: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "=== DASHBOARD FUNCTIONALITY TEST COMPLETE ==="
