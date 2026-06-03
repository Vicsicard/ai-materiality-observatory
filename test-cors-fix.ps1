# Test CORS fix

Write-Host "=== CORS FIX VERIFICATION ==="
Write-Host "Worker Version: bada2d57-cce3-4fd3-a340-822e8afe0a32"
Write-Host ""

# Test OPTIONS /api/process-article
Write-Host "TEST 1: OPTIONS /api/process-article"
try {
    $response = Invoke-WebRequest -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/process-article' -Method OPTIONS
    Write-Host "✅ OPTIONS /api/process-article = $($response.StatusCode)"
    Write-Host "CORS Headers:"
    $response.Headers | ForEach-Object {
        if ($_.Key -like "*Access-Control*") {
            Write-Host "  $($_.Key): $($_.Value)"
        }
    }
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)"
}

Write-Host ""

# Test OPTIONS /api/admin/articles
Write-Host "TEST 2: OPTIONS /api/admin/articles"
try {
    $response = Invoke-WebRequest -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/admin/articles' -Method OPTIONS
    Write-Host "✅ OPTIONS /api/admin/articles = $($response.StatusCode)"
    Write-Host "CORS Headers:"
    $response.Headers | ForEach-Object {
        if ($_.Key -like "*Access-Control*") {
            Write-Host "  $($_.Key): $($_.Value)"
        }
    }
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "=== CORS VERIFICATION COMPLETE ==="
