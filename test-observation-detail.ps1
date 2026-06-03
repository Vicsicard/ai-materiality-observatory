# Test that existing article can be opened directly
try {
    $slug = "event-detected"
    $response = Invoke-RestMethod -Uri "https://ai-materiality-observatory.vic-76c.workers.dev/api/observations/$slug" -Method GET
    
    Write-Host "Observation detail test completed successfully"
    Write-Host "Article retrieved:"
    $response | ConvertTo-Json -Depth 10 | Out-File -FilePath 'C:\Users\digit\CascadeProjects\ai-materiality-observatory\observation-detail-response.json' -Encoding UTF8
    
    if ($response) {
        Write-Host "SUCCESS: Article can be opened directly"
        Write-Host "Article ID:" $response.id
        Write-Host "Title:" $response.title
        Write-Host "Slug:" $response.slug
        Write-Host "Content length:" $response.content.length
    } else {
        Write-Host "WARNING: Article not found"
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
