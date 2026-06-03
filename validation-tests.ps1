# Post-deployment validation tests for draft-first publication model

Write-Host "=== POST-DEPLOYMENT VALIDATION TESTS ==="
Write-Host "Deployment Version: 28ff03ce-94bf-4417-a09f-e321083599cd"
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host ""

# TEST 1: Article containing "need to"
Write-Host "=== TEST 1: Article containing 'need to' ==="
Write-Host "Source URL: https://www.crn.com/news/security/2026/microsoft-s-vasu-jakkal-on-why-ai-agents-need-human-level-security-controls"

try {
    $body = @{ url = 'https://www.crn.com/news/security/2026/microsoft-s-vasu-jakkal-on-why-ai-agents-need-human-level-security-controls' } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/process-article' -Method POST -ContentType 'application/json' -Body $body
    
    Write-Host "Generated Title: $($response.headline)"
    Write-Host "Generated Slug: $($response.slug)"
    Write-Host "Approved Status: $($response.approved)"
    Write-Host "Editorial Flags: $($response.editorial_flags | ConvertTo-Json -Depth 3)"
    Write-Host "Article ID: $($response.articleId)"
    Write-Host "Event ID: $($response.eventId)"
    Write-Host "Stored in D1: $($response.persisted)"
    
    # Verify article is accessible
    if ($response.persisted -and $response.slug) {
        $article = Invoke-RestMethod -Uri "https://ai-materiality-observatory.vic-76c.workers.dev/api/observations/$($response.slug)" -Method GET
        Write-Host "Article Status: $($article.status)"
        Write-Host "Content Length: $($article.content.length)"
    }
    
    # Expected results verification
    $test1Passed = $response.approved -eq $true -and $response.persisted -eq $true
    Write-Host "TEST 1 RESULT: $(if ($test1Passed) { 'PASS' } else { 'FAIL' })"
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    Write-Host "TEST 1 RESULT: FAIL"
}

Write-Host ""

# TEST 2: Article containing "critical" (using a different article)
Write-Host "=== TEST 2: Article containing 'critical' ==="
Write-Host "Source URL: https://www.aljazeera.com/economy/2026/6/2/google-parent-alphabet-to-sell-80bn-in-stock-to-fund-ai-plans"

try {
    $body = @{ url = 'https://www.aljazeera.com/economy/2026/6/2/google-parent-alphabet-to-sell-80bn-in-stock-to-fund-ai-plans' } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/process-article' -Method POST -ContentType 'application/json' -Body $body
    
    Write-Host "Generated Title: $($response.headline)"
    Write-Host "Generated Slug: $($response.slug)"
    Write-Host "Approved Status: $($response.approved)"
    Write-Host "Editorial Flags: $($response.editorial_flags | ConvertTo-Json -Depth 3)"
    Write-Host "Article ID: $($response.articleId)"
    Write-Host "Event ID: $($response.eventId)"
    Write-Host "Stored in D1: $($response.persisted)"
    
    # Verify article is accessible
    if ($response.persisted -and $response.slug) {
        $article = Invoke-RestMethod -Uri "https://ai-materiality-observatory.vic-76c.workers.dev/api/observations/$($response.slug)" -Method GET
        Write-Host "Article Status: $($article.status)"
        Write-Host "Content Length: $($article.content.length)"
    }
    
    # Expected results verification
    $test2Passed = $response.approved -eq $true -and $response.persisted -eq $true
    Write-Host "TEST 2 RESULT: $(if ($test2Passed) { 'PASS' } else { 'FAIL' })"
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    Write-Host "TEST 2 RESULT: FAIL"
}

Write-Host ""

# TEST 3: Article containing "recommended" (using another article)
Write-Host "=== TEST 3: Article containing 'recommended' ==="
Write-Host "Source URL: https://siliconangle.com/2026/06/02/ai-agents-open-data-governance-take-center-stage-snowflake-summit/"

try {
    $body = @{ url = 'https://siliconangle.com/2026/06/02/ai-agents-open-data-governance-take-center-stage-snowflake-summit/' } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/process-article' -Method POST -ContentType 'application/json' -Body $body
    
    Write-Host "Generated Title: $($response.headline)"
    Write-Host "Generated Slug: $($response.slug)"
    Write-Host "Approved Status: $($response.approved)"
    Write-Host "Editorial Flags: $($response.editorial_flags | ConvertTo-Json -Depth 3)"
    Write-Host "Article ID: $($response.articleId)"
    Write-Host "Event ID: $($response.eventId)"
    Write-Host "Stored in D1: $($response.persisted)"
    
    # Verify article is accessible
    if ($response.persisted -and $response.slug) {
        $article = Invoke-RestMethod -Uri "https://ai-materiality-observatory.vic-76c.workers.dev/api/observations/$($response.slug)" -Method GET
        Write-Host "Article Status: $($article.status)"
        Write-Host "Content Length: $($article.content.length)"
    }
    
    # Expected results verification
    $test3Passed = $response.approved -eq $true -and $response.persisted -eq $true
    Write-Host "TEST 3 RESULT: $(if ($test3Passed) { 'PASS' } else { 'FAIL' })"
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    Write-Host "TEST 3 RESULT: FAIL"
}

Write-Host ""
Write-Host "=== VALIDATION TESTS SUMMARY ==="
Write-Host "Test 1 (need to): $(if ($test1Passed) { 'PASS' } else { 'FAIL' })"
Write-Host "Test 2 (critical): $(if ($test2Passed) { 'PASS' } else { 'FAIL' })"
Write-Host "Test 3 (recommended): $(if ($test3Passed) { 'PASS' } else { 'FAIL' })"
Write-Host "Overall Result: $(if ($test1Passed -and $test2Passed -and $test3Passed) { 'ALL TESTS PASSED' } else { 'SOME TESTS FAILED' })"
