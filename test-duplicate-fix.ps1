# Test duplicate handling with title update

Write-Host "=== Testing Duplicate Handling Fix ==="

# Test with the Al Jazeera article that already exists
$testUrl = 'https://www.aljazeera.com/economy/2026/6/2/google-parent-alphabet-to-sell-80bn-in-stock-to-fund-ai-plans'

Write-Host "Testing URL: $testUrl"
Write-Host "This should:"
Write-Host "1. Detect duplicate URL"
Write-Host "2. Continue processing pipeline"
Write-Host "3. Generate new Writer-owned title"
Write-Host "4. Update existing article in D1"

try {
    $body = @{ url = $testUrl } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/process-article' -Method POST -ContentType 'application/json' -Body $body
    
    Write-Host "`n=== Response ==="
    Write-Host "Status:" $response.status
    Write-Host "Approved:" $response.approved
    Write-Host "Event ID:" $response.eventId
    Write-Host "Article ID:" $response.articleId
    Write-Host "New Title:" $response.headline
    Write-Host "New Slug:" $response.slug
    
    if ($response.status -eq "updated") {
        Write-Host "✅ SUCCESS: Article updated with new title"
        
        # Verify the update in D1
        Write-Host "`n=== Verifying D1 Update ==="
        $obs = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/observations' -Method GET
        $updated = $obs | Where-Object { $_.id -eq $response.eventId }
        
        if ($updated) {
            Write-Host "D1 Title:" $updated.title
            Write-Host "D1 Slug:" $updated.slug
            
            if ($updated.title -eq $response.headline) {
                Write-Host "✅ SUCCESS: D1 updated with new title"
            } else {
                Write-Host "❌ FAILED: D1 title mismatch"
            }
            
            if ($updated.slug -eq $response.slug) {
                Write-Host "✅ SUCCESS: D1 updated with new slug"
            } else {
                Write-Host "❌ FAILED: D1 slug mismatch"
            }
        } else {
            Write-Host "❌ FAILED: Could not find updated article in D1"
        }
        
    } else {
        Write-Host "❌ FAILED: Expected status 'updated', got '$($response.status)'"
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
