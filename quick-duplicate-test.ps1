# Quick test of duplicate handling
Write-Host "Testing duplicate handling..."

try {
    $body = @{ url = 'https://www.aljazeera.com/economy/2026/6/2/google-parent-alphabet-to-sell-80bn-in-stock-to-fund-ai-plans' } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/process-article' -Method POST -ContentType 'application/json' -Body $body -TimeoutSec 60
    
    Write-Host "Status: $($response.status)"
    Write-Host "Title: $($response.headline)"
    Write-Host "Event ID: $($response.eventId)"
    
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
