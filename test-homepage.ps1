# Test that existing article can be opened from homepage
try {
    $response = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/observations' -Method GET
    
    Write-Host "Homepage API test completed successfully"
    Write-Host "Observations retrieved:"
    $response | ConvertTo-Json -Depth 10 | Out-File -FilePath 'C:\Users\digit\CascadeProjects\ai-materiality-observatory\homepage-test-response.json' -Encoding UTF8
    
    # Check if our existing article is in the list
    if ($response -and $response.Length -gt 0) {
        $existingArticle = $response | Where-Object { $_.slug -eq "event-detected" }
        if ($existingArticle) {
            Write-Host "SUCCESS: Existing article found in homepage"
            Write-Host "Article ID:" $existingArticle.id
            Write-Host "Slug:" $existingArticle.slug
            Write-Host "Signal Type:" $existingArticle.signal_type
        } else {
            Write-Host "WARNING: Existing article not found in homepage"
        }
    } else {
        Write-Host "WARNING: No observations found"
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
