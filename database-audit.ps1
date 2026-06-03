# DATABASE AUDIT REPORT - IMMEDIATE

Write-Host "=== DATABASE AUDIT REPORT ==="
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "Purpose: Identify deleted articles during dashboard testing"
Write-Host ""

try {
    # Get current articles from database
    $articles = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/admin/articles' -Method GET
    
    Write-Host "CURRENT ARTICLES IN DATABASE:"
    Write-Host "Total articles: $($articles.Count)"
    Write-Host ""
    
    foreach ($article in $articles) {
        Write-Host "ID: $($article.id)"
        Write-Host "Title: $($article.title)"
        Write-Host "Slug: $($article.slug)"
        Write-Host "Status: $($article.status)"
        Write-Host "Created: $($article.created_at)"
        Write-Host "---"
    }
    
    Write-Host ""
    Write-Host "=== AUDIT ANALYSIS ==="
    
    # Check for missing articles (what we expect vs what we have)
    $expectedArticles = @(
        @{ id = 1; title = "Anthropic IPO: Infrastructure Signal for AI Deployment" },
        @{ id = 2; title = "Funding Patterns Signal AI Resource Intensification" },
        @{ id = 3; title = "AI Infrastructure Deployment Signals System Integration Needs" },
        @{ id = 4; title = "AI Governance Oversight Signals Emerging Policy Requirements" }
    )
    
    $missingArticles = @()
    foreach ($expected in $expectedArticles) {
        $found = $articles | Where-Object { $_.id -eq $expected.id }
        if (-not $found) {
            $missingArticles += $expected
        }
    }
    
    if ($missingArticles.Count -gt 0) {
        Write-Host "⚠️ MISSING ARTICLES DETECTED:"
        foreach ($missing in $missingArticles) {
            Write-Host "  ID: $($missing.id) - $($missing.title)"
        }
        Write-Host ""
        Write-Host "STATUS: DATA LOSS CONFIRMED"
        Write-Host "RECOVERY: NOT POSSIBLE FROM WORKER"
        Write-Host "RECOMMENDATION: Check database backups"
    } else {
        Write-Host "✅ All expected articles present"
        Write-Host "STATUS: NO DATA LOSS DETECTED"
    }
    
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "=== AUDIT COMPLETE ==="
