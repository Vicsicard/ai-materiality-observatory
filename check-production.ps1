# Check production deployment status

Write-Host "=== PRODUCTION DEPLOYMENT VERIFICATION ==="
Write-Host ""

# Check production admin page
Write-Host "TEST 1: Check production admin page"
try {
    $response = Invoke-WebRequest -Uri 'https://ai-materiality-observatory.vercel.app/admin' -Method GET
    Write-Host "✅ Production admin page accessible"
    Write-Host "Status: $($response.StatusCode)"
    
    # Check if page contains dashboard elements
    if ($response.Content -like "*GENERATED OBSERVATIONS*") {
        Write-Host "✅ Admin dashboard expansion detected in production"
    } else {
        Write-Host "⚠️ Admin dashboard expansion not yet detected"
    }
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)"
}

Write-Host ""

# Check production API endpoints
Write-Host "TEST 2: Check production admin API"
try {
    $apiResponse = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/admin/articles' -Method GET
    Write-Host "✅ Production admin API working"
    Write-Host "Articles returned: $($apiResponse.Count)"
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "=== DEPLOYMENT CHECK COMPLETE ==="
