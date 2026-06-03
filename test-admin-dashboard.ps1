# Test Admin Dashboard expansion

Write-Host "=== ADMIN DASHBOARD EXPANSION TEST ==="
Write-Host "Worker Version: 2b4a8390-0e41-408a-b595-5fa53a2a546a"
Write-Host ""

# Test 1: Admin articles endpoint
Write-Host "TEST 1: GET /api/admin/articles"
try {
    $response = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/admin/articles' -Method GET
    Write-Host "✅ Admin articles endpoint working"
    Write-Host "Articles returned: $($response.Count)"
    
    foreach ($article in $response) {
        Write-Host "  ID: $($article.id), Title: $($article.title), Status: $($article.status)"
    }
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)"
}

Write-Host ""

# Test 2: Publish endpoint (test with article ID 4)
Write-Host "TEST 2: POST /api/admin/articles/4/publish"
try {
    $response = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/admin/articles/4/publish' -Method POST
    Write-Host "✅ Publish endpoint working"
    Write-Host "Response: $($response | ConvertTo-Json)"
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)"
}

Write-Host ""

# Test 3: Check if article appears in public observations after publishing
Write-Host "TEST 3: Check public observations"
try {
    $response = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/observations' -Method GET
    Write-Host "✅ Public observations endpoint working"
    Write-Host "Public articles: $($response.Count)"
    
    foreach ($article in $response) {
        Write-Host "  ID: $($article.id), Title: $($article.title)"
    }
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "=== TEST COMPLETE ==="
