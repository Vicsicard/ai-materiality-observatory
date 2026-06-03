# Origin tracing for Snowflake article prohibited phrases

Write-Host "=== ORIGIN TRACING: SNOWFLAKE ARTICLE ==="
Write-Host "URL: https://siliconangle.com/2026/06/02/ai-agents-open-data-governance-take-center-stage-snowflake-summit/"
Write-Host ""

try {
    $body = @{ url = 'https://siliconangle.com/2026/06/02/ai-agents-open-data-governance-take-center-stage-snowflake-summit/' } | ConvertTo-Json
    
    # Submit article and capture response
    $response = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/process-article' -Method POST -ContentType 'application/json' -Body $body
    
    Write-Host "=== SUBMISSION RESPONSE ==="
    Write-Host "Status:" $response.status
    Write-Host "Approved:" $response.approved
    Write-Host "Signal Type:" $response.signalType
    
    if ($response.validationReasons) {
        Write-Host "Validation Reasons:" $($response.validationReasons -join ', ')"
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
Write-Host "=== NOTE: Detailed pipeline stage tracing requires Worker logs ==="
Write-Host "The above shows final output but not individual stage outputs."
Write-Host "For complete stage-by-stage tracing, Worker logs would be needed."
