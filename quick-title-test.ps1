# Quick test of Writer title generation
Write-Host "Testing Writer title generation..."

try {
    $body = @{ url = 'https://example.com/test' } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/process-article' -Method POST -ContentType 'application/json' -Body $body -TimeoutSec 30
    
    Write-Host "Response received:"
    Write-Host "Status: $($response.status)"
    Write-Host "Approved: $($response.approved)"
    Write-Host "Title: $($response.headline)"
    
    if ($response.headline -eq "Event detected") {
        Write-Host "❌ Still using placeholder"
    } else {
        Write-Host "✅ Generated meaningful title"
    }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
