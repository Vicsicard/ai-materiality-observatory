# Test simple workflow with known working URL

Write-Host "=== SIMPLE ADMIN DASHBOARD WORKFLOW TEST ==="
Write-Host ""

# Check current admin articles
Write-Host "STEP 1: Check current admin articles"
try {
    $articles = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/admin/articles' -Method GET
    Write-Host "✅ Current articles: $($articles.Count)"
    
    foreach ($article in $articles) {
        Write-Host "  ID: $($article.id), Title: $($article.title), Status: $($article.status)"
    }
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)"
}

Write-Host ""

# Test delete functionality (cleanup test)
Write-Host "STEP 2: Test delete functionality with oldest article"
if ($articles.Count -gt 0) {
    $oldestArticle = $articles | Sort-Object id | Select-Object -First 1
    Write-Host "Testing delete with article ID: $($oldestArticle.id)"
    
    try {
        $deleteResponse = Invoke-RestMethod -Uri "https://ai-materiality-observatory.vic-76c.workers.dev/api/admin/articles/$($oldestArticle.id)" -Method DELETE
        Write-Host "✅ Delete endpoint working"
        Write-Host "Response: $($deleteResponse | ConvertTo-Json)"
    } catch {
        Write-Host "❌ ERROR: $($_.Exception.Message)"
    }
} else {
    Write-Host "No articles to test delete functionality"
}

Write-Host ""

# Check articles after delete
Write-Host "STEP 3: Check articles after delete"
try {
    $articlesAfter = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/admin/articles' -Method GET
    Write-Host "✅ Articles after delete: $($articlesAfter.Count)"
    
    foreach ($article in $articlesAfter) {
        Write-Host "  ID: $($article.id), Title: $($article.title), Status: $($article.status)"
    }
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "=== SIMPLE WORKFLOW TEST COMPLETE ==="
