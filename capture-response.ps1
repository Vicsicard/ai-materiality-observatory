$body = @{
    url = "https://www.aljazeera.com/economy/2026/6/2/google-parent-alphabet-to-sell-80bn-in-stock-to-fund-ai-plans"
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Uri "https://ai-materiality-observatory.vic-76c.workers.dev/api/process-article" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

# Convert to JSON and save to file
$response | ConvertTo-Json -Depth 10 | Out-File -FilePath "C:\Users\digit\CascadeProjects\ai-materiality-observatory\full-response.json" -Encoding utf8

Write-Host "Full response saved to full-response.json"
Write-Host "Approved: $($response.approved)"
Write-Host "Validation Reasons: $($response.validationReasons)"
Write-Host "Article length: $($response.article.Length)"
Write-Host "First 200 chars: $($response.article.Substring(0, [Math]::Min(200, $response.article.Length)))"
