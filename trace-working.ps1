# Trace working article to show stage outputs
Write-Host "=== TRACING WORKING ARTICLE FOR DEMONSTRATION ==="
Write-Host "URL: https://www.aljazeera.com/economy/2026/6/2/google-parent-alphabet-to-sell-80bn-in-stock-to-fund-ai-plans"
Write-Host ""

try {
    $body = @{ url = 'https://www.aljazeera.com/economy/2026/6/2/google-parent-alphabet-to-sell-80bn-in-stock-to-fund-ai-plans' } | ConvertTo-Json
    
    # Submit article and capture response
    $response = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/process-article' -Method POST -ContentType 'application/json' -Body $body
    
    Write-Host "=== SUBMISSION RESPONSE ==="
    Write-Host "Status:" $response.status
    Write-Host "Approved:" $response.approved
    Write-Host "Signal Type:" $response.signalType
    
    if ($response.validationReasons) {
        Write-Host "Validation Reasons:" $($response.validationReasons -join ', ')
    }
    
    # Get the full article content for analysis
    if ($response.article) {
        Write-Host ""
        Write-Host "=== FULL ARTICLE CONTENT ==="
        Write-Host $response.article
        Write-Host ""
        
        # Check for prohibited phrases in final article
        $prohibited = @('essential', 'critical', 'need to')
        $foundPhrases = @()
        
        foreach ($phrase in $prohibited) {
            if ($response.article.ToLower().Contains($phrase)) {
                $foundPhrases += $phrase
                Write-Host "FOUND '$phrase' in final article"
                
                # Extract sentences containing the phrase
                $sentences = $response.article -split '(?<=[.!?])\s+'
                foreach ($sentence in $sentences) {
                    if ($sentence.ToLower().Contains($phrase)) {
                        Write-Host "  Sentence: $($sentence.Trim())"
                    }
                }
            }
        }
        
        if ($foundPhrases.Count -eq 0) {
            Write-Host "No prohibited phrases found in final article"
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
Write-Host "=== CHECK WORKER LOGS FOR DETAILED STAGE TRACING ==="
