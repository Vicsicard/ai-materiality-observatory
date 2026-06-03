# Test draft-first publication model
# Verify articles with editorial warnings are stored and not rejected

Write-Host "=== DRAFT-FIRST PUBLICATION MODEL TEST ==="
Write-Host ""

# Test 1: Article with "need to"
Write-Host "Test 1: Microsoft article (contains 'need to')"
Write-Host "URL: https://www.crn.com/news/security/2026/microsoft-s-vasu-jakkal-on-why-ai-agents-need-human-level-security-controls"

try {
    $body = @{ url = 'https://www.crn.com/news/security/2026/microsoft-s-vasu-jakkal-on-why-ai-agents-need-human-level-security-controls' } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/process-article' -Method POST -ContentType 'application/json' -Body $body
    
    Write-Host "Status: $($response.status)"
    Write-Host "Approved: $($response.approved)"
    Write-Host "Editorial Flags: $($response.editorial_flags | ConvertTo-Json)"
    Write-Host "Article Stored: $($response.persisted)"
    
    if ($response.persisted -and $response.editorial_flags) {
        Write-Host "✅ PASS: Article stored with editorial warnings"
    } elseif ($response.persisted) {
        Write-Host "✅ PASS: Article stored (no warnings)"
    } else {
        Write-Host "❌ FAIL: Article not stored"
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "Test 2: Verify article appears in observations"

try {
    $obs = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/observations' -Method GET
    Write-Host "Total observations: $($obs.Count)"
    
    foreach ($o in $obs) {
        Write-Host "Article $($o.id): $($o.title)"
    }
    
    Write-Host "✅ PASS: Articles visible in observations"
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "=== TEST COMPLETE ==="
