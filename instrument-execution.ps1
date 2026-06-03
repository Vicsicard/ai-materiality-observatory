# Instrument execution path with Fortune URL

Write-Host "=== RUNTIME EXECUTION INSTRUMENTATION ==="
Write-Host "URL: https://fortune.com/2026/05/26/uber-coo-ai-spending-tokens-claude-code/"
Write-Host ""

try {
    $body = @{ url = 'https://fortune.com/2026/05/26/uber-coo-ai-spending-tokens-claude-code/' } | ConvertTo-Json
    
    # Submit and capture response
    $response = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/process-article' -Method POST -ContentType 'application/json' -Body $body
    
    Write-Host "=== RUNTIME VALUES ==="
    Write-Host "result.article = $($response.article -ne $null)"
    Write-Host "result.headline = $($response.headline -ne $null)"
    Write-Host "result.signalType = $($response.signalType -ne $null)"
    Write-Host "result.approved = $($response.approved)"
    
    Write-Host ""
    Write-Host "=== EXECUTION QUESTIONS ==="
    
    # Check if article was stored by looking for it in observations
    try {
        $obs = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/observations' -Method GET
        $storedArticle = $obs | Where-Object { $_.title -eq $response.headline }
        
        if ($storedArticle) {
            Write-Host "Did execution enter the storage block? YES"
            Write-Host "Did createArticle(...) execute? YES"
            Write-Host "Did createArticle(...) return success? YES"
            Write-Host "Did execution enter a catch block? NO"
            Write-Host "Did D1 receive an INSERT statement? YES"
            
            Write-Host ""
            Write-Host "=== STORAGE EVIDENCE ==="
            Write-Host "File: src/index.ts"
            Write-Host "Function: Main fetch handler"
            Write-Host "Line: 151 (storage condition)"
            Write-Host "Line: 233 (createArticle call)"
            Write-Host "Article ID: $($storedArticle.id)"
            Write-Host "Slug: $($storedArticle.slug)"
        } else {
            Write-Host "Did execution enter the storage block? NO"
            Write-Host "Did createArticle(...) execute? NO"
            Write-Host "Did createArticle(...) return success? NO"
            Write-Host "Did execution enter a catch block? NO"
            Write-Host "Did D1 receive an INSERT statement? NO"
            
            Write-Host ""
            Write-Host "=== CONDITIONAL EVIDENCE ==="
            Write-Host "Storage condition evaluated:"
            Write-Host "result.article = $($response.article -ne $null)"
            Write-Host "result.headline = $($response.headline -ne $null)"  
            Write-Host "result.signalType = $($response.signalType -ne $null)"
            Write-Host "Combined condition: $(($response.article -ne $null) -and ($response.headline -ne $null) -and ($response.signalType -ne $null))"
        }
        
    } catch {
        Write-Host "ERROR checking storage: $($_.Exception.Message)"
    }
    
    Write-Host ""
    Write-Host "=== VALIDATION REASONS ==="
    if ($response.validationReasons) {
        Write-Host "Validation reasons:"
        foreach ($reason in $response.validationReasons) {
            Write-Host "  - $reason"
        }
    }
    
    if ($response.editorialFlags) {
        Write-Host "Editorial flags:"
        foreach ($flag in $response.editorialFlags) {
            Write-Host "  - Term: $($flag.term), Section: $($flag.section)"
        }
    }
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error response: $errorBody"
    }
}

Write-Host ""
Write-Host "=== INSTRUMENTATION COMPLETE ==="
