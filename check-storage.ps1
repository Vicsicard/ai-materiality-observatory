# Check if articles were actually stored in D1

Write-Host "=== CHECKING D1 STORAGE ==="

try {
    $obs = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/observations' -Method GET
    Write-Host "Total articles in D1: $($obs.Count)"
    
    foreach ($o in $obs) {
        Write-Host ""
        Write-Host "Article ID: $($o.id)"
        Write-Host "Title: $($o.title)"
        Write-Host "Slug: $($o.slug)"
        Write-Host "Status: $($o.status)"
        Write-Host "Signal Type: $($o.signal_type)"
        Write-Host "Created: $($o.created_at)"
        
        # Check article content
        try {
            $article = Invoke-RestMethod -Uri "https://ai-materiality-observatory.vic-76c.workers.dev/api/observations/$($o.slug)" -Method GET
            Write-Host "Content Length: $($article.content.length)"
            
            # Check for editorial warning terms
            $content = $article.content.ToLower()
            $warningTerms = @('essential', 'critical', 'need to', 'must', 'required', 'recommended', 'best practice')
            $foundTerms = @()
            
            foreach ($term in $warningTerms) {
                if ($content.Contains($term)) {
                    $foundTerms += $term
                }
            }
            
            if ($foundTerms.Count -gt 0) {
                Write-Host "Contains editorial warnings: $($foundTerms -join ', ')"
            } else {
                Write-Host "No editorial warnings found"
            }
            
        } catch {
            Write-Host "ERROR: Could not fetch article content"
        }
    }
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "=== STORAGE VERIFICATION COMPLETE ==="
