# Test Writer Agent title generation with Signal Detection failure

Write-Host "=== Testing Writer Agent Title Ownership ==="

# Test with a URL that likely causes Signal Detection to fail
# Using a simple URL that might not have clear headline structure
$testUrl = 'https://example.com/news/brief-update'
$body = @{ url = $testUrl } | ConvertTo-Json

try {
    Write-Host "Testing URL: $testUrl"
    Write-Host "This should trigger Signal Detection fallback to 'Event detected'"
    Write-Host "Writer Agent should generate meaningful title instead"
    
    $response = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/process-article' -Method POST -ContentType 'application/json' -Body $body
    
    Write-Host "`n=== Results ==="
    Write-Host "Approved:" $response.approved
    Write-Host "Status:" $response.status
    Write-Host "Signal Type:" $response.signalType
    Write-Host "Generated Title:" $response.headline
    
    # Check if title is meaningful (not placeholder)
    $placeholderTitles = @('Event detected', 'Signal detected', 'Observation detected', 'Article detected')
    if ($placeholderTitles -contains $response.headline) {
        Write-Host "❌ FAILED: Still using placeholder title"
    } else {
        Write-Host "✅ SUCCESS: Writer generated meaningful title"
        Write-Host "Title quality: $($response.headline.Length) characters"
    }
    
    # If approved, check the full article content
    if ($response.approved -and $response.article) {
        Write-Host "`n=== Article Content Analysis ==="
        Write-Host "Article length:" $response.article.Length
        
        # Extract title from article content
        $titleMatch = $response.article -match '^#\s+(.+)$'
        if ($titleMatch) {
            $articleTitle = $titleMatch[1].Trim()
            Write-Host "Title in article: $articleTitle"
            
            if ($placeholderTitles -contains $articleTitle) {
                Write-Host "❌ FAILED: Article contains placeholder title"
            } else {
                Write-Host "✅ SUCCESS: Article has meaningful title"
            }
        }
    }
    
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)"
    
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error response: $errorBody"
    }
}

Write-Host "`n=== Test Complete ==="
