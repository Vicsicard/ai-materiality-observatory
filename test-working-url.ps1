# Test with a working URL to see title generation
Write-Host "Testing with known working article..."

try {
    $body = @{ url = 'https://www.aljazeera.com/economy/2026/6/2/google-parent-alphabet-to-sell-80bn-in-stock-to-fund-ai-plans' } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/process-article' -Method POST -ContentType 'application/json' -Body $body
    
    Write-Host "Response:"
    Write-Host "Status: $($response.status)"
    Write-Host "Approved: $($response.approved)"
    Write-Host "Title: $($response.headline)"
    
    if ($response.status -eq "already_exists") {
        Write-Host "Article already exists - checking if title was updated in previous run"
        
        # Get the latest article from observations
        $obs = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/observations' -Method GET
        $latest = $obs | Sort-Object id -Descending | Select-Object -First 1
        
        Write-Host "Latest article title: $($latest.title)"
        Write-Host "Latest article slug: $($latest.slug)"
        
        if ($latest.title -eq "Event detected") {
            Write-Host "❌ Still has placeholder title"
        } else {
            Write-Host "✅ Has meaningful title"
        }
    }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
