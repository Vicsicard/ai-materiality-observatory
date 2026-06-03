# Test the updated Organizational Relevance Agent directly
$url = 'https://www.aljazeera.com/economy/2026/6/2/google-parent-alphabet-to-sell-80bn-in-stock-to-fund-ai-plans'
$body = @{ url = $url } | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/process-article' -Method POST -ContentType 'application/json' -Body $body -ErrorAction Stop
    
    Write-Host "Test completed successfully"
    Write-Host "Response received"
    
    if ($response) {
        $response | ConvertTo-Json -Depth 10 | Out-File -FilePath 'C:\Users\digit\CascadeProjects\ai-materiality-observatory\observer-test-response.json' -Encoding UTF8
        Write-Host "Response saved to observer-test-response.json"
    }
} catch {
    Write-Host "Error occurred: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error response: $errorBody"
    }
}
